import React from 'react';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Payments } from '../payments';

jest.mock('../../../context/AuthContext', () => ({
  useAuth: () => ({ user: { uid: 'member-1' } }),
}));

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useParams: () => ({ groupId: 'jamiah-1' }),
}));

jest.mock('@stripe/react-stripe-js', () => {
  const confirmPaymentMock = jest.fn();
  return {
    Elements: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
    PaymentElement: () => <div>payment-element</div>,
    useStripe: () => ({ confirmPayment: confirmPaymentMock }),
    useElements: () => ({}),
    __confirmPaymentMock: confirmPaymentMock,
  };
});

const { __confirmPaymentMock: confirmPaymentMock } = jest.requireMock('@stripe/react-stripe-js') as any;

jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn(() => Promise.resolve(null)),
}));

type FetchInput = Parameters<typeof fetch>[0];
type FetchInit = Parameters<typeof fetch>[1];

const jsonResponse = (data: unknown, init?: { ok?: boolean; status?: number }): Response => ({
  ok: init?.ok ?? true,
  status: init?.status ?? 200,
  json: async () => data,
  text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
}) as Response;

const extractUrl = (input: FetchInput): string => (typeof input === 'string' ? input : input.url);

const baseJamiahResponse = {
  rateAmount: 10,
  ownerId: 'owner-1',
};

const baseCyclesResponse = [
  {
    id: 1,
    cycleNumber: 1,
    startDate: new Date().toISOString(),
    completed: false,
    recipient: { uid: 'member-2' },
  },
];

const baseMembersResponse = [
  { uid: 'member-1', username: 'member-one' },
  { uid: 'member-2', username: 'member-two' },
];

const baseRoundResponse = {
  id: 1,
  cycleNumber: 1,
  startDate: new Date().toISOString(),
  completed: false,
  receiptConfirmed: false,
  allPaid: false,
  expectedAmount: 10,
  recipient: { uid: 'member-2' },
  payments: [
    {
      id: 11,
      amount: 10,
      status: 'UNPAID',
      user: { uid: 'member-1' },
    },
  ],
  wallets: [],
};

beforeEach(() => {
  confirmPaymentMock.mockReset();
});

const setupCommonFetch = (overrides: (url: string, init?: FetchInit) => Response | Promise<Response>) => {
  const fetchMock = jest.fn(async (input: FetchInput, init?: FetchInit) => {
    const url = extractUrl(input);
    if (url.endsWith('/api/jamiahs/jamiah-1')) {
      return jsonResponse(baseJamiahResponse);
    }
    if (url.includes('/api/jamiahs/jamiah-1/cycles/summary')) {
      return jsonResponse([]);
    }
    if (url.includes('/api/jamiahs/jamiah-1/cycles/1/round')) {
      return jsonResponse(baseRoundResponse);
    }
    if (url.includes('/api/jamiahs/jamiah-1/cycles')) {
      return jsonResponse(baseCyclesResponse);
    }
    if (url.includes('/api/jamiahs/jamiah-1/members')) {
      return jsonResponse(baseMembersResponse);
    }
    const override = overrides(url, init);
    if (override instanceof Promise) {
      return override;
    }
    if (override === undefined || override === null) {
      return jsonResponse([]);
    }
    return override;
  });
  global.fetch = fetchMock as unknown as typeof fetch;
  return fetchMock;
};

describe('Payments wallet flows', () => {
  afterEach(() => {
    jest.resetAllMocks();
  });

  it('creates a wallet when requested', async () => {
    let walletCreated = false;
    let walletStatus = {
      balance: 0,
      reservedBalance: 0,
      requiresOnboarding: true,
      onboardingUrl: 'https://stripe.example/onboarding',
    };

    const fetchMock = setupCommonFetch((url, init) => {
      if (url.includes('/api/jamiahs/jamiah-1/wallets?uid=member-1')) {
        return jsonResponse(walletCreated ? [{ memberId: 'member-1', balance: walletStatus.balance, reserved: walletStatus.reservedBalance }] : []);
      }
      if (url.includes('/api/jamiahs/jamiah-1/wallets/status')) {
        if (!walletCreated) {
          return jsonResponse('Not found', { ok: false, status: 404 });
        }
        return jsonResponse(walletStatus);
      }
      if (url.includes('/api/jamiahs/jamiah-1/wallets?') && init?.method === 'POST') {
        walletCreated = true;
        walletStatus = { ...walletStatus }; // ensure object reference updates
        return jsonResponse(walletStatus);
      }
      return jsonResponse([]);
    });

    await act(async () => {
      render(<Payments />);
    });

    const createButton = await screen.findByRole('button', { name: /wallet erstellen/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/jamiahs/jamiah-1/wallets?uid=member-1'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await waitFor(() => {
      const statusCalls = fetchMock.mock.calls.filter(call => extractUrl(call[0] as FetchInput).includes('/wallets/status'));
      expect(statusCalls.length).toBeGreaterThan(1);
    });
  });

  it('opens onboarding link when available', async () => {
    const walletStatus = {
      balance: 25,
      reservedBalance: 0,
      requiresOnboarding: true,
      onboardingUrl: 'https://stripe.example/onboarding',
    };

    setupCommonFetch((url, init) => {
      if (url.includes('/api/jamiahs/jamiah-1/wallets?uid=member-1')) {
        return jsonResponse([{ memberId: 'member-1', balance: 25, reserved: 0, lastUpdated: new Date().toISOString() }]);
      }
      if (url.includes('/api/jamiahs/jamiah-1/wallets/status')) {
        return jsonResponse(walletStatus);
      }
      return jsonResponse([]);
    });

    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null);

    await act(async () => {
      render(<Payments />);
    });

    const onboardingButton = await screen.findByRole('button', { name: /onboarding öffnen/i });
    fireEvent.click(onboardingButton);

    expect(openSpy).toHaveBeenCalledWith(walletStatus.onboardingUrl, '_blank', 'noopener,noreferrer');
    openSpy.mockRestore();
  });

  it('submits a top-up request with the entered amount', async () => {
    confirmPaymentMock.mockResolvedValue({ paymentIntent: { status: 'succeeded' } });
    let walletStatus = {
      balance: 10,
      reservedBalance: 0,
      requiresOnboarding: false,
    };

    const fetchMock = setupCommonFetch((url, init) => {
      if (url.includes('/api/jamiahs/jamiah-1/wallets?uid=member-1')) {
        return jsonResponse([{ memberId: 'member-1', balance: walletStatus.balance, reserved: walletStatus.reservedBalance }]);
      }
      if (url.includes('/api/jamiahs/jamiah-1/wallets/status')) {
        return jsonResponse(walletStatus);
      }
      if (url.includes('/api/jamiahs/jamiah-1/wallets/top-up') && init?.method === 'POST') {
        walletStatus = { ...walletStatus, paymentIntentClientSecret: 'pi_secret', paymentIntentId: 'pi_1' };
        return jsonResponse({ ...walletStatus, publishableKey: 'pk_test' });
      }
      if (url.includes('/api/wallets/payment-intents/pi_1/refresh')) {
        walletStatus = { ...walletStatus, balance: walletStatus.balance + 5 };
        return jsonResponse(walletStatus);
      }
      return jsonResponse([]);
    });

    await act(async () => {
      render(<Payments />);
    });

    const topUpButton = await screen.findByRole('button', { name: /aufladen/i });
    fireEvent.click(topUpButton);

    const amountField = await screen.findByLabelText(/betrag/i);
    fireEvent.change(amountField, { target: { value: '5' } });

    fireEvent.click(screen.getByRole('button', { name: /bestätigen/i }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        expect.stringContaining('/api/jamiahs/jamiah-1/wallets/top-up?uid=member-1'),
        expect.objectContaining({ method: 'POST' }),
      );
    });

    await screen.findByText(/bitte zahlung in stripe bestätigen/i);

    const topUpCall = fetchMock.mock.calls.find(call => extractUrl(call[0] as FetchInput).includes('/wallets/top-up'));
    expect(topUpCall).toBeDefined();
    const topUpInit = topUpCall?.[1] as RequestInit | undefined;
    expect(topUpInit?.body).toBeDefined();
    const parsedBody = topUpInit?.body ? JSON.parse(topUpInit.body.toString()) : {};
    expect(parsedBody.amount).toBe(5);
  });
});


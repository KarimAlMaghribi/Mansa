import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { CardElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js';
import { loadStripe, Stripe } from '@stripe/stripe-js';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { useParams } from 'react-router-dom';

interface Member {
  uid: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface PaymentUser {
  uid: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export type PaymentStatus = 'UNPAID' | 'INITIATED' | 'PAID_SELF_CONFIRMED' | 'RECEIPT_CONFIRMED';

interface Payment {
  id: number;
  user: PaymentUser;
  paidAt?: string;
  recipientConfirmedAt?: string;
  amount: number;
  stripePaymentIntentId?: string;
  status: PaymentStatus;
}

interface Round {
  id: number;
  cycleNumber: number;
  startDate: string;
  completed: boolean;
  receiptConfirmed: boolean;
  allPaid: boolean;
  expectedAmount?: number;
  recipient?: PaymentUser;
  payments: Payment[];
}

interface WalletDto {
  jamiahId?: number;
  memberId: string;
  username?: string;
  balance: number;
  reserved?: number;
  lastUpdated?: string;
  kycStatus?: string | null;
  requiresOnboarding?: boolean;
  lockedForPayments?: boolean;
  lockedForPayouts?: boolean;
}

interface WalletStatus {
  jamiahId?: number;
  jamiahPublicId?: string;
  memberId?: number;
  memberUid?: string;
  balance: number;
  reservedBalance: number;
  updatedAt?: string;
  stripeAccountId?: string;
  kycStatus?: string | null;
  requiresOnboarding?: boolean;
  onboardingUrl?: string;
  accountSessionClientSecret?: string;
  stripeSandboxId?: string;
  lockedForPayments?: boolean;
  lockedForPayouts?: boolean;
}

interface WalletHistoryEntry {
  recordedAt: string;
  balance: number;
  reservedBalance: number;
  updatedAt?: string;
  kycStatus?: string | null;
}

const parseAmountValue = (value: any): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const normalized = value.replace(',', '.');
    const parsed = Number(normalized);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  const parsed = Number(value ?? 0);
  return Number.isFinite(parsed) ? parsed : 0;
};

const buildHistoryEntry = (status: WalletStatus): WalletHistoryEntry => ({
  recordedAt: new Date().toISOString(),
  balance: status.balance,
  reservedBalance: status.reservedBalance,
  updatedAt: status.updatedAt,
  kycStatus: status.kycStatus,
});

interface Cycle {
  id: number;
  cycleNumber: number;
  startDate: string;
  completed: boolean;
  recipient?: { uid: string };
}

interface CycleSummary {
  id: number;
  cycleNumber: number;
  startDate: string;
  completed: boolean;
  recipientUid?: string;
  totalPayers: number;
  paidCount: number;
  receiptCount: number;
}

interface PaymentConfirmationResponse {
  payment: any;
  wallet?: any;
}

interface StripePaymentFormProps {
  amount: number;
  clientSecret: string;
  onCancel: () => void;
  onSuccess: () => Promise<void>;
  onError: (message: string) => void;
}

const StripePaymentForm: React.FC<StripePaymentFormProps> = ({ amount, clientSecret, onCancel, onSuccess, onError }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!stripe || !elements) {
      return;
    }
    if (!clientSecret) {
      onError('Ungültiger Zahlungsstatus. Bitte versuche es erneut.');
      return;
    }
    const card = elements.getElement(CardElement);
    if (!card) {
      onError('Kartenelement konnte nicht initialisiert werden.');
      return;
    }
    setSubmitting(true);
    try {
      const result = await stripe.confirmCardPayment(clientSecret, {
        payment_method: {
          card,
        },
      });
      if (result.error) {
        onError(result.error.message || 'Stripe-Zahlung fehlgeschlagen.');
        return;
      }
      const paymentIntent = result.paymentIntent;
      if (!paymentIntent || paymentIntent.status !== 'succeeded') {
        onError('Stripe-Zahlung konnte nicht bestätigt werden.');
        return;
      }
      await onSuccess();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Stripe-Zahlung fehlgeschlagen.';
      onError(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <Typography variant="body2" sx={{ mb: 2 }}>
        Betrag: {amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
      </Typography>
      <Box sx={{ p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1, mb: 2 }}>
        <CardElement options={{ hidePostalCode: true }} />
      </Box>
      <DialogActions sx={{ px: 0 }}>
        <Button onClick={onCancel} disabled={submitting}>Abbrechen</Button>
        <Button type="submit" variant="contained" disabled={submitting || !stripe} startIcon={submitting ? <CircularProgress size={18} /> : undefined}>
          Zahlung bestätigen
        </Button>
      </DialogActions>
    </form>
  );
};

interface PaymentStatusHeaderProps {
  round: Round | null;
  currentUserPayment: Payment | null;
  rateAmount: number;
  wallet?: WalletDto | null;
}

const paymentStatusLabels: Record<PaymentStatus, { label: string; color: 'default' | 'primary' | 'secondary' | 'error' | 'info' | 'success' | 'warning' }> = {
  UNPAID: { label: 'Offen', color: 'warning' },
  INITIATED: { label: 'In Bearbeitung', color: 'info' },
  PAID_SELF_CONFIRMED: { label: 'Bezahlt', color: 'success' },
  RECEIPT_CONFIRMED: { label: 'Empfang bestätigt', color: 'success' },
};

const PaymentStatusHeader: React.FC<PaymentStatusHeaderProps> = ({ round, currentUserPayment, rateAmount, wallet }) => {
  if (!round || !currentUserPayment) return null;

  const amount = currentUserPayment.amount ?? round.expectedAmount ?? rateAmount;
  const dueDate = round.startDate ? new Date(round.startDate).toLocaleDateString() : undefined;
  const statusMeta = paymentStatusLabels[currentUserPayment.status] || paymentStatusLabels.UNPAID;

  return (
    <Paper sx={{ mb: 3, p: 2 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems={{ xs: 'flex-start', sm: 'center' }}
        flexDirection={{ xs: 'column', sm: 'row' }}
        gap={2}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Dein Zahlungsstatus
          </Typography>
          <Box display="flex" alignItems="center" gap={1} mt={0.5}>
            <Chip label={statusMeta.label} color={statusMeta.color} size="small" />
            <Typography variant="body2">
              Betrag: {amount.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </Typography>
          </Box>
          {dueDate && (
            <Typography variant="body2" color="text.secondary">
              Nächste Fälligkeit: {dueDate}
            </Typography>
          )}
        </Box>
        {wallet && (
          <Box textAlign={{ xs: 'left', sm: 'right' }}>
            <Typography variant="subtitle2" color="text.secondary">
              Wallet-Stand
            </Typography>
            <Typography variant="body1" fontWeight="bold">
              {wallet.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
            </Typography>
            {typeof wallet.reserved === 'number' && wallet.reserved > 0 && (
              <Typography variant="caption" color="text.secondary">
                Reserviert: {wallet.reserved.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
              </Typography>
            )}
            {wallet.lastUpdated && (
              <Typography variant="caption" color="text.secondary">
                Aktualisiert am {new Date(wallet.lastUpdated).toLocaleDateString()}
              </Typography>
            )}
            <Stack direction="row" spacing={1} justifyContent={{ xs: 'flex-start', sm: 'flex-end' }} mt={1} flexWrap="wrap">
              {wallet.requiresOnboarding && <Chip label="Onboarding offen" size="small" color="warning" />}
              {wallet.kycStatus && !wallet.requiresOnboarding && (
                <Chip label={`KYC: ${wallet.kycStatus}`} size="small" color="success" />
              )}
              {wallet.lockedForPayments && <Chip label="Zahlung gesperrt" size="small" color="error" />}
              {wallet.lockedForPayouts && <Chip label="Payout gesperrt" size="small" color="warning" />}
            </Stack>
          </Box>
        )}
      </Box>
    </Paper>
  );
};

interface OwnerPaymentsPanelProps {
  summary: CycleSummary[];
  wallets: WalletDto[];
  getMemberName: (uid?: string) => string;
  onSelectCycle: (cycleId: number) => void;
  loadingWallets: boolean;
  walletStatuses: Record<string, WalletStatus>;
  onRefreshWalletStatus: (uid: string) => void;
}

const OwnerPaymentsPanel: React.FC<OwnerPaymentsPanelProps> = ({ summary, wallets, getMemberName, onSelectCycle, loadingWallets, walletStatuses, onRefreshWalletStatus }) => (
  <Accordion defaultExpanded sx={{ mb: 3 }}>
    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
      <Typography fontWeight="bold">Owner-Bereich</Typography>
    </AccordionSummary>
    <AccordionDetails>
      <Stack spacing={3}>
        <Box>
          <Typography variant="subtitle1" gutterBottom>Runden-Übersicht</Typography>
          {summary.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Noch keine Rundenübersicht verfügbar.
            </Typography>
          ) : (
            summary.map(s => {
              const name = getMemberName(s.recipientUid);
              const status = s.completed
                ? 'abgeschlossen'
                : s.receiptCount === s.totalPayers
                  ? 'Empfang bestätigt'
                  : s.paidCount === s.totalPayers
                    ? 'vollständig bezahlt'
                    : 'offen';
              const chipColor: 'success' | 'warning' | 'default' = s.completed
                ? 'success'
                : s.receiptCount === s.totalPayers || s.paidCount === s.totalPayers
                  ? 'warning'
                  : 'default';
              const paidPct = s.totalPayers ? (s.paidCount / s.totalPayers) * 100 : 0;
              const receiptPct = s.totalPayers ? (s.receiptCount / s.totalPayers) * 100 : 0;
              return (
                <Box key={s.id} mb={2} sx={{ cursor: 'pointer' }} onClick={() => onSelectCycle(s.id)}>
                  <Typography variant="body2">Runde {s.cycleNumber} – Empfänger: {name}</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <LinearProgress variant="determinate" value={paidPct} sx={{ flex: 1 }} />
                    <LinearProgress variant="determinate" value={receiptPct} color="secondary" sx={{ flex: 1 }} />
                    <Chip label={status} size="small" color={chipColor} />
                  </Box>
                  <Typography variant="caption">Bezahlt {s.paidCount}/{s.totalPayers} – Empfang bestätigt {s.receiptCount}/{s.totalPayers}</Typography>
                </Box>
              );
            })
          )}
        </Box>
        <Divider />
        <Box>
          <Typography variant="subtitle1" gutterBottom>Wallet-Stände</Typography>
          {loadingWallets ? (
            <Skeleton variant="rectangular" height={80} />
          ) : wallets.length === 0 ? (
            <Typography variant="body2" color="text.secondary">
              Keine Wallet-Daten verfügbar.
            </Typography>
          ) : (
            wallets.map(wallet => (
              <Box key={wallet.memberId} mb={1}>
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }}>
                  <Box>
                    <Typography variant="body2">{getMemberName(wallet.memberId)}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      Stand: {wallet.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      {wallet.reserved ? ` · Reserviert: ${wallet.reserved.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}` : ''}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={1} alignItems="center">
                    {walletStatuses[wallet.memberId]?.requiresOnboarding && (
                      <Chip label="KYC offen" size="small" color="warning" />
                    )}
                    {walletStatuses[wallet.memberId]?.kycStatus && !walletStatuses[wallet.memberId]?.requiresOnboarding && (
                      <Chip label={`KYC: ${walletStatuses[wallet.memberId]?.kycStatus}`} size="small" color="success" />
                    )}
                    {walletStatuses[wallet.memberId]?.lockedForPayments && (
                      <Chip label="Zahlung gesperrt" size="small" color="error" />
                    )}
                    {walletStatuses[wallet.memberId]?.lockedForPayouts && (
                      <Chip label="Payout gesperrt" size="small" color="warning" />
                    )}
                    <Button size="small" onClick={() => onRefreshWalletStatus(wallet.memberId)}>Aktualisieren</Button>
                  </Stack>
                </Stack>
              </Box>
            ))
          )}
        </Box>
      </Stack>
    </AccordionDetails>
  </Accordion>
);

interface MemberPaymentListProps {
  round: Round;
  totalPayers: number;
  paidCount: number;
  receiptCount: number;
  roundStatus: string;
  canPay: boolean;
  currentUid?: string;
  currentUserPayment: Payment | null;
  onInitiatePayment: (payment: Payment) => void;
  getMemberName: (uid?: string) => string;
  renderStatusLabel: (payment: Payment) => string;
  loadingRound: boolean;
  rateAmount: number;
}

const MemberPaymentList: React.FC<MemberPaymentListProps> = ({
  round,
  totalPayers,
  paidCount,
  receiptCount,
  roundStatus,
  canPay,
  currentUid,
  currentUserPayment,
  onInitiatePayment,
  getMemberName,
  renderStatusLabel,
  loadingRound,
  rateAmount,
}) => {
  const amountPerPayment = round.expectedAmount ?? rateAmount;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }} gap={2} mb={2}>
        <Box>
          <Typography variant="body2">Empfänger: {getMemberName(round.recipient?.uid)}</Typography>
          <Typography variant="body2">Bezahlt: {paidCount}/{totalPayers}</Typography>
          <Typography variant="body2">Empfang bestätigt: {receiptCount}/{totalPayers}</Typography>
          <Typography variant="body2">Rundenstatus: {roundStatus}</Typography>
        </Box>
        <Box textAlign={{ xs: 'left', sm: 'right' }}>
          <Typography variant="body2">Beitrag je Zahlung: {amountPerPayment.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</Typography>
          <Typography variant="body2">Startdatum: {new Date(round.startDate).toLocaleDateString()}</Typography>
        </Box>
      </Box>
      <Box mb={2} display="flex" flexWrap="wrap" gap={2} alignItems="center">
        <Tooltip title={canPay ? '' : 'Du kannst nur in deiner Runde zahlen, solange du nicht Empfänger bist.'} disableHoverListener={canPay}>
          <span>
            <Button
              variant="contained"
              startIcon={<EuroIcon />}
              disabled={!canPay || !currentUserPayment}
              onClick={() => currentUserPayment && onInitiatePayment(currentUserPayment)}
            >
              Beitrag bezahlen
            </Button>
          </span>
        </Tooltip>
      </Box>
      {loadingRound ? (
        <Skeleton variant="rectangular" height={120} />
      ) : (
        <List>
          {round.payments.map(payment => {
            const name = getMemberName(payment.user?.uid);
            const isCurrent = payment.user?.uid === currentUid;
            return (
              <ListItem key={payment.id} secondaryAction={
                isCurrent && (payment.status === 'UNPAID' || payment.status === 'INITIATED') ? (
                  <Button size="small" variant="outlined" onClick={() => onInitiatePayment(payment)}>
                    Jetzt zahlen
                  </Button>
                ) : (
                  <Typography variant="body2">{renderStatusLabel(payment)}</Typography>
                )
              }>
                <ListItemText primary={name} secondary={isCurrent ? 'Das bist du' : undefined} />
              </ListItem>
            );
          })}
        </List>
      )}
    </Box>
  );
};

interface RecipientConfirmationProps {
  round: Round | null;
  isRecipient: boolean;
  onConfirm: () => void;
}

const RecipientConfirmation: React.FC<RecipientConfirmationProps> = ({ round, isRecipient, onConfirm }) => {
  if (!round || !isRecipient) {
    return null;
  }

  const canConfirm = round.allPaid && !round.receiptConfirmed;

  return (
    <Box mt={2} display="flex" flexWrap="wrap" gap={2} justifyContent="space-between" alignItems="center">
      <Typography variant="body2">
        Sobald alle Beiträge eingegangen sind, kannst du den Empfang bestätigen.
      </Typography>
      <Button variant="outlined" onClick={onConfirm} disabled={!canConfirm}>
        Empfang quittieren
      </Button>
    </Box>
  );
};

export const Payments: React.FC = () => {
  const { user } = useAuth();
  const currentUid = user?.uid;
  const { groupId } = useParams<{ groupId: string }>();

  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [summary, setSummary] = useState<CycleSummary[]>([]);
  const [round, setRound] = useState<Round | null>(null);
  const [wallets, setWallets] = useState<WalletDto[]>([]);
  const [memberWallet, setMemberWallet] = useState<WalletDto | null>(null);
  const [walletStatus, setWalletStatus] = useState<WalletStatus | null>(null);
  const [walletStatusHistory, setWalletStatusHistory] = useState<WalletHistoryEntry[]>([]);
  const [walletStatusByMember, setWalletStatusByMember] = useState<Record<string, WalletStatus>>({});
  const [walletStatusLoading, setWalletStatusLoading] = useState(false);
  const [creatingWallet, setCreatingWallet] = useState(false);
  const [walletActionState, setWalletActionState] = useState<{ open: boolean; mode: 'top-up' | 'withdraw' } | null>(null);
  const [walletActionAmount, setWalletActionAmount] = useState('');
  const [walletActionError, setWalletActionError] = useState<string | null>(null);
  const [walletActionSubmitting, setWalletActionSubmitting] = useState(false);
  const [rateAmount, setRateAmount] = useState<number>(0);

  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingRound, setLoadingRound] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' | 'info' | 'warning' } | null>(null);

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentClientSecret(null);
    setActivePayment(null);
  };

  const parseErr = useCallback(async (r: Response) =>
    Promise.reject(new Error((await r.text()) || r.statusText)), []);

  const pushWalletHistory = useCallback((status: WalletStatus) => {
    setWalletStatusHistory(prev => {
      const entry = buildHistoryEntry(status);
      const next = [entry, ...prev];
      return next.slice(0, 10);
    });
  }, []);

  const mergeStatusIntoWallets = useCallback((status: WalletStatus, fallbackUid?: string) => {
    const uid = status.memberUid
      || (typeof status.memberId === 'string' ? status.memberId : undefined)
      || fallbackUid;
    if (!uid) {
      return;
    }
    setWalletStatusByMember(prev => ({ ...prev, [uid]: status }));
    setWallets(prev => {
      if (!prev.length) {
        return prev;
      }
      return prev.map(wallet => (wallet.memberId === uid
        ? {
          ...wallet,
          balance: status.balance,
          reserved: status.reservedBalance,
          lastUpdated: status.updatedAt,
          kycStatus: status.kycStatus ?? wallet.kycStatus,
          requiresOnboarding: status.requiresOnboarding ?? wallet.requiresOnboarding,
          lockedForPayments: status.lockedForPayments ?? wallet.lockedForPayments,
          lockedForPayouts: status.lockedForPayouts ?? wallet.lockedForPayouts,
        }
        : wallet));
    });
    if (uid === currentUid) {
      setWalletStatus(status);
      setMemberWallet(prev => {
        if (prev) {
          return {
            ...prev,
            balance: status.balance,
            reserved: status.reservedBalance,
            lastUpdated: status.updatedAt,
            kycStatus: status.kycStatus ?? prev.kycStatus,
            requiresOnboarding: status.requiresOnboarding ?? prev.requiresOnboarding,
            lockedForPayments: status.lockedForPayments ?? prev.lockedForPayments,
            lockedForPayouts: status.lockedForPayouts ?? prev.lockedForPayouts,
          };
        }
        return {
          jamiahId: status.jamiahId,
          memberId: uid,
          balance: status.balance,
          reserved: status.reservedBalance,
          lastUpdated: status.updatedAt,
          kycStatus: status.kycStatus,
          requiresOnboarding: status.requiresOnboarding,
          lockedForPayments: status.lockedForPayments,
          lockedForPayouts: status.lockedForPayouts,
        };
      });
    }
  }, [currentUid]);

  const mapPayment = useCallback((data: any): Payment => ({
    id: data.id,
    user: data.user || { uid: '' },
    paidAt: data.paidAt || undefined,
    recipientConfirmedAt: data.recipientConfirmedAt || undefined,
    amount: typeof data.amount === 'number' ? data.amount : Number(data.amount || 0),
    stripePaymentIntentId: data.stripePaymentIntentId || undefined,
    status: data.status || 'UNPAID',
  }), []);

  const mapRound = useCallback((data: any): Round => ({
    id: data.id,
    cycleNumber: data.cycleNumber,
    startDate: data.startDate,
    completed: Boolean(data.completed),
    receiptConfirmed: Boolean(data.receiptConfirmed),
    allPaid: Boolean(data.allPaid),
    expectedAmount: typeof data.expectedAmount === 'number' ? data.expectedAmount : Number(data.expectedAmount || 0),
    recipient: data.recipient,
    payments: Array.isArray(data.payments) ? data.payments.map(mapPayment) : [],
  }), [mapPayment]);

  const mapWallet = useCallback((data: any): WalletDto => {
    const memberId: string = typeof data.memberId === 'string'
      ? data.memberId
      : typeof data.memberUid === 'string'
        ? data.memberUid
        : '';
    return {
      jamiahId: typeof data.jamiahId === 'number' ? data.jamiahId : undefined,
      memberId,
      username: data.username,
      balance: parseAmountValue(data.balance),
      reserved: parseAmountValue(data.reserved ?? data.reservedBalance),
      lastUpdated: data.lastUpdated || data.updatedAt || undefined,
      kycStatus: data.kycStatus ?? null,
      requiresOnboarding: Boolean(data.requiresOnboarding),
      lockedForPayments: Boolean(data.lockedForPayments),
      lockedForPayouts: Boolean(data.lockedForPayouts),
    };
  }, []);

  const mapWalletStatus = useCallback((data: any): WalletStatus => ({
    jamiahId: typeof data.jamiahId === 'number' ? data.jamiahId : undefined,
    jamiahPublicId: data.jamiahPublicId || undefined,
    memberId: typeof data.memberId === 'number' ? data.memberId : undefined,
    memberUid: typeof data.memberUid === 'string' ? data.memberUid : (typeof data.memberId === 'string' ? data.memberId : undefined),
    balance: parseAmountValue(data.balance),
    reservedBalance: parseAmountValue(data.reservedBalance ?? data.reserved ?? 0),
    updatedAt: data.updatedAt || data.lastUpdated || undefined,
    stripeAccountId: data.stripeAccountId || undefined,
    kycStatus: data.kycStatus ?? null,
    requiresOnboarding: data.requiresOnboarding != null ? Boolean(data.requiresOnboarding) : undefined,
    onboardingUrl: data.onboardingUrl || undefined,
    accountSessionClientSecret: data.accountSessionClientSecret || undefined,
    stripeSandboxId: data.stripeSandboxId || undefined,
    lockedForPayments: data.lockedForPayments != null ? Boolean(data.lockedForPayments) : undefined,
    lockedForPayouts: data.lockedForPayouts != null ? Boolean(data.lockedForPayouts) : undefined,
  }), []);

  useEffect(() => {
    if (!groupId || !currentUid) return;
    let owner = false;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        setRateAmount(Number(data.rateAmount || 0));
        owner = data.ownerId === currentUid;
        setIsOwner(owner);
        return fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`);
      })
      .then(r => r ? (r.ok ? r.json() : parseErr(r)) : [])
      .then((data: any) => {
        if (Array.isArray(data)) {
          setCycles(data);
          if (data.length > 0) {
            const today = new Date();
            const parseDate = (s: string) => new Date(s);
            const upcoming = data
              .filter((c: Cycle) => !c.completed && parseDate(c.startDate) <= today)
              .sort((a: Cycle, b: Cycle) => parseDate(a.startDate).getTime() - parseDate(b.startDate).getTime());
            const initial = upcoming[0]?.id ?? data[data.length - 1]?.id ?? null;
            setSelectedCycle(prev => prev ?? initial);
          }
        } else {
          setCycles([]);
        }
      })
      .catch(err => setSnackbar({ message: err.message, severity: 'error' }));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [groupId, currentUid, parseErr]);

  const fetchCycleSummary = useCallback(() => {
    if (!groupId || !isOwner || !currentUid) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/summary?uid=${encodeURIComponent(currentUid)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setSummary(Array.isArray(data) ? data : []))
      .catch(() => setSummary([]));
  }, [groupId, isOwner, currentUid]);

  const fetchWalletStatus = useCallback(async (uid: string, options: { recordHistory?: boolean; silent?: boolean; dashboardSession?: boolean } = {}) => {
    if (!groupId || !uid) {
      return null;
    }
    const isCurrentUser = uid === currentUid;
    if (isCurrentUser) {
      setWalletStatusLoading(true);
    }
    try {
      const params = new URLSearchParams({ uid });
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      if (currentUrl) {
        params.set('returnUrl', currentUrl);
        params.set('refreshUrl', currentUrl);
      }
      if (options.dashboardSession) {
        params.set('dashboardSession', 'true');
      }
      const response = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/wallets/status?${params.toString()}`);
      if (response.status === 404) {
        if (isCurrentUser) {
          setWalletStatus(null);
        }
        return null;
      }
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || response.statusText);
      }
      const data = await response.json();
      const status = mapWalletStatus(data);
      if (isCurrentUser) {
        setWalletStatus(status);
      }
      mergeStatusIntoWallets(status, uid);
      if (isCurrentUser && options.recordHistory) {
        pushWalletHistory(status);
      }
      return status;
    } catch (error) {
      if (!options.silent) {
        const message = error instanceof Error ? error.message : 'Wallet-Status konnte nicht geladen werden.';
        setSnackbar({ message, severity: 'error' });
      }
      return null;
    } finally {
      if (isCurrentUser) {
        setWalletStatusLoading(false);
      }
    }
  }, [currentUid, groupId, mapWalletStatus, mergeStatusIntoWallets, pushWalletHistory]);

  const fetchWalletData = useCallback((options: { recordHistory?: boolean } = {}) => {
    if (!groupId || !currentUid) return;
    setLoadingWallets(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/wallets?uid=${encodeURIComponent(currentUid)}`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(async data => {
        const mapped = Array.isArray(data) ? data.map(mapWallet) : [];
        setWallets(mapped);
        if (!isOwner) {
          const ownWallet = mapped.find(w => w.memberId === currentUid) || mapped[0] || null;
          if (ownWallet) {
            setMemberWallet(ownWallet);
          } else {
            setMemberWallet(null);
          }
          await fetchWalletStatus(currentUid, { recordHistory: options.recordHistory ?? true, silent: true });
        } else {
          const statusPromises = mapped
            .map(wallet => wallet.memberId)
            .filter((uid, index, arr) => uid && arr.indexOf(uid) === index)
            .map(uid => fetchWalletStatus(uid, { silent: true }));
          await Promise.all(statusPromises);
        }
      })
      .catch(() => {
        setWallets([]);
        if (!isOwner) {
          setMemberWallet(null);
        }
      })
      .finally(() => setLoadingWallets(false));
  }, [currentUid, fetchWalletStatus, groupId, isOwner, mapWallet, parseErr]);

  const fetchRound = useCallback((cycleId: number) => {
    if (!groupId || !currentUid) return;
    setLoadingRound(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/round?uid=${encodeURIComponent(currentUid)}`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        const mapped = mapRound(data);
        setRound(mapped);
        if (!isOwner) {
          const walletList = Array.isArray(data?.wallets) ? data.wallets.map(mapWallet) : [];
          if (walletList.length > 0) {
            const ownWallet = walletList.find((wallet: WalletDto) => wallet.memberId === currentUid) || walletList[0];
            setMemberWallet(ownWallet ?? null);
          }
        }
      })
      .catch(err => {
        setRound(null);
        setSnackbar({ message: err.message, severity: 'error' });
      })
      .finally(() => setLoadingRound(false));
  }, [currentUid, groupId, isOwner, mapRound, mapWallet, parseErr]);

  const refreshCycles = useCallback(() => {
    if (!groupId) return;
    setLoadingCycles(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        if (Array.isArray(data)) {
          setCycles(data);
        } else {
          setCycles([]);
        }
      })
      .catch(() => setCycles([]))
      .finally(() => setLoadingCycles(false));
  }, [groupId, parseErr]);

  useEffect(() => {
    if (!groupId || !currentUid) return;
    if (!isOwner) return;
    fetchCycleSummary();
    fetchWalletData();
  }, [fetchCycleSummary, fetchWalletData, groupId, currentUid, isOwner]);

  useEffect(() => {
    if (!groupId || !currentUid) return;
    if (isOwner) return;
    fetchWalletData({ recordHistory: true });
  }, [fetchWalletData, groupId, currentUid, isOwner]);

  useEffect(() => {
    if (!groupId || selectedCycle == null || !currentUid) {
      setRound(null);
      return;
    }
    fetchRound(selectedCycle);
  }, [groupId, selectedCycle, currentUid, fetchRound]);

  const handleInitiatePayment = (payment: Payment) => {
    if (!groupId || !currentUid) return;
    fetch(`${API_BASE_URL}/api/payments/${payment.id}/initiate?uid=${encodeURIComponent(currentUid)}`, { method: 'POST' })
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        const mapped = mapPayment(data);
        setRound(prev => prev ? { ...prev, payments: prev.payments.map(p => p.id === mapped.id ? mapped : p) } : prev);
        setActivePayment(mapped);
        setPaymentClientSecret(data.clientSecret || null);
        if (data.publishableKey) {
          setStripePromise(loadStripe(data.publishableKey));
        }
        if (!data.publishableKey) {
          setSnackbar({ message: 'Kein Stripe-Publishable-Key konfiguriert.', severity: 'error' });
          return;
        }
        setPaymentDialogOpen(true);
      })
      .catch(err => setSnackbar({ message: err.message, severity: 'error' }));
  };

  const finalizePayment = async () => {
    if (!activePayment || !currentUid) return;
    const params = new URLSearchParams({ uid: currentUid });
    const response = await fetch(`${API_BASE_URL}/api/payments/${activePayment.id}/confirm?${params.toString()}`, {
      method: 'POST',
    });
    if (!response.ok) {
      throw new Error((await response.text()) || response.statusText);
    }
    const data: PaymentConfirmationResponse = await response.json();
    if (data.payment) {
      const mapped = mapPayment(data.payment);
      setRound(prev => prev ? { ...prev, payments: prev.payments.map(p => p.id === mapped.id ? mapped : p) } : prev);
    }
    if (data.wallet) {
      const mappedWallet = mapWallet(data.wallet);
      setWallets(prev => {
        const idx = prev.findIndex(w => w.memberId === mappedWallet.memberId);
        if (idx >= 0) {
          const next = [...prev];
          next[idx] = mappedWallet;
          return next;
        }
        return [...prev, mappedWallet];
      });
    } else if (!isOwner && currentUid) {
      fetchWalletData();
    }
    setSnackbar({ message: 'Zahlung erfolgreich bestätigt.', severity: 'success' });
    if (selectedCycle != null) {
      fetchRound(selectedCycle);
    } else if (round?.id) {
      fetchRound(round.id);
    }
    if (isOwner) {
      fetchCycleSummary();
      fetchWalletData();
    }
    closePaymentDialog();
  };

  const handleCreateWallet = useCallback(async () => {
    if (!groupId || !currentUid || creatingWallet) {
      return;
    }
    setCreatingWallet(true);
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      const payload: Record<string, unknown> = { createDashboardSession: true };
      if (currentUrl) {
        payload.returnUrl = currentUrl;
        payload.refreshUrl = currentUrl;
      }
      const response = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/wallets?uid=${encodeURIComponent(currentUid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || response.statusText);
      }
      const data = await response.json();
      const status = mapWalletStatus(data);
      mergeStatusIntoWallets(status, currentUid);
      pushWalletHistory(status);
      setSnackbar({ message: 'Wallet erfolgreich erstellt.', severity: 'success' });
      await fetchWalletData({ recordHistory: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wallet konnte nicht erstellt werden.';
      setSnackbar({ message, severity: 'error' });
    } finally {
      setCreatingWallet(false);
    }
  }, [creatingWallet, currentUid, fetchWalletData, groupId, mapWalletStatus, mergeStatusIntoWallets, pushWalletHistory, setSnackbar]);

  const openWalletActionDialog = (mode: 'top-up' | 'withdraw') => {
    setWalletActionAmount('');
    setWalletActionError(null);
    setWalletActionState({ open: true, mode });
  };

  const closeWalletActionDialog = () => {
    setWalletActionState(null);
    setWalletActionError(null);
    setWalletActionAmount('');
  };

  const handleWalletActionSubmit = async () => {
    if (!walletActionState || !groupId || !currentUid) {
      return;
    }
    const amount = parseAmountValue(walletActionAmount);
    if (!amount || amount <= 0) {
      setWalletActionError('Bitte einen Betrag größer 0 eingeben.');
      return;
    }
    setWalletActionSubmitting(true);
    setWalletActionError(null);
    try {
      const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
      const payload: Record<string, unknown> = {
        amount,
        createDashboardSession: true,
      };
      if (currentUrl) {
        payload.returnUrl = currentUrl;
        payload.refreshUrl = currentUrl;
      }
      const endpoint = walletActionState.mode === 'top-up' ? 'top-up' : 'withdraw';
      const response = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/wallets/${endpoint}?uid=${encodeURIComponent(currentUid)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const message = await response.text();
        throw new Error(message || response.statusText);
      }
      const data = await response.json();
      const status = mapWalletStatus(data);
      mergeStatusIntoWallets(status, currentUid);
      pushWalletHistory(status);
      setSnackbar({
        message: walletActionState.mode === 'top-up' ? 'Wallet erfolgreich aufgeladen.' : 'Auszahlung erfolgreich veranlasst.',
        severity: 'success',
      });
      setWalletActionState(null);
      await fetchWalletData({ recordHistory: false });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Wallet-Aktion fehlgeschlagen.';
      setWalletActionError(message);
    } finally {
      setWalletActionSubmitting(false);
    }
  };

  const handleRefreshWalletStatus = useCallback((uid?: string) => {
    if (!uid) {
      return;
    }
    fetchWalletStatus(uid, { recordHistory: uid === currentUid });
  }, [currentUid, fetchWalletStatus]);

  const handleStartOnboarding = () => {
    if (!walletStatus?.onboardingUrl) {
      setSnackbar({ message: 'Kein Onboarding-Link verfügbar. Bitte versuche es später erneut.', severity: 'error' });
      return;
    }
    window.open(walletStatus.onboardingUrl, '_blank', 'noopener,noreferrer');
  };

  const handleReceiptConfirm = () => {
    if (!groupId || !round || !currentUid) return;
    fetch(`${API_BASE_URL}/api/payments/confirm-receipt`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jamiahId: groupId, cycleId: round.id, uid: currentUid }),
    })
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        const mapped = mapRound(data);
        setRound(mapped);
        setSnackbar({ message: 'Empfang bestätigt. Neue Runde gestartet.', severity: 'success' });
        refreshCycles();
        fetchCycleSummary();
      })
      .catch(err => setSnackbar({ message: err.message, severity: 'error' }));
  };

  const totalPayers = round?.payments.length ?? 0;
  const paidCount = round ? round.payments.filter(p => p.status === 'PAID_SELF_CONFIRMED' || p.status === 'RECEIPT_CONFIRMED').length : 0;
  const receiptCount = round ? round.payments.filter(p => p.status === 'RECEIPT_CONFIRMED').length : 0;

  const roundStatus = useMemo(() => {
    if (!round) return 'Keine aktive Runde';
    if (round.completed) return 'abgeschlossen';
    if (round.receiptConfirmed) return 'Empfang bestätigt';
    if (round.allPaid) return 'vollständig bezahlt';
    if (paidCount > 0) return 'teilweise bezahlt';
    return 'offen';
  }, [round, paidCount]);

  const currentUserPayment = round?.payments.find(p => p.user?.uid === currentUid) || null;
  const canPay = Boolean(currentUserPayment && (currentUserPayment.status === 'UNPAID' || currentUserPayment.status === 'INITIATED'));
  const isRecipient = round?.recipient?.uid && currentUid ? round.recipient.uid === currentUid : false;

  const getMemberName = (uid?: string) => {
    if (!uid) return uid || '';
    const member = members.find(m => m.uid === uid);
    if (!member) return uid;
    const name = `${member.firstName || ''} ${member.lastName || ''}`.trim();
    return name || member.username || uid;
  };

  const renderStatusLabel = (payment: Payment) => {
    switch (payment.status) {
      case 'RECEIPT_CONFIRMED':
        return `Empfang bestätigt${payment.recipientConfirmedAt ? ' am ' + new Date(payment.recipientConfirmedAt).toLocaleDateString() : ''}`;
      case 'PAID_SELF_CONFIRMED':
        return `Bezahlt am ${payment.paidAt ? new Date(payment.paidAt).toLocaleDateString() : ''}`;
      case 'INITIATED':
        return 'Zahlung gestartet';
      default:
        return 'Offen';
    }
  };

  const statusAlerts: React.ReactNode[] = [];

  if (round && currentUserPayment) {
    if (currentUserPayment.status === 'UNPAID') {
      statusAlerts.push(
        <Alert key="payment-unpaid" severity="warning">
          Deine Zahlung ist noch offen. Bitte begleiche den fälligen Beitrag, damit die Runde weitergehen kann.
        </Alert>,
      );
    }
    if (currentUserPayment.status === 'INITIATED') {
      statusAlerts.push(
        <Alert key="payment-initiated" severity="info">
          Deine Kartenzahlung wird verarbeitet. Du erhältst eine Bestätigung, sobald sie abgeschlossen ist.
        </Alert>,
      );
    }
    if (currentUserPayment.status === 'PAID_SELF_CONFIRMED') {
      statusAlerts.push(
        <Alert key="payment-paid" severity="success">
          Danke! Dein Beitrag ist eingegangen und wartet auf die Bestätigung des Empfängers.
        </Alert>,
      );
    }
  }

  if (round?.completed) {
    statusAlerts.push(
      <Alert key="round-completed" severity="success">
        Diese Runde wurde abgeschlossen. Du kannst die Historie im Owner-Bereich einsehen.
      </Alert>,
    );
  } else if (round?.allPaid && round?.receiptConfirmed) {
    statusAlerts.push(
      <Alert key="round-receipt" severity="success">
        Alle Beiträge wurden bestätigt. Die nächste Runde startet in Kürze.
      </Alert>,
    );
  }

  if (round && isRecipient && round.allPaid && !round.receiptConfirmed) {
    statusAlerts.push(
      <Alert key="receipt-pending" severity="info">
        Alle Zahlungen sind eingegangen. Bestätige jetzt den Empfang, um die nächste Runde zu starten.
      </Alert>,
    );
  }

  if (walletStatus?.requiresOnboarding) {
    statusAlerts.push(
      <Alert
        key="wallet-onboarding"
        severity="warning"
        action={<Button color="inherit" size="small" onClick={handleStartOnboarding}>Onboarding starten</Button>}
      >
        Bitte schließe das Stripe-Onboarding ab, um Zahlungen empfangen und senden zu können.
      </Alert>,
    );
  }

  if (walletStatus?.lockedForPayments) {
    statusAlerts.push(
      <Alert key="wallet-payments-locked" severity="error">
        Dein Wallet ist für Zahlungen gesperrt. Bitte kontaktiere den Support oder schließe das Onboarding erneut ab.
      </Alert>,
    );
  }

  if (walletStatus?.lockedForPayouts) {
    statusAlerts.push(
      <Alert key="wallet-payouts-locked" severity="warning">
        Auszahlungen sind momentan gesperrt. Prüfe deine Kontodaten oder kontaktiere den Support.
      </Alert>,
    );
  }

  const showBankDetailsCTA = Boolean(currentUserPayment && currentUserPayment.status === 'UNPAID');

  const handleBankDetailsClick = () => {
    setSnackbar({ message: 'Bitte hinterlege deine Bankdaten im Profilbereich.', severity: 'info' });
  };

  if (!groupId) {
    return (
      <Box p={4}>
        <Typography variant="h6">Keine Jamiah ausgewählt</Typography>
      </Box>
    );
  }

  const dialogAmount = activePayment?.amount || round?.expectedAmount || rateAmount;

  return (
    <>
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Zahlungsübersicht</Typography>
          {isOwner && (
            loadingCycles ? (
              <Skeleton variant="rectangular" width={160} height={40} />
            ) : (
              cycles.length > 0 && (
                <TextField
                  select
                  label="Runde"
                  value={selectedCycle ?? ''}
                  onChange={e => setSelectedCycle(Number(e.target.value))}
                  size="small"
                >
                  {cycles.map(c => (
                    <MenuItem key={c.id} value={c.id}>Runde {c.cycleNumber}</MenuItem>
                  ))}
                </TextField>
              )
            )
          )}
        </Box>

        {currentUserPayment && (
          <PaymentStatusHeader
            round={round}
            currentUserPayment={currentUserPayment}
            rateAmount={rateAmount}
            wallet={memberWallet}
          />
        )}

        {showBankDetailsCTA && (
          <Paper sx={{ p: 2, mb: 3, border: '1px solid', borderColor: 'warning.light', backgroundColor: 'rgba(255, 193, 7, 0.08)' }}>
            <Box display="flex" flexDirection={{ xs: 'column', sm: 'row' }} justifyContent="space-between" gap={2} alignItems={{ xs: 'flex-start', sm: 'center' }}>
              <Box>
                <Typography variant="subtitle1">Bankdaten hinterlegen</Typography>
                <Typography variant="body2" color="text.secondary">
                  Hinterlege jetzt dein Konto, um Zahlungen schneller abzuwickeln.
                </Typography>
              </Box>
              <Button variant="outlined" color="warning" onClick={handleBankDetailsClick}>
                Bankdaten hinterlegen
              </Button>
            </Box>
          </Paper>
        )}

        {statusAlerts.length > 0 && (
          <Stack spacing={1.5} sx={{ mb: 3 }}>
            {statusAlerts}
          </Stack>
        )}

        {!round ? (
          <Alert severity="info" sx={{ mb: 3 }}>
            {isOwner ? 'Noch keine Runden – Jamiah starten' : 'Keine aktive Runde – bitte vom Admin starten lassen.'}
          </Alert>
        ) : (
          <Paper sx={{ p: 2, mb: 3 }}>
            <MemberPaymentList
              round={round}
              totalPayers={totalPayers}
              paidCount={paidCount}
              receiptCount={receiptCount}
              roundStatus={roundStatus}
              canPay={canPay}
              currentUid={currentUid}
              currentUserPayment={currentUserPayment}
              onInitiatePayment={handleInitiatePayment}
              getMemberName={getMemberName}
              renderStatusLabel={renderStatusLabel}
              loadingRound={loadingRound}
              rateAmount={rateAmount}
            />
            <RecipientConfirmation round={round} isRecipient={isRecipient} onConfirm={handleReceiptConfirm} />
          </Paper>
        )}

        {!isOwner && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Stack spacing={2}>
              <Box display="flex" justifyContent="space-between" alignItems={{ xs: 'flex-start', sm: 'center' }} flexDirection={{ xs: 'column', sm: 'row' }} gap={1.5}>
                <Typography variant="subtitle1">Dein Wallet</Typography>
                <Stack direction="row" spacing={1}>
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => handleRefreshWalletStatus(currentUid || '')}
                    disabled={walletStatusLoading || (!memberWallet && !walletStatus)}
                  >
                    {walletStatusLoading ? <CircularProgress size={18} /> : 'Status aktualisieren'}
                  </Button>
                  <Button
                    size="small"
                    variant="outlined"
                    color="secondary"
                    onClick={() => fetchWalletStatus(currentUid || '', { recordHistory: true })}
                    disabled={walletStatusLoading || (!memberWallet && !walletStatus)}
                  >
                    Verlauf aktualisieren
                  </Button>
                </Stack>
              </Box>
              {walletStatusLoading ? (
                <Box display="flex" justifyContent="center" py={2}>
                  <CircularProgress />
                </Box>
              ) : !walletStatus && !memberWallet ? (
                <Stack spacing={1}>
                  <Typography variant="body2" color="text.secondary">
                    Noch kein Wallet vorhanden. Lege jetzt dein Wallet an, um Guthaben zu verwalten.
                  </Typography>
                  <Button variant="contained" onClick={handleCreateWallet} disabled={creatingWallet}>
                    {creatingWallet ? <CircularProgress size={20} color="inherit" /> : 'Wallet erstellen'}
                  </Button>
                </Stack>
              ) : (
                <>
                  <Box>
                    <Typography variant="body1" fontWeight="bold">
                      {(walletStatus?.balance ?? memberWallet?.balance ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                    </Typography>
                    {typeof (walletStatus?.reservedBalance ?? memberWallet?.reserved) === 'number' && (walletStatus?.reservedBalance ?? memberWallet?.reserved ?? 0) > 0 && (
                      <Typography variant="caption" color="text.secondary">
                        Reserviert: {(walletStatus?.reservedBalance ?? memberWallet?.reserved ?? 0).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}
                      </Typography>
                    )}
                    {(walletStatus?.updatedAt || memberWallet?.lastUpdated) && (
                      <Typography variant="caption" color="text.secondary">
                        Aktualisiert am {new Date(walletStatus?.updatedAt || memberWallet?.lastUpdated || '').toLocaleDateString()}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={1} mt={1} flexWrap="wrap">
                      {walletStatus?.requiresOnboarding && <Chip label="Onboarding offen" size="small" color="warning" />}
                      {walletStatus?.kycStatus && !walletStatus?.requiresOnboarding && (
                        <Chip label={`KYC: ${walletStatus.kycStatus}`} size="small" color="success" />
                      )}
                      {walletStatus?.lockedForPayments && <Chip label="Zahlung gesperrt" size="small" color="error" />}
                      {walletStatus?.lockedForPayouts && <Chip label="Payout gesperrt" size="small" color="warning" />}
                    </Stack>
                  </Box>
                  <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5}>
                    <Button
                      variant="contained"
                      onClick={() => openWalletActionDialog('top-up')}
                      disabled={Boolean(walletStatus?.requiresOnboarding || walletStatus?.lockedForPayments)}
                    >
                      Aufladen
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => openWalletActionDialog('withdraw')}
                      disabled={Boolean(walletStatus?.requiresOnboarding || walletStatus?.lockedForPayouts || (walletStatus?.balance ?? memberWallet?.balance ?? 0) <= 0)}
                    >
                      Auszahlen
                    </Button>
                    {walletStatus?.onboardingUrl && (
                      <Button variant="text" onClick={handleStartOnboarding} color="secondary">
                        Onboarding öffnen
                      </Button>
                    )}
                  </Stack>
                  {walletStatusHistory.length > 0 && (
                    <Box>
                      <Typography variant="subtitle2" gutterBottom>
                        Saldohistorie
                      </Typography>
                      <List dense>
                        {walletStatusHistory.map((entry, index) => (
                          <ListItem key={`${entry.recordedAt}-${index}`} disableGutters>
                            <ListItemText
                              primary={`Saldo: ${entry.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}`}
                              secondary={`Reserviert: ${entry.reservedBalance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })} · Stand ${new Date(entry.updatedAt || entry.recordedAt).toLocaleString()}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    </Box>
                  )}
                </>
              )}
            </Stack>
          </Paper>
        )}

        {isOwner && (
          <OwnerPaymentsPanel
            summary={summary}
            wallets={wallets}
            getMemberName={getMemberName}
            onSelectCycle={cycleId => setSelectedCycle(cycleId)}
            loadingWallets={loadingWallets}
            walletStatuses={walletStatusByMember}
            onRefreshWalletStatus={handleRefreshWalletStatus}
          />
        )}
      </Box>

      <Dialog open={Boolean(walletActionState)} onClose={closeWalletActionDialog} fullWidth maxWidth="xs">
        <DialogTitle>
          {walletActionState?.mode === 'withdraw' ? 'Auszahlung anfordern' : 'Wallet aufladen'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ pt: 1 }}>
            <TextField
              label="Betrag"
              type="number"
              value={walletActionAmount}
              onChange={event => setWalletActionAmount(event.target.value)}
              fullWidth
              inputProps={{ min: 0, step: 0.01 }}
            />
            {walletActionError && (
              <Alert severity="error">{walletActionError}</Alert>
            )}
            <Typography variant="body2" color="text.secondary">
              Der Vorgang startet eine Stripe-Wallet-Transaktion. Du wirst ggf. zu Stripe weitergeleitet, um den Vorgang abzuschließen.
            </Typography>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeWalletActionDialog} disabled={walletActionSubmitting}>Abbrechen</Button>
          <Button onClick={handleWalletActionSubmit} variant="contained" disabled={walletActionSubmitting}>
            {walletActionSubmitting ? <CircularProgress size={18} /> : 'Bestätigen'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={paymentDialogOpen} onClose={closePaymentDialog} fullWidth maxWidth="sm">
        <DialogTitle>Kartenzahlung</DialogTitle>
        <DialogContent>
          {!paymentClientSecret || !stripePromise || dialogAmount == null ? (
            <Box display="flex" justifyContent="center" alignItems="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <Elements stripe={stripePromise} options={{ clientSecret: paymentClientSecret }}>
              <StripePaymentForm
                amount={dialogAmount}
                clientSecret={paymentClientSecret}
                onCancel={closePaymentDialog}
                onError={message => setSnackbar({ message, severity: 'error' })}
                onSuccess={finalizePayment}
              />
            </Elements>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
        <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'success'} sx={{ width: '100%' }}>
          {snackbar?.message}
        </Alert>
      </Snackbar>
    </>
  );
};

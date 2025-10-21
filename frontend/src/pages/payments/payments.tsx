import React, { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  LinearProgress,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Skeleton,
  Snackbar,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
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
  memberId: string;
  username?: string;
  balance: number;
  lastUpdated?: string;
}

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
    const card = elements.getElement(CardElement);
    if (!card) {
      onError('Kartenelement konnte nicht initialisiert werden.');
      return;
    }
    setSubmitting(true);
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: {
        card,
      },
    });
    if (result.error) {
      onError(result.error.message || 'Stripe-Zahlung fehlgeschlagen.');
      setSubmitting(false);
      return;
    }
    if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
      try {
        await onSuccess();
      } finally {
        setSubmitting(false);
      }
      return;
    }
    onError('Zahlung konnte nicht abgeschlossen werden.');
    setSubmitting(false);
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
  const [rateAmount, setRateAmount] = useState<number>(0);

  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingRound, setLoadingRound] = useState(false);
  const [loadingWallets, setLoadingWallets] = useState(false);

  const [stripePromise, setStripePromise] = useState<Promise<Stripe | null> | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [paymentClientSecret, setPaymentClientSecret] = useState<string | null>(null);
  const [activePayment, setActivePayment] = useState<Payment | null>(null);

  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  const closePaymentDialog = () => {
    setPaymentDialogOpen(false);
    setPaymentClientSecret(null);
    setActivePayment(null);
  };

  const parseErr = useCallback(async (r: Response) =>
    Promise.reject(new Error((await r.text()) || r.statusText)), []);

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

  const mapWallet = useCallback((data: any): WalletDto => ({
    memberId: data.memberId,
    username: data.username,
    balance: typeof data.balance === 'number' ? data.balance : Number(data.balance || 0),
    lastUpdated: data.lastUpdated || undefined,
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

  const fetchWalletData = useCallback(() => {
    if (!groupId || !currentUid) return;
    setLoadingWallets(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/wallets?uid=${encodeURIComponent(currentUid)}`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => setWallets(Array.isArray(data) ? data.map(mapWallet) : []))
      .catch(() => setWallets([]))
      .finally(() => setLoadingWallets(false));
  }, [groupId, currentUid, mapWallet, parseErr]);

  const fetchRound = useCallback((cycleId: number) => {
    if (!groupId || !currentUid) return;
    setLoadingRound(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/round?uid=${encodeURIComponent(currentUid)}`)
      .then(r => r.ok ? r.json() : parseErr(r))
      .then(data => {
        const mapped = mapRound(data);
        setRound(mapped);
        if (!isOwner) {
          setWallets([]);
        }
      })
      .catch(err => {
        setRound(null);
        setSnackbar({ message: err.message, severity: 'error' });
      })
      .finally(() => setLoadingRound(false));
  }, [groupId, currentUid, isOwner, mapRound, parseErr]);

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
    const response = await fetch(`${API_BASE_URL}/api/payments/${activePayment.id}/confirm?uid=${encodeURIComponent(currentUid)}`, {
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

        {isOwner && summary.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" mb={2}>Runden-Übersicht</Typography>
            {summary.map(s => {
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
                <Box key={s.id} mb={2} sx={{ cursor: 'pointer' }} onClick={() => setSelectedCycle(s.id)}>
                  <Typography variant="body2">Runde {s.cycleNumber} – Empfänger: {name}</Typography>
                  <Box display="flex" alignItems="center" gap={1} mt={1}>
                    <LinearProgress variant="determinate" value={paidPct} sx={{ flex: 1 }} />
                    <LinearProgress variant="determinate" value={receiptPct} color="secondary" sx={{ flex: 1 }} />
                    <Chip label={status} size="small" color={chipColor} />
                  </Box>
                  <Typography variant="caption">Bezahlt {s.paidCount}/{s.totalPayers} – Empfang bestätigt {s.receiptCount}/{s.totalPayers}</Typography>
                </Box>
              );
            })}
          </Paper>
        )}

        {!round && (
          <Alert severity="info" sx={{ mb: 3 }}>
            {isOwner ? 'Noch keine Runden – Jamiah starten' : 'Keine aktive Runde – bitte vom Admin starten lassen.'}
          </Alert>
        )}

        {round && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Box>
                <Typography variant="body2">Empfänger: {getMemberName(round.recipient?.uid)}</Typography>
                <Typography variant="body2">Bezahlt: {paidCount}/{totalPayers}</Typography>
                <Typography variant="body2">Empfang bestätigt: {receiptCount}/{totalPayers}</Typography>
                <Typography variant="body2">Rundenstatus: {roundStatus}</Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="body2">Beitrag je Zahlung: {(round.expectedAmount ?? rateAmount).toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</Typography>
                <Typography variant="body2">Startdatum: {new Date(round.startDate).toLocaleDateString()}</Typography>
              </Box>
            </Box>
            <Box mb={2}>
              <Tooltip title={canPay ? '' : 'Du kannst nur in deiner Runde zahlen, solange du nicht Empfänger bist.'} disableHoverListener={canPay}>
                <span>
                  <Button
                    variant="contained"
                    startIcon={<EuroIcon />}
                    disabled={!canPay}
                    onClick={() => currentUserPayment && handleInitiatePayment(currentUserPayment)}
                  >
                    Beitrag bezahlen
                  </Button>
                </span>
              </Tooltip>
              {isRecipient && round.allPaid && !round.receiptConfirmed && (
                <Button sx={{ ml: 2 }} variant="outlined" onClick={handleReceiptConfirm}>
                  Empfang quittieren
                </Button>
              )}
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
                        <Button size="small" variant="outlined" onClick={() => handleInitiatePayment(payment)}>
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
          </Paper>
        )}

        {wallets.length > 0 && (
          <Paper sx={{ p: 2, mb: 3 }}>
            <Typography variant="h6" mb={2}>{isOwner ? 'Wallet-Stände aller Mitglieder' : 'Dein Wallet'}</Typography>
            {loadingWallets ? (
              <Skeleton variant="rectangular" height={80} />
            ) : (
              wallets.map(wallet => (
                <Box key={wallet.memberId} display="flex" justifyContent="space-between" mb={1}>
                  <Typography variant="body2">{getMemberName(wallet.memberId)}</Typography>
                  <Typography variant="body2">{wallet.balance.toLocaleString('de-DE', { style: 'currency', currency: 'EUR' })}</Typography>
                </Box>
              ))
            )}
          </Paper>
        )}
      </Box>

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

import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  TextField, MenuItem, Snackbar, Alert, Tooltip, Skeleton, Chip, LinearProgress
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

interface Member {
  uid: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface Payment {
  id: number;
  user: { uid: string; };
  paidAt: string;
  recipientConfirmed: boolean;
  confirmed: boolean;
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

export const Payments = () => {
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [summary, setSummary] = useState<CycleSummary[]>([]);
  const [loadingCycles, setLoadingCycles] = useState(false);
  const [loadingPayments, setLoadingPayments] = useState(false);
  const [amount, setAmount] = useState<number>(50);
  const [snackbar, setSnackbar] = useState<{message: string; severity: 'success' | 'error'} | null>(null);

  const { user } = useAuth();
  const currentUid = user?.uid;
  const groupId = window.location.pathname.split('/')[2];

  useEffect(() => {
    let owner = false;

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(r => r.json())
      .then(data => {
        setAmount(data.rateAmount || 50);
        owner = data.ownerId === currentUid;
        setIsOwner(owner);
        setLoadingCycles(true);
        return fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`);
      })
      .then(r => (r ? (r.ok ? r.json() : Promise.reject()) : []))
      .then(data => {
        if (Array.isArray(data)) {
          setCycles(data);
          if (data.length > 0) {
            const today = new Date();
            const parse = (s: string) => new Date(s);
            const upcoming = data
              .filter((c: Cycle) => !c.completed && parse(c.startDate) <= today)
              .sort((a: Cycle, b: Cycle) => parse(a.startDate).getTime() - parse(b.startDate).getTime());
            const initial = upcoming[0]?.id ?? data[data.length - 1]?.id ?? null;
            if (!owner) {
              setSelectedCycle(initial);
            } else {
              setSelectedCycle(prev => prev ?? initial);
            }
          }
        } else {
          setCycles([]);
        }
      })
      .catch(() => setCycles([]))
      .finally(() => setLoadingCycles(false));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));
  }, [groupId, currentUid]);

  useEffect(() => {
    if (isOwner) fetchCycleSummary();
  }, [isOwner, groupId, currentUid]);

  const fetchPayments = (cycleId: number) => {
    const uid = currentUid || '';
    setLoadingPayments(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/payments?uid=${encodeURIComponent(uid)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {
        setPayments([]);
        setSnackbar({ message: 'Fehler beim Laden', severity: 'error' });
      })
      .finally(() => setLoadingPayments(false));
  };

  const fetchCycleSummary = () => {
    if (!isOwner) return;
    const uid = currentUid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/summary?uid=${encodeURIComponent(uid)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setSummary(Array.isArray(data) ? data : []))
      .catch(() => setSummary([]));
  };

  useEffect(() => {
    if (selectedCycle !== null) {
      fetchPayments(selectedCycle);
    }
  }, [groupId, selectedCycle, currentUid]);

  const handlePay = () => {
    const link = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=student.abdelkarim@gmail.com&amount=${amount}&currency_code=EUR`;
    window.open(link, '_blank');
  };

  const currentCycle = cycles.find(c => c.id === selectedCycle) || null;
  const isRecipient = Boolean(currentCycle?.recipient?.uid && currentUid && currentCycle.recipient.uid === currentUid);

  const recipientUid = currentCycle?.recipient?.uid;
  const totalPayers = members.filter(m => m.uid !== recipientUid).length;
  const paidCount = payments.filter(p => p.confirmed && p.user.uid !== recipientUid).length;
  const receiptCount = payments.filter(p => p.recipientConfirmed && p.user.uid !== recipientUid).length;
  let roundStatus = 'offen';
  if (currentCycle?.completed) {
    roundStatus = 'abgeschlossen';
  } else if (receiptCount === totalPayers && totalPayers > 0) {
    roundStatus = 'vollständig bestätigt';
  } else if (paidCount === totalPayers && totalPayers > 0) {
    roundStatus = 'vollständig bezahlt';
  }

  const handleConfirm = (uid: string) => {
    if (selectedCycle == null) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${selectedCycle}/pay?uid=${encodeURIComponent(uid)}&amount=${amount}`, { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setSnackbar({ message: 'Zahlung bestätigt', severity: 'success' });
        fetchPayments(selectedCycle);
        fetchCycleSummary(); // Admin-Übersicht sofort aktualisieren
      })
      .catch(() => setSnackbar({ message: 'Fehler bei Zahlungsbestätigung', severity: 'error' }));
  };

  const handleReceiptConfirm = (paymentId: number) => {
    if (selectedCycle == null) return;
    const uid = currentUid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${selectedCycle}/payments/${paymentId}/confirm-receipt?uid=${encodeURIComponent(uid)}`, { method: 'POST' })
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(() => {
        setSnackbar({ message: 'Empfang bestätigt', severity: 'success' });
        fetchPayments(selectedCycle);
        fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
          .then(r => r.ok ? r.json() : Promise.reject())
          .then(data => {
            if (Array.isArray(data)) {
              setCycles(data);
              const today = new Date();
              const parse = (s: string) => new Date(s);
              const upcoming = data
                .filter((c: Cycle) => !c.completed && parse(c.startDate) <= today)
                .sort((a: Cycle, b: Cycle) => parse(a.startDate).getTime() - parse(b.startDate).getTime());
              const initial = upcoming[0]?.id ?? data[data.length - 1]?.id ?? null;
              if (!isOwner) {
                setSelectedCycle(initial);
              }
            }
          })
          .finally(() => fetchCycleSummary());
      })
      .catch(() => setSnackbar({ message: 'Fehler beim Empfangsbestätigen', severity: 'error' }));
  };

  const getSortKey = (m: Member) => {
    if (m.uid === recipientUid) return 0;
    const payment = payments.find(p => p.user.uid === m.uid);
    if (!payment || !payment.confirmed) return 1; // Zahlung offen
    if (payment.confirmed && !payment.recipientConfirmed) return 2; // bezahlt, Eingang offen
    return 3; // Empfang bestätigt
  };
  const sortedMembers = [...members].sort((a, b) => getSortKey(a) - getSortKey(b));

  const renderMemberRow = (m: Member) => {
    const payment = payments.find(p => p.user.uid === m.uid);
    const name = m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username;
    const isRoundRecipient = m.uid === currentCycle?.recipient?.uid;
    const disableMemberConfirm = selectedCycle === null || isRecipient || !!payment?.confirmed;
    let action;
    if (m.uid === currentUid && isRecipient) {
      action = <Typography variant="body2">Empfänger zahlt nicht</Typography>;
    } else if (payment) {
      if (m.uid === currentUid) {
        if (!payment.confirmed) {
          const tip = selectedCycle === null
            ? 'Keine aktive Runde'
            : isRecipient
              ? 'Du bist Empfänger'
              : payment.confirmed
                ? 'Schon bestätigt'
                : '';
          action = (
            <Tooltip title={tip} disableHoverListener={!tip} disableFocusListener={!tip} disableTouchListener={!tip}>
              <span>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleConfirm(m.uid)}
                  disabled={disableMemberConfirm}
                >
                  Zahlung bestätigen
                </Button>
              </span>
            </Tooltip>
          );
        } else {
          action = (
            <Typography variant="body2">
              {`${new Date(payment.paidAt).toLocaleDateString()}${payment.recipientConfirmed ? ' / Empfang bestätigt' : ' / Eingang offen'}`}
            </Typography>
          );
        }
      } else if (isRecipient && payment.confirmed && !payment.recipientConfirmed) {
        action = (
          <Button size="small" variant="outlined" onClick={() => handleReceiptConfirm(payment.id)}>
            Erhalt bestätigen
          </Button>
        );
      } else if (payment.confirmed) {
        action = (
          <Typography variant="body2">
            {`${new Date(payment.paidAt).toLocaleDateString()}${payment.recipientConfirmed ? ' / Empfang bestätigt' : ' / Eingang offen'}`}
          </Typography>
        );
      } else {
        action = <Typography variant="body2">Zahlung offen</Typography>;
      }
    } else if (m.uid === currentUid) {
      const tip = selectedCycle === null
        ? 'Keine aktive Runde'
        : isRecipient
          ? 'Du bist Empfänger'
          : '';
      action = (
        <Tooltip title={tip} disableHoverListener={!tip} disableFocusListener={!tip} disableTouchListener={!tip}>
          <span>
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleConfirm(m.uid)}
              disabled={disableMemberConfirm}
            >
              Zahlung bestätigen
            </Button>
          </span>
        </Tooltip>
      );
    } else {
      action = <Typography variant="body2">Nicht bestätigt</Typography>;
    }
    return (
      <ListItem key={m.uid} secondaryAction={action}>
        <ListItemText primary={`${name}${isRoundRecipient ? ' (Empfänger)' : ''}`} />
      </ListItem>
    );
  };

  const alreadyConfirmed = payments.some(p => p.user.uid === currentUid && p.confirmed);
  const disableTopConfirm = selectedCycle == null || isRecipient || alreadyConfirmed;

  return (
      <>
        <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Zahlungsübersicht</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {isOwner && (
              loadingCycles ? (
                <Skeleton variant="rectangular" width={120} height={40} />
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
        </Box>

        {isOwner && (
          summary.length > 0 ? (
            <Paper sx={{ p: 2, mb: 3 }}>
              <Typography variant="h6" mb={2}>Runden-Übersicht</Typography>
              {summary.map(s => {
                const r = members.find(m => m.uid === s.recipientUid);
                const name = r ? (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : r.username) : s.recipientUid;
                const status = s.completed
                  ? 'abgeschlossen'
                  : s.receiptCount === s.totalPayers
                    ? 'vollständig bestätigt'
                    : s.paidCount === s.totalPayers
                      ? 'vollständig bezahlt'
                      : 'offen';
                const paidPct = s.totalPayers ? (s.paidCount / s.totalPayers) * 100 : 0;
                const receiptPct = s.totalPayers ? (s.receiptCount / s.totalPayers) * 100 : 0;
                return (
                  <Box key={s.id} mb={2} sx={{ cursor: 'pointer' }} onClick={() => setSelectedCycle(s.id)}>
                    <Typography variant="body2">Runde {s.cycleNumber} – Empfänger: {name}</Typography>
                    <Box display="flex" alignItems="center" gap={1} mt={1}>
                      <LinearProgress variant="determinate" value={paidPct} sx={{ flex: 1 }} />
                      <LinearProgress variant="determinate" value={receiptPct} color="secondary" sx={{ flex: 1 }} />
                      <Chip label={status} size="small" />
                    </Box>
                    <Typography variant="caption">Bezahlt {s.paidCount}/{s.totalPayers} – Empfang bestätigt {s.receiptCount}/{s.totalPayers}</Typography>
                  </Box>
                );
              })}
            </Paper>
          ) : (
            <Alert severity="info" sx={{ mb: 3 }}>
              Noch keine Runden – Jamiah starten
            </Alert>
          )
        )}

        {cycles.length === 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            Keine aktive Runde – bitte vom Admin starten lassen.
          </Alert>
        )}
        <Box mb={3}>
          <Button variant="contained" startIcon={<EuroIcon />} onClick={handlePay}>
            Beitrag bezahlen
          </Button>
          {(() => {
            const tip = selectedCycle == null
              ? 'Keine aktive Runde'
              : isRecipient
                ? 'Du bist Empfänger'
                : alreadyConfirmed
                  ? 'Schon bestätigt'
                  : '';
            return (
              <Tooltip title={tip} disableHoverListener={!tip} disableFocusListener={!tip} disableTouchListener={!tip}>
                <span>
                  <Button
                    sx={{ ml: 2 }}
                    variant="outlined"
                    onClick={() => handleConfirm(currentUid || '')}
                    disabled={disableTopConfirm}
                  >
                    Zahlung bestätigen
                  </Button>
                </span>
              </Tooltip>
            );
          })()}
        </Box>

        {/* Eigene Kurzansicht immer anzeigen */}
        <Typography variant="body2" sx={{ mb: 2 }}>
          {(() => {
            const own = payments.find(p => p.user.uid === currentUid);
            if (!own) return 'Noch nicht bezahlt';
            if (!own.confirmed) return 'Zahlung offen';
            return `Bezahlt am ${new Date(own.paidAt).toLocaleDateString()}${own.recipientConfirmed ? ' / Empfang bestätigt' : ' / Eingang offen'}`;
          })()}
        </Typography>

        {/* Details zur aktuellen Runde */}
        {currentCycle && (
        <Paper sx={{ p: 2 }}>
            <Box mb={2}>
              <Typography variant="body2">Empfänger: {
                (() => {
                  const rUid = currentCycle?.recipient?.uid;
                  const r = members.find(m => m.uid === rUid);
                  return r ? (r.firstName || r.lastName ? `${r.firstName || ''} ${r.lastName || ''}`.trim() : r.username) : rUid;
                })()
              }</Typography>
              <Typography variant="body2">Bezahlt: {paidCount}/{totalPayers}</Typography>
              <Typography variant="body2">Empfang bestätigt: {receiptCount}/{totalPayers}</Typography>
              <Typography variant="body2">Rundenstatus: {roundStatus}</Typography>
            </Box>
            <List>
              {loadingPayments ? (
                <ListItem><Skeleton width="100%" /></ListItem>
              ) : (
                sortedMembers.map(renderMemberRow)
              )}
            </List>
          </Paper>
        )}
        </Box>
        <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity={snackbar?.severity || 'success'} sx={{ width: '100%' }}>
            {snackbar?.message}
          </Alert>
        </Snackbar>
      </>
  );
};

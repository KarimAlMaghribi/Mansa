import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  TextField, MenuItem, Snackbar, Alert
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

export const Payments = () => {
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [snackbar, setSnackbar] = useState<{message: string; severity: 'success' | 'error'} | null>(null);

  const { user } = useAuth();
  const currentUid = user?.uid;
  const groupId = window.location.pathname.split('/')[2];

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(r => r.json())
      .then(data => {
        setAmount(data.rateAmount || 50);
        const owner = data.ownerId === currentUid;
        setIsOwner(owner);
      });

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setMembers(Array.isArray(data) ? data : []))
      .catch(() => setMembers([]));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data)) {
          setCycles(data);
          if (data.length > 0) {
            const today = new Date();
            const parse = (s: string) => new Date(s);
            const upcoming = data
              .filter((c: Cycle) => !c.completed && parse(c.startDate) <= today)
              .sort((a: Cycle, b: Cycle) => parse(a.startDate).getTime() - parse(b.startDate).getTime());
            const initial = upcoming[0]?.id ?? data[data.length - 1].id;
            setSelectedCycle(initial);
          }
        } else {
          setCycles([]);
        }
      })
      .catch(() => setCycles([]));
  }, [groupId, currentUid]);

  const fetchPayments = (cycleId: number) => {
    const uid = currentUid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/payments?uid=${encodeURIComponent(uid)}`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then(data => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {
        setPayments([]);
        setSnackbar({ message: 'Fehler beim Laden', severity: 'error' });
      });
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
  const isRecipient = currentCycle?.recipient?.uid === currentUid;

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
      })
      .catch(() => setSnackbar({ message: 'Fehler beim Empfangsbestätigen', severity: 'error' }));
  };

  const renderMemberRow = (m: Member) => {
    const payment = payments.find(p => p.user.uid === m.uid);
    const name = m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username;
    const isRoundRecipient = m.uid === currentCycle?.recipient?.uid;
    let action;
    if (m.uid === currentUid && isRecipient) {
      action = <Typography variant="body2">Empfänger zahlt nicht</Typography>;
    } else if (payment) {
      if (m.uid === currentUid) {
        if (!payment.confirmed) {
          action = (
            <Button
              size="small"
              variant="outlined"
              onClick={() => handleConfirm(m.uid)}
              disabled={selectedCycle === null || isRecipient}
            >
              Zahlung bestätigen
            </Button>
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
      action = (
        <Button
          size="small"
          variant="outlined"
          onClick={() => handleConfirm(m.uid)}
          disabled={selectedCycle === null || isRecipient}
        >
          Zahlung bestätigen
        </Button>
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

  return (
      <>
        <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Zahlungsübersicht</Typography>
          <Box display="flex" alignItems="center" gap={2}>
            {cycles.length > 0 && (
              <TextField
                select
                label="Zyklus"
                value={selectedCycle ?? ''}
                onChange={e => setSelectedCycle(Number(e.target.value))}
                size="small"
              >
                {cycles.map(c => (
                  <MenuItem key={c.id} value={c.id}>Zyklus {c.cycleNumber}</MenuItem>
                ))}
              </TextField>
            )}
          </Box>
        </Box>

        <Box mb={3}>
          <Button variant="contained" startIcon={<EuroIcon />} onClick={handlePay}>
            Beitrag bezahlen
          </Button>
          <Button
            sx={{ ml: 2 }}
            variant="outlined"
            onClick={() => handleConfirm(currentUid || '')}
            disabled={selectedCycle == null || isRecipient || payments.some(p => p.user.uid === currentUid && p.confirmed)}
          >
            Zahlung bestätigen
          </Button>
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

        {/* Zusatz-Card für Admin oder Empfänger */}
        {(isOwner || isRecipient) && (
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
              {members.map(renderMemberRow)}
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

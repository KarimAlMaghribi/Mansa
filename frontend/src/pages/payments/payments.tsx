import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  Switch, FormControlLabel, TextField, MenuItem, Snackbar, Alert
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';

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
}

interface Cycle {
  id: number;
  cycleNumber: number;
  startDate: string;
  completed: boolean;
  recipient?: { uid: string };
}

export const Payments = () => {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(50);
  const [snackbar, setSnackbar] = useState<string | null>(null);

  const groupId = window.location.pathname.split('/')[2];
  const currentUid = auth.currentUser?.uid;

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(r => r.json())
      .then(data => {
        setAmount(data.rateAmount || 50);
        const owner = data.ownerId === currentUid;
        setIsOwner(owner);
        setIsAdminView(owner);
      });

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(r => r.json())
      .then(data => setMembers(data));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
      .then(r => r.json())
      .then(data => {
        setCycles(data);
        if (data.length > 0) {
          setSelectedCycle(data[data.length - 1].id);
        }
      });
  }, [groupId, currentUid]);

  const fetchPayments = (cycleId: number) => {
    const uid = currentUid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/payments?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(data => setPayments(data));
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
  const showList = isAdminView || isRecipient;

  const totalMembers = members.length;
  const paidCount = payments.length;
  const receiptCount = payments.filter(p => p.recipientConfirmed).length;
  let roundStatus = 'offen';
  if (currentCycle?.completed) {
    roundStatus = 'abgeschlossen';
  } else if (receiptCount === totalMembers && totalMembers > 0) {
    roundStatus = 'vollständig bestätigt';
  } else if (paidCount === totalMembers && totalMembers > 0) {
    roundStatus = 'vollständig bezahlt';
  }

  const handleConfirm = (uid: string) => {
    if (!selectedCycle) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${selectedCycle}/pay?uid=${encodeURIComponent(uid)}&amount=${amount}`, { method: 'POST' })
      .then(() => {
        setSnackbar('Zahlung bestätigt');
        fetchPayments(selectedCycle);
      });
  };

  const handleReceiptConfirm = (paymentId: number) => {
    if (!selectedCycle) return;
    const uid = currentUid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${selectedCycle}/payments/${paymentId}/confirm-receipt?uid=${encodeURIComponent(uid)}`, { method: 'POST' })
      .then(() => {
        setSnackbar('Empfang bestätigt');
        fetchPayments(selectedCycle);
      });
  };

  const renderMemberRow = (m: Member) => {
    const payment = payments.find(p => p.user.uid === m.uid);
    const name = m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username;
    let action;
    if (payment) {
      if (isRecipient && !payment.recipientConfirmed && m.uid !== currentUid) {
        action = <Button size="small" variant="outlined" onClick={() => handleReceiptConfirm(payment.id)}>Erhalt bestätigen</Button>;
      } else {
        action = <Typography variant="body2">{`${new Date(payment.paidAt).toLocaleDateString()}${payment.recipientConfirmed ? ' / Empfang bestätigt' : ' / Eingang offen'}`}</Typography>;
      }
    } else if (m.uid === currentUid) {
      action = <Button size="small" variant="outlined" onClick={() => handleConfirm(m.uid)}>Zahlung bestätigen</Button>;
    } else {
      action = <Typography variant="body2">Nicht bestätigt</Typography>;
    }
    return (
      <ListItem key={m.uid} secondaryAction={action}>
        <ListItemText primary={name} />
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
            {isOwner && (
              <FormControlLabel
                control={
                  <Switch
                    checked={isAdminView}
                    onChange={() => setIsAdminView(!isAdminView)}
                  />
                }
                label={isAdminView ? "Admin-Modus" : "Mitgliedsansicht"}
              />
            )}
          </Box>
        </Box>

        <Box mb={3}>
          <Button variant="contained" startIcon={<EuroIcon />} onClick={handlePay}>
            Beitrag bezahlen
          </Button>
          <Button sx={{ ml: 2 }} variant="outlined" onClick={() => handleConfirm(currentUid || '')}>Zahlung bestätigen</Button>
        </Box>

        {showList ? (
          <Paper sx={{ p: 2 }}>
            <Box mb={2}>
              <Typography variant="body2">Bezahlt: {paidCount}/{totalMembers}</Typography>
              <Typography variant="body2">Empfang bestätigt: {receiptCount}/{totalMembers}</Typography>
              <Typography variant="body2">Rundenstatus: {roundStatus}</Typography>
            </Box>
            <List>
              {members.map(renderMemberRow)}
            </List>
          </Paper>
        ) : (
          <Typography variant="body2">
            {payments.find(p => p.user.uid === currentUid)
              ? `Bezahlt am ${new Date((payments.find(p => p.user.uid === currentUid) as Payment).paidAt).toLocaleDateString()}${(payments.find(p => p.user.uid === currentUid) as Payment).recipientConfirmed ? ' / Empfang bestätigt' : ''}`
              : 'Noch nicht bezahlt'}
          </Typography>
        )}
        </Box>
        <Snackbar open={!!snackbar} autoHideDuration={4000} onClose={() => setSnackbar(null)}>
          <Alert onClose={() => setSnackbar(null)} severity="success" sx={{ width: '100%' }}>
            {snackbar}
          </Alert>
        </Snackbar>
      </>
  );
};

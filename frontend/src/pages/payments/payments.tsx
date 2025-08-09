import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  Switch, FormControlLabel, TextField, MenuItem
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
  user: { uid: string; };
  paidAt: string;
}

interface Cycle {
  id: number;
  cycleNumber: number;
  startDate: string;
  completed: boolean;
}

export const Payments = () => {
  const [isAdminView, setIsAdminView] = useState(false);
  const [isOwner, setIsOwner] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [cycles, setCycles] = useState<Cycle[]>([]);
  const [selectedCycle, setSelectedCycle] = useState<number | null>(null);
  const [amount, setAmount] = useState<number>(50);

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
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/payments`)
      .then(r => r.json())
      .then(data => setPayments(data));
  };

  useEffect(() => {
    if (selectedCycle !== null) {
      fetchPayments(selectedCycle);
    }
  }, [groupId, selectedCycle]);

  const handlePay = () => {
    const link = `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=student.abdelkarim@gmail.com&amount=${amount}&currency_code=EUR`;
    window.open(link, '_blank');
  };

  const handleConfirm = (uid: string) => {
    if (!selectedCycle) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${selectedCycle}/pay?uid=${encodeURIComponent(uid)}&amount=${amount}`, { method: 'POST' })
      .then(() => fetchPayments(selectedCycle));
  };

  const renderMemberRow = (m: Member) => {
    const payment = payments.find(p => p.user.uid === m.uid);
    const name = m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username;
    return (
      <ListItem key={m.uid} secondaryAction={
        payment ? (
          <Typography variant="body2">{new Date(payment.paidAt).toLocaleDateString()}</Typography>
        ) : (
          <Button size="small" variant="outlined" onClick={() => handleConfirm(m.uid)}>Bestätigen</Button>
        )
      }>
        <ListItemText primary={name} />
      </ListItem>
    );
  };

  return (
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

        {isAdminView ? (
          <Paper sx={{ p: 2 }}>
            <List>
              {members.map(renderMemberRow)}
            </List>
          </Paper>
        ) : (
          <Typography variant="body2">
            {payments.find(p => p.user.uid === currentUid)
              ? `Bezahlt am ${new Date((payments.find(p => p.user.uid === currentUid) as Payment).paidAt).toLocaleDateString()}`
              : 'Noch nicht bezahlt'}
          </Typography>
        )}
      </Box>
  );
};

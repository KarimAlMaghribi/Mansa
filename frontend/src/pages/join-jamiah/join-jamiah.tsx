import React, { useMemo, useState } from 'react';
import { Box, Button, TextField, Typography, Snackbar, Alert } from '@mui/material';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';
import { fetchJoinStatus, normalizeAcceptedStatus, JoinRequestStatus } from '../../api/jamiah-status';

export const JoinJamiahPage = () => {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);
  const [joinStatus, setJoinStatus] = useState<JoinRequestStatus | null>(null);
  const [jamiahName, setJamiahName] = useState('');

  const statusAlert = useMemo(() => {
    if (!joinStatus) return null;
    const severity = joinStatus === 'rejected' ? 'error' : joinStatus === 'pending' ? 'info' : 'success';
    const label =
      joinStatus === 'pending'
        ? 'Beitrittsanfrage gesendet'
        : joinStatus === 'accepted'
        ? 'Beitritt bestätigt'
        : 'Beitritt abgelehnt';
    return (
      <Alert severity={severity} sx={{ mt: 2 }}>
        {label}
        {jamiahName ? ` für ${jamiahName}` : ''}
      </Alert>
    );
  }, [jamiahName, joinStatus]);

  const handleSubmit = async () => {
    const uid = auth.currentUser?.uid || '';
    setJoinStatus(null);
    setJamiahName('');
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/jamiahs/join?code=${encodeURIComponent(code)}&uid=${encodeURIComponent(uid)}`,
        { method: 'POST' }
      );
      if (response.ok) {
        const jamiah = await response.json();
        setJamiahName(jamiah?.name ?? 'deine Jamiah');
        setMessage('Beitritt erfolgreich angefragt.');
        setError(false);
        if (jamiah?.id && uid) {
          const { status } = await fetchJoinStatus(jamiah.id, uid);
          setJoinStatus(normalizeAcceptedStatus(status));
        } else {
          setJoinStatus('accepted');
        }
      } else if (response.status === 400) {
        setMessage('Maximale Teilnehmerzahl erreicht.');
        setError(true);
      } else {
        setMessage('Einladungscode ungültig.');
        setError(true);
      }
    } catch (e) {
      setMessage('Einladungscode ungültig.');
      setError(true);
    } finally {
      setOpen(true);
    }
  };

  return (
    <Box p={4} maxWidth={400} mx="auto">
      <Typography variant="h5" gutterBottom>
        Jamiah beitreten
      </Typography>
      <TextField
        label="Einladungscode"
        fullWidth
        value={code}
        onChange={e => setCode(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Button variant="contained" fullWidth onClick={handleSubmit} disabled={!code}>
        Beitreten
      </Button>
      {statusAlert}
      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert severity={error ? 'error' : 'success'} onClose={() => setOpen(false)} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

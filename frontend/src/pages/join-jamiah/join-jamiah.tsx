import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Snackbar, Alert } from '@mui/material';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';

export const JoinJamiahPage = () => {
  const [code, setCode] = useState('');
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    const uid = auth.currentUser?.uid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/join?code=${encodeURIComponent(code)}&uid=${encodeURIComponent(uid)}`, {
      method: 'POST'
    })
      .then(res => {
        if (res.ok) {
          setMessage('Beitritt erfolgreich angefragt.');
          setError(false);
        } else if (res.status === 400) {
          setMessage('Maximale Teilnehmerzahl erreicht.');
          setError(true);
        } else {
          setMessage('Einladungscode ungültig.');
          setError(true);
        }
      })
      .catch(() => {
        setMessage('Einladungscode ungültig.');
        setError(true);
      })
      .finally(() => setOpen(true));
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
      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert severity={error ? 'error' : 'success'} onClose={() => setOpen(false)} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

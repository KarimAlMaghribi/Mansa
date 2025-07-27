import React, { useState } from 'react';
import { Box, Button, TextField, Typography, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';
import { signUpWithEmail } from '../../firebase/firebase-service';
import { auth } from '../../firebase_config';
import { API_BASE_URL } from '../../constants/api';

export const SignUpForm: React.FC = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: '',
    firstName: '',
    lastName: ''
  });
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const failed = await signUpWithEmail(formData.email, formData.password);
    if (!failed && auth.currentUser) {
      await fetch(`${API_BASE_URL}/api/userProfiles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          uid: auth.currentUser.uid,
          username: formData.username,
          firstName: formData.firstName,
          lastName: formData.lastName
        })
      });
      navigate('/');
    } else {
      setMessage('Registrierung fehlgeschlagen.');
      setOpen(true);
    }
    setLoading(false);
  };

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, px: 2, maxWidth: 400, mx: 'auto' }}>
      <Typography variant="h5" gutterBottom>Registrieren</Typography>
      <TextField label="E-Mail" name="email" type="email" fullWidth required sx={{ mb: 2 }}
                 value={formData.email} onChange={handleChange} />
      <TextField label="Passwort" name="password" type="password" fullWidth required sx={{ mb: 2 }}
                 value={formData.password} onChange={handleChange} />
      <TextField label="Benutzername" name="username" fullWidth required sx={{ mb: 2 }}
                 value={formData.username} onChange={handleChange} />
      <TextField label="Vorname" name="firstName" fullWidth sx={{ mb: 2 }}
                 value={formData.firstName} onChange={handleChange} />
      <TextField label="Nachname" name="lastName" fullWidth sx={{ mb: 2 }}
                 value={formData.lastName} onChange={handleChange} />
      <Button type="submit" variant="contained" fullWidth disabled={loading} sx={{ mb: 2 }}>
        Konto erstellen
      </Button>
      <Button fullWidth onClick={() => navigate(`/${ROUTES.SIGN_IN}`)}>Zum Login</Button>
      <Snackbar open={open} autoHideDuration={6000} onClose={() => setOpen(false)}>
        <Alert severity="error" onClose={() => setOpen(false)} sx={{ width: '100%' }}>
          {message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

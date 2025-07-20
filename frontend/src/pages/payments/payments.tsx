import React, { useState } from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button,
  Switch, FormControlLabel
} from '@mui/material';
import EuroIcon from '@mui/icons-material/Euro';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';

export const Payments = () => {
  const [isAdminView, setIsAdminView] = useState(true);
  const members = [
    { uid: 'u1', name: 'Amina Yusuf' },
    { uid: 'u2', name: 'Ali Khan' },
  ];

  const handlePay = (uid: string) => {
    const groupId = (window.location.pathname.split('/')[2]);
    const cycleId = 1; // simplified demo
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${cycleId}/pay?uid=${encodeURIComponent(uid)}&amount=50`, { method: 'POST' });
  };

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Zahlungsübersicht</Typography>
          <FormControlLabel
              control={
                <Switch
                    checked={isAdminView}
                    onChange={() => setIsAdminView(!isAdminView)}
                />
              }
              label={isAdminView ? "Admin-Modus" : "Mitgliedsansicht"}
          />
        </Box>

        {isAdminView && (
            <Box mb={3}>
              <Button variant="contained" startIcon={<EuroIcon />}>
                Manuelle Zahlung verbuchen
              </Button>
            </Box>
        )}

        <Paper sx={{ p: 2 }}>
          <List>
            {members.map(m => (
              <ListItem key={m.uid} secondaryAction={
                <Button size="small" variant="outlined" onClick={() => handlePay(m.uid)}>Bezahlt</Button>
              }>
                <ListItemText primary={m.name} />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
  );
};

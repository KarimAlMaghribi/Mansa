
import React from 'react';
import {
  Box, Typography, Grid, Paper, List, ListItem, ListItemText, Button, Divider, Switch, FormControlLabel, Avatar, Stack
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/PersonRemove';
import EmailIcon from '@mui/icons-material/Email';

export const Members = () => {
  const [isAdminView, setIsAdminView] = React.useState(true);

  const members = [
    { name: 'Amina Yusuf', role: 'Admin', joined: '01.2023', payments: '✅', lastLogin: '2025-05-02' },
    { name: 'Ali Khan', role: 'Mitglied', joined: '03.2023', payments: '❌', lastLogin: '2025-04-20' },
    { name: 'Fatima El-Hadi', role: 'Mitglied', joined: '08.2023', payments: '✅', lastLogin: '2025-05-01' },
  ];

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Mitgliederbereich</Typography>
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

        <Grid container spacing={3}>
          {members.map((member, i) => (
              <Grid item xs={12} md={6} key={i}>
                <Paper sx={{ p: 2 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar>{member.name.charAt(0)}</Avatar>
                    <Box flexGrow={1}>
                      <Typography variant="h6">{member.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        Rolle: {member.role} | Beigetreten: {member.joined}
                      </Typography>
                    </Box>
                    {isAdminView && (
                        <Stack direction="row" spacing={1}>
                          <Button size="small" startIcon={<EditIcon />}>Bearbeiten</Button>
                          <Button size="small" color="error" startIcon={<DeleteIcon />}>Entfernen</Button>
                        </Stack>
                    )}
                  </Stack>
                  <Divider sx={{ my: 1 }} />
                  <Typography variant="body2">
                    Zahlungsstatus: {isAdminView ? member.payments : (member.name === 'Ali Khan' ? '❌' : '✅')}
                  </Typography>
                  {isAdminView && (
                      <Typography variant="body2" color="text.secondary">
                        Letzter Login: {member.lastLogin}
                      </Typography>
                  )}
                  {!isAdminView && member.role === 'Admin' && (
                      <Box mt={1}>
                        <Button variant="outlined" size="small" startIcon={<EmailIcon />}>Kontakt aufnehmen</Button>
                      </Box>
                  )}
                </Paper>
              </Grid>
          ))}
        </Grid>
      </Box>
  );
};

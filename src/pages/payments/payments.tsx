import React from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button, Divider, Stack,
  Switch, FormControlLabel, IconButton
} from '@mui/material';
import CheckIcon from '@mui/icons-material/CheckCircle';
import CloseIcon from '@mui/icons-material/Cancel';
import EditIcon from '@mui/icons-material/Edit';
import EuroIcon from '@mui/icons-material/Euro';

export const Payments = () => {
  const [isAdminView, setIsAdminView] = React.useState(true);

  const allPayments = [
    { name: 'Amina Yusuf', month: 'April 2025', amount: '50€', status: 'Bezahlt' },
    { name: 'Ali Khan', month: 'April 2025', amount: '50€', status: 'Ausstehend' },
    { name: 'Fatima El-Hadi', month: 'April 2025', amount: '50€', status: 'Bezahlt' },
    { name: 'Amina Yusuf', month: 'Mai 2025', amount: '50€', status: 'Bezahlt' },
  ];

  const memberName = 'Amina Yusuf';
  const visiblePayments = isAdminView
      ? allPayments
      : allPayments.filter(p => p.name === memberName);

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
            {visiblePayments.map((payment, i) => (
                <React.Fragment key={i}>
                  <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          {payment.status === 'Bezahlt' ? (
                              <CheckIcon color="success" />
                          ) : (
                              <CloseIcon color="error" />
                          )}
                          {isAdminView && (
                              <IconButton edge="end">
                                <EditIcon />
                              </IconButton>
                          )}
                        </Stack>
                      }
                  >
                    <ListItemText
                        primary={`${payment.month} – ${payment.amount}`}
                        secondary={isAdminView ? `Mitglied: ${payment.name}` : `Status: ${payment.status}`}
                    />
                  </ListItem>
                  {i < visiblePayments.length - 1 && <Divider />}
                </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
  );
};

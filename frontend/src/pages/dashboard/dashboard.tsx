import React from 'react';
import {
  Box, Grid, Paper, Typography, List, ListItem, ListItemText, Divider, Stack, Button, Tooltip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { selectName } from '../../store/slices/user-profile';
import { JamiahSettings } from '../../components/jamiah/JamiahSettings';
import { Jamiah } from '../../models/Jamiah';

export const Dashboard = () => {
  const userName = useSelector(selectName);

  const jamiah: Jamiah = {
    name: 'Beispiel Jamiah',
    isPublic: false,
    cycleCount: 12,
    rateAmount: 50,
    rateInterval: 'MONTHLY',
  };

  const stats = [
    {
      label: 'Meine Jamiahs',
      value: 3,
      href: '/groups',
      tooltip: 'Zeige dir alle Jamiahs, in denen du aktiv bist.'
    },
    {
      label: 'Bezahlte Monate',
      value: 11,
      href: '/payments',
      tooltip: 'Anzahl der Monate, für die du bereits bezahlt hast.'
    },
    {
      label: 'Ausstehende Zahlungen',
      value: '1 Monat',
      href: '/payments',
      tooltip: 'Noch offene Beiträge, die bezahlt werden müssen.'
    },
    {
      label: 'Offene Anträge',
      value: 2,
      href: '/votes',
      tooltip: 'Anträge, über die aktuell abgestimmt wird.'
    }
  ];

  const recentVotes = [
    { title: 'Neuer Vorstand ab Juli', status: 'Läuft' },
    { title: 'Ramadan-Spendenaktion', status: 'Abgeschlossen' },
  ];

  const recentPayments = [
    { month: 'April 2025', amount: '50€', status: 'Bezahlt' },
    { month: 'Mai 2025', amount: '50€', status: 'Ausstehend' },
  ];

  const personalDocs = [
    { name: 'Mitgliedsbestätigung.pdf' },
    { name: 'Beitragsquittung_April.pdf' },
  ];

  return (
      <Box p={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Willkommen zurück{userName ? `, ${userName}` : ''} 👋
        </Typography>

        {/* Statistiken */}
        <Grid container spacing={3} mb={4}>
          {stats.map((s, i) => (
              <Grid item xs={12} sm={6} md={3} key={i}>
                <Tooltip title={s.tooltip} arrow>
                  <Paper
                      sx={{
                        p: 2,
                        textAlign: 'center',
                        cursor: 'pointer',
                        transition: '0.2s',
                        '&:hover': {
                          backgroundColor: '#f5f5f5',
                          transform: 'scale(1.02)'
                        }
                      }}
                      onClick={() => window.open(s.href, '_blank', 'noopener,noreferrer')}
                  >
                    <Typography variant="subtitle2" color="textSecondary">{s.label}</Typography>
                    <Typography variant="h5" fontWeight="bold">{s.value}</Typography>
                  </Paper>
                </Tooltip>
              </Grid>
          ))}
        </Grid>

        <JamiahSettings jamiah={jamiah} />

        <Grid container spacing={3}>
          {/* Abstimmungen */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Letzte Abstimmungen</Typography>
              <Stack spacing={1}>
                {recentVotes.map((v, i) => (
                    <Box key={i}>
                      <Typography>{v.title} – <i>{v.status}</i></Typography>
                      {i < recentVotes.length - 1 && <Divider sx={{ my: 1 }} />}
                    </Box>
                ))}
              </Stack>
              <Button
                  size="small"
                  sx={{ mt: 2 }}
                  href="/votes"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                Zu den Abstimmungen
              </Button>
            </Paper>
          </Grid>

          {/* Zahlungen */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Meine Zahlungen</Typography>
              <List dense>
                {recentPayments.map((p, i) => (
                    <ListItem key={i}>
                      <ListItemText
                          primary={`${p.month} – ${p.amount}`}
                          secondary={p.status}
                      />
                    </ListItem>
                ))}
              </List>
              <Button
                  size="small"
                  href="/payments"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                Zahlungen verwalten
              </Button>
            </Paper>
          </Grid>

          {/* Eigene Dokumente */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Meine Dokumente</Typography>
              <List dense>
                {personalDocs.map((d, i) => (
                    <ListItem key={i}>
                      <ListItemText primary={d.name} />
                    </ListItem>
                ))}
              </List>
              <Button
                  size="small"
                  href="/documents"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                Alle Dokumente anzeigen
              </Button>
            </Paper>
          </Grid>

          {/* Hinweise */}
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>Wichtige Hinweise</Typography>
              <Typography>
                Deine nächste Zahlung ist fällig bis zum 10. Mai. <br />
                <b>Bitte rechtzeitig überweisen oder SEPA aktivieren.</b>
              </Typography>
              <Button
                  size="small"
                  sx={{ mt: 2 }}
                  href="/account"
                  target="_blank"
                  rel="noopener noreferrer"
              >
                Zahlungseinstellungen prüfen
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Box>
  );
};

import React, { useEffect, useState } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  List,
  ListItem,
  ListItemText,
  Divider,
  Stack,
  Button,
  Tooltip,
  Chip
} from '@mui/material';
import { useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { selectName } from '../../store/slices/user-profile';
import { JamiahSettings } from '../../components/jamiah/JamiahSettings';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import CheckIcon from '@mui/icons-material/Check';
import { auth } from '../../firebase_config';

export const Dashboard = () => {
  const { groupId } = useParams();
  const userName = useSelector(selectName);
  const [jamiah, setJamiah] = useState<Jamiah | null>(null);
  const [cycle, setCycle] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!groupId) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(res => res.json())
      .then(data => setJamiah(data))
      .catch(() => setJamiah(null));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(res => res.json())
      .then(data => setMembers(data))
      .catch(() => setMembers([]));

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
      .then(res => res.json())
      .then(data => {
        const active = data[data.length - 1];
        setCycle(active);
        if (active) {
          fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${active.id}/payments`)
            .then(res => res.json())
            .then(p => setPayments(p))
            .catch(() => setPayments([]));
        }
      })
      .catch(() => setCycle(null));
  }, [groupId]);

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

        {jamiah && cycle && (
          <Box mb={4}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>{jamiah.name}</Typography>
            <Typography variant="subtitle1" gutterBottom>
              Zyklus – Runde <b>{cycle.cycleNumber}</b> von {cycle.memberOrder?.length || members.length}
            </Typography>
            <List>
              {cycle.memberOrder?.map((uid: string) => {
                const m = members.find(mem => mem.uid === uid) || {};
                const hasPaid = payments.some(p => p.user && p.user.uid === uid);
                const isRecipient = cycle.recipient && cycle.recipient.uid === uid;
                const displayName = m.firstName || m.username || uid;
                return (
                  <ListItem key={uid}>
                    <ListItemText primary={`${displayName}${auth.currentUser?.uid === uid ? ' (Du)' : ''}`} />
                    {isRecipient && <Chip label="Aktueller Empfänger" size="small" color="primary" sx={{ mr: 1 }} />}
                    {hasPaid && <CheckIcon color="success" />}
                  </ListItem>
                );
              })}
            </List>
            <Typography variant="body2">
              Fortschritt: {payments.length}/{cycle.memberOrder?.length || members.length} Zahlungen bestätigt.
            </Typography>
          </Box>
        )}

        {jamiah && <JamiahSettings jamiah={jamiah} />}

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

import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '../../context/AuthContext';

interface JoinRequest {
  id: number;
  userUid: string;
  status: string;
  motivation?: string;
  username?: string;
  firstName?: string;
  lastName?: string;
}

export const Dashboard = () => {
  const { groupId } = useParams();
  const userName = useSelector(selectName);
  const [jamiah, setJamiah] = useState<Jamiah | null>(null);
  const [cycle, setCycle] = useState<any | null>(null);
  const [payments, setPayments] = useState<any[]>([]);
  const [members, setMembers] = useState<any[]>([]);
  const [joinRequests, setJoinRequests] = useState<JoinRequest[]>([]);
  const { user } = useAuth();
  const votePageLink = groupId ? `/jamiah/${groupId}/votes` : '/groups';

  const currentUid = user?.uid ?? auth.currentUser?.uid ?? null;

  const loadMembers = useCallback(async () => {
    if (!groupId) return;
    try {
      const res = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`);
      if (!res.ok) throw new Error('failed to load members');
      const data = await res.json();
      setMembers(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[dashboard] Fehler beim Laden der Mitglieder', error);
      setMembers([]);
    }
  }, [groupId]);

  const loadJoinRequests = useCallback(async (ownerUid: string) => {
    if (!groupId) return;
    try {
      const res = await fetch(
        `${API_BASE_URL}/api/jamiahs/${groupId}/join-requests?uid=${ownerUid}`
      );
      if (!res.ok) throw new Error('failed to load join requests');
      const data: JoinRequest[] = await res.json();
      const enriched = await Promise.all(
        data.map(async (request) => {
          try {
            const profileRes = await fetch(
              `${API_BASE_URL}/api/userProfiles/uid/${request.userUid}`
            );
            if (!profileRes.ok) throw new Error('profile not found');
            const profile = await profileRes.json();
            return { ...request, ...profile };
          } catch (profileError) {
            console.warn(
              `[dashboard] Profil konnte nicht geladen werden für ${request.userUid}`,
              profileError
            );
            return request;
          }
        })
      );
      setJoinRequests(enriched);
    } catch (error) {
      console.error('[dashboard] Fehler beim Laden der Bewerbungen', error);
      setJoinRequests([]);
    }
  }, [groupId]);

  useEffect(() => {
    if (!groupId) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => setJamiah(data))
      .catch(() => setJamiah(null));

    void loadMembers();

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles`)
      .then(res => res.ok ? res.json() : Promise.reject())
      .then(data => {
        if (Array.isArray(data)) {
          const active = data[data.length - 1];
          setCycle(active);
          if (active) {
            fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/cycles/${active.id}/payments`)
              .then(res => res.ok ? res.json() : Promise.reject())
              .then(p => setPayments(Array.isArray(p) ? p : []))
              .catch(() => setPayments([]));
          }
        } else {
          setCycle(null);
        }
      })
      .catch(() => setCycle(null));
  }, [groupId, loadMembers]);

  const isOwner = useMemo(
    () => Boolean(jamiah && currentUid && jamiah.ownerId === currentUid),
    [jamiah, currentUid]
  );

  useEffect(() => {
    if (!isOwner || !currentUid) {
      setJoinRequests([]);
      return;
    }
    void loadJoinRequests(currentUid);
  }, [isOwner, currentUid, loadJoinRequests]);

  const handleDecision = useCallback(
    async (requestId: number, accept: boolean) => {
      if (!groupId || !currentUid) return;
      try {
        const res = await fetch(
          `${API_BASE_URL}/api/jamiahs/${groupId}/join-requests/${requestId}?uid=${currentUid}&accept=${accept}`,
          { method: 'POST' }
        );
        if (!res.ok) throw new Error('decision failed');
        await loadJoinRequests(currentUid);
        if (accept) {
          await loadMembers();
        }
      } catch (error) {
        console.error('[dashboard] Entscheidung für Beitrittsanfrage fehlgeschlagen', error);
      }
    },
    [groupId, currentUid, loadJoinRequests, loadMembers]
  );

  const pendingRequests = useMemo(
    () => joinRequests.filter((request) => request.status === 'PENDING'),
    [joinRequests]
  );

  const stats = useMemo(() => [
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
      value: pendingRequests.length,
      href: votePageLink,
      tooltip: 'Anträge, über die aktuell abgestimmt wird.'
    }
  ], [pendingRequests.length, votePageLink]);

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

        {isOwner && (
          <Box mb={4}>
            <Typography variant="h5" fontWeight="bold" gutterBottom>
              Beitrittsanfragen
            </Typography>
            {pendingRequests.length === 0 ? (
              <Paper sx={{ p: 3 }}>
                <Typography>
                  Aktuell liegen keine offenen Beitrittsanfragen vor.
                </Typography>
              </Paper>
            ) : (
              <Stack spacing={2}>
                {pendingRequests.map((request) => {
                  const displayName = (
                    `${request.firstName ?? ''} ${request.lastName ?? ''}`.trim() ||
                    request.username ||
                    request.userUid
                  );
                  return (
                    <Paper key={request.id} sx={{ p: 2 }}>
                      <Stack
                        direction={{ xs: 'column', sm: 'row' }}
                        spacing={2}
                        justifyContent="space-between"
                        alignItems={{ xs: 'flex-start', sm: 'center' }}
                      >
                        <Box>
                          <Typography variant="subtitle1">{displayName}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Möchte der Jamiah beitreten
                          </Typography>
                          {request.motivation && (
                            <Typography variant="body2" mt={1}>
                              {request.motivation}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            color="success"
                            variant="contained"
                            onClick={() => handleDecision(request.id, true)}
                          >
                            Annehmen
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            variant="contained"
                            onClick={() => handleDecision(request.id, false)}
                          >
                            Ablehnen
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  );
                })}
              </Stack>
            )}
          </Box>
        )}

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
                  href={votePageLink}
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

import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  TextField,
  Avatar,
  Chip,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';
import { useAuth } from '../../context/AuthContext';
import { fetchJoinStatus, JoinRequestStatus } from '../../api/jamiah-status';

export const SearchPage = () => {
  const [publicGroups, setPublicGroups] = useState<Jamiah[]>([]);
  const [myGroups, setMyGroups] = useState<Jamiah[]>([]);
  const [search, setSearch] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [statusMap, setStatusMap] = useState<Record<string, JoinRequestStatus>>({});
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Jamiah | null>(null);
  const [motivation, setMotivation] = useState('');
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jamiahs/public`)
      .then(res => res.json())
      .then(setPublicGroups)
      .catch(() => setPublicGroups([]));
  }, []);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setMyGroups([]);
      setStatusMap({});
      return;
    }
    fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/jamiahs`)
      .then(res => res.json())
      .then(setMyGroups)
      .catch(() => setMyGroups([]));
  }, [user]);

  useEffect(() => {
    const uid = user?.uid;
    if (!uid) {
      setStatusMap({});
      return;
    }
    const ids = publicGroups.map(pg => pg.id).filter((id): id is string => Boolean(id));
    if (ids.length === 0) {
      setStatusMap({});
      return;
    }
    let cancelled = false;
    const load = async () => {
      const entries = await Promise.all(
        ids.map(async (id) => {
          const { status } = await fetchJoinStatus(id, uid);
          return [id, status] as [string, JoinRequestStatus];
        })
      );
      if (!cancelled) {
        setStatusMap(Object.fromEntries(entries));
      }
    };
    void load();
    return () => {
      cancelled = true;
    };
  }, [publicGroups, user?.uid]);

  const joinedIds = useMemo(
    () => new Set(myGroups.filter(g => g.id).map(g => g.id as string)),
    [myGroups]
  );

  const openJoinDialog = (group: Jamiah) => {
    setSelectedGroup(group);
    setMotivation('');
    setJoinDialogOpen(true);
  };

  const submitJoinRequest = () => {
    if (!selectedGroup) return;
    const uid = auth.currentUser?.uid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${selectedGroup.id}/join-public/request`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ uid, motivation })
    })
      .then(res => {
        if (res.ok) {
          if (selectedGroup.id) {
            setStatusMap((current) => ({ ...current, [selectedGroup.id as string]: 'pending' }));
          }
          setSnackbarMessage('Bewerbung gesendet');
          setSnackbarError(false);
        } else {
          setSnackbarMessage('Fehler beim Bewerben');
          setSnackbarError(true);
        }
      })
      .catch(() => {
        setSnackbarMessage('Fehler beim Bewerben');
        setSnackbarError(true);
      })
      .finally(() => {
        setSnackbarOpen(true);
        setJoinDialogOpen(false);
      });
  };

  const availablePublicGroups = publicGroups.filter(
    pg => !joinedIds.has(pg.id as string) && pg.ownerId !== user?.uid
  );

  const filteredPublicGroups = availablePublicGroups.filter(pg =>
    pg.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <Box p={4}>
      <Box display="flex" alignItems="center" gap={2} mb={2}>
        <TextField
          label="Jamiah suchen"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <Button
          variant="outlined"
          startIcon={<KeyIcon />}
          onClick={() => navigate(`/${ROUTES.JOIN_JAMIAH}`)}
        >
          Beitreten mit Code
        </Button>
      </Box>
      <Grid container spacing={4}>
        {filteredPublicGroups.map(pg => {
          const rawStatus = statusMap[pg.id as string] ?? 'none';
          const joined = joinedIds.has(pg.id as string) || rawStatus === 'accepted';
          const pending = rawStatus === 'pending';
          const rejected = rawStatus === 'rejected';
          const isOwner = pg.ownerId === user?.uid;
          return (
            <Grid item xs={12} sm={6} md={4} key={pg.id}>
              <Card>
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                    <Avatar>{pg.name[0]}</Avatar>
                    <Typography variant="h6">{pg.name}</Typography>
                    {isOwner ? (
                      <Chip label="Eigentümer" color="info" size="small" />
                    ) : joined ? (
                      <Chip label="Beigetreten" color="success" size="small" />
                    ) : rejected ? (
                      <Chip label="Abgelehnt" color="error" size="small" />
                    ) : pending ? (
                      <Chip label="Bewerbung läuft" color="warning" size="small" />
                    ) : null}
                  </Box>
                  {pg.description && (
                    <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                      {pg.description}
                    </Typography>
                  )}
                </CardContent>
                <CardActions>
                  {isOwner ? (
                    <Button disabled fullWidth>Eigentümer</Button>
                  ) : joined ? (
                    <Button disabled fullWidth>Beigetreten</Button>
                  ) : rejected ? (
                    <Button disabled fullWidth>Abgelehnt</Button>
                  ) : pending ? (
                    <Button disabled fullWidth>Bewerbung läuft</Button>
                  ) : (
                    <Button variant="contained" fullWidth onClick={() => openJoinDialog(pg)}>
                      Beitreten
                    </Button>
                  )}
                </CardActions>
              </Card>
            </Grid>
          );
        })}
      </Grid>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
        <Alert severity={snackbarError ? 'error' : 'success'} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
      <Dialog open={joinDialogOpen} onClose={() => setJoinDialogOpen(false)}>
        <DialogTitle>Beitrittsanfrage</DialogTitle>
        <DialogContent>
          <TextField
            label="Warum möchtest du beitreten?"
            fullWidth
            multiline
            minRows={3}
            value={motivation}
            onChange={e => setMotivation(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setJoinDialogOpen(false)}>Abbrechen</Button>
          <Button onClick={submitJoinRequest} variant="contained">Senden</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default SearchPage;

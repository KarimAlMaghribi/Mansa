import React, { useEffect, useState } from 'react';
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

export const SearchPage = () => {
  const [publicGroups, setPublicGroups] = useState<Jamiah[]>([]);
  const [myGroups, setMyGroups] = useState<Jamiah[]>([]);
  const [search, setSearch] = useState('');
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [pendingIds, setPendingIds] = useState<string[]>([]);
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
      setPendingIds([]);
      return;
    }
    fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/jamiahs`)
      .then(res => res.json())
      .then(setMyGroups)
      .catch(() => setMyGroups([]));

    fetch(`${API_BASE_URL}/api/jamiahs/join-requests?uid=${uid}`)
      .then(res => res.json())
      .then(data => setPendingIds(data.filter((r: any) => r.status === 'PENDING').map((r: any) => r.jamiahId)))
      .catch(() => setPendingIds([]));
  }, [user]);

  const joinedIds = new Set(myGroups.filter(g => g.id).map(g => g.id as string));
  const pendingSet = new Set(pendingIds);

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
          setPendingIds([...pendingIds, selectedGroup.id as string]);
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
          const joined = joinedIds.has(pg.id as string);
          const pending = pendingSet.has(pg.id as string);
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

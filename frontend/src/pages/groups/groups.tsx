
import React, { useCallback, useEffect, useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  CardActions,
  Grid,
  Typography,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tooltip,
  Skeleton,
  Snackbar,
  Alert,
  Avatar,
  Chip,
  LinearProgress,
  Pagination,
  List,
  ListItem,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  IconButton,
  useMediaQuery,
  useTheme,
  Fade
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/VpnKey';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import CloseIcon from '@mui/icons-material/Close';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { GenerateInviteButton } from '../../components/jamiah/GenerateInviteButton';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import SettingsIcon from '@mui/icons-material/Settings';
import { JamiahWizard } from '../../components/jamiah/JamiahWizard';
import { JAMIAH_GROUPS_REFRESH_EVENT } from '../../constants/events';

const DEFAULT_NEW_GROUP: Partial<Jamiah> = {
  name: '',
  description: '',
  isPublic: false,
  rateInterval: 'MONTHLY',
};

export const Groups = () => {
  const [groups, setGroups] = useState<Jamiah[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Jamiah | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createWizardKey, setCreateWizardKey] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [visibilityFilter, setVisibilityFilter] = useState<'all' | 'public' | 'private'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'completed'>('all');
  const [page, setPage] = useState(1);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarError, setSnackbarError] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const theme = useTheme();
  const isMobile = useMediaQuery('(max-width:600px)');
  const { user, loading: authLoading } = useAuth();

  const refreshGroups = useCallback(async () => {
    const uid = user?.uid;
    if (!uid) {
      setGroups([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${uid}/jamiahs`);
      if (!res.ok) {
        throw new Error('Failed to load groups');
      }
      const data = await res.json();
      setGroups(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('[groups] Fehler beim Laden der Jamiahs', error);
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [user?.uid]);

  useEffect(() => {
    void refreshGroups();
  }, [refreshGroups]);

  useEffect(() => {
    const handler = () => {
      void refreshGroups();
    };
    window.addEventListener(JAMIAH_GROUPS_REFRESH_EVENT, handler);
    return () => window.removeEventListener(JAMIAH_GROUPS_REFRESH_EVENT, handler);
  }, [refreshGroups]);


  const navigate = useNavigate();
  const handleCreateOpen = () => {
    setOpenCreateModal(true);
  };
  const handleCreateClose = () => {
    setOpenCreateModal(false);
    setCreateWizardKey(key => key + 1);
  };
  const handleJoinOpen = () => navigate(`/${ROUTES.JOIN_JAMIAH}`);
  const handleCloseModal = () => setOpenModal(false);
  const handleDetails = (group: Jamiah) => {
    navigate(`/jamiah/${group.id}`);
  };

  const isCreateDisabled = authLoading || !user?.uid;
  const createDisabledMessage = authLoading
    ? 'Benutzerdaten werden geladen. Bitte warte einen Moment.'
    : !user?.uid
    ? 'Bitte melde dich an, um eine Jamiah zu erstellen.'
    : undefined;

  const handleCreateJamiah = async (data: Partial<Jamiah>) => {
    const payload = { ...DEFAULT_NEW_GROUP, ...data };
    if (!payload.name || payload.name.trim().length === 0) {
      throw new Error('Name ist erforderlich');
    }
    if (authLoading) {
      throw new Error('Benutzerdaten werden noch geladen. Bitte versuche es in Kürze erneut.');
    }
    const uid = user?.uid;
    if (!uid) {
      throw new Error('Du musst angemeldet sein, um eine Jamiah zu erstellen.');
    }
    setCreateLoading(true);
    try {
      const url = `${API_BASE_URL}/api/jamiahs?uid=${encodeURIComponent(uid)}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        throw new Error('Jamiah konnte nicht erstellt werden');
      }
      const created = await response.json();
      setSnackbarMessage('Erfolgreich erstellt');
      setSnackbarError(false);
      setSnackbarOpen(true);
      handleCreateClose();
      await refreshGroups();
      return created;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Jamiah konnte nicht erstellt werden';
      throw new Error(message);
    } finally {
      setCreateLoading(false);
    }
  };


  const getCycleInfo = (g: Jamiah) => {
    if (!g.startDate || !g.cycleCount) return { current: 0, nextIn: null };
    const unit = g.rateInterval === 'WEEKLY' ? 'week' : 'month';
    const start = dayjs(g.startDate);
    const now = dayjs();
    const diff = now.diff(start, unit);
    const current = Math.min(diff + 1, g.cycleCount);
    const next = start.add(diff + 1, unit);
    return { current, nextIn: next.diff(now, 'day') };
  };

  const isCompleted = (g: Jamiah) => {
    if (!g.startDate || !g.cycleCount) return false;
    const unit = g.rateInterval === 'WEEKLY' ? 'week' : 'month';
    return dayjs().diff(dayjs(g.startDate), unit) >= g.cycleCount;
  };

  useEffect(() => {
    setPage(1);
  }, [search, visibilityFilter, statusFilter]);

  const filteredGroups = groups
    .filter(g => g && g.name)
    .filter(g => g.name.toLowerCase().includes(search.toLowerCase()))
    .filter(g =>
      visibilityFilter === 'all'
        ? true
        : visibilityFilter === 'public'
        ? g.isPublic
        : !g.isPublic
    )
    .filter(g => {
      if (statusFilter === 'all') return true;
      const completed = isCompleted(g);
      return statusFilter === 'completed' ? completed : !completed;
    });

  const paginatedGroups = filteredGroups.slice((page - 1) * 9, page * 9);

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Deine Jamiahs</Typography>
          <Box display="flex" gap={2}>
            <Button variant="outlined" startIcon={<KeyIcon />} onClick={handleJoinOpen}>
              Beitreten mit Code
            </Button>
            <Button variant="contained" startIcon={<AddCircleOutlineIcon />} onClick={handleCreateOpen}>
              Neue Jamiah gründen
            </Button>
          </Box>
        </Box>

        <Box display="flex" gap={2} mb={2}>
          <TextField label="Jamiah suchen" value={search} onChange={e => setSearch(e.target.value)} />
          <TextField
            select
            label="Alle / Öffentliche / Private Jamiahs"
            value={visibilityFilter}
            onChange={e => setVisibilityFilter(e.target.value as 'all' | 'public' | 'private')}
            sx={{ minWidth: 280 }}
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="public">Öffentliche</MenuItem>
            <MenuItem value="private">Private</MenuItem>
          </TextField>
          <TextField
            select
            label="Aktiver Zyklus / Abgeschlossen"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value as 'all' | 'active' | 'completed')}
            sx={{ minWidth: 280 }}
          >
            <MenuItem value="all">Alle</MenuItem>
            <MenuItem value="active">Aktiver Zyklus</MenuItem>
            <MenuItem value="completed">Abgeschlossen</MenuItem>
          </TextField>
        </Box>

        {loading ? (
          <Grid container spacing={4}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Grid item xs={12} sm={6} md={4} key={i}>
                <Skeleton variant="rectangular" height={180} />
              </Grid>
            ))}
          </Grid>
        ) : filteredGroups.length === 0 ? (
          <Typography variant="body1" color="textSecondary">
            Du bist noch keiner Jamiah beigetreten. Verwende einen Einladungslink oder -code oder gründe deine eigene
            Jamiah.
          </Typography>
        ) : isMobile ? (
          <List>
            {paginatedGroups.map(group => {
              const info = getCycleInfo(group);
              const isOwner = group.ownerId === user?.uid;
              return (
                <ListItem key={group.id} disablePadding>
                  <ListItemButton onClick={() => handleDetails(group)}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}>
                        {group.name[0]}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <span>{group.name}</span>
                          {isOwner && <Chip label="Eigentümer" color="info" size="small" />}
                        </Box>
                      }
                      secondary={`Zyklus ${info.current} von ${group.cycleCount ?? '?'}`}
                    />
                  </ListItemButton>
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Grid container spacing={4}>
            {paginatedGroups.map(group => {
              const info = getCycleInfo(group);
              const progress = group.cycleCount ? (info.current / group.cycleCount) * 100 : 0;
              return (
                <Grid item xs={12} sm={6} md={4} key={group.id}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                    <Card elevation={3} sx={{ transition: '0.3s', '&:hover': { transform: 'scale(1.02)', boxShadow: theme.shadows[8] } }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
                          <Avatar sx={{ bgcolor: theme.palette.primary.main, color: theme.palette.getContrastText(theme.palette.primary.main) }}>
                            {group.name[0]}
                          </Avatar>
                          <Typography variant="h6">{group.name}</Typography>
                          <Box display="flex" alignItems="center" gap={1}>
                            {group.isPublic ? (
                              <Tooltip title="Öffentliche Jamiah"><PublicIcon fontSize="small" /></Tooltip>
                            ) : (
                              <Tooltip title="Private Jamiah"><LockIcon fontSize="small" /></Tooltip>
                            )}
                            {group.ownerId === user?.uid && (
                              <Chip label="Eigentümer" color="info" size="small" />
                            )}
                          </Box>
                        </Box>
                        <LinearProgress variant="determinate" value={progress} sx={{ mb: 1 }} />
                        <Typography variant="body2">Zyklus {info.current} von {group.cycleCount ?? '?'}</Typography>
                        {info.nextIn !== null && (
                          <Typography variant="body2" gutterBottom>Nächste Abrechnung in {info.nextIn} Tagen</Typography>
                        )}
                        <Divider sx={{ my: 1 }} />
                        {group.currentMembers !== undefined && group.maxMembers !== undefined && (
                          <Typography variant="body2">Mitglieder: <b>{group.currentMembers} / {group.maxMembers}</b></Typography>
                        )}
                        {group.description && (
                          <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>{group.description}</Typography>
                        )}
                      </CardContent>
                      <CardActions sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Button
                          size="small"
                          variant="outlined"
                          fullWidth
                          startIcon={<InfoOutlinedIcon />}
                          onClick={() => handleDetails(group)}
                          aria-label="Details ansehen"
                          sx={{ mt: 1, '&:focus': { outline: '2px solid', outlineColor: 'primary.main' } }}
                        >
                          Details ansehen
                        </Button>
                        {!group.isPublic && group.id && (
                          <GenerateInviteButton jamiahId={group.id} />
                        )}
                        {group.ownerId === user?.uid && !group.startDate && group.id && (
                          <Button
                            size="small"
                            variant="contained"
                            fullWidth
                            startIcon={<SettingsIcon />}
                            onClick={() => navigate(`/jamiah/${group.id}/setup`)}
                            sx={{ mt: 1, '&:focus': { outline: '2px solid', outlineColor: 'primary.main' } }}
                          >
                            Setup starten
                          </Button>
                        )}
                     </CardActions>
                    </Card>
                  </motion.div>
                </Grid>
              );
            })}
          </Grid>
        )}

        {filteredGroups.length > 9 && (
          <Box display="flex" justifyContent="center" mt={2}>
            <Pagination count={Math.ceil(filteredGroups.length / 9)} page={page} onChange={(_, p) => setPage(p)} />
          </Box>
        )}


        {/* Detail-Modal */}
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth TransitionComponent={Fade}>
          <DialogTitle>
            Jamiah bearbeiten
            <IconButton aria-label="Schließen" onClick={handleCloseModal} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          {selectedGroup && (
            <>
              <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Name"
                  value={selectedGroup.name}
                  onChange={e => setSelectedGroup({ ...selectedGroup, name: e.target.value })}
                />
                <TextField
                  label="Beschreibung"
                  value={selectedGroup.description ?? ''}
                  onChange={e => setSelectedGroup({ ...selectedGroup, description: e.target.value })}
                  multiline
                />
                <TextField
                  label="Maximale Gruppengröße"
                  type="number"
                  value={selectedGroup.maxGroupSize ?? ''}
                  inputProps={{ min: 2 }}
                  onChange={e => setSelectedGroup({ ...selectedGroup, maxGroupSize: Number(e.target.value) })}
                />
                <TextField
                  label="Anzahl Zyklen"
                  type="number"
                  value={selectedGroup.cycleCount ?? ''}
                  inputProps={{ min: 1 }}
                  onChange={e => setSelectedGroup({ ...selectedGroup, cycleCount: Number(e.target.value) })}
                />
                <TextField
                  label="Ratenhöhe"
                  type="number"
                  value={selectedGroup.rateAmount ?? ''}
                  inputProps={{ min: 1 }}
                  onChange={e => setSelectedGroup({ ...selectedGroup, rateAmount: Number(e.target.value) })}
                />
                <TextField
                  select
                  label="Raten-Rhythmus"
                  value={selectedGroup.rateInterval}
                  onChange={e => setSelectedGroup({ ...selectedGroup, rateInterval: e.target.value as 'WEEKLY' | 'MONTHLY' })}
                >
                  <MenuItem value="WEEKLY">Wöchentlich</MenuItem>
                  <MenuItem value="MONTHLY">Monatlich</MenuItem>
                </TextField>
                <TextField
                  label="Startdatum"
                  type="date"
                  InputLabelProps={{ shrink: true }}
                  value={selectedGroup.startDate ?? ''}
                  onChange={e => setSelectedGroup({ ...selectedGroup, startDate: e.target.value })}
                />
                <TextField
                  select
                  label="Typ"
                  value={selectedGroup.isPublic ? 'public' : 'private'}
                  onChange={e => setSelectedGroup({ ...selectedGroup, isPublic: e.target.value === 'public' })}
                >
                  <MenuItem value="private">Privat (nur mit Einladung)</MenuItem>
                  <MenuItem value="public">Öffentlich (sichtbar für alle)</MenuItem>
                </TextField>
              </DialogContent>
              <DialogActions sx={{ display: 'flex', flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
                <Button variant="text" fullWidth onClick={handleCloseModal} sx={{ mt: 1, '&:focus': { outline: '2px solid', outlineColor: 'primary.main' } }} aria-label="Abbrechen">Abbrechen</Button>
                {!selectedGroup.isPublic && selectedGroup.id && (
                  <GenerateInviteButton jamiahId={selectedGroup.id} />
                )}
                {selectedGroup.ownerId === user?.uid && !selectedGroup.startDate && selectedGroup.id && (
                  <Button
                    variant="outlined"
                    fullWidth
                    startIcon={<SettingsIcon />}
                    onClick={() => {
                      setOpenModal(false);
                      navigate(`/jamiah/${selectedGroup.id}/setup`);
                    }}
                    sx={{ '&:focus': { outline: '2px solid', outlineColor: 'primary.main' } }}
                  >
                    Setup öffnen
                  </Button>
                )}
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  sx={{ mt: 1, '&:focus': { outline: '2px solid', outlineColor: 'primary.main' } }}
                  onClick={() => {
                    fetch(`${API_BASE_URL}/api/jamiahs/${selectedGroup.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(selectedGroup)
                    })
                      .then(async res => {
                        if (res.ok) {
                          await refreshGroups();
                          setSnackbarMessage('Erfolgreich gespeichert');
                          setSnackbarError(false);
                        } else {
                          setSnackbarMessage('Fehler beim Speichern');
                          setSnackbarError(true);
                        }
                      })
                      .catch(() => {
                        setSnackbarMessage('Fehler beim Speichern');
                        setSnackbarError(true);
                      })
                      .finally(() => {
                        setSnackbarOpen(true);
                        setOpenModal(false);
                      });
                  }}
                >
                  Speichern
                </Button>
                <Button
                  color="error"
                  onClick={() => {
                    fetch(`${API_BASE_URL}/api/jamiahs/${selectedGroup.id}`, {
                      method: 'DELETE'
                    })
                      .then(() => refreshGroups())
                      .finally(() => setOpenModal(false));
                  }}
                >
                  Löschen
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Modal */}
        <Dialog open={openCreateModal} onClose={handleCreateClose} maxWidth="sm" fullWidth TransitionComponent={Fade}>
          <DialogTitle>
            Neue Jamiah gründen
            <IconButton aria-label="Schließen" onClick={handleCreateClose} sx={{ position: 'absolute', right: 8, top: 8 }}>
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <JamiahWizard
              key={createWizardKey}
              initialValue={DEFAULT_NEW_GROUP}
              submitLabel="Jamiah erstellen"
              onSubmit={handleCreateJamiah}
              onCancel={handleCreateClose}
              submitting={createLoading}
              submitDisabled={isCreateDisabled}
              submitDisabledMessage={createDisabledMessage}
            />
          </DialogContent>
        </Dialog>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={() => setSnackbarOpen(false)}>
          <Alert severity={snackbarError ? 'error' : 'success'} onClose={() => setSnackbarOpen(false)} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Box>
  );
};

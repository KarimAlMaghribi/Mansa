
import React, { useEffect, useState } from 'react';
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
  Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/VpnKey';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { GenerateInviteButton } from '../../components/jamiah/GenerateInviteButton';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../routing/routes';

export const Groups = () => {
  const [groups, setGroups] = useState<Jamiah[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Jamiah | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<Jamiah>>({
    name: '',
    description: '',
    isPublic: false,
    maxGroupSize: undefined,
    cycleCount: undefined,
    rateAmount: undefined,
    rateInterval: 'MONTHLY',
    startDate: undefined
  });
  const [createErrors, setCreateErrors] = useState<{ name?: boolean }>({});

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/jamiahs`)
      .then(res => res.json())
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  const navigate = useNavigate();
  const handleCreateOpen = () => setOpenCreateModal(true);
  const handleJoinOpen = () => navigate(`/${ROUTES.JOIN_JAMIAH}`);
  const handleCloseModal = () => setOpenModal(false);
  const handleDetails = (group: Jamiah) => {
    setSelectedGroup(group);
    setOpenModal(true);
  };

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

        {groups.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              Du bist noch keiner Jamiah beigetreten. Verwende einen Einladungscode oder gründe deine eigene Jamiah.
            </Typography>
        ) : (
            <Grid container spacing={4}>
              {groups.map((group) => (
                  <Grid item xs={12} sm={6} md={4} key={group.id}>
                    <Card elevation={3} sx={{ transition: '0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{group.name}</Typography>
                          {group.isPublic ? (
                              <Tooltip title="Öffentliche Jamiah"><PublicIcon fontSize="small" /></Tooltip>
                          ) : (
                              <Tooltip title="Private Jamiah"><LockIcon fontSize="small" /></Tooltip>
                          )}
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        {group.maxGroupSize && (
                          <Typography variant="body2">Max Mitglieder: <b>{group.maxGroupSize}</b></Typography>
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
                        >
                          Details ansehen
                        </Button>
                        {!group.isPublic && group.id && (
                            <GenerateInviteButton jamiahId={group.id} />
                        )}
                      </CardActions>
                    </Card>
                  </Grid>
              ))}
            </Grid>
        )}

        {/* Detail-Modal */}
        <Dialog open={openModal} onClose={handleCloseModal} maxWidth="sm" fullWidth>
          <DialogTitle>Jamiah bearbeiten</DialogTitle>
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
                <Button onClick={handleCloseModal}>Abbrechen</Button>
                {!selectedGroup.isPublic && selectedGroup.id && (
                  <GenerateInviteButton jamiahId={selectedGroup.id} />
                )}
                <Button
                  onClick={() => {
                    fetch(`${API_BASE_URL}/api/jamiahs/${selectedGroup.id}`, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(selectedGroup)
                    }).then(() => {
                      setGroups(groups.map(g => (g.id === selectedGroup.id ? selectedGroup : g)));
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
                    }).then(() => {
                      setGroups(groups.filter(g => g.id !== selectedGroup.id));
                      setOpenModal(false);
                    });
                  }}
                >
                  Löschen
                </Button>
              </DialogActions>
            </>
          )}
        </Dialog>

        {/* Create Modal */}
        <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Neue Jamiah gründen</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Name der Jamiah"
              fullWidth
              required
              error={createErrors.name && !newGroup.name}
              helperText={createErrors.name && !newGroup.name ? 'Name erforderlich' : ''}
              value={newGroup.name}
              onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              value={newGroup.description}
              onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
            />
            <TextField
              label="Maximale Gruppengröße"
              type="number"
              fullWidth
              value={newGroup.maxGroupSize ?? ''}
              inputProps={{ min: 2 }}
              onChange={e => setNewGroup({ ...newGroup, maxGroupSize: Number(e.target.value) })}
            />
            <TextField
              label="Anzahl Zyklen"
              type="number"
              fullWidth
              value={newGroup.cycleCount ?? ''}
              inputProps={{ min: 1 }}
              onChange={e => setNewGroup({ ...newGroup, cycleCount: Number(e.target.value) })}
            />
            <TextField
              label="Ratenhöhe"
              type="number"
              fullWidth
              value={newGroup.rateAmount ?? ''}
              inputProps={{ min: 1 }}
              onChange={e => setNewGroup({ ...newGroup, rateAmount: Number(e.target.value) })}
            />
            <TextField
              select
              label="Raten-Rhythmus"
              value={newGroup.rateInterval}
              onChange={e => setNewGroup({ ...newGroup, rateInterval: e.target.value as 'WEEKLY' | 'MONTHLY' })}
            >
              <MenuItem value="WEEKLY">Wöchentlich</MenuItem>
              <MenuItem value="MONTHLY">Monatlich</MenuItem>
            </TextField>
            <TextField
              label="Startdatum"
              type="date"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={newGroup.startDate ?? ''}
              onChange={e => setNewGroup({ ...newGroup, startDate: e.target.value })}
            />
            <TextField
              select
              label="Typ"
              value={newGroup.isPublic ? 'public' : 'private'}
              onChange={e => setNewGroup({ ...newGroup, isPublic: e.target.value === 'public' })}
            >
              <MenuItem value="private">Privat (nur mit Einladung)</MenuItem>
              <MenuItem value="public">Öffentlich (sichtbar für alle)</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateModal(false)}>Abbrechen</Button>
            <Button
              onClick={() => {
                if (!newGroup.name) {
                  setCreateErrors({ name: true });
                  return;
                }
                fetch(`${API_BASE_URL}/api/jamiahs`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newGroup)
                })
                  .then(res => res.json())
                  .then(j => {
                    setGroups([...groups, j]);
                    setOpenCreateModal(false);
                    setCreateErrors({});
                    setNewGroup({
                      name: '',
                      description: '',
                      isPublic: false,
                      maxGroupSize: undefined,
                      cycleCount: undefined,
                      rateAmount: undefined,
                      rateInterval: 'MONTHLY',
                      startDate: undefined
                    });
                  });
              }}
            >
              Erstellen
            </Button>
          </DialogActions>
        </Dialog>

      </Box>
  );
};

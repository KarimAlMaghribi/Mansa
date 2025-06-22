
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
  InputAdornment,
  MenuItem,
  Tooltip
} from '@mui/material';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyIcon from '@mui/icons-material/VpnKey';
import PublicIcon from '@mui/icons-material/Public';
import LockIcon from '@mui/icons-material/Lock';
import { Jamiah } from '../../models/Jamiah';

export const Groups = () => {
  const [groups, setGroups] = useState<Jamiah[]>([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedGroup, setSelectedGroup] = useState<Jamiah | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [openJoinModal, setOpenJoinModal] = useState(false);
  const [newGroup, setNewGroup] = useState<Partial<Jamiah>>({ name: '', monthlyContribution: undefined, isPublic: false });

  useEffect(() => {
    fetch('http://localhost:8080/api/jamiahs')
      .then(res => res.json())
      .then(setGroups)
      .catch(() => setGroups([]));
  }, []);

  const handleCreateOpen = () => setOpenCreateModal(true);
  const handleJoinOpen = () => setOpenJoinModal(true);
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
                        {group.monthlyContribution !== undefined && (
                          <Typography variant="body2">Beitrag: <b>{group.monthlyContribution}€</b></Typography>
                        )}
                      </CardContent>
                      <CardActions>
                        <Button
                            size="small"
                            variant="outlined"
                            fullWidth
                            startIcon={<InfoOutlinedIcon />}
                            onClick={() => handleDetails(group)}
                        >
                          Details ansehen
                        </Button>
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
                  label="Monatlicher Beitrag (€)"
                  type="number"
                  value={selectedGroup.monthlyContribution ?? ''}
                  onChange={e => setSelectedGroup({ ...selectedGroup, monthlyContribution: Number(e.target.value) })}
                  InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
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
              <DialogActions>
                <Button onClick={handleCloseModal}>Abbrechen</Button>
                <Button
                  onClick={() => {
                    fetch(`http://localhost:8080/api/jamiahs/${selectedGroup.id}`, {
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
              value={newGroup.name}
              onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
            />
            <TextField
              label="Monatlicher Beitrag (€)"
              type="number"
              fullWidth
              value={newGroup.monthlyContribution ?? ''}
              onChange={e => setNewGroup({ ...newGroup, monthlyContribution: Number(e.target.value) })}
              InputProps={{ endAdornment: <InputAdornment position="end">€</InputAdornment> }}
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
                fetch('http://localhost:8080/api/jamiahs', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(newGroup)
                })
                  .then(res => res.json())
                  .then(j => {
                    setGroups([...groups, j]);
                    setOpenCreateModal(false);
                    setNewGroup({ name: '', monthlyContribution: undefined, isPublic: false });
                  });
              }}
            >
              Erstellen
            </Button>
          </DialogActions>
        </Dialog>

        {/* Join Modal */}
        <Dialog open={openJoinModal} onClose={() => setOpenJoinModal(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Jamiah beitreten</DialogTitle>
          <DialogContent sx={{ mt: 1 }}>
            <TextField label="Einladungscode" fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenJoinModal(false)}>Abbrechen</Button>
            <Button onClick={() => {
              alert('Beitrittsanfrage gesendet!');
              setOpenJoinModal(false);
            }}>Beitreten</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

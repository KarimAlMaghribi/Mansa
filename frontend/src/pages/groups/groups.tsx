
import React from 'react';
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

export const Groups = () => {
  const dummyGroups = [
    { name: 'Jamiah Berlin', members: 34, contribution: '50€/Monat', role: 'Admin', type: 'public' },
    { name: 'Jamiah München', members: 21, contribution: '40€/Monat', role: 'Mitglied', type: 'private' },
    { name: 'Jamiah Köln', members: 17, contribution: '35€/Monat', role: 'Admin', type: 'public' },
  ];

  const [openModal, setOpenModal] = React.useState(false);
  const [selectedGroup, setSelectedGroup] = React.useState<typeof dummyGroups[0] | null>(null);
  const [openCreateModal, setOpenCreateModal] = React.useState(false);
  const [openJoinModal, setOpenJoinModal] = React.useState(false);

  const handleCreateOpen = () => setOpenCreateModal(true);
  const handleJoinOpen = () => setOpenJoinModal(true);
  const handleCloseModal = () => setOpenModal(false);
  const handleDetails = (group: typeof dummyGroups[0]) => {
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

        {dummyGroups.length === 0 ? (
            <Typography variant="body1" color="textSecondary">
              Du bist noch keiner Jamiah beigetreten. Verwende einen Einladungscode oder gründe deine eigene Jamiah.
            </Typography>
        ) : (
            <Grid container spacing={4}>
              {dummyGroups.map((group, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <Card elevation={3} sx={{ transition: '0.3s', '&:hover': { transform: 'scale(1.02)' } }}>
                      <CardContent>
                        <Box display="flex" justifyContent="space-between" alignItems="center">
                          <Typography variant="h6">{group.name}</Typography>
                          {group.type === 'public' ? (
                              <Tooltip title="Öffentliche Jamiah"><PublicIcon fontSize="small" /></Tooltip>
                          ) : (
                              <Tooltip title="Private Jamiah"><LockIcon fontSize="small" /></Tooltip>
                          )}
                        </Box>
                        <Divider sx={{ my: 1 }} />
                        <Typography variant="body2">Mitglieder: <b>{group.members}</b></Typography>
                        <Typography variant="body2">Beitrag: <b>{group.contribution}</b></Typography>
                        <Typography variant="body2">Rolle: <b>{group.role}</b></Typography>
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
          <DialogTitle>Details zur Jamiah</DialogTitle>
          <DialogContent>
            {selectedGroup && (
                <>
                  <Typography variant="h6">{selectedGroup.name}</Typography>
                  <Typography>Mitglieder: {selectedGroup.members}</Typography>
                  <Typography>Beitrag: {selectedGroup.contribution}</Typography>
                  <Typography>Rolle: {selectedGroup.role}</Typography>
                  <Typography sx={{ mt: 2 }} color="text.secondary">
                    Weitere Verwaltungsfunktionen folgen hier…
                  </Typography>
                </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseModal}>Schließen</Button>
          </DialogActions>
        </Dialog>

        {/* Create Modal */}
        <Dialog open={openCreateModal} onClose={() => setOpenCreateModal(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Neue Jamiah gründen</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Name der Jamiah" fullWidth />
            <TextField label="Monatlicher Beitrag (€)" type="number" fullWidth InputProps={{
              endAdornment: <InputAdornment position="end">€</InputAdornment>,
            }} />
            <TextField select label="Typ" defaultValue="private">
              <MenuItem value="private">Privat (nur mit Einladung)</MenuItem>
              <MenuItem value="public">Öffentlich (sichtbar für alle)</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenCreateModal(false)}>Abbrechen</Button>
            <Button onClick={() => {
              alert('Jamiah gespeichert!');
              setOpenCreateModal(false);
            }}>Erstellen</Button>
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

import React from 'react';
import {
  Box, Typography, Card, CardContent, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Divider
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';

export const Votes = () => {
  const [voteModalOpen, setVoteModalOpen] = React.useState(false);
  const [detailModalOpen, setDetailModalOpen] = React.useState(false);
  const [createModalOpen, setCreateModalOpen] = React.useState(false);
  const [selectedVote, setSelectedVote] = React.useState<any | null>(null);

  const votes = [
    { title: 'Neue Beitragshöhe ab Juni', status: 'Läuft', options: ['40€', '45€', '50€'], result: '45€' },
    { title: 'Anschaffung neuer Teppiche', status: 'Abgeschlossen', result: 'Ja' },
  ];

  const handleVote = (vote: any) => {
    setSelectedVote(vote);
    setVoteModalOpen(true);
  };

  const handleDetails = (vote: any) => {
    setSelectedVote(vote);
    setDetailModalOpen(true);
  };

  const handleCreateNew = () => {
    setCreateModalOpen(true);
  };

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Abstimmungen</Typography>
          <Button
              startIcon={<AddIcon />}
              variant="contained"
              sx={{ textTransform: 'none' }}
              onClick={handleCreateNew}
          >
            Neue Abstimmung
          </Button>
        </Box>

        <Stack spacing={3}>
          {votes.map((vote, i) => (
              <Card key={i}>
                <CardContent>
                  <Typography variant="h6">{vote.title}</Typography>
                  <Typography color="textSecondary">Status: {vote.status}</Typography>

                  <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                    {vote.status === 'Läuft' && (
                        <Button variant="outlined" startIcon={<HowToVoteIcon />} onClick={() => handleVote(vote)}>
                          Jetzt abstimmen
                        </Button>
                    )}
                    <Button variant="outlined" startIcon={<VisibilityIcon />} onClick={() => handleDetails(vote)}>
                      Details / Ergebnis
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
          ))}
        </Stack>

        {/* Abstimmen Modal */}
        <Dialog open={voteModalOpen} onClose={() => setVoteModalOpen(false)} maxWidth="xs" fullWidth>
          <DialogTitle>Jetzt abstimmen</DialogTitle>
          <DialogContent>
            {selectedVote?.options?.map((opt: string, idx: number) => (
                <Button
                    key={idx}
                    fullWidth
                    sx={{ my: 1 }}
                    variant="outlined"
                    onClick={() => {
                      alert(`Du hast für "${opt}" gestimmt.`);
                      setVoteModalOpen(false);
                    }}
                >
                  {opt}
                </Button>
            ))}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setVoteModalOpen(false)}>Abbrechen</Button>
          </DialogActions>
        </Dialog>

        {/* Details Modal */}
        <Dialog open={detailModalOpen} onClose={() => setDetailModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Abstimmungsdetails</DialogTitle>
          <DialogContent>
            <Typography variant="h6">{selectedVote?.title}</Typography>
            <Divider sx={{ my: 2 }} />
            {selectedVote?.status === 'Abgeschlossen' ? (
                <>
                  <Typography>Ergebnis: <b>{selectedVote?.result}</b></Typography>
                  <Typography color="textSecondary" sx={{ mt: 1 }}>
                    Diese Abstimmung wurde erfolgreich abgeschlossen.
                  </Typography>
                </>
            ) : (
                <Typography>Abstimmung läuft noch – bitte Stimme abgeben.</Typography>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDetailModalOpen(false)}>Schließen</Button>
          </DialogActions>
        </Dialog>

        {/* Neue Abstimmung Modal */}
        <Dialog open={createModalOpen} onClose={() => setCreateModalOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Neue Abstimmung erstellen</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField label="Titel der Abstimmung" fullWidth />
            <TextField label="Option 1" fullWidth />
            <TextField label="Option 2" fullWidth />
            <TextField label="Option 3 (optional)" fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setCreateModalOpen(false)}>Abbrechen</Button>
            <Button onClick={() => {
              alert('Abstimmung gespeichert!');
              setCreateModalOpen(false);
            }}>Speichern</Button>
          </DialogActions>
        </Dialog>
      </Box>
  );
};

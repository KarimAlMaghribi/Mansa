import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Card, CardContent, Button, Stack, Dialog, DialogTitle,
  DialogContent, DialogActions, TextField, Divider
} from '@mui/material';
import HowToVoteIcon from '@mui/icons-material/HowToVote';
import VisibilityIcon from '@mui/icons-material/Visibility';
import AddIcon from '@mui/icons-material/Add';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';
import { useParams } from 'react-router-dom';
import { StartCycleButton } from '../../components/jamiah/StartCycleButton';
import { Jamiah } from '../../models/Jamiah';
import { useAuth } from '../../context/AuthContext';

interface Vote {
  id: number;
  title: string;
  options: string[];
  ballots: Record<string, string>;
  closed: boolean;
  result?: string;
  expiresAt: string;
}

export const Votes = () => {
  const [votes, setVotes] = useState<Vote[]>([]);
  const [voteModalOpen, setVoteModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [selectedVote, setSelectedVote] = useState<Vote | null>(null);
  const [newTitle, setNewTitle] = useState('');
  const [opt1, setOpt1] = useState('');
  const [opt2, setOpt2] = useState('');
  const [opt3, setOpt3] = useState('');
  const [jamiah, setJamiah] = useState<Jamiah | null>(null);
  const [cycleStarted, setCycleStarted] = useState(false);
  const { user } = useAuth();
  const { groupId } = useParams();

  const uid = auth.currentUser?.uid || '';

  const loadVotes = () => {
    fetch(`${API_BASE_URL}/api/votes`)
      .then(r => r.json())
      .then(data => setVotes(data));
  };

  useEffect(() => {
    loadVotes();
  }, []);

  useEffect(() => {
    if (!groupId) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then(r => r.json())
      .then(data => {
        setJamiah(data);
        if (data.startDate) setCycleStarted(true);
      });
  }, [groupId]);

  const handleVote = (vote: Vote) => {
    setSelectedVote(vote);
    setVoteModalOpen(true);
  };

  const handleDetails = (vote: Vote) => {
    setSelectedVote(vote);
    setDetailModalOpen(true);
  };

  const handleCreateNew = () => {
    setCreateModalOpen(true);
  };

  const submitVote = (choice: string) => {
    if (!selectedVote) return;
    fetch(`${API_BASE_URL}/api/votes/${selectedVote.id}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: uid, choice })
    }).then(() => {
      setVoteModalOpen(false);
      loadVotes();
    });
  };

  const saveVote = () => {
    const options = [opt1, opt2, opt3].filter(Boolean);
    fetch(`${API_BASE_URL}/api/votes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle, options })
    }).then(() => {
      setCreateModalOpen(false);
      setNewTitle('');
      setOpt1('');
      setOpt2('');
      setOpt3('');
      loadVotes();
    });
  };

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="bold">Abstimmungen</Typography>
        <Stack direction="row" spacing={2}>
          {jamiah && user?.uid === jamiah.ownerId && !cycleStarted && (
            <StartCycleButton
              jamiahId={jamiah.id as string}
              onStarted={() => setCycleStarted(true)}
            />
          )}
          <Button
            startIcon={<AddIcon />}
            variant="contained"
            sx={{ textTransform: 'none' }}
            onClick={handleCreateNew}
          >
            Neue Abstimmung
          </Button>
        </Stack>
      </Box>

      <Stack spacing={3}>
        {votes.map(vote => (
          <Card key={vote.id}>
            <CardContent>
              <Typography variant="h6">{vote.title}</Typography>
              <Typography color="textSecondary">
                {vote.closed ? 'Abgeschlossen' : 'Läuft'}
              </Typography>

              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                {!vote.closed && (
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
          {selectedVote?.options.map((opt, idx) => (
            <Button
              key={idx}
              fullWidth
              sx={{ my: 1 }}
              variant="outlined"
              onClick={() => submitVote(opt)}
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
          {selectedVote?.closed ? (
            <>
              <Typography>Ergebnis: <b>{selectedVote?.result || 'Abgelehnt'}</b></Typography>
              <Typography color="textSecondary" sx={{ mt: 1 }}>
                Diese Abstimmung wurde abgeschlossen.
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
          <TextField label="Titel der Abstimmung" fullWidth value={newTitle} onChange={e => setNewTitle(e.target.value)} />
          <TextField label="Option 1" fullWidth value={opt1} onChange={e => setOpt1(e.target.value)} />
          <TextField label="Option 2" fullWidth value={opt2} onChange={e => setOpt2(e.target.value)} />
          <TextField label="Option 3 (optional)" fullWidth value={opt3} onChange={e => setOpt3(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateModalOpen(false)}>Abbrechen</Button>
          <Button onClick={saveVote}>Speichern</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

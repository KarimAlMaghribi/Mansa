import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField } from '@mui/material';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { ROUTES } from '../../routing/routes';
import { useAuth } from '../../context/AuthContext';
import SettingsIcon from '@mui/icons-material/Settings';

export const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Jamiah | null>(null);
  const { user } = useAuth();
  const [cycleStarted, setCycleStarted] = useState(false);
  const [status, setStatus] = useState<"member" | "applicant" | null>(null);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [motivation, setMotivation] = useState('');

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${id}`)
      .then(res => res.json())
      .then(data => {
        setGroup(data);
        if (data.startDate) setCycleStarted(true);
      })
      .catch(() => setGroup(null));
  }, [id]);

  useEffect(() => {
    if (!id || !user) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${id}/members`)
      .then(res => res.json())
      .then((ms: any[]) => {
        if (ms.some(m => m.uid === user.uid)) {
          setStatus("member");
        } else {
          fetch(`${API_BASE_URL}/api/jamiahs/${id}/join-public/status?uid=${user.uid}`)
            .then(r => (r.ok ? r.json() : null))
            .then(data => {
              if (data?.status === "PENDING") {
                setStatus("applicant");
              }
            })
            .catch(() => undefined);
        }
      })
      .catch(() => undefined);
  }, [id, user]);

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Button variant="text" onClick={() => navigate(`/${ROUTES.GROUPS}`)}>
        Zurück zu Meine Jamiahs
      </Button>
      {group ? (
        <Box mt={2}>
          <Typography variant="h4" gutterBottom>{group.name}</Typography>
          {group.description && (
            <Typography variant="body1" gutterBottom>{group.description}</Typography>
          )}
          <Divider sx={{ my: 2 }} />
          {group.language && (
            <Typography variant="body2">Sprache: <b>{group.language}</b></Typography>
          )}
          {group.currentMembers !== undefined && group.maxMembers !== undefined && (
            <Typography variant="body2">Mitglieder: <b>{group.currentMembers} / {group.maxMembers}</b></Typography>
          )}
          {group.rateAmount !== undefined && (
            <Typography variant="body2">Ratenhöhe: <b>{group.rateAmount}€</b></Typography>
          )}
          {group.rateInterval && (
            <Typography variant="body2">Ratenrhythmus: <b>{group.rateInterval === 'MONTHLY' ? 'Monatlich' : 'Wöchentlich'}</b></Typography>
          )}
          {group.cycleCount !== undefined && (
            <Typography variant="body2">Laufzeit: <b>{group.cycleCount} {group.rateInterval === 'MONTHLY' ? 'Monate' : 'Wochen'}</b></Typography>
          )}
          <Typography variant="body2" mt={2}>
            Sichtbarkeit: <b>{group.isPublic ? 'Öffentlich' : 'Privat'}</b>
          </Typography>
          {user?.uid === group.ownerId && (
            <Box mt={2} display="flex" flexDirection="column" gap={1}>
              {!cycleStarted && (
                <Button
                  variant="contained"
                  startIcon={<SettingsIcon />}
                  onClick={() => navigate(`/jamiah/${group.id}/setup`)}
                >
                  Setup starten
                </Button>
              )}
              {cycleStarted && (
                <Typography variant="body2">
                  Aktiver Zyklus läuft
                </Typography>
              )}
            </Box>
          )}
          <Box mt={3}>
            {status === "applicant" ? (
              <Typography color="textSecondary">Status: Bewerber</Typography>
            ) : status === "member" ? (
              <Typography color="textSecondary">Status: Mitglied</Typography>
          ) : group.isPublic ? (
              <Button
                variant="contained"
                onClick={() => setJoinDialogOpen(true)}
                disabled={
                  group.maxMembers !== undefined &&
                  group.currentMembers !== undefined &&
                  group.currentMembers >= group.maxMembers
                }
              >
                Jetzt bewerben
              </Button>
            ) : (
              <Typography color="textSecondary">Beitritt nur per Einladung</Typography>
            )}
          </Box>
        </Box>
      ) : (
        <Typography>Gruppe nicht gefunden.</Typography>
      )}
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
          <Button
            onClick={async () => {
              if (!id || !user) return;
              await fetch(`${API_BASE_URL}/api/jamiahs/${id}/join-public`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ uid: user.uid, motivation })
              }).catch(() => undefined);
              fetch(`${API_BASE_URL}/api/jamiahs/${id}/join-public/status?uid=${user.uid}`)
                .then(r => (r.ok ? r.json() : null))
                .then(d => {
                  if (d?.status === 'PENDING') setStatus('applicant');
                })
                .catch(() => undefined);
              setJoinDialogOpen(false);
            }}
            variant="contained"
          >
            Senden
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Chip } from '@mui/material';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { ROUTES } from '../../routing/routes';
import { useAuth } from '../../context/AuthContext';
import SettingsIcon from '@mui/icons-material/Settings';
import useJoinStatus from '../../hooks/useJoinStatus';

export const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Jamiah | null>(null);
  const { user } = useAuth();
  const [cycleStarted, setCycleStarted] = useState(false);
  const [joinDialogOpen, setJoinDialogOpen] = useState(false);
  const [motivation, setMotivation] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [walletProvisioned, setWalletProvisioned] = useState(false);
  const { status: joinStatus, refresh: refreshJoinStatus, loading: statusLoading } = useJoinStatus(id, user?.uid);

  useEffect(() => {
    setWalletProvisioned(false);
  }, [id, user?.uid]);

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
        setIsMember(ms.some(m => m.uid === user.uid));
      })
      .catch(() => undefined);
  }, [id, user]);

  useEffect(() => {
    if (joinStatus === 'accepted') {
      setIsMember(true);
    }
  }, [joinStatus]);

  const ownership = user && group && user.uid === group.ownerId;
  const statusState = useMemo(() => {
    if (ownership) return 'owner';
    if (isMember) return 'member';
    return joinStatus;
  }, [ownership, isMember, joinStatus]);

  const statusChip = useMemo(() => {
    if (!user) return null;
    switch (statusState) {
      case 'owner':
        return <Chip label="Eigentümer" color="info" size="small" />;
      case 'member':
      case 'accepted':
        return <Chip label="Mitglied" color="success" size="small" />;
      case 'pending':
        return <Chip label="Bewerbung läuft" color="warning" size="small" />;
      case 'rejected':
        return <Chip label="Abgelehnt" color="error" size="small" />;
      default:
        return statusLoading ? <Chip label="Status wird geladen" size="small" /> : null;
    }
  }, [statusState, statusLoading, user]);

  useEffect(() => {
    const joined = statusState === 'owner' || statusState === 'member' || statusState === 'accepted';
    if (!id || !user || walletProvisioned || !joined) {
      return;
    }
    const currentUrl = typeof window !== 'undefined' ? window.location.href : undefined;
    const params = new URLSearchParams({ uid: user.uid });
    if (currentUrl) {
      params.set('returnUrl', currentUrl);
      params.set('refreshUrl', currentUrl);
    }
    const provision = async () => {
      try {
        const statusRes = await fetch(`${API_BASE_URL}/api/jamiahs/${id}/wallets/status?${params.toString()}`);
        if (statusRes.status === 404) {
          const payload: Record<string, unknown> = { createDashboardSession: true };
          if (currentUrl) {
            payload.returnUrl = currentUrl;
            payload.refreshUrl = currentUrl;
          }
          await fetch(`${API_BASE_URL}/api/jamiahs/${id}/wallets?uid=${encodeURIComponent(user.uid)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
        }
        setWalletProvisioned(true);
      } catch (err) {
        console.error('[group-details] Wallet provisioning failed', err);
      }
    };
    void provision();
  }, [id, statusState, user, walletProvisioned]);

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
          {statusChip && (
            <Box mt={1}>
              {statusChip}
            </Box>
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
            {statusState === 'pending' ? (
              <Typography color="textSecondary">Status: Bewerbung läuft</Typography>
            ) : statusState === 'rejected' ? (
              <Typography color="textSecondary">Status: Abgelehnt</Typography>
            ) : statusState === 'member' || statusState === 'accepted' ? (
              <Typography color="textSecondary">Status: Mitglied</Typography>
            ) : statusState === 'owner' ? (
              <Typography color="textSecondary">Status: Eigentümer</Typography>
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
              await refreshJoinStatus();
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

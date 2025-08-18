import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { ROUTES } from '../../routing/routes';
import { StartCycleButton } from '../../components/jamiah/StartCycleButton';
import { useAuth } from '../../context/AuthContext';

export const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Jamiah | null>(null);
  const { user } = useAuth();
  const [cycleStarted, setCycleStarted] = useState(false);
  const [status, setStatus] = useState<"member" | "applicant" | null>(null);

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
            <Box mt={2}>
              <StartCycleButton
                jamiahId={group.id as string}
                onStarted={() => setCycleStarted(true)}
              />
              {cycleStarted && (
                <Typography variant="body2" mt={1}>
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
    </Box>
  );
};

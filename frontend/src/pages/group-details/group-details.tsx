import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Typography, Button, Divider } from '@mui/material';
import { Jamiah } from '../../models/Jamiah';
import { API_BASE_URL } from '../../constants/api';
import { ROUTES } from '../../routing/routes';

export const GroupDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [group, setGroup] = useState<Jamiah | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${id}`)
      .then(res => res.json())
      .then(setGroup)
      .catch(() => setGroup(null));
  }, [id]);

  return (
    <Box p={4} maxWidth={600} mx="auto">
      <Button variant="text" onClick={() => navigate(`/${ROUTES.GROUPS}`)}>
        Zurück zur Übersicht
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
          {group.maxGroupSize !== undefined && (
            <Typography variant="body2">Gruppengröße: <b>{group.maxGroupSize}</b></Typography>
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
          <Box mt={3}>
            {group.isPublic ? (
              <Button variant="contained">Jetzt bewerben</Button>
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

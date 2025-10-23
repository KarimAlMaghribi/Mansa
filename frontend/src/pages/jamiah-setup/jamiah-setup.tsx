import React, { useMemo, useState } from 'react';
import { Alert, Box, CircularProgress, Snackbar, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { JamiahWizard } from '../../components/jamiah/JamiahWizard';
import { useJamiahContext } from '../../context/JamiahContext';
import { StartCycleButton } from '../../components/jamiah/StartCycleButton';
import { API_BASE_URL } from '../../constants/api';
import { Jamiah } from '../../models/Jamiah';

export const JamiahSetup: React.FC = () => {
  const { jamiah, roles, refresh } = useJamiahContext();
  const { groupId } = useParams();
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState<{ message: string; severity: 'success' | 'error' } | null>(null);

  if (!roles.isOwner) {
    return (
      <Box p={4}>
        <Alert severity="info">
          Nur Owner können die Jamiah-Einstellungen bearbeiten.
        </Alert>
      </Box>
    );
  }

  if (!jamiah) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  const cycleStarted = Boolean(jamiah.startDate);

  const initialValue = useMemo(() => ({
    ...jamiah,
    startDate: jamiah.startDate ? jamiah.startDate.substring(0, 10) : undefined,
  }), [jamiah]);

  const handleSubmit = async (data: Partial<Jamiah>) => {
    if (!groupId) {
      throw new Error('Jamiah konnte nicht geladen werden');
    }
    setSaving(true);
    try {
      const payload = {
        ...jamiah,
        ...data,
        startDate: data.startDate ? data.startDate : null,
      };
      const response = await fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Einstellungen konnten nicht gespeichert werden');
      }
      const updated = await response.json();
      await refresh();
      setSnackbar({ message: 'Einstellungen gespeichert', severity: 'success' });
      return updated;
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Setup für {jamiah.name}
      </Typography>
      {cycleStarted && (
        <Alert severity="info" sx={{ mb: 3 }}>
          Der erste Zyklus läuft bereits. Du kannst die Stammdaten weiterhin anpassen.
        </Alert>
      )}
      <JamiahWizard
        initialValue={initialValue}
        submitLabel="Einstellungen speichern"
        onSubmit={handleSubmit}
        submitting={saving}
        renderSummaryExtras={() => (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Start vorbereiten
            </Typography>
            {cycleStarted ? (
              <Alert severity="success">Der Zyklus läuft bereits.</Alert>
            ) : (
              <StartCycleButton
                jamiahId={groupId ?? jamiah.id ?? ''}
                onStarted={() => setSnackbar({ message: 'Jamiah erfolgreich gestartet', severity: 'success' })}
              />
            )}
          </Box>
        )}
      />
      <Snackbar
        open={Boolean(snackbar)}
        autoHideDuration={6000}
        onClose={() => setSnackbar(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        {snackbar && (
          <Alert severity={snackbar.severity} onClose={() => setSnackbar(null)} sx={{ width: '100%' }}>
            {snackbar.message}
          </Alert>
        )}
      </Snackbar>
    </Box>
  );
};

export default JamiahSetup;


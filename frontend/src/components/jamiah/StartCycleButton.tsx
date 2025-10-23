import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
  Stack,
  Typography,
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import RefreshIcon from '@mui/icons-material/Refresh';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';
import { useJamiahContext } from '../../context/JamiahContext';
import { JAMIAH_GROUPS_REFRESH_EVENT } from '../../constants/events';

interface Props {
  jamiahId: string | number;
  onStarted?: () => void;
}

interface PreviewMember {
  uid: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

interface StartPreview {
  order: PreviewMember[];
  payoutPerInterval: number;
  rounds: number;
  expectedEndDate: string;
}

export const StartCycleButton: React.FC<Props> = ({ jamiahId, onStarted }) => {
  const { members, pendingRequests, jamiah, refresh, currentUid } = useJamiahContext();
  const [preview, setPreview] = useState<StartPreview | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [starting, setStarting] = useState(false);
  const navigate = useNavigate();

  const memberCount = members.length;
  const pendingCount = pendingRequests.length;

  const validations = useMemo(() => {
    const messages: string[] = [];
    if (jamiah?.startDate) {
      messages.push('Die Jamiah wurde bereits gestartet.');
    }
    if (memberCount < 2) {
      messages.push(`Mindestens 2 Mitglieder erforderlich (aktuell ${memberCount}).`);
    }
    if (pendingCount > 0) {
      messages.push(`${pendingCount} offene Bewerbungen müssen zuerst bearbeitet werden.`);
    }
    return messages;
  }, [jamiah?.startDate, memberCount, pendingCount]);

  const canStart = validations.length === 0;
  const uid = currentUid ?? auth.currentUser?.uid ?? '';

  const loadPreview = useCallback(async () => {
    if (!canStart || !uid) {
      return;
    }
    setPreviewLoading(true);
    setPreviewError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/jamiahs/${jamiahId}/start-preview?uid=${encodeURIComponent(uid)}`
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Vorschau konnte nicht geladen werden');
      }
      const data = await response.json();
      setPreview(data);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Vorschau konnte nicht geladen werden';
      setPreview(null);
      setPreviewError(message);
    } finally {
      setPreviewLoading(false);
    }
  }, [canStart, jamiahId, uid]);

  useEffect(() => {
    if (canStart) {
      void loadPreview();
    } else {
      setPreview(null);
    }
  }, [canStart, loadPreview]);

  if (jamiah?.startDate) {
    return null;
  }

  const handleStart = async () => {
    if (!preview || !uid) {
      return;
    }
    setStarting(true);
    setPreviewError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/jamiahs/${jamiahId}/start?uid=${encodeURIComponent(uid)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: preview.order.map(m => m.uid) }),
        }
      );
      if (!response.ok) {
        const text = await response.text();
        throw new Error(text || 'Start fehlgeschlagen');
      }
      await refresh();
      window.dispatchEvent(new Event(JAMIAH_GROUPS_REFRESH_EVENT));
      onStarted?.();
      navigate(`/jamiah/${jamiahId}/dashboard`, { replace: true });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Start fehlgeschlagen';
      setPreviewError(message);
    } finally {
      setStarting(false);
    }
  };

  return (
    <Box>
      <Stack spacing={2}>
        {validations.map((msg, idx) => (
          <Alert key={idx} severity="warning">
            {msg}
          </Alert>
        ))}
        {previewError && (
          <Alert severity="error">{previewError}</Alert>
        )}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={() => void loadPreview()}
            disabled={!canStart || previewLoading}
          >
            Vorschau aktualisieren
          </Button>
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleStart}
            disabled={!canStart || !preview || starting}
          >
            Jamiah starten
          </Button>
        </Stack>
        {previewLoading && (
          <Box display="flex" justifyContent="center">
            <CircularProgress size={24} />
          </Box>
        )}
        {!previewLoading && preview && (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Reihenfolge der Auszahlungen
            </Typography>
            <List dense>
              {preview.order.map((m, idx) => (
                <ListItem key={m.uid} disableGutters>
                  <ListItemText
                    primary={`${idx + 1}. ${
                      m.firstName || m.lastName
                        ? `${m.firstName || ''} ${m.lastName || ''}`.trim()
                        : m.username
                    }`}
                  />
                </ListItem>
              ))}
            </List>
            <Typography variant="body2">Auszahlung pro Intervall: {preview.payoutPerInterval} €</Typography>
            <Typography variant="body2">Runden: {preview.rounds}</Typography>
            <Typography variant="body2">
              Voraussichtliches Ende: {new Date(preview.expectedEndDate).toLocaleDateString()}
            </Typography>
          </Box>
        )}
        {!previewLoading && !preview && canStart && (
          <Typography variant="body2" color="text.secondary">
            Lade eine Vorschau, um die Reihenfolge der Auszahlungen zu prüfen.
          </Typography>
        )}
      </Stack>
    </Box>
  );
};

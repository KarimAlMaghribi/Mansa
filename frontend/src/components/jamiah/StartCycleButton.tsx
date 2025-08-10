import React, { useState } from 'react';
import { Button, Dialog, DialogTitle, DialogContent, DialogActions, Typography, List, ListItem, ListItemText } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';

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
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<StartPreview | null>(null);
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    const uid = auth.currentUser?.uid || '';
    setLoading(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${jamiahId}/start-preview?uid=${encodeURIComponent(uid)}`)
      .then(r => r.json())
      .then(data => {
        setPreview(data);
        setOpen(true);
      })
      .finally(() => setLoading(false));
  };

  const handleStart = () => {
    if (!preview) return;
    const uid = auth.currentUser?.uid || '';
    fetch(`${API_BASE_URL}/api/jamiahs/${jamiahId}/start?uid=${encodeURIComponent(uid)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ order: preview.order.map(m => m.uid) })
    }).then(() => {
      setOpen(false);
      onStarted?.();
    });
  };

  return (
    <>
      <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleClick} disabled={loading}>
        Jamiah starten
      </Button>
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Jamiah starten</DialogTitle>
        <DialogContent>
          {preview && (
            <>
              <Typography variant="subtitle1" gutterBottom>Reihenfolge der Auszahlungen:</Typography>
              <List>
                {preview.order.map((m, idx) => (
                  <ListItem key={m.uid}>
                    <ListItemText primary={`${idx + 1}. ${m.firstName || m.lastName ? `${m.firstName || ''} ${m.lastName || ''}`.trim() : m.username}`} />
                  </ListItem>
                ))}
              </List>
              <Typography>Auszahlung pro Monat: {preview.payoutPerInterval} €</Typography>
              <Typography>Runden: {preview.rounds}</Typography>
              <Typography>Voraussichtliches Ende: {new Date(preview.expectedEndDate).toLocaleDateString()}</Typography>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpen(false)}>Abbrechen</Button>
          <Button onClick={handleStart} disabled={!preview}>Bestätigen</Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

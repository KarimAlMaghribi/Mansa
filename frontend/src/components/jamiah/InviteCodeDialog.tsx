import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface InviteCodeDialogProps {
  open: boolean;
  code: string | null;
  expiry: string | null;
  onClose: () => void;
}

export const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ open, code, expiry, onClose }) => {
  const [remaining, setRemaining] = React.useState<number>(0);

  React.useEffect(() => {
    if (!expiry) return;
    const target = new Date(expiry).getTime();
    const update = () => setRemaining(target - Date.now());
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [expiry]);

  const format = (ms: number) => {
    if (ms <= 0) return '00:00:00';
    const totalSeconds = Math.floor(ms / 1000);
    const hours = String(Math.floor(totalSeconds / 3600)).padStart(2, '0');
    const minutes = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0');
    const seconds = String(totalSeconds % 60).padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const handleCopy = () => {
    if (code) {
      navigator.clipboard.writeText(code);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Einladungscode</DialogTitle>
      <DialogContent sx={{ textAlign: 'center' }}>
        <Typography variant="h5" align="center" sx={{ wordBreak: 'break-all', mb: 1 }}>
          {code ?? '...'}
        </Typography>
        {code && (
          <Tooltip title="Code kopieren">
            <IconButton onClick={handleCopy} size="small">
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}
        {expiry && (
          <Typography variant="body2" color="textSecondary" sx={{ mt: 1 }}>
            Läuft ab in: {format(remaining)}
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};

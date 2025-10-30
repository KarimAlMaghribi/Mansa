import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  IconButton,
  Tooltip,
  Box,
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface InviteCodeDialogProps {
  open: boolean;
  code: string | null;
  expiry: string | null;
  link: string | null;
  onClose: () => void;
}

export const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ open, code, expiry, link, onClose }) => {
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

  const copyToClipboard = (value: string | null) => {
    if (value) {
      void navigator.clipboard.writeText(value);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Einladung teilen</DialogTitle>
      <DialogContent sx={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
          <Typography variant="subtitle2" color="textSecondary">
            Einladungscode
          </Typography>
          <Typography variant="h5" align="center" sx={{ wordBreak: 'break-all' }}>
            {code ?? '...'}
          </Typography>
          {code && (
            <Tooltip title="Code kopieren">
              <IconButton onClick={() => copyToClipboard(code)} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </Box>
        {link && (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="subtitle2" color="textSecondary">
              Einladungslink
            </Typography>
            <Typography
              variant="body1"
              sx={{ wordBreak: 'break-all' }}
              component="a"
              href={link}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link}
            </Typography>
            <Tooltip title="Link kopieren">
              <IconButton onClick={() => copyToClipboard(link)} size="small">
                <ContentCopyIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>
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

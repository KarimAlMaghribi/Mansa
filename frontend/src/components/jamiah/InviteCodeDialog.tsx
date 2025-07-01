import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, IconButton, Tooltip } from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface InviteCodeDialogProps {
  open: boolean;
  code: string | null;
  onClose: () => void;
}

export const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ open, code, onClose }) => {
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
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Schließen</Button>
      </DialogActions>
    </Dialog>
  );
};

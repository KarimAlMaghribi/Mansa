import React from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography } from '@mui/material';

interface InviteCodeDialogProps {
  open: boolean;
  code: string | null;
  onClose: () => void;
}

export const InviteCodeDialog: React.FC<InviteCodeDialogProps> = ({ open, code, onClose }) => (
  <Dialog open={open} onClose={onClose}>
    <DialogTitle>Einladungscode</DialogTitle>
    <DialogContent>
      <Typography variant="h5" align="center" sx={{ wordBreak: 'break-all' }}>
        {code ?? '...'}
      </Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Schließen</Button>
    </DialogActions>
  </Dialog>
);

import React, { useState } from 'react';
import { Button } from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import { API_BASE_URL } from '../../constants/api';
import { InviteCodeDialog } from './InviteCodeDialog';

interface GenerateInviteButtonProps {
  jamiahId: string | number;
}

export const GenerateInviteButton: React.FC<GenerateInviteButtonProps> = ({ jamiahId }) => {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);

  const handleClick = () => {
    fetch(`${API_BASE_URL}/api/jamiahs/${jamiahId}/invite`, { method: 'POST' })
      .then(res => res.text())
      .then(setCode)
      .catch(() => setCode('Fehler'))
      .finally(() => setOpen(true));
  };

  return (
    <>
      <Button size="small" variant="outlined" fullWidth startIcon={<KeyIcon />} onClick={handleClick}>
        Einladungscode
      </Button>
      <InviteCodeDialog open={open} code={code} onClose={() => setOpen(false)} />
    </>
  );
};

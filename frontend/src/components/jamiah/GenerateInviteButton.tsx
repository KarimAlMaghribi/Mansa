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
  const [invite, setInvite] = useState<{ invitationCode: string; invitationExpiry: string } | null>(null);

  const handleClick = () => {
    fetch(`${API_BASE_URL}/api/jamiahs/${jamiahId}/invite`, { method: 'POST' })
      .then(res => res.json())
      .then(data => setInvite({ invitationCode: data.invitationCode, invitationExpiry: data.invitationExpiry }))
      .catch(() => setInvite({ invitationCode: 'Fehler', invitationExpiry: new Date().toISOString() }))
      .finally(() => setOpen(true));
  };

  return (
    <>
      <Button size="small" variant="outlined" fullWidth startIcon={<KeyIcon />} onClick={handleClick}>
        Einladungscode
      </Button>
      <InviteCodeDialog
        open={open}
        code={invite?.invitationCode ?? null}
        expiry={invite?.invitationExpiry ?? null}
        onClose={() => setOpen(false)}
      />
    </>
  );
};

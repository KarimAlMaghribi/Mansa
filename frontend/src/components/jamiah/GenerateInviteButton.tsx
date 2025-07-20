import React, { useState } from 'react';
import { Button } from '@mui/material';
import KeyIcon from '@mui/icons-material/VpnKey';
import { API_BASE_URL } from '../../constants/api';
import { InviteCodeDialog } from './InviteCodeDialog';
import { auth } from '../../firebase_config';

interface GenerateInviteButtonProps {
  jamiahId: string | number;
}

export const GenerateInviteButton: React.FC<GenerateInviteButtonProps> = ({ jamiahId }) => {
  const [open, setOpen] = useState(false);
  const [invite, setInvite] = useState<{ invitationCode: string; invitationExpiry: string } | null>(null);

  const handleClick = () => {
    const uid = auth.currentUser?.uid || '';
    const url = `${API_BASE_URL}/api/jamiahs/${jamiahId}/invite?uid=${encodeURIComponent(uid)}`;
    fetch(url, { method: 'POST' })
      .then(async res => {
        if (!res.ok) throw new Error();
        const data = await res.json();
        setInvite({ invitationCode: data.invitationCode, invitationExpiry: data.invitationExpiry });
      })
      .catch(() =>
        setInvite({ invitationCode: 'Fehler', invitationExpiry: new Date().toISOString() })
      )
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

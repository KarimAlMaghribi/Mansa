import React, { useState } from 'react';
import { Button } from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import { API_BASE_URL } from '../../constants/api';
import { auth } from '../../firebase_config';

interface Props {
  jamiahId: string | number;
  onStarted?: () => void;
}

export const StartCycleButton: React.FC<Props> = ({ jamiahId, onStarted }) => {
  const [loading, setLoading] = useState(false);

  const handleClick = () => {
    const uid = auth.currentUser?.uid || '';
    setLoading(true);
    fetch(`${API_BASE_URL}/api/jamiahs/${jamiahId}/start?uid=${encodeURIComponent(uid)}`, {
      method: 'POST'
    })
      .then(() => onStarted?.())
      .finally(() => setLoading(false));
  };

  return (
    <Button variant="contained" startIcon={<PlayArrowIcon />} onClick={handleClick} disabled={loading}>
      Zyklus starten
    </Button>
  );
};

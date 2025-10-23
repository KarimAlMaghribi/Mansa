import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { JamiahSettings } from '../../components/jamiah/JamiahSettings';
import { useJamiahContext } from '../../context/JamiahContext';

export const JamiahSetup: React.FC = () => {
  const { jamiah, roles } = useJamiahContext();

  if (!roles.isOwner) {
    return (
      <Box p={4}>
        <Alert severity="info">
          Nur Owner können die Jamiah-Einstellungen bearbeiten.
        </Alert>
      </Box>
    );
  }

  if (!jamiah) {
    return (
      <Box p={4} display="flex" justifyContent="center" alignItems="center">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box p={4}>
      <Typography variant="h4" fontWeight="bold" gutterBottom>
        Setup für {jamiah.name}
      </Typography>
      <JamiahSettings jamiah={jamiah} />
    </Box>
  );
};

export default JamiahSetup;


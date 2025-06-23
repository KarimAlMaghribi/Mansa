import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import { API_BASE_URL } from '../../constants/api';

export const HelloBackend = () => {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch(`${API_BASE_URL}/api/hello`)
      .then(res => res.text())
      .then(setMessage)
      .catch(() => setMessage('Backend request failed'));
  }, []);

  return (
    <Box p={4} textAlign="center">
      <Typography variant="h4" gutterBottom>
        Backend says:
      </Typography>
      <Typography variant="h5" color="primary">
        {message || 'Loading...'}
      </Typography>
    </Box>
  );
};

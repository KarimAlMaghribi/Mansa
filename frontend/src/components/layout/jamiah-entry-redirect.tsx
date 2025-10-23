import React, { useEffect } from 'react';
import { Box, CircularProgress } from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useJamiahContext } from '../../context/JamiahContext';

export const JamiahEntryRedirect: React.FC = () => {
  const { loading, status, roles } = useJamiahContext();
  const navigate = useNavigate();
  const location = useLocation();

  const target = roles.isOwner && status.needsSetup ? 'setup' : 'dashboard';

  useEffect(() => {
    if (!loading) {
      const currentSegment = location.pathname.split('/').filter(Boolean)[2];
      if (currentSegment !== target) {
        navigate(target, { replace: true });
      }
    }
  }, [loading, target, navigate, location.pathname]);

  return (
    <Box p={4} display="flex" justifyContent="center" alignItems="center">
      <CircularProgress />
    </Box>
  );
};

export default JamiahEntryRedirect;


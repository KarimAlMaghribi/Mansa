import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Box, Button, CircularProgress, Stack, Typography } from '@mui/material';
import { useNavigate, useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';
import { ROUTES } from '../../routing/routes';

type JamiahInvite = {
  id: string;
  name?: string;
  description?: string;
};

type InviteError = {
  message: string;
};

export const InviteJoinPage: React.FC = () => {
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();

  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<JamiahInvite | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);
  const [acceptError, setAcceptError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/${ROUTES.SIGN_IN}`, { replace: true, state: { from: window.location.pathname } });
    }
  }, [authLoading, user, navigate]);

  useEffect(() => {
    if (!code) {
      setError('Einladungscode fehlt.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const fetchInvite = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/jamiahs/invite/${encodeURIComponent(code)}`,
          { signal: controller.signal }
        );
        if (!response.ok) {
          const data = await response.json().catch(() => ({} as InviteError));
          const message = (data as InviteError)?.message;
          throw new Error(
            message ||
              (response.status === 404
                ? 'Einladung nicht gefunden oder bereits genutzt.'
                : 'Einladung konnte nicht geladen werden.')
          );
        }
        const data: JamiahInvite = await response.json();
        setInvite(data);
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        setInvite(null);
        setError((err as Error).message || 'Einladung konnte nicht geladen werden.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvite();

    return () => controller.abort();
  }, [code]);

  const handleDecline = useCallback(() => {
    navigate('/');
  }, [navigate]);

  const handleAccept = useCallback(async () => {
    if (!code) {
      return;
    }

    if (!user?.uid) {
      navigate(`/${ROUTES.SIGN_IN}`, { replace: true, state: { from: window.location.pathname } });
      return;
    }

    setAccepting(true);
    setAcceptError(null);
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/jamiahs/invite/${encodeURIComponent(code)}/accept`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ uid: user.uid }),
        }
      );
      if (!response.ok) {
        const data = await response.json().catch(() => ({} as InviteError));
        const message = (data as InviteError)?.message;
        throw new Error(
          message ||
            (response.status === 409
              ? 'Diese Jamiah ist bereits voll.'
              : response.status === 410
              ? 'Diese Einladung ist abgelaufen.'
              : 'Beitritt nicht möglich.')
        );
      }

      const jamiah = await response.json();
      if (jamiah?.id) {
        navigate(`/jamiah/${jamiah.id}/dashboard`, { replace: true });
      } else {
        navigate(`/${ROUTES.DASHBOARD}`);
      }
    } catch (err) {
      setAcceptError((err as Error).message || 'Beitritt nicht möglich.');
    } finally {
      setAccepting(false);
    }
  }, [code, navigate, user]);

  const jamiahName = useMemo(() => invite?.name ?? 'deine Jamiah', [invite?.name]);

  const renderContent = () => {
    if (loading) {
      return (
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography>Einladung wird geladen...</Typography>
        </Stack>
      );
    }

    if (error) {
      return (
        <Stack spacing={2} alignItems="center">
          <Alert severity="error" sx={{ width: '100%' }}>
            {error}
          </Alert>
          <Button variant="contained" onClick={handleDecline}>
            Zur Startseite
          </Button>
        </Stack>
      );
    }

    return (
      <Stack spacing={3} alignItems="center">
        <Typography variant="h5" textAlign="center">
          Möchtest du der Jamiah „{jamiahName}” beitreten?
        </Typography>
        {invite?.description && (
          <Typography color="text.secondary" textAlign="center">
            {invite.description}
          </Typography>
        )}
        {acceptError && (
          <Alert severity="error" sx={{ width: '100%' }}>
            {acceptError}
          </Alert>
        )}
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" onClick={handleDecline} disabled={accepting}>
            Nein
          </Button>
          <Button variant="contained" onClick={handleAccept} disabled={accepting}>
            {accepting ? <CircularProgress size={24} /> : 'Ja'}
          </Button>
        </Stack>
      </Stack>
    );
  };

  return (
    <Box p={4} maxWidth={480} mx="auto">
      {renderContent()}
    </Box>
  );
};

export default InviteJoinPage;

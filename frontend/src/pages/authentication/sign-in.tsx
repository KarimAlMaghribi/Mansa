import React, { useState } from "react";
import { Box, Button, Typography, Snackbar, Alert, CircularProgress, TextField } from "@mui/material";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../firebase_config";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "../../routing/routes";
import { API_BASE_URL } from "../../constants/api";
import { signInWithEmail } from "../../firebase/firebase-service";

export const LoginForm: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSnackbarOpen(true);
  };

  const handleEmailSignIn = async () => {
    setLoading(true);
    try {
      const user = await signInWithEmail(email, password);
      if (!user) {
        showError("Anmeldung fehlgeschlagen.");
      } else {
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${user.uid}`);
        if (resp.status === 404) {
          navigate(`/${ROUTES.PROFILE}`);
        } else if (resp.ok) {
          navigate("/");
        } else {
          showError("Profil konnte nicht geladen werden.");
        }
      }
    } catch (err) {
      showError("Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const resp = await fetch(`${API_BASE_URL}/api/userProfiles/uid/${user.uid}`);
      if (resp.status === 404) {
        navigate(`/${ROUTES.PROFILE}`);
      } else if (resp.ok) {
        navigate("/");
      } else {
        showError("Profil konnte nicht geladen werden.");
      }
    } catch (err: any) {
      showError("Google-Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <Box sx={{ mt: 3, px: 2, maxWidth: 400, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        <TextField label="E-Mail" fullWidth sx={{ mb: 2 }} value={email} onChange={e => setEmail(e.target.value)} />
        <TextField label="Passwort" type="password" fullWidth sx={{ mb: 2 }} value={password} onChange={e => setPassword(e.target.value)} />
        <Button variant="contained" fullWidth onClick={handleEmailSignIn} disabled={loading} sx={{ mb: 2 }}>
          Einloggen
        </Button>
        <Button variant="outlined" fullWidth onClick={handleGoogleSignIn} disabled={loading} startIcon={loading ? <CircularProgress size={20} /> : null} sx={{ mb: 2 }}>
          Mit Google anmelden
        </Button>
        <Button fullWidth onClick={() => navigate(`/${ROUTES.SIGN_UP}`)}>Registrieren</Button>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity="error" onClose={handleSnackbarClose} sx={{ width: "100%" }}>
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
  );
};

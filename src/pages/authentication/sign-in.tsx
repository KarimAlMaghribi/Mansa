import React, { useState } from "react";
import {
  Box, Button, TextField, Typography, Snackbar, Alert, CircularProgress
} from "@mui/material";
import {
  signInWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import {auth, db} from "../../firebase_config";
import { useNavigate, Link } from "react-router-dom";
import {doc, setDoc} from "firebase/firestore";

export const LoginForm: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSnackbarOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        showError("Bitte bestätige deine E-Mail-Adresse. Wir haben dir eine neue E-Mail geschickt.");
        setLoading(false);
        return;
      }
      navigate("/");
    } catch (err: any) {
      const msg = err.code === "auth/user-not-found"
          ? "Kein Benutzer mit dieser E-Mail gefunden."
          : err.code === "auth/wrong-password"
              ? "Falsches Passwort."
              : "Anmeldung fehlgeschlagen.";
      showError(msg);
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
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        showError("Bitte bestätige deine E-Mail-Adresse. Wir haben dir eine E-Mail geschickt.");
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        provider: "google",
        createdAt: new Date().toISOString(),
        role: "member"
      }, { merge: true });

      navigate("/");
    } catch (err: any) {
      showError("Google-Anmeldung fehlgeschlagen.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, px: 2, maxWidth: 400, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>
          Login
        </Typography>
        <TextField
            fullWidth
            required
            label="E-Mail"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{ mb: 2 }}
        />
        <TextField
            fullWidth
            required
            label="Passwort"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            sx={{ mb: 2 }}
        />
        <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
            sx={{ mb: 1 }}
        >
          Einloggen
        </Button>
        <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
        >
          Mit Google anmelden
        </Button>
        <Typography variant="body2" sx={{ mt: 1 }}>
          <Link to="/forgot-password">Passwort vergessen?</Link>
        </Typography>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity="error" onClose={handleSnackbarClose} sx={{ width: "100%" }}>
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
  );
};

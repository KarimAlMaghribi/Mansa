import React, { useState } from "react";
import { Box, Button, Typography, Snackbar, Alert, CircularProgress } from "@mui/material";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth, db } from "../../firebase_config";
import { useNavigate } from "react-router-dom";
import { collection, getDocs, query, where } from "firebase/firestore";
import { ROUTES } from "../../routing/routes";

export const LoginForm: React.FC = () => {
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const showError = (msg: string) => {
    setErrorMsg(msg);
    setSnackbarOpen(true);
  };


  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const profileQuery = query(collection(db, "userProfiles"), where("uid", "==", user.uid));
      const profileSnapshot = await getDocs(profileQuery);
      if (profileSnapshot.empty) {
        navigate(`/${ROUTES.COMPLETE_PROFILE}`);
      } else {
        navigate("/");
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
        <Button
            variant="outlined"
            fullWidth
            onClick={handleGoogleSignIn}
            disabled={loading}
            startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          Mit Google anmelden
        </Button>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity="error" onClose={handleSnackbarClose} sx={{ width: "100%" }}>
            {errorMsg}
          </Alert>
        </Snackbar>
      </Box>
  );
};

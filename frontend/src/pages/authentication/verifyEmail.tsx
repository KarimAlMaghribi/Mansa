import React, { useState } from "react";
import { Box, Button, Typography, Snackbar, Alert } from "@mui/material";
import { sendEmailVerification } from "firebase/auth";
import { auth } from "../../firebase_config";

export const VerifyEmail: React.FC = () => {
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  const resendVerificationEmail = async () => {
    if (auth.currentUser && !auth.currentUser.emailVerified) {
      await sendEmailVerification(auth.currentUser);
      setSnackbarMessage("Verifizierungs-E-Mail wurde erneut gesendet.");
      setSnackbarOpen(true);
    }
  };

  const handleSnackbarClose = () => setSnackbarOpen(false);

  return (
      <Box sx={{ mt: 10, px: 2, textAlign: "center" }}>
        <Typography variant="h5" gutterBottom>
          Bestätige deine E-Mail-Adresse
        </Typography>
        <Typography variant="body1">
          Wir haben dir eine Bestätigungs-E-Mail geschickt. Bitte klicke auf den Link in der E-Mail, um dein Konto zu aktivieren.
          Danach kannst du dich anmelden.
        </Typography>
        <Button onClick={resendVerificationEmail} sx={{ mt: 2 }}>
          E-Mail-Bestätigung erneut senden
        </Button>

        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity="success" onClose={handleSnackbarClose} sx={{ width: "100%" }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
};

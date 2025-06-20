import { useSendPasswordResetEmail } from "react-firebase-hooks/auth";
import { auth } from "../../firebase_config";
import {Box, Button, TextField, Typography} from "@mui/material";
import React, {useState} from "react";

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState("");
    const [sendPasswordResetEmail, sending, error] = useSendPasswordResetEmail(auth);
    const [message, setMessage] = useState<string | null>(null);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        const success = await sendPasswordResetEmail(email);
        if (success) setMessage("Passwort-Reset-E-Mail wurde gesendet.");
    };

    return (
        <Box component="form" onSubmit={handleReset} sx={{ mt: 3, px: 2, maxWidth: 400, mx: "auto" }}>
            <Typography variant="h5" gutterBottom>Passwort vergessen</Typography>
            <TextField
                fullWidth
                required
                label="E-Mail-Adresse"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                sx={{ mb: 2 }}
            />
            <Button type="submit" variant="contained" color="primary" disabled={sending}>
                Zurücksetzen
            </Button>
            {message && <Typography color="success.main" sx={{ mt: 2 }}>{message}</Typography>}
            {error && <Typography color="error" sx={{ mt: 2 }}>{error.message}</Typography>}
        </Box>
    );
};

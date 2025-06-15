import React, { useState } from "react";
import {
  Box, Button, Checkbox, FormControlLabel, Grid, MenuItem,
  TextField, Typography, Snackbar, Alert
} from "@mui/material";
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification
} from "firebase/auth";
import { doc, setDoc, getDocs, collection, query, where } from "firebase/firestore";
import { auth, db } from "../../firebase_config";
import { useNavigate } from "react-router-dom";

const helperTexts: Record<string, string> = {
  firstName: "Mindestens 2 Zeichen.",
  lastName: "Mindestens 2 Zeichen.",
  email: "Gültige E-Mail-Adresse erforderlich.",
  password: "Mindestens 8 Zeichen, Groß- und Kleinbuchstaben, Zahl und Sonderzeichen.",
  birthDate: "Du musst mindestens 18 Jahre alt sein.",
  address: "Mindestens 2 Zeichen.",
  phone: "Nur Ziffern, mind. 7 Stellen.",
  username: "Mindestens 3 Zeichen.",
  gender: "Bitte auswählen.",
  nationality: "Bitte auswählen.",
  language: "Bitte auswählen."
};

const calculateAge = (birthDate: string): number => {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const m = today.getMonth() - birth.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
  return age;
};

const isValidEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
const isValidPhone = (phone: string) => /^\+?[0-9]{7,15}$/.test(phone);
const isValidPassword = (password: string) =>
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(password);

export const RegistrationForm: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "", lastName: "", email: "", password: "", birthDate: "", gender: "",
    nationality: "", address: "", phone: "", username: "", language: "", interests: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const navigate = useNavigate();

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: false });
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const trimmed = value.trim();
    const fail = (condition: boolean) => condition && setFieldErrors(prev => ({ ...prev, [name]: true }));

    switch (name) {
      case "firstName":
      case "lastName":
      case "address":
        fail(trimmed.length < 2); break;
      case "email":
        fail(!isValidEmail(trimmed)); break;
      case "password":
        fail(!isValidPassword(trimmed)); break;
      case "birthDate":
        fail(calculateAge(trimmed) < 18); break;
      case "phone":
        fail(!isValidPhone(trimmed)); break;
      case "username":
        fail(trimmed.length < 3); break;
      case "gender":
      case "nationality":
      case "language":
        fail(trimmed.length === 0); break;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    let hasError = false;

    const checks: [keyof typeof formData, () => boolean][] = [
      ["birthDate", () => calculateAge(formData.birthDate) < 18],
      ["email", () => !isValidEmail(formData.email)],
      ["phone", () => !isValidPhone(formData.phone)],
      ["password", () => !isValidPassword(formData.password)],
      ["username", () => formData.username.trim().length < 3],
      ["firstName", () => formData.firstName.trim().length < 2],
      ["lastName", () => formData.lastName.trim().length < 2],
      ["address", () => formData.address.trim().length < 2],
      ["gender", () => !formData.gender],
      ["nationality", () => !formData.nationality],
      ["language", () => !formData.language]
    ];

    for (const [key, condition] of checks) {
      if (condition()) {
        setFieldErrors(prev => ({ ...prev, [key]: true }));
        hasError = true;
      }
    }

    if (!agreed) {
      setError("Du musst den AGB und der Datenschutzerklärung zustimmen.");
      hasError = true;
    }

    if (hasError) return;

    // Prüfen, ob der Benutzername bereits existiert
    const usernameQuery = query(
      collection(db, "users"),
      where("username", "==", formData.username)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      setError("Benutzername bereits vergeben.");
      setSnackbarMessage("Benutzername bereits vergeben.");
      setSnackbarOpen(true);
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      await setDoc(doc(db, "users", user.uid), {
        ...formData,
        uid: user.uid,
        role: "member",
        createdAt: new Date().toISOString()
      });
      await sendEmailVerification(user);
      await auth.signOut();
      setSnackbarMessage("Registrierung erfolgreich. Bitte bestätige deine E-Mail-Adresse.");
      setSnackbarOpen(true);
      setTimeout(() => navigate("/verify-email"), 3000);
    } catch (err: any) {
      let friendlyMessage = "Ein unbekannter Fehler ist aufgetreten.";
      if (err.code === 'auth/email-already-in-use') {
        friendlyMessage = "Diese E-Mail-Adresse ist bereits registriert. Bitte verwende eine andere oder melde dich an.";
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = "Die eingegebene E-Mail-Adresse ist ungültig.";
      } else if (err.code === 'auth/weak-password') {
        friendlyMessage = "Das Passwort ist zu schwach. Es muss mindestens 8 Zeichen sowie Groß- und Kleinbuchstaben, eine Zahl und ein Sonderzeichen enthalten.";
      } else {
        friendlyMessage = err.message;
      }
      setError(friendlyMessage);
      setSnackbarMessage(friendlyMessage);
      setSnackbarOpen(true);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      if (!user.emailVerified) {
        await sendEmailVerification(user);
        await auth.signOut();
        setSnackbarMessage("Bitte bestätige deine E-Mail-Adresse. Wir haben dir eine E-Mail geschickt.");
        setSnackbarOpen(true);
        return;
      }
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        displayName: user.displayName,
        uid: user.uid,
        role: "member",
        createdAt: new Date().toISOString()
      }, { merge: true });
      navigate("/");
    } catch (error: any) {
      setSnackbarMessage(error.message);
      setSnackbarOpen(true);
    }
  };

  const getError = (field: keyof typeof formData) => fieldErrors[field] || false;
  const getHelper = (field: keyof typeof formData) => getError(field) ? helperTexts[field] : " ";

  return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, px: 2, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>Benutzer registrieren</Typography>
        <Grid container spacing={2}>
          {Object.entries(formData).map(([key, value]) => (
              <Grid item xs={12} key={key}>
                <TextField
                    fullWidth
                    required={key !== "interests"}
                    name={key}
                    label={{
                      firstName: "Vorname",
                      lastName: "Nachname",
                      email: "E-Mail",
                      password: "Passwort",
                      birthDate: "Geburtsdatum",
                      gender: "Geschlecht",
                      nationality: "Nationalität",
                      address: "Adresse",
                      phone: "Telefonnummer",
                      username: "Benutzername",
                      language: "Sprache",
                      interests: "Interessen / Vorstellung"
                    }[key] || key}
                    type={key === "password" ? "password" : key === "email" ? "email" : key === "birthDate" ? "date" : "text"}
                    value={value}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={getError(key as keyof typeof formData)}
                    helperText={getHelper(key as keyof typeof formData)}
                    multiline={key === "interests"}
                    rows={key === "interests" ? 3 : undefined}
                    InputLabelProps={key === "birthDate" ? { shrink: true } : undefined}
                    select={["gender", "nationality", "language"].includes(key)}
                >
                  {key === "gender" && ["männlich", "weiblich"].map(g => (
                      <MenuItem key={g} value={g}>{g}</MenuItem>
                  ))}
                  {key === "nationality" && [
                    "Deutschland 🇩🇪", "Türkei 🇹🇷", "Syrien 🇸🇾", "Afghanistan 🇦🇫", "Marokko 🇲🇦"
                  ].map(n => (
                      <MenuItem key={n} value={n}>{n}</MenuItem>
                  ))}
                  {key === "language" && [
                    { code: "de", label: "Deutsch 🇩🇪" },
                    { code: "en", label: "Englisch 🇬🇧" },
                    { code: "ar", label: "Arabisch 🇸🇦" },
                    { code: "fr", label: "Französisch 🇫🇷" }
                  ].map(l => (
                      <MenuItem key={l.code} value={l.code}>{l.label}</MenuItem>
                  ))}
                </TextField>
              </Grid>
          ))}
          <Grid item xs={12}>
            <FormControlLabel
                control={<Checkbox checked={agreed} onChange={() => setAgreed(!agreed)} />}
                label="Ich stimme den AGB und der Datenschutzerklärung zu."
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Registrieren
        </Button>
        <Button variant="outlined" fullWidth onClick={handleGoogleSignIn} sx={{ mt: 2 }}>
          Mit Google registrieren
        </Button>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity={error ? "error" : "success"} onClose={handleSnackbarClose} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
};

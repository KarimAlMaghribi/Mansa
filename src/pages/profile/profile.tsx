import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Snackbar,
  Alert
} from "@mui/material";
import { doc, getDoc, setDoc, query, collection, where, getDocs } from "firebase/firestore";
import { auth, db } from "../../firebase_config";

const helperTexts: Record<string, string> = {
  firstName: "Mindestens 2 Zeichen.",
  lastName: "Mindestens 2 Zeichen.",
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

const isValidPhone = (phone: string) => /^\+?[0-9]{7,15}$/.test(phone);

export const Profile: React.FC = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    birthDate: "",
    gender: "",
    nationality: "",
    address: "",
    phone: "",
    username: "",
    language: "",
    interests: ""
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      if (!auth.currentUser) return;
      const docRef = doc(db, "userProfiles", auth.currentUser.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data().profile || {};
        setFormData(prev => ({ ...prev, ...data }));
      }
    };
    fetchProfile();
  }, []);

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
    let hasError = false;

    const checks: [keyof typeof formData, () => boolean][] = [
      ["birthDate", () => calculateAge(formData.birthDate) < 18],
      ["phone", () => !isValidPhone(formData.phone)],
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

    if (hasError) return;
    if (!auth.currentUser) return;

    const usernameQuery = query(
      collection(db, "userProfiles"),
      where("profile.username", "==", formData.username),
      where("uid", "!=", auth.currentUser.uid)
    );
    const usernameSnapshot = await getDocs(usernameQuery);
    if (!usernameSnapshot.empty) {
      setSnackbarMessage("Benutzername bereits vergeben.");
      setSnackbarOpen(true);
      return;
    }

    await setDoc(
      doc(db, "userProfiles", auth.currentUser.uid),
      {
        id: auth.currentUser.uid,
        uid: auth.currentUser.uid,
        profile: formData,
        updatedAt: new Date().toISOString()
      },
      { merge: true }
    );
    setSnackbarMessage("Profil aktualisiert.");
    setSnackbarOpen(true);
  };

  const getError = (field: keyof typeof formData) => fieldErrors[field] || false;
  const getHelper = (field: keyof typeof formData) => getError(field) ? helperTexts[field] : " ";

  return (
    <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, px: 2, maxWidth: 600, mx: "auto" }}>
      <Typography variant="h5" gutterBottom>Profil bearbeiten</Typography>
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
                birthDate: "Geburtsdatum",
                gender: "Geschlecht",
                nationality: "Nationalität",
                address: "Adresse",
                phone: "Telefonnummer",
                username: "Benutzername",
                language: "Sprache",
                interests: "Interessen / Vorstellung"
              }[key] || key}
              type={key === "birthDate" ? "date" : "text"}
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
      </Grid>
      <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
        Speichern
      </Button>
      <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
        <Alert severity="success" onClose={handleSnackbarClose} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
};

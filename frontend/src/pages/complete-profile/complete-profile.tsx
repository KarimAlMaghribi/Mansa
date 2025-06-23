import React, { useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  MenuItem,
  TextField,
  Typography,
  Snackbar,
  Alert
} from "@mui/material";
import Avatar from "@mui/material/Avatar";
import { useDispatch } from "react-redux";
import { AppDispatch } from "../../store/store";
import { saveProfileImage, removeProfileImage } from "../../store/slices/user-profile";
import { uploadProfileImage, deleteProfileImage } from "../../firebase/firebase-service";
import { collection, getDocs, query, where, setDoc, doc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../constants/api";
import { db } from "../../firebase_config";
import { useAuth } from "../../context/AuthContext";

const helperTexts: Record<string, string> = {
  firstName: "Mindestens 2 Zeichen.",
  lastName: "Mindestens 2 Zeichen.",
  birthDate: "Du musst mindestens 18 Jahre alt sein.",
  address: "Mindestens 2 Zeichen.",
  phone: "Nur Ziffern, mind. 7 Stellen.",
  username: "Mindestens 3 Zeichen. Benutzername muss einzigartig sein.",
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

export const CompleteProfile: React.FC = () => {
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
    interests: "",
    image: ""
  });
  const [agreed, setAgreed] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const navigate = useNavigate();
  const { user } = useAuth();
  const dispatch: AppDispatch = useDispatch();

  const handleSnackbarClose = () => setSnackbarOpen(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFieldErrors({ ...fieldErrors, [e.target.name]: false });
  };

  const handleBlur = async (e: React.FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => {
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
        if (trimmed.length < 3) {
          fail(true);
          break;
        }
        const resp = await fetch(`${API_BASE_URL}/api/userProfiles/check?username=${encodeURIComponent(trimmed)}`);
        const available = await resp.json();
        if (!available) {
          setFieldErrors(prev => ({ ...prev, [name]: true }));
          setSnackbarMessage("Benutzername bereits vergeben.");
          setSnackbarOpen(true);
        }
        break;
      case "gender":
      case "nationality":
      case "language":
        fail(trimmed.length === 0); break;
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    if (!['image/png', 'image/jpeg', 'image/jpg'].includes(file.type)) {
      setSnackbarMessage('Nur PNG oder JPG erlaubt.');
      setSnackbarOpen(true);
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setSnackbarMessage('Die Datei darf maximal 5 MB groß sein.');
      setSnackbarOpen(true);
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleDeleteImage = async () => {
    if (!user) return;
    await deleteProfileImage(user.uid);
    dispatch(removeProfileImage());
    setSelectedFile(null);
    setPreviewUrl('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!agreed) {
      setSnackbarMessage("Du musst den AGB und der Datenschutzerklärung zustimmen.");
      setSnackbarOpen(true);
      return;
    }

    if (!user) return;

    const errors: Record<string, boolean> = {};
    if (formData.birthDate && calculateAge(formData.birthDate) < 18) errors.birthDate = true;
    if (formData.phone && !isValidPhone(formData.phone)) errors.phone = true;
    if (formData.username && formData.username.trim().length < 3) errors.username = true;
    if (formData.firstName && formData.firstName.trim().length < 2) errors.firstName = true;
    if (formData.lastName && formData.lastName.trim().length < 2) errors.lastName = true;
    if (formData.address && formData.address.trim().length < 2) errors.address = true;
    setFieldErrors(prev => ({ ...prev, ...errors }));

    if (Object.keys(errors).length > 0) return;

    if (formData.username) {
      const usernameQuery = query(
        collection(db, "userProfiles"),
        where("profile.username", "==", formData.username),
        where("uid", "!=", user.uid)
      );
      const usernameSnapshot = await getDocs(usernameQuery);
      if (!usernameSnapshot.empty) {
        setSnackbarMessage("Benutzername bereits vergeben.");
        setSnackbarOpen(true);
        return;
      }
    }

    let imageUrl = previewUrl;
    if (selectedFile && user) {
      const uploaded = await uploadProfileImage(user.uid, selectedFile);
      if (uploaded) {
        imageUrl = uploaded;
        dispatch(saveProfileImage(uploaded));
      }
    }

    await setDoc(
      doc(db, "userProfiles", user.uid),
      {
        id: user.uid,
        uid: user.uid,
        profile: { ...formData, image: imageUrl },
        createdAt: new Date().toISOString()
      },
      { merge: true }
    );

    const resp = await fetch(`${API_BASE_URL}/api/userProfiles`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uid: user.uid, ...formData })
    });
    if (!resp.ok) {
      setSnackbarMessage("Benutzername bereits vergeben.");
      setSnackbarOpen(true);
      return;
    }

    navigate("/");
  };

  const getError = (field: keyof typeof formData) => fieldErrors[field] || false;
  const getHelper = (field: keyof typeof formData) => getError(field) ? helperTexts[field] : " ";

  return (
      <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, px: 2, maxWidth: 600, mx: "auto" }}>
        <Typography variant="h5" gutterBottom>Profil vervollständigen</Typography>
        <Grid container spacing={2}>
          {Object.entries(formData)
            .filter(([key]) => key !== "image")
            .map(([key, value]) => (
              <Grid item xs={12} key={key}>
                <TextField
                    fullWidth
                    required={false}
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
          <Grid item xs={12}>
            <Box display="flex" alignItems="center" gap={2}>
              {previewUrl && <Avatar src={previewUrl} />}
              <Button variant="outlined" component="label">
                Bild wählen
                <input hidden type="file" accept="image/png,image/jpeg,image/jpg" onChange={handleFileChange} />
              </Button>
              {previewUrl && (
                <Button color="error" onClick={handleDeleteImage}>Bild löschen</Button>
              )}
            </Box>
          </Grid>
          <Grid item xs={12}>
            <FormControlLabel
                control={<Checkbox checked={agreed} onChange={() => setAgreed(!agreed)} />}
                label="Ich stimme den AGB und der Datenschutzerklärung zu."
            />
          </Grid>
        </Grid>
        <Button type="submit" variant="contained" color="primary" sx={{ mt: 2 }}>
          Speichern
        </Button>
        <Snackbar open={snackbarOpen} autoHideDuration={6000} onClose={handleSnackbarClose}>
          <Alert severity="error" onClose={handleSnackbarClose} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>
      </Box>
  );
};


import {Checkbox, FormControlLabel, TextField} from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import {Link, useNavigate} from "react-router-dom";
import {ROUTES} from "../../routing/routes";
import {signUpWithEmail} from "../../firebase/firebase-service";
import "./style.scss";
import {AppDispatch} from "../../store/store";
import {useDispatch} from "react-redux";
import {addProfile, ProfileInformation} from "../../store/slices/user-profile";

export const SignUp = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const [formData, setFormData] = React.useState({
        fullName: '',
        email: '',
        password: '',
        receiveUpdates: false
    });

    const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const {name, value, type, checked} = event.target;
        setFormData(prev => ({...prev, [name]: type === 'checkbox' ? checked : value}));
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();


        const error = await signUpWithEmail(formData.email, formData.password);

        try {
            saveProfileInformation();
        } catch (error) {
            console.error('Error saving profile information', error);
            return;
        }

        if (!error) {
            navigate(`/${ROUTES.MY_RISKS}`);
        } else {
            alert('Error signing up')
        }
    };

    const saveProfileInformation = () => {
        const newProfile: ProfileInformation = {
            name: formData.fullName,
            email: formData.email,
            receiveUpdates: formData.receiveUpdates
        };

        dispatch(addProfile(newProfile));
    }

    return (
        <div className="sign-up-card">
            <Box sx={{
                maxWidth: 400,
                mx: 'auto',
                p: 3,
                boxShadow: 3,
                borderRadius: 2,
            }}>
                <Typography variant="h6" sx={{mb: 2}}>Registrieren</Typography>
                <form onSubmit={handleSubmit}>
                    <TextField
                        required
                        size="small"
                        fullWidth
                        label="Name"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        size="small"
                        fullWidth
                        label="Email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <TextField
                        fullWidth
                        size="small"
                        label="Passwort"
                        name="password"
                        type="password"
                        value={formData.password}
                        onChange={handleChange}
                        margin="normal"
                    />
                    <FormControlLabel
                        control={<Checkbox checked={formData.receiveUpdates} onChange={handleChange} name="receiveUpdates"/>}
                        label="Ich möchte Updates per Email erhalten."
                        sx={{mb: 2}}
                    />
                    <Button
                        disabled={!formData.email || !formData.password || !formData.fullName}
                        type="submit"
                        fullWidth
                        variant="contained"
                        sx={{mb: 2}}>
                        Registrieren
                    </Button>
                    <Typography textAlign="center" sx={{mb: 1}} variant="subtitle1">
                        Ich habe bereits einen Account? <Link to={`/${ROUTES.SIGN_IN}`}>Log In</Link>
                    </Typography>
                </form>
            </Box>
        </div>

    );
}

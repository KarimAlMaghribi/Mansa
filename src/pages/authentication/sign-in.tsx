import {Button, Card, Container, Divider, TextField, Typography} from "@mui/material";
import Grid from '@mui/material/Grid2';
import React, {useEffect} from "react";
// @ts-ignore
import Logo from "../../assests/imgs/logo.png";
import "./style.scss";
import GoogleIcon from '@mui/icons-material/Google';
import {Link, useNavigate} from "react-router-dom";
import {ROUTES} from "../../routing/routes";
import {signInWithEmail, signInWithGoogle} from "../../firebase/firebase-service";
import {auth} from "../../firebase_config";
import {fetchUserProfile} from "../../store/slices/user-profile";
import {AppDispatch} from "../../store/store";
import {useDispatch} from "react-redux";

export const SignIn = () => {
    const dispatch: AppDispatch = useDispatch();
    const navigate = useNavigate();
    const [email, setEmail] = React.useState<string>("");
    const [password, setPassword] = React.useState<string>("");

    useEffect(() => {
        if (auth.currentUser) {
            navigate(`/${ROUTES.MY_RISKS}`)
        }
    }, [])

    const signIn = async () => {
        const user = await signInWithEmail(email, password);
        dispatch(fetchUserProfile())

        if (user?.refreshToken) {
            navigate(`/${ROUTES.MY_RISKS}`);
        }
    }

    return (
        <div className="sign-in-card">
            <Card>
                <Grid container>
                    <Grid size={6} style={{backgroundColor: "#1F271B"}}>
                        <div style={{display: "flex", alignItems: "center", padding: "20px"}}>
                            <img src={Logo} alt="logo" style={{height: "30px", width: "39px", marginRight: "20px"}}/>
                            <Typography variant="body1" style={{color: "white"}}>
                                Wir machen Risiken handelbar
                            </Typography>
                        </div>
                    </Grid>

                    <Grid size={6} style={{padding: "20px"}}>
                        <Grid container>
                            <Grid size={12} textAlign="center">
                                <Typography variant="h6">Erstelle ein Konto</Typography>
                            </Grid>

                            <Grid size={12} textAlign="center">
                                <Typography variant="caption">Nutze deine Email zur Kontoerstellung</Typography>
                            </Grid>

                            <Container style={{maxWidth: "400px"}}>
                                <Grid size={12} textAlign="center">
                                    <TextField
                                        InputProps={{
                                            style: {
                                                fontSize: '14px'
                                            },
                                        }}
                                        autoComplete="email"
                                        placeholder="max.mustermann@email.de"
                                        variant="outlined"
                                        name="Email"
                                        size="small"
                                        style={{marginTop: "20px"}}
                                        value={email}
                                        onChange={(event) => setEmail(event.target.value)}
                                        fullWidth
                                    />
                                </Grid>

                                <Grid size={12} textAlign="center">
                                    <TextField
                                        InputProps={{
                                            style: {
                                                fontSize: '14px'
                                            },
                                        }}
                                        autoComplete="current-password"
                                        variant="outlined"
                                        name="Passwort"
                                        size="small"
                                        type="password"
                                        style={{marginTop: "20px"}}
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                        fullWidth
                                    />
                                </Grid>

                                <Grid size={12} textAlign="center">
                                    <Button variant="contained" style={{color: "white", marginTop: "10px"}} fullWidth
                                            onClick={signIn}>
                                        Log In
                                    </Button>
                                </Grid>

                                <Divider style={{marginTop: "10px", marginBottom: "10px"}}><Typography
                                    variant="subtitle2" color="textSecondary">ODER LOGGE DICH EIN
                                    MIT</Typography></Divider>

                                <Button
                                    disabled
                                    variant="outlined"
                                    startIcon={<GoogleIcon/>}
                                    fullWidth
                                    onClick={signInWithGoogle}>
                                    Google
                                </Button>

                                <Typography variant="subtitle2" style={{textAlign: "center", marginTop: "10px"}}>
                                    Durch Registrierung, stimmst du automatisch unseren <Link
                                    to={`/${ROUTES.LEGAL}`}>AGBs</Link> und
                                    unseren <Link to={`/${ROUTES.PRIVACY}`}>Datenschutzrichtlinien</Link> zu.
                                </Typography>

                            </Container>


                        </Grid>
                    </Grid>
                </Grid>
            </Card>
        </div>

    )
}

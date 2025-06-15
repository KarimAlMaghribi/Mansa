import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import Avatar from "@mui/material/Avatar";
import Menu from "@mui/material/Menu";
import {settings} from "../pages";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";
import {signOutUser} from "../../../firebase/firebase-service";
import West from "@mui/icons-material/West";
import Grid from "@mui/material/Grid2";
import {ROUTES} from "../../../routing/routes";
import East from "@mui/icons-material/East";
import * as React from "react";
import {useLocation, useNavigate} from "react-router-dom";
import {Divider, Fade, ListItemIcon} from "@mui/material";
import {auth} from "../../../firebase_config";
import {selectName} from "../../../store/slices/user-profile";
import {useSelector} from "react-redux";

export interface AuthenticationButtonsProps {
    isLoggedIn: boolean;
    anchorElUser: HTMLElement | null;
    handleOpenUserMenu: (event: React.MouseEvent<HTMLElement>) => void;
    handleCloseUserMenu: (setting: any) => void;
}

export const QuickMenuButtons = (props: AuthenticationButtonsProps) => {
    const location = useLocation();
    const navigate = useNavigate();
    const userName: string = useSelector(selectName);

    return (
        <>
            {
                props.isLoggedIn ? (
                    <Box sx={{flexGrow: 0}}>
                        {/*<NotificationButton />*/}
                        <IconButton onClick={props.handleOpenUserMenu} sx={{p: 0}}>
                            <Avatar src=""/>
                        </IconButton>
                        <Menu
                            sx={{mt: '45px'}}
                            id="menu-appbar"
                            anchorEl={props.anchorElUser}
                            anchorOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            keepMounted
                            transformOrigin={{
                                vertical: 'top',
                                horizontal: 'right',
                            }}
                            open={Boolean(props.anchorElUser)}
                            TransitionComponent={Fade}
                            onClose={props.handleCloseUserMenu}>
                            {/* TODO:: beautify profilemenu with header menu profile image, name and mail*/}

                            {[
                                <Box sx={{ px: 2, py: 1 }}>
                                    <Typography variant="body1" fontWeight="bold">
                                        {userName}
                                    </Typography>
                                    <Typography variant="body2" color="textSecondary">
                                        {auth.currentUser?.email}
                                    </Typography>
                                </Box>,
                                <Divider key="divider"/>,
                                ...settings.map((setting) => (
                                    <MenuItem
                                        key={setting.name}
                                        onClick={() => props.handleCloseUserMenu(setting)}>
                                        <ListItemIcon>
                                            <setting.icon fontSize="small"/>
                                        </ListItemIcon>
                                        <Typography sx={{textAlign: 'center'}}>
                                            {setting.name}
                                        </Typography>
                                    </MenuItem>
                                )),
                            ]}
                        </Menu>
                        <Button
                            onClick={() => signOutUser()}
                            variant="outlined"
                            style={{color: "white", borderColor: "white", marginLeft: "20px"}}
                            startIcon={<West/>}>
                            Log Out
                        </Button>
                    </Box>
                ) : (
                    <Grid container>
                        <Grid size={6}>
                            <Button
                                onClick={() => navigate(ROUTES.SIGN_IN)}
                                variant="outlined"
                                style={{
                                    color: "white",
                                    borderColor: "white",
                                    minWidth: "100px",
                                    visibility: location.pathname === `/${ROUTES.SIGN_IN}` ? "hidden" : "visible"
                                }}
                                endIcon={<East/>}>
                                Log In
                            </Button>
                        </Grid>
                        <Grid size={6}>
                            <Button
                                onClick={() => navigate(ROUTES.SIGN_UP)}
                                variant="contained"
                                style={{
                                    minWidth: "100px",
                                    visibility: location.pathname === `/${ROUTES.SIGN_UP}` ? "hidden" : "visible"
                                }}
                                endIcon={<East/>}>
                                Registrieren
                            </Button>
                        </Grid>
                    </Grid>
                )
            }
        </>
    )
}

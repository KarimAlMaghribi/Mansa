import IconButton from "@mui/material/IconButton";
import React, {useEffect} from "react";
import {Badge, Fade} from "@mui/material";
import NotificationsIcon from "@mui/icons-material/Notifications";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import {useDispatch, useSelector} from "react-redux";
import {fetchNotifications, selectNotificationCount} from "../../../store/slices/notifications";
import {AppDispatch} from "../../../store/store";

export const NotificationButton = () => {
    const dispatch: AppDispatch = useDispatch();
    const notificationCount: number = useSelector(selectNotificationCount);
    const [anchorNotificationsNav, setAnchorNotificationsNav] = React.useState<null | HTMLElement>(null);

    useEffect(() => {
        dispatch(fetchNotifications());
    }, [])

    const handleOpenNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorNotificationsNav(event.currentTarget);
    };

    const handleCloseNotificationsMenu = (event: React.MouseEvent<HTMLElement>) => {
        setAnchorNotificationsNav(null);
    };

    return (
        <>
            <IconButton
                onClick={handleOpenNotificationsMenu}
                style={{marginRight: "10px"}}>
                <Badge badgeContent={notificationCount} color="primary">
                    <NotificationsIcon style={{color: "white"}}/>
                </Badge>
            </IconButton>
            <Menu
                sx={{mt: '45px'}}
                id="menu-appbar"
                anchorEl={anchorNotificationsNav}
                anchorOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                keepMounted
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                open={Boolean(anchorNotificationsNav)}
                TransitionComponent={Fade}
                onClose={handleCloseNotificationsMenu}>
                {
                    [
                        <Box sx={{px: 2, py: 1}} >
                            <Typography variant="body1" fontWeight="bold">
                                Benachrichtigungen
                            </Typography>
                        </Box>,
                        <MenuItem key="box_1"></MenuItem>
                    ]
                }

            </Menu>
        </>

    )
}

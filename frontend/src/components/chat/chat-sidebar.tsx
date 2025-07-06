import Typography from "@mui/material/Typography";
import {Badge, Drawer, InputAdornment, TextField} from "@mui/material";
import React from "react";
import {ChatsList} from "./chats-list";
import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import SearchIcon from '@mui/icons-material/Search';
import {useDispatch, useSelector} from "react-redux";
import {AppDispatch} from "../../store/store";
import {searchChats} from "../../store/slices/my-bids";
import {selectMail, selectName} from "../../store/slices/user-profile";
import {auth} from "../../firebase_config";
import {fetchProfileImage} from "../../firebase/firebase-service";

const drawerWidth = 320;

export const ChatSidebar = () => {
    const dispatch: AppDispatch = useDispatch();
    const username: string = useSelector(selectName);
    const userMail: string = useSelector(selectMail);
    const [avatarUrl, setAvatarUrl] = React.useState<string | undefined>(undefined);

    React.useEffect(() => {
        const loadImage = async () => {
            if (auth.currentUser) {
                const url = await fetchProfileImage(auth.currentUser.uid);
                if (url) {
                    setAvatarUrl(url);
                }
            }
        };
        loadImage();
        const handler = () => loadImage();
        window.addEventListener('profileImageUpdated', handler);
        return () => window.removeEventListener('profileImageUpdated', handler);
    }, []);

    return (
        <Drawer
            open={true}
            variant='permanent'
            sx={{
                width: drawerWidth,
                flexShrink: 0,
                [`& .MuiDrawer-paper`]: {position: 'relative'},
            }}>
            <Box display={'flex'} alignItems="center" gap="10px" p={3}>
                <Badge
                    variant="dot"
                    anchorOrigin={{
                        vertical: 'bottom',
                        horizontal: 'right',
                    }}
                    overlap="circular"
                    color="success">
                    <Avatar src={avatarUrl || ''} sx={{width: 54, height: 54}}/>
                </Badge>
                <Box>
                    <Typography variant="body1" fontWeight={600}>
                        {username}
                    </Typography>
                    <Typography variant="body2">{userMail}</Typography>
                </Box>
            </Box>

            <Box px={3} py={1}>
                <TextField
                    id="outlined-search"
                    placeholder="Durchsuche Chats"
                    size="small"
                    type="search"
                    variant="outlined"
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <SearchIcon/>
                            </InputAdornment>
                        ),
                    }}
                    fullWidth
                    onChange={(e) => dispatch(searchChats(e.target.value))}
                />
            </Box>
            <ChatsList/>
        </Drawer>
    )
}

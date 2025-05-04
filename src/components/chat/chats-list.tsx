import Typography from "@mui/material/Typography";
import React from "react";
import {Alert, Badge, List, ListItemAvatar, ListItemButton, ListItemText} from "@mui/material";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Menu from "@mui/material/Menu";
import MenuItem from "@mui/material/MenuItem";
import Avatar from "@mui/material/Avatar";
import Scrollbar from "./scrollbar";
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import {useDispatch, useSelector} from "react-redux";
import {Chat, selectActiveChatId, selectChats, setActiveChat} from "../../store/slices/my-bids";
import {AppDispatch} from "../../store/store";
import {ChatStatusEnum} from "../../enums/ChatStatus.enum";
import {formatLastActivity} from "./utils";



export const ChatsList = () => {
    const dispatch: AppDispatch = useDispatch();
    const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const chats: Chat[] = useSelector(selectChats);

    const isMenuOpen = Boolean(anchorEl);

    const handleSelectChat = (chatId: string) => {
        if (chatId === activeChatId) {
            return;
        }

        dispatch(setActiveChat(chatId));
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
    };

    return (
        <List sx={{ px: 0 }}>
            <Box px={2.5} pb={1}>
                <Button
                    id="basic-button"
                    aria-controls={isMenuOpen ? 'basic-menu' : undefined}
                    aria-haspopup="true"
                    aria-expanded={isMenuOpen ? 'true' : undefined}
                    onClick={handleClick}
                    color="inherit">
                    Letzte Chats <ExpandMoreIcon />
                </Button>
                <Menu
                    id="basic-menu"
                    anchorEl={anchorEl}
                    open={isMenuOpen}
                    onClose={handleClose}
                    MenuListProps={{
                        'aria-labelledby': 'basic-button',
                    }}>
                    <MenuItem onClick={handleClose}>Sort By Time</MenuItem>
                    <MenuItem onClick={handleClose}>Sort By Unread</MenuItem>
                    <MenuItem onClick={handleClose}>Mark as all Read</MenuItem>
                </Menu>
            </Box>
            <Scrollbar sx={{ height: { lg: 'calc(100vh - 100px)', md: '100vh' }, maxHeight: '600px' }}>
                {chats && chats.length ? (
                    chats.map((chat) => (
                        <ListItemButton
                            key={chat.id}
                            onClick={() => handleSelectChat(chat.id)}
                            sx={{
                                mb: 0.5,
                                py: 2,
                                px: 3,
                                alignItems: 'start',
                            }}
                            selected={activeChatId === chat.id}>
                            <ListItemAvatar>
                                <Badge
                                    color={
                                        chat.status === ChatStatusEnum.ONLINE
                                            ? 'success'
                                            : chat.status === ChatStatusEnum.BUSY
                                                ? 'error'
                                                : chat.status === ChatStatusEnum.AWAY
                                                    ? 'warning'
                                                    : 'secondary'
                                    }
                                    variant="dot"
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    overlap="circular">
                                    <Avatar src="" sx={{ width: 42, height: 42 }} />
                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Typography variant="subtitle2" fontWeight={600} mb={0.5}>
                                        {chat.topic}
                                    </Typography>
                                }
                                secondary={chat.lastMessage || ""}
                                secondaryTypographyProps={{
                                    noWrap: true,
                                }}
                                sx={{ my: 0 }}
                            />
                            <Box sx={{ flexShrink: '0' }} mt={0.5}>
                                <Typography variant="body2">
                                    {formatLastActivity(chat?.lastActivity) || ""}
                                </Typography>
                            </Box>
                        </ListItemButton>
                    ))
                ) : (
                    <Box m={2}>
                        <Alert severity="error" variant="filled" sx={{ color: 'white' }}>
                            Keine Chats gefunden!
                        </Alert>
                    </Box>
                )}
            </Scrollbar>
        </List>
    )
}

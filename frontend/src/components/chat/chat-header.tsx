import {Badge, Box, Divider, ListItem, ListItemAvatar, ListItemText, Stack} from "@mui/material";
import Typography from "@mui/material/Typography";
import React from "react";
import Avatar from "@mui/material/Avatar";
import IconButton from "@mui/material/IconButton";
import LocalPhoneIcon from '@mui/icons-material/LocalPhone';
import VideoChatIcon from '@mui/icons-material/VideoChat';
import HandshakeIcon from '@mui/icons-material/Handshake';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {useSelector} from "react-redux";
import {Chat, selectActiveChat, selectActiveChatId} from "../../store/slices/my-bids";
import {ChatStatusEnum} from "../../enums/ChatStatus.enum";
import {MyRiskAgreementDialog} from "../risk-agreement/risk-agreement";



export const ChatHeader = () => {
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const activeChat: Chat | undefined = useSelector(selectActiveChat);
    const [openRiskAgreementCreationDialog, setOpenRiskAgreementCreationDialog] = React.useState(false);

    const handleClose = () => {
        setOpenRiskAgreementCreationDialog(false);
    }

    return (
        <Box>
            {
                activeChat &&
                <Box>
                    <Box display="flex" alignItems="center" p={2}>
                        <ListItem key={activeChatId} dense disableGutters>
                            <ListItemAvatar>
                                <Badge
                                    color={
                                        activeChat?.status === ChatStatusEnum.ONLINE
                                            ? 'success'
                                            : activeChat?.status === ChatStatusEnum.BUSY
                                                ? 'error'
                                                : activeChat?.status === ChatStatusEnum.AWAY
                                                    ? 'warning'
                                                    : 'secondary'
                                    }
                                    variant="dot"
                                    anchorOrigin={{
                                        vertical: 'bottom',
                                        horizontal: 'right',
                                    }}
                                    overlap="circular">
                                    <Avatar alt={activeChat?.riskProvider?.name} src="" />

                                </Badge>
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="body1" fontWeight={600}>{activeChat?.riskProvider?.name}</Typography>}
                                secondary={<Typography variant="body2">{activeChat?.status}</Typography>}
                            />
                        </ListItem>
                        <Stack direction={'row'}>
                        <IconButton aria-label="delete">
                                <HandshakeIcon onClick={() => {setOpenRiskAgreementCreationDialog(true)}}/>
                            </IconButton>
                            <IconButton aria-label="delete">
                                <LocalPhoneIcon />
                            </IconButton>
                            <IconButton aria-label="delete">
                                <VideoChatIcon />
                            </IconButton>
                            <IconButton aria-label="delete">
                                <MoreVertIcon />
                            </IconButton>
                        </Stack>
                    </Box>
                    <Divider />
                </Box>
            }
                        <MyRiskAgreementDialog
                            open={openRiskAgreementCreationDialog}
                            handleClose={handleClose} />
        </Box>
        

    )
}

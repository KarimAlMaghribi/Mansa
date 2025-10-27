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
import GroupsIcon from '@mui/icons-material/Groups';
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";



export const ChatHeader = () => {
    const activeChatId: string | null = useSelector(selectActiveChatId);
    const activeChat: Chat | undefined = useSelector(selectActiveChat);
    const [openRiskAgreementCreationDialog, setOpenRiskAgreementCreationDialog] = React.useState(false);
    const [isMembersDialogOpen, setMembersDialogOpen] = React.useState(false);

    const isGroupChat = React.useMemo(() => {
        if (!activeChat) {
            return false;
        }

        const participantCount = activeChat.participants?.length ?? 0;
        return activeChat.kind === "group" || participantCount > 2 || activeChat.context === "jamiah_group";
    }, [activeChat]);

    const participantNames = React.useMemo(() => {
        if (!activeChat) {
            return [] as string[];
        }

        const names = new Set<string>();
        if (activeChat.riskProvider?.name) {
            names.add(activeChat.riskProvider.name);
        }
        if (activeChat.riskTaker?.name) {
            names.add(activeChat.riskTaker.name);
        }
        if (activeChat.participants && activeChat.participants.length > 0) {
            activeChat.participants.forEach((participant) => {
                if (participant) {
                    names.add(participant);
                }
            });
        }
        return Array.from(names);
    }, [activeChat]);

    const participantCount = participantNames.length || activeChat?.participants?.length || 0;

    const conversationTitle = isGroupChat
        ? activeChat?.topic || "Gruppenchat"
        : activeChat?.riskProvider?.name || activeChat?.topic || "Chat";

    const secondaryText = isGroupChat
        ? participantNames.length > 0
            ? `Teilnehmer: ${participantNames.join(", ")}`
            : `Teilnehmer: ${participantCount}`
        : activeChat?.status;

    const handleClose = () => {
        setOpenRiskAgreementCreationDialog(false);
    }

    const handleOpenMembers = () => {
        setMembersDialogOpen(true);
    };

    const handleCloseMembers = () => {
        setMembersDialogOpen(false);
    };

    const statusColor = (status?: ChatStatusEnum) => {
        switch (status) {
            case ChatStatusEnum.ONLINE:
                return 'success';
            case ChatStatusEnum.BUSY:
                return 'error';
            case ChatStatusEnum.AWAY:
                return 'warning';
            default:
                return 'secondary';
        }
    };

    return (
        <Box>
            {
                activeChat &&
                <Box>
                    <Box display="flex" alignItems="center" p={2}>
                        <ListItem key={activeChatId} dense disableGutters>
                            <ListItemAvatar>
                                {isGroupChat ? (
                                    <Badge
                                        color="primary"
                                        overlap="circular"
                                        badgeContent={participantCount > 0 ? participantCount : null}
                                        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                                        <Avatar>
                                            <GroupsIcon fontSize="small" />
                                        </Avatar>
                                    </Badge>
                                ) : (
                                    <Badge
                                        color={statusColor(activeChat?.status)}
                                        variant="dot"
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'right',
                                        }}
                                        overlap="circular">
                                        <Avatar alt={activeChat?.riskProvider?.name} src="" />

                                    </Badge>
                                )}
                            </ListItemAvatar>
                            <ListItemText
                                primary={<Typography variant="body1" fontWeight={600}>{conversationTitle}</Typography>}
                                secondary={
                                    secondaryText ? (
                                        <Typography variant="body2">{secondaryText}</Typography>
                                    ) : null
                                }
                            />
                        </ListItem>
                        <Stack direction={'row'} spacing={1} alignItems="center">
                            {(isGroupChat || participantNames.length > 0) && (
                                <IconButton aria-label="Mitglieder anzeigen" onClick={handleOpenMembers}>
                                    <GroupsIcon />
                                </IconButton>
                            )}
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
            <Dialog open={isMembersDialogOpen} onClose={handleCloseMembers} fullWidth maxWidth="xs">
                <DialogTitle>Mitgliederübersicht</DialogTitle>
                <DialogContent dividers>
                    {participantNames.length > 0 ? (
                        <Stack spacing={1}>
                            {participantNames.map((participant) => (
                                <Typography key={participant} variant="body2">
                                    {participant}
                                </Typography>
                            ))}
                        </Stack>
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            Keine Teilnehmerinformationen verfügbar.
                        </Typography>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleCloseMembers}>Schließen</Button>
                </DialogActions>
            </Dialog>
        </Box>


    )
}

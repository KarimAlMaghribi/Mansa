import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Avatar,
  Stack,
  IconButton,
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/PersonRemove";
import ChatIcon from "@mui/icons-material/Chat";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  Chat,
  createChat,
  selectChats,
  setActiveChat,
} from "../../store/slices/my-bids";
import { ChatStatusEnum } from "../../enums/ChatStatus.enum";
import { auth } from "../../firebase_config";
import { useAuth } from "../../context/AuthContext";
import { JamiahMember, useJamiahContext } from "../../context/JamiahContext";

export const Members = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const chats: Chat[] = useSelector(selectChats);
  const { user } = useAuth();
  const userUid = user?.uid;
  const { members, pendingRequests: pendingApplicants, roles, jamiah, respondToJoinRequest } = useJamiahContext();

  const handleDecision = (requestId: number, accept: boolean) => {
    void respondToJoinRequest(requestId, accept);
  };

  const startChat = (member: JamiahMember) => {
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.uid || !member.uid) return;
    if (currentUser.uid === member.uid) return;

    const existing = chats.find(
      (chat) =>
        (chat.riskProvider?.uid === currentUser.uid && chat.riskTaker?.uid === member.uid) ||
        (chat.riskProvider?.uid === member.uid && chat.riskTaker?.uid === currentUser.uid),
    );

    if (existing) {
      dispatch(setActiveChat(existing.id));
      navigate(`/chat`);
      return;
    }

    const targetName = getMemberName(member);

    const newChat: Omit<Chat, "id"> = {
      riskId: (groupId as string) || "jamiah",
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      topic: targetName,
      status: ChatStatusEnum.ONLINE,
      riskProvider: {
        name: targetName,
        uid: member.uid,
      },
      riskTaker: {
        name: currentUser.displayName || currentUser.email || "Unknown",
        uid: currentUser.uid,
      },
    };

    dispatch(createChat(newChat));
    navigate(`/chat`);
  };

  const getMemberName = (member: JamiahMember) =>
    `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.username || member.uid || `Mitglied ${member.id}`;

  return (
    <Box p={4}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Mitgliederbereich
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {jamiah?.name ? `${jamiah.name}` : "Jamiah"} – {roles.isOwner ? "Owner-Ansicht" : "Mitgliedsansicht"}
          </Typography>
        </Box>
        <Stack direction="row" spacing={1}>
          {roles.isOwner && <Chip label="Owner" color="primary" size="small" />}
          {!roles.isOwner && userUid && <Chip label="Mitglied" size="small" />}
        </Stack>
      </Box>

      {roles.isOwner && (
        <Box mb={4}>
          <Typography variant="h5" gutterBottom>
            Bewerber
          </Typography>
          {pendingApplicants.length === 0 ? (
            <Paper sx={{ p: 3 }}>
              <Typography color="text.secondary">Keine offenen Bewerbungen.</Typography>
            </Paper>
          ) : (
            <Grid container spacing={3}>
              {pendingApplicants.map((request) => {
                const name = `${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() || request.username || request.userUid;
                const initial = name.charAt(0).toUpperCase() || "?";
                return (
                  <Grid item xs={12} md={6} key={request.id}>
                    <Paper sx={{ p: 2 }}>
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Avatar>{initial}</Avatar>
                        <Box flexGrow={1}>
                          <Typography variant="h6">{name}</Typography>
                          <Typography variant="body2" color="text.secondary">
                            Bewerber
                          </Typography>
                          {request.motivation && (
                            <Typography variant="body2" mt={1}>
                              {request.motivation}
                            </Typography>
                          )}
                        </Box>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" color="success" onClick={() => handleDecision(request.id, true)}>
                            Annehmen
                          </Button>
                          <Button size="small" color="error" onClick={() => handleDecision(request.id, false)}>
                            Ablehnen
                          </Button>
                        </Stack>
                      </Stack>
                    </Paper>
                  </Grid>
                );
              })}
            </Grid>
          )}
        </Box>
      )}

      <Typography variant="h5" gutterBottom>
        Mitglieder
      </Typography>
      <Grid container spacing={3}>
        {members.map((member) => {
          const name = getMemberName(member);
          const initial = name.charAt(0).toUpperCase() || "?";
          return (
            <Grid item xs={12} md={6} key={member.id}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar>{initial}</Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6">{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Mitglied
                    </Typography>
                    {roles.isOwner && (
                      <Typography variant="body2" color="text.secondary">
                        {member.username ?? member.uid ?? "-"}
                      </Typography>
                    )}
                  </Box>
                  {roles.isOwner ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<EditIcon />}>Bearbeiten</Button>
                      <Button size="small" color="error" startIcon={<DeleteIcon />}>Entfernen</Button>
                    </Stack>
                  ) : (
                    <IconButton aria-label="Chat" color="primary" onClick={() => startChat(member)}>
                      <ChatIcon />
                    </IconButton>
                  )}
                </Stack>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    </Box>
  );
};


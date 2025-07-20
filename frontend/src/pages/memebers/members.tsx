import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  Box,
  Typography,
  Grid,
  Paper,
  Button,
  Switch,
  FormControlLabel,
  Avatar,
  Stack,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/PersonRemove";
import ChatIcon from "@mui/icons-material/Chat";
import { API_BASE_URL } from "../../constants/api";
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

interface Member {
  id: number;
  uid?: string;
  username: string;
  firstName?: string;
  lastName?: string;
}

export const Members = () => {
  const { groupId } = useParams();
  const [isAdminView, setIsAdminView] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);
  const dispatch: AppDispatch = useDispatch();
  const chats: Chat[] = useSelector(selectChats);
  const navigate = useNavigate();

  useEffect(() => {
    if (!groupId) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then((res) => res.json())
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [groupId]);

  const startChat = (member: Member) => {
    const user = auth.currentUser;
    if (!user || !user.uid || !member.uid) return;
    if (user.uid === member.uid) return;

    const existing = chats.find(
      (c) =>
        (c.riskProvider?.uid === user.uid && c.riskTaker?.uid === member.uid) ||
        (c.riskProvider?.uid === member.uid && c.riskTaker?.uid === user.uid),
    );

    if (existing) {
      dispatch(setActiveChat(existing.id));
      navigate(`/chat`);
      return;
    }

    const newChat: Omit<Chat, "id"> = {
      riskId: (groupId as string) || "jamiah",
      created: new Date().toISOString(),
      lastActivity: new Date().toISOString(),
      topic: member.username,
      status: ChatStatusEnum.ONLINE,
      riskProvider: {
        name: member.username,
        uid: member.uid,
      },
      riskTaker: {
        name: user.displayName || user.email || "Unknown",
        uid: user.uid,
      },
    };

    dispatch(createChat(newChat));
    navigate(`/chat`);
  };

  return (
    <Box p={4}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={4}
      >
        <Typography variant="h4" fontWeight="bold">
          Mitgliederbereich
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={isAdminView}
              onChange={() => setIsAdminView(!isAdminView)}
            />
          }
          label={isAdminView ? "Admin-Modus" : "Mitgliedsansicht"}
        />
      </Box>

      <Grid container spacing={3}>
        {members.map((member) => {
          const name =
            `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() ||
            member.username;
          const initial = name.charAt(0).toUpperCase();
          return (
            <Grid item xs={12} md={6} key={member.id}>
              <Paper sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <Avatar>{initial}</Avatar>
                  <Box flexGrow={1}>
                    <Typography variant="h6">{name}</Typography>
                    {isAdminView && (
                      <Typography variant="body2" color="text.secondary">
                        {member.username}
                      </Typography>
                    )}
                  </Box>
                  {isAdminView ? (
                    <Stack direction="row" spacing={1}>
                      <Button size="small" startIcon={<EditIcon />}>
                        Bearbeiten
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<DeleteIcon />}
                      >
                        Entfernen
                      </Button>
                    </Stack>
                  ) : (
                    <IconButton
                      aria-label="Chat"
                      color="primary"
                      onClick={() => startChat(member)}
                    >
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

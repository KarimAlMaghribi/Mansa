import React, { useEffect, useMemo, useState } from "react";
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
  Tabs,
  Tab,
  Badge,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/PersonRemove";
import ChatIcon from "@mui/icons-material/Chat";
import type { SelectChangeEvent } from "@mui/material/Select";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "../../store/store";
import {
  Chat,
  createChat,
  fetchMyChats,
  selectChats,
  sendMessage,
  setActiveChat,
} from "../../store/slices/my-bids";
import { ChatStatusEnum } from "../../enums/ChatStatus.enum";
import { MessageTypeEnum } from "../../enums/MessageTypeEnum";
import { auth } from "../../firebase_config";
import { useAuth } from "../../context/AuthContext";
import { JamiahJoinRequest, JamiahMember, useJamiahContext } from "../../context/JamiahContext";
import useJoinStatus from "../../hooks/useJoinStatus";

export const Members = () => {
  const { groupId } = useParams();
  const navigate = useNavigate();
  const dispatch: AppDispatch = useDispatch();
  const chats: Chat[] = useSelector(selectChats);
  const { user } = useAuth();
  const userUid = user?.uid;
  const { members, pendingRequests: pendingApplicants, roles, jamiah, respondToJoinRequest } = useJamiahContext();
  const { status: rawStatus, loading: statusLoading } = useJoinStatus(jamiah?.id, userUid);
  const joinStatus = useMemo(() => {
    if (roles.isOwner) return "owner";
    if (roles.isPayer) return "accepted";
    return rawStatus;
  }, [rawStatus, roles.isOwner, roles.isPayer]);
  const [activeTab, setActiveTab] = useState<"members" | "applications">("members");
  const [roleDialog, setRoleDialog] = useState<{
    open: boolean;
    member: JamiahMember | null;
    role: string;
  }>({ open: false, member: null, role: "mitglied" });
  const [removeDialog, setRemoveDialog] = useState<{
    open: boolean;
    member: JamiahMember | null;
  }>({ open: false, member: null });
  const [feedback, setFeedback] = useState<{
    open: boolean;
    message: string;
    severity: "success" | "error";
  }>({ open: false, message: "", severity: "success" });

  useEffect(() => {
    dispatch(fetchMyChats());
  }, [dispatch]);

  const handleDecision = async (request: JamiahJoinRequest, accept: boolean) => {
    const decisionSuccessful = await respondToJoinRequest(request.id, accept);
    if (!decisionSuccessful) return;

    const currentUser = auth.currentUser;
    if (!currentUser?.uid || !jamiah?.id || !request.userUid) return;

    const applicantName = `${request.firstName ?? ""} ${request.lastName ?? ""}`.trim() || request.username || request.userUid;
    const ownerMember = members.find((member) => member.uid === jamiah.ownerId);
    const ownerName = ownerMember ? getMemberName(ownerMember) : currentUser.displayName || currentUser.email || currentUser.uid;

    let targetChat = chats.find(
      (chat) =>
        chat.context === "jamiah_request" &&
        chat.contextId === jamiah.id &&
        chat.participants?.includes(request.userUid)
    );

    if (!targetChat) {
      try {
        const createdChat = await dispatch(
          createChat({
            context: "jamiah_request",
            contextId: jamiah.id,
            created: new Date().toISOString(),
            lastActivity: new Date().toISOString(),
            topic: jamiah.name ?? applicantName,
            status: ChatStatusEnum.ONLINE,
            participants: [currentUser.uid, request.userUid],
            riskProvider: {
              name: ownerName,
              uid: jamiah.ownerId ?? currentUser.uid,
            },
            riskTaker: {
              name: applicantName,
              uid: request.userUid,
            },
          })
        ).unwrap();
        targetChat = createdChat;
      } catch (error) {
        console.error("[members] Konnte Chat für Beitrittsanfrage nicht anlegen", error);
        return;
      }
    }

    if (!targetChat) {
      return;
    }

    const message = accept
      ? `Deine Bewerbung für ${jamiah?.name ?? "die Jamiah"} wurde akzeptiert. Willkommen!`
      : `Deine Bewerbung für ${jamiah?.name ?? "die Jamiah"} wurde abgelehnt.`;

    void dispatch(
      sendMessage({
        chatId: targetChat.id,
        message: {
          type: MessageTypeEnum.SYSTEM,
          uid: currentUser.uid,
          content: message,
          read: false,
        },
      })
    );
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

    const now = new Date().toISOString();
    const newChat: Omit<Chat, "id"> = {
      context: "jamiah_member",
      contextId: jamiah?.id || (groupId as string) || "jamiah",
      created: now,
      lastActivity: now,
      topic: targetName,
      status: ChatStatusEnum.ONLINE,
      participants: [currentUser.uid, member.uid],
      riskProvider: {
        name: targetName,
        uid: member.uid,
      },
      riskTaker: {
        name: currentUser.displayName || currentUser.email || "Unknown",
        uid: currentUser.uid,
      },
    };

    dispatch(createChat(newChat))
      .unwrap()
      .then((chat) => {
        dispatch(setActiveChat(chat.id));
        navigate(`/chat`);
      })
      .catch((error) => {
        console.error("[members] Konnte Chat nicht starten", error);
      });
  };

  const getMemberName = (member: JamiahMember) =>
    `${member.firstName ?? ""} ${member.lastName ?? ""}`.trim() || member.username || member.uid || `Mitglied ${member.id}`;

  const statusChip = useMemo(() => {
    if (roles.isOwner) {
      return <Chip label="Owner" color="primary" size="small" />;
    }

    if (statusLoading) {
      return <Chip label="Status wird geladen" size="small" />;
    }

    switch (joinStatus) {
      case "pending":
        return <Chip label="Bewerbung läuft" color="warning" size="small" />;
      case "rejected":
        return <Chip label="Abgelehnt" color="error" size="small" />;
      case "accepted":
        return <Chip label="Mitglied" color="success" size="small" />;
      default:
        return userUid ? <Chip label="Gast" size="small" /> : null;
    }
  }, [joinStatus, roles.isOwner, statusLoading, userUid]);

  const showApplicationsTab = roles.isOwner;

  const openRoleDialog = (member: JamiahMember) => {
    setRoleDialog({ open: true, member, role: "mitglied" });
  };

  const openRemoveDialog = (member: JamiahMember) => {
    setRemoveDialog({ open: true, member });
  };

  const closeDialogs = () => {
    setRoleDialog({ open: false, member: null, role: "mitglied" });
    setRemoveDialog({ open: false, member: null });
  };

  const submitRoleChange = () => {
    if (!roleDialog.member) return;
    const name = getMemberName(roleDialog.member);
    setFeedback({
      open: true,
      message: `Rolle "${roleDialog.role}" für ${name} gespeichert (nur UI-Vorschau).`,
      severity: "success",
    });
    closeDialogs();
  };

  const submitRemoval = () => {
    if (!removeDialog.member) return;
    const name = getMemberName(removeDialog.member);
    setFeedback({
      open: true,
      message: `${name} wurde zur Entfernung vorgemerkt (nur UI-Vorschau).`,
      severity: "success",
    });
    closeDialogs();
  };

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
          {statusChip}
          {!roles.isOwner && (
            <Chip
              label="Kommunikation"
              size="small"
              onClick={() => navigate(`/chat`)}
            />
          )}
        </Stack>
      </Box>

      <Box mb={3}>
        <Tabs
          value={activeTab}
          onChange={(_, value) => setActiveTab(value as "members" | "applications")}
          variant="scrollable"
          allowScrollButtonsMobile
        >
          <Tab
            value="members"
            label={
              <Badge color="primary" badgeContent={members.length} max={999}>
                Mitglieder
              </Badge>
            }
          />
          {showApplicationsTab && (
            <Tab
              value="applications"
              label={
                <Badge color="secondary" badgeContent={pendingApplicants.length} max={999}>
                  Bewerbungen
                </Badge>
              }
            />
          )}
        </Tabs>
      </Box>

      {activeTab === "applications" && showApplicationsTab ? (
        <Box mb={4}>
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
                          <Button size="small" color="success" onClick={() => { void handleDecision(request, true); }}>
                            Annehmen
                          </Button>
                          <Button size="small" color="error" onClick={() => { void handleDecision(request, false); }}>
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
      ) : null}

      {activeTab === "members" && (
        <>
          <Typography variant="h5" gutterBottom>
            Mitglieder
          </Typography>
          <Grid container spacing={3}>
            {members.map((member) => {
              const name = getMemberName(member);
              const initial = name.charAt(0).toUpperCase() || "?";
              const isCurrent = member.uid && member.uid === userUid;
              return (
                <Grid item xs={12} md={6} key={member.id}>
                  <Paper sx={{ p: 2 }}>
                    <Stack direction="row" spacing={2} alignItems="center">
                      <Avatar>{initial}</Avatar>
                      <Box flexGrow={1}>
                        <Typography variant="h6">
                          {name}
                          {isCurrent && " (Du)"}
                        </Typography>
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
                          <Button size="small" startIcon={<EditIcon />} onClick={() => openRoleDialog(member)}>
                            Rolle zuweisen
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            startIcon={<DeleteIcon />}
                            onClick={() => openRemoveDialog(member)}
                          >
                            Entfernen
                          </Button>
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
        </>
      )}

      <Dialog open={roleDialog.open} onClose={closeDialogs} fullWidth maxWidth="xs">
        <DialogTitle>Rolle zuweisen</DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Rolle für {roleDialog.member ? getMemberName(roleDialog.member) : "Mitglied"} wählen.
          </Typography>
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel id="role-select-label">Rolle</InputLabel>
            <Select
              labelId="role-select-label"
              label="Rolle"
              value={roleDialog.role}
              onChange={(event: SelectChangeEvent<string>) =>
                setRoleDialog((current) => ({ ...current, role: event.target.value }))
              }
            >
              <MenuItem value="mitglied">Mitglied</MenuItem>
              <MenuItem value="kassierer">Kassierer</MenuItem>
              <MenuItem value="moderator">Moderator</MenuItem>
            </Select>
          </FormControl>
          <TextField
            label="Notiz"
            fullWidth
            multiline
            minRows={2}
            sx={{ mt: 2 }}
            placeholder="Interne Notiz zur Rollenvergabe"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Abbrechen</Button>
          <Button onClick={submitRoleChange} variant="contained">
            Speichern
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={removeDialog.open} onClose={closeDialogs} fullWidth maxWidth="xs">
        <DialogTitle>Mitglied entfernen</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            Möchtest du {removeDialog.member ? getMemberName(removeDialog.member) : "dieses Mitglied"} aus der Jamiah entfernen?
            Diese Aktion benötigt noch eine Backend-Integration.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={closeDialogs}>Abbrechen</Button>
          <Button onClick={submitRemoval} variant="contained" color="error">
            Entfernen
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={feedback.open}
        autoHideDuration={4000}
        onClose={() => setFeedback((current) => ({ ...current, open: false }))}
      >
        <Alert
          severity={feedback.severity}
          onClose={() => setFeedback((current) => ({ ...current, open: false }))}
          sx={{ width: "100%" }}
        >
          {feedback.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};


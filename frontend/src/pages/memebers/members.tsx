
import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
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
  IconButton
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/PersonRemove';
import ChatIcon from '@mui/icons-material/Chat';
import { API_BASE_URL } from '../../constants/api';

interface Member {
  id: number;
  username: string;
  firstName?: string;
  lastName?: string;
}

export const Members = () => {
  const { groupId } = useParams();
  const [isAdminView, setIsAdminView] = useState(true);
  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    if (!groupId) return;
    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}/members`)
      .then(res => res.json())
      .then(setMembers)
      .catch(() => setMembers([]));
  }, [groupId]);

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Mitgliederbereich</Typography>
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
            {members.map(member => {
              const name = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim() || member.username;
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
                          <Button size="small" startIcon={<EditIcon />}>Bearbeiten</Button>
                          <Button size="small" color="error" startIcon={<DeleteIcon />}>Entfernen</Button>
                        </Stack>
                      ) : (
                        <IconButton aria-label="Chat" color="primary">
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

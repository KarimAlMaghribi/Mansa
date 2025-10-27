import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Button,
  Divider,
  Stack,
  IconButton,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import { useAuth } from '../../context/AuthContext';
import { useJamiahContext } from '../../context/JamiahContext';

export const Documents = () => {
  const { user } = useAuth();
  const { jamiah, members, roles, currentUid } = useJamiahContext();
  const isAdmin = React.useMemo(() => {
    if (roles.isOwner) {
      return true;
    }
    if (!jamiah?.ownerId) {
      return false;
    }
    const uidToCheck = currentUid ?? user?.uid;
    return Boolean(uidToCheck && jamiah.ownerId === uidToCheck);
  }, [roles.isOwner, jamiah?.ownerId, currentUid, user?.uid]);

  const allDocuments = [
    { name: 'Satzung Jamiah Berlin.pdf', owner: 'Admin', date: '01.01.2025' },
    { name: 'Beitragsquittung_Mai.pdf', owner: 'Amina Yusuf', date: '03.05.2025' },
    { name: 'Protokoll März.pdf', owner: 'Admin', date: '15.03.2025' },
  ];

  const currentMemberName = React.useMemo(() => {
    const uidToMatch = currentUid ?? user?.uid;
    if (!uidToMatch) {
      return user?.displayName || user?.email || 'Amina Yusuf';
    }

    const member = members.find((m) => m.uid === uidToMatch);
    if (!member) {
      return user?.displayName || user?.email || 'Amina Yusuf';
    }

    const fullName = `${member.firstName ?? ''} ${member.lastName ?? ''}`.trim();
    if (fullName) {
      return fullName;
    }

    return member.username || member.uid || user?.displayName || user?.email || 'Amina Yusuf';
  }, [currentUid, members, user?.displayName, user?.email, user?.uid]);

  const visibleDocs = isAdmin
      ? allDocuments
      : allDocuments.filter((doc) => doc.owner === 'Admin' || doc.owner === currentMemberName);

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Dokumente</Typography>
          <Typography variant="body1" color="text.secondary">
            {isAdmin ? 'Admin-Ansicht' : 'Mitgliedsansicht'}
          </Typography>
        </Box>

        {isAdmin && (
            <Box mb={3}>
              <Button variant="contained" startIcon={<UploadFileIcon />}>
                Dokument hochladen
              </Button>
            </Box>
        )}

        <Paper sx={{ p: 2 }}>
          <List>
            {visibleDocs.map((doc, i) => (
                <React.Fragment key={i}>
                  <ListItem
                      secondaryAction={
                        <Stack direction="row" spacing={1}>
                          <IconButton edge="end">
                            <DownloadIcon />
                          </IconButton>
                          {isAdmin && (
                              <IconButton edge="end" color="error">
                                <DeleteIcon />
                              </IconButton>
                          )}
                        </Stack>
                      }
                  >
                    <ListItemText
                        primary={doc.name}
                        secondary={`Hochgeladen am ${doc.date} ${isAdmin ? `| Eigentümer: ${doc.owner}` : ''}`}
                    />
                  </ListItem>
                  {i < visibleDocs.length - 1 && <Divider />}
                </React.Fragment>
            ))}
          </List>
        </Paper>
      </Box>
  );
};

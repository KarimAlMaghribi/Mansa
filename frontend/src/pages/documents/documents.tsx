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
import { useParams } from 'react-router-dom';
import { API_BASE_URL } from '../../constants/api';
import { useAuth } from '../../context/AuthContext';

export const Documents = () => {
  const [isAdmin, setIsAdmin] = React.useState(false);
  const { groupId } = useParams();
  const { user } = useAuth();
  const userUid = user?.uid;

  React.useEffect(() => {
    if (!groupId || !userUid) {
      setIsAdmin(false);
      return;
    }

    fetch(`${API_BASE_URL}/api/jamiahs/${groupId}`)
      .then((res) => res.json())
      .then((jamiah) => {
        setIsAdmin(jamiah.ownerId === userUid);
      })
      .catch(() => setIsAdmin(false));
  }, [groupId, userUid]);

  const allDocuments = [
    { name: 'Satzung Jamiah Berlin.pdf', owner: 'Admin', date: '01.01.2025' },
    { name: 'Beitragsquittung_Mai.pdf', owner: 'Amina Yusuf', date: '03.05.2025' },
    { name: 'Protokoll März.pdf', owner: 'Admin', date: '15.03.2025' },
  ];

  const memberName = user?.displayName || user?.email || 'Amina Yusuf';

  const visibleDocs = isAdmin
      ? allDocuments
      : allDocuments.filter(doc => doc.owner === 'Admin' || doc.owner === memberName);

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

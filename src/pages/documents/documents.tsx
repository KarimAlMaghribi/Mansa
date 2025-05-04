import React from 'react';
import {
  Box, Typography, Paper, List, ListItem, ListItemText, Button, Divider, Stack,
  Switch, FormControlLabel, IconButton
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';

export const Documents = () => {
  const [isAdminView, setIsAdminView] = React.useState(true);

  const allDocuments = [
    { name: 'Satzung Jamiah Berlin.pdf', owner: 'Admin', date: '01.01.2025' },
    { name: 'Beitragsquittung_Mai.pdf', owner: 'Amina Yusuf', date: '03.05.2025' },
    { name: 'Protokoll März.pdf', owner: 'Admin', date: '15.03.2025' },
  ];

  const memberName = 'Amina Yusuf';

  const visibleDocs = isAdminView
      ? allDocuments
      : allDocuments.filter(doc => doc.owner === 'Admin' || doc.owner === memberName);

  return (
      <Box p={4}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography variant="h4" fontWeight="bold">Dokumente</Typography>
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

        {isAdminView && (
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
                          {isAdminView && (
                              <IconButton edge="end" color="error">
                                <DeleteIcon />
                              </IconButton>
                          )}
                        </Stack>
                      }
                  >
                    <ListItemText
                        primary={doc.name}
                        secondary={`Hochgeladen am ${doc.date} ${isAdminView ? `| Eigentümer: ${doc.owner}` : ''}`}
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

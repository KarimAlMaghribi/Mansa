import React from 'react';
import { Box, Typography, Divider, Paper, Grid, Avatar, useTheme } from '@mui/material';
import GroupsIcon from '@mui/icons-material/Groups';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import SecurityIcon from '@mui/icons-material/Security';

export const About = () => {
  const theme = useTheme();

  return (
      <Box p={{ xs: 2, md: 6 }}>
        <Typography variant="h3" fontWeight="bold" gutterBottom sx={{ color: theme.palette.primary.main }}>
          Über Jamiah
        </Typography>

        <Typography variant="body1" fontSize={18} gutterBottom sx={{ maxWidth: '800px' }}>
          Jamiah ist die digitale Plattform für muslimische Gemeinschaften, die Organisation, Finanzen und Kommunikation
          intelligent vereint. Egal ob Moschee-Verein, Spenden-Initiative oder Nachbarschafts-Jamiah –
          wir digitalisieren den Zusammenhalt.
        </Typography>

        <Divider sx={{ my: 4 }} />

        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }} elevation={2}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, margin: '0 auto', mb: 2 }}>
                <EmojiObjectsIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">Unsere Mission</Typography>
              <Typography variant="body2" mt={1}>
                Jamiah bringt Struktur, Transparenz und Effizienz in deine Gemeinschaft – mit Fokus auf Usability und Vertrauen.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }} elevation={2}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, margin: '0 auto', mb: 2 }}>
                <GroupsIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">Für Gemeinschaften</Typography>
              <Typography variant="body2" mt={1}>
                Ob Beiträge, Abstimmungen oder Dokumente – alles an einem Ort, für Mitglieder und Admins zugleich.
              </Typography>
            </Paper>
          </Grid>

          <Grid item xs={12} md={4}>
            <Paper sx={{ p: 3, textAlign: 'center', height: '100%' }} elevation={2}>
              <Avatar sx={{ bgcolor: theme.palette.primary.main, margin: '0 auto', mb: 2 }}>
                <SecurityIcon />
              </Avatar>
              <Typography variant="h6" fontWeight="bold">Sicher & DSGVO-konform</Typography>
              <Typography variant="body2" mt={1}>
                Deine Daten gehören dir. Jamiah schützt Informationen nach höchsten Sicherheitsstandards.
              </Typography>
            </Paper>
          </Grid>
        </Grid>

        <Box mt={6}>
          <Typography variant="h5" fontWeight="bold" gutterBottom>
            Kontakt & Kooperation
          </Typography>
          <Typography variant="body1" sx={{ maxWidth: '700px' }}>
            Du möchtest Jamiah in deiner Gemeinde einsetzen, Feedback geben oder mitentwickeln?
            Wir freuen uns über deine Nachricht.
          </Typography>
        </Box>
      </Box>
  );
};

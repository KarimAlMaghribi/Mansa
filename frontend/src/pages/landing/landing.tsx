import React, { useEffect, useState } from "react";
import {
  Typography,
  Button,
  Container,
  Grid,
  Card,
  CardContent,
  Box,
  Paper,
  useTheme,
  Fade
} from "@mui/material";
import CurvyLines from "../../assests/imgs/appCurvyLines.png";
import contracts from "../../assests/imgs/commercial/running_contracts.jpg";
import happyUsers from "../../assests/imgs/commercial/users-min.jpg";
import secured from "../../assests/imgs/commercial/secured.jpg";
import { FAQs } from "../../components/landing/faqs";

export const Landing = () => {
  const theme = useTheme();
  const [showHeroText, setShowHeroText] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowHeroText(true);
    }, 3000);
    return () => clearTimeout(timer);
  }, []);

  return (
      <>
        {/* HERO VIDEO */}
        <Box sx={{ position: "relative", height: { xs: "60vh", md: "85vh" }, overflow: "hidden" }}>
          <video
              src="/cover.mp4"
              autoPlay
              muted
              playsInline
              preload="auto"
              loop
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block"
              }}
          />
          {showHeroText && (
              <Fade in={true} timeout={1000}>
                <Box
                    sx={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "100%",
                      height: "100%",
                      color: "white",
                      px: 2,
                      display: "flex",
                      flexDirection: "column",
                      justifyContent: "center",
                      alignItems: "center",
                      textAlign: "center",
                      background: "rgba(0,0,0,0.4)",
                      textShadow: "1px 1px 4px rgba(0,0,0,0.7)"
                    }}
                >
                  <Typography variant="h3" fontWeight="bold" gutterBottom>
                    Jamiah – Die digitale Gemeinschaft
                  </Typography>
                  <Typography variant="h5" maxWidth="600px">
                    Gemeinsam. Transparent. Digital. – Deine Jamiah mit einem Klick organisiert.
                  </Typography>
                  <Box mt={4}>
                    <Button variant="contained" size="large" color="primary">
                      Jetzt starten
                    </Button>
                  </Box>
                </Box>
              </Fade>
          )}
        </Box>

        {/* PROBLEM / LÖSUNG */}
        <Container maxWidth="md" sx={{ py: 10 }}>
          <Typography variant="h4" gutterBottom color="primary.main">
            Warum Jamiah?
          </Typography>
          <Typography variant="body1" sx={{ fontSize: "1.1rem" }}>
            Papierformulare, manuelle Buchhaltung und fehlende Transparenz sind Vergangenheit.
          </Typography>
          <Typography variant="body1" sx={{ mt: 2, fontSize: "1.1rem" }}>
            Mit <strong>Jamiah</strong> digitalisierst du deine Gemeinschaft: Mitgliederverwaltung, Beiträge,
            Abstimmungen und Kommunikation – alles in einer Plattform.
          </Typography>
        </Container>

        {/* FEATURES */}
        <Box sx={{ background: theme.palette.background.default, py: 10 }}>
          <Container maxWidth="lg">
            <Typography variant="h4" align="center" gutterBottom color="primary.main">
              Funktionen, die begeistern
            </Typography>
            <Grid container spacing={4} mt={2}>
              {[
                { title: "Mitgliederverwaltung", text: "Einladungen, Rollen & Gruppen smart organisieren." },
                { title: "Finanzen im Griff", text: "Übersicht über Beiträge & Ausgaben deiner Jamiah." },
                { title: "Gemeinsam entscheiden", text: "Abstimmungen & Umfragen, direkt in der App." },
              ].map((feature, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card elevation={4} sx={{ height: "100%", p: 2 }}>
                      <CardContent>
                        <Typography variant="h6" gutterBottom color="secondary.main">
                          {feature.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {feature.text}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* STATISTIKEN */}
        <Box sx={{ py: 12, background: "#F9F9F6", position: "relative" }}>
          <Container>
            <Box component="img" src={CurvyLines} sx={{ position: 'absolute', top: -180, pointerEvents: 'none' }} />
            <Typography variant="h4" align="center" gutterBottom color="primary.main">
              Unsere Community wächst
            </Typography>
            <Grid container spacing={4} mt={4}>
              {[
                { img: happyUsers, title: "Aktive Mitglieder", value: "120+" },
                { img: secured, title: "Beitragsvolumen / Monat", value: "50.000 €" },
                { img: contracts, title: "Organisierte Jamiahs", value: "34" },
              ].map((stat, index) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Paper elevation={2} sx={{ textAlign: "center", p: 4 }}>
                      <Box component="img" src={stat.img} alt={stat.title} sx={{ height: 140, borderRadius: 2 }} />
                      <Typography variant="h6" mt={3}>{stat.title}</Typography>
                      <Typography variant="h4" fontWeight="bold" color="primary.main">{stat.value}</Typography>
                    </Paper>
                  </Grid>
              ))}
            </Grid>
          </Container>
        </Box>

        {/* FAQ */}
        <FAQs jamiahMode={true} />

        {/* CTA */}
        <Box sx={{ py: 10, textAlign: "center", bgcolor: theme.palette.background.default }}>
          <Typography variant="h5" gutterBottom>
            Bereit, deine Jamiah zu digitalisieren?
          </Typography>
          <Button variant="contained" size="large" color="primary">
            Kostenlos ausprobieren
          </Button>
        </Box>
      </>
  );
};

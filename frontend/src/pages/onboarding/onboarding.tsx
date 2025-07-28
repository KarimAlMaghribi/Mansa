import React from 'react';
import {
  Box, Typography, Stepper, Step, StepLabel, Button, Paper, Stack
} from '@mui/material';

const steps = [
  'Profil vervollständigen',
  'Jamiah beitreten oder gründen',
  'Beitragseinstellungen prüfen',
  'Erste Abstimmung ansehen',
  'Dokumente abrufen'
];

export const Onboarding = () => {
  const [activeStep, setActiveStep] = React.useState(0);

  const handleNext = () => {
    if (activeStep < steps.length - 1) {
      setActiveStep(prev => prev + 1);
    } else {
      alert('Willkommen bei Mansa! 🎉');
    }
  };

  return (
      <Box p={4}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Willkommen bei Mansa 👋
        </Typography>

        <Paper sx={{ p: 3, mt: 2 }}>
          <Typography variant="body1" gutterBottom>
            Um die Plattform voll nutzen zu können, folge diesen Schritten:
          </Typography>

          <Stepper activeStep={activeStep} orientation="vertical">
            {steps.map((label, index) => (
                <Step key={label}>
                  <StepLabel>{label}</StepLabel>
                </Step>
            ))}
          </Stepper>

          <Stack direction="row" justifyContent="flex-end" mt={4}>
            <Button variant="contained" onClick={handleNext}>
              {activeStep === steps.length - 1 ? 'Fertig' : 'Weiter'}
            </Button>
          </Stack>
        </Paper>
      </Box>
  );
};

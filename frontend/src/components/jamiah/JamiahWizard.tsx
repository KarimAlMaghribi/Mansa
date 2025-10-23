import React, { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Divider,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import { Jamiah } from '../../models/Jamiah';

export interface JamiahWizardProps {
  initialValue: Partial<Jamiah>;
  submitLabel: string;
  onSubmit: (data: Partial<Jamiah>) => Promise<Partial<Jamiah> | void> | Partial<Jamiah> | void;
  onCancel?: () => void;
  submitting?: boolean;
  submitDisabled?: boolean;
  submitDisabledMessage?: string;
  renderSummaryExtras?: (data: Partial<Jamiah>) => React.ReactNode;
}

const steps = ['Stammdaten', 'Beiträge', 'Mitgliedergrenzen', 'Zusammenfassung'];

type FieldErrorMap = Partial<Record<keyof Jamiah | 'global', string>>;

const normalizeInitialValue = (value: Partial<Jamiah>): Partial<Jamiah> => ({
  rateInterval: 'MONTHLY',
  isPublic: false,
  ...value,
  startDate: value.startDate ? value.startDate.substring(0, 10) : undefined,
});

export const JamiahWizard: React.FC<JamiahWizardProps> = ({
  initialValue,
  submitLabel,
  onSubmit,
  onCancel,
  submitting = false,
  submitDisabled = false,
  submitDisabledMessage,
  renderSummaryExtras,
}) => {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState<Partial<Jamiah>>(() => normalizeInitialValue(initialValue));
  const [errors, setErrors] = useState<FieldErrorMap>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    setFormData(normalizeInitialValue(initialValue));
    setActiveStep(0);
    setErrors({});
    setSubmitError(null);
  }, [initialValue]);

  const currentStepTitle = useMemo(() => steps[activeStep] ?? steps[0], [activeStep]);

  const updateField = <K extends keyof Jamiah>(field: K, value: Jamiah[K] | undefined) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateStep = (stepIndex: number): boolean => {
    const newErrors: FieldErrorMap = {};
    const stepFields: (keyof FieldErrorMap)[] = [];

    if (stepIndex === 0) {
      stepFields.push('name');
      if (!formData.name || formData.name.trim().length === 0) {
        newErrors.name = 'Name ist erforderlich';
      }
    }

    if (stepIndex === 1) {
      stepFields.push('rateAmount', 'rateInterval', 'cycleCount');
      if (formData.rateAmount === undefined || Number(formData.rateAmount) <= 0) {
        newErrors.rateAmount = 'Beitrag muss größer als 0 sein';
      }
      if (!formData.rateInterval) {
        newErrors.rateInterval = 'Rhythmus auswählen';
      }
      if (formData.cycleCount === undefined || Number(formData.cycleCount) < 1) {
        newErrors.cycleCount = 'Mindestens ein Zyklus';
      }
    }

    if (stepIndex === 2) {
      stepFields.push('maxGroupSize');
      if (formData.maxGroupSize !== undefined && Number(formData.maxGroupSize) < 2) {
        newErrors.maxGroupSize = 'Mindestens zwei Mitglieder erforderlich';
      }
    }

    setErrors(prev => {
      const updated = { ...prev };
      stepFields.forEach(field => {
        delete updated[field];
      });
      return { ...updated, ...newErrors };
    });
    return Object.keys(newErrors).length === 0;
  };

  const validateAll = () => {
    for (let index = 0; index < steps.length - 1; index += 1) {
      if (!validateStep(index)) {
        setActiveStep(index);
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setErrors({});
      setActiveStep(prev => Math.min(prev + 1, steps.length - 1));
    }
  };

  const handleBack = () => {
    setErrors({});
    setActiveStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!validateAll()) {
      return;
    }
    setSubmitError(null);
    if (submitDisabled) {
      return;
    }
    try {
      const result = await onSubmit(formData);
      if (result) {
        setFormData(normalizeInitialValue(result));
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Speichern fehlgeschlagen';
      setSubmitError(message);
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <Stack spacing={2}>
            <TextField
              label="Name der Jamiah"
              fullWidth
              required
              value={formData.name ?? ''}
              error={Boolean(errors.name)}
              helperText={errors.name ?? ''}
              onChange={e => updateField('name', e.target.value)}
            />
            <TextField
              label="Beschreibung"
              fullWidth
              multiline
              minRows={3}
              value={formData.description ?? ''}
              onChange={e => updateField('description', e.target.value)}
            />
            <TextField
              select
              label="Sichtbarkeit"
              value={formData.isPublic ? 'public' : 'private'}
              onChange={e => updateField('isPublic', e.target.value === 'public')}
            >
              <MenuItem value="private">Privat (nur mit Einladung)</MenuItem>
              <MenuItem value="public">Öffentlich (sichtbar für alle)</MenuItem>
            </TextField>
          </Stack>
        );
      case 1:
        return (
          <Stack spacing={2}>
            <TextField
              label="Beitragshöhe (€)"
              type="number"
              value={formData.rateAmount ?? ''}
              onChange={e => updateField('rateAmount', e.target.value === '' ? undefined : Number(e.target.value))}
              error={Boolean(errors.rateAmount)}
              helperText={errors.rateAmount ?? ''}
              inputProps={{ min: 1 }}
            />
            <TextField
              select
              label="Rhythmus"
              value={formData.rateInterval ?? 'MONTHLY'}
              onChange={e => updateField('rateInterval', e.target.value as 'WEEKLY' | 'MONTHLY')}
              error={Boolean(errors.rateInterval)}
              helperText={errors.rateInterval ?? ''}
            >
              <MenuItem value="MONTHLY">Monatlich</MenuItem>
              <MenuItem value="WEEKLY">Wöchentlich</MenuItem>
            </TextField>
            <TextField
              label="Anzahl Zyklen"
              type="number"
              value={formData.cycleCount ?? ''}
              onChange={e => updateField('cycleCount', e.target.value === '' ? undefined : Number(e.target.value))}
              error={Boolean(errors.cycleCount)}
              helperText={errors.cycleCount ?? ''}
              inputProps={{ min: 1 }}
            />
          </Stack>
        );
      case 2:
        return (
          <Stack spacing={2}>
            <TextField
              label="Maximale Mitgliederzahl"
              type="number"
              value={formData.maxGroupSize ?? ''}
              onChange={e => updateField('maxGroupSize', e.target.value === '' ? undefined : Number(e.target.value))}
              error={Boolean(errors.maxGroupSize)}
              helperText={errors.maxGroupSize ?? ''}
              inputProps={{ min: 2 }}
            />
            <TextField
              label="Geplanter Start"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={formData.startDate ?? ''}
              onChange={e => updateField('startDate', e.target.value)}
            />
          </Stack>
        );
      case 3:
      default:
        return (
          <Box>
            <Typography variant="subtitle1" gutterBottom>
              Zusammenfassung
            </Typography>
            <Paper variant="outlined" sx={{ p: 2 }}>
              <List dense>
                <ListItem>
                  <ListItemText primary="Name" secondary={formData.name || 'Nicht gesetzt'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Beschreibung" secondary={formData.description || 'Keine Beschreibung'} />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Sichtbarkeit"
                    secondary={formData.isPublic ? 'Öffentlich' : 'Privat'}
                  />
                </ListItem>
                <Divider component="li" sx={{ my: 1 }} />
                <ListItem>
                  <ListItemText
                    primary="Beitragshöhe"
                    secondary={formData.rateAmount ? `${formData.rateAmount} €` : 'Nicht gesetzt'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Rhythmus"
                    secondary={formData.rateInterval === 'WEEKLY' ? 'Wöchentlich' : 'Monatlich'}
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Zyklen"
                    secondary={formData.cycleCount ? `${formData.cycleCount}` : 'Nicht gesetzt'}
                  />
                </ListItem>
                <Divider component="li" sx={{ my: 1 }} />
                <ListItem>
                  <ListItemText
                    primary="Maximale Mitgliederzahl"
                    secondary={
                      formData.maxGroupSize ? `${formData.maxGroupSize}` : 'Keine Begrenzung'
                    }
                  />
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Geplanter Start"
                    secondary={formData.startDate ? formData.startDate : 'Noch nicht geplant'}
                  />
                </ListItem>
              </List>
            </Paper>
            {renderSummaryExtras && (
              <Box mt={3}>{renderSummaryExtras(formData)}</Box>
            )}
          </Box>
        );
    }
  };

  return (
    <Box>
      <Typography variant="h6" gutterBottom>
        {currentStepTitle}
      </Typography>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
        {steps.map(label => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Box>{renderStepContent()}</Box>

      {submitDisabled && submitDisabledMessage && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {submitDisabledMessage}
        </Alert>
      )}

      {submitError && (
        <Alert severity="error" sx={{ mt: 3 }}>
          {submitError}
        </Alert>
      )}

      <Stack direction="row" justifyContent="space-between" spacing={2} sx={{ mt: 4 }}>
        <Stack direction="row" spacing={2}>
          {onCancel && (
            <Button variant="text" onClick={onCancel} disabled={submitting}>
              Abbrechen
            </Button>
          )}
          <Button variant="outlined" onClick={handleBack} disabled={activeStep === 0 || submitting}>
            Zurück
          </Button>
        </Stack>
        {activeStep < steps.length - 1 ? (
          <Button variant="contained" onClick={handleNext} disabled={submitting}>
            Weiter
          </Button>
        ) : (
          <Button variant="contained" onClick={handleSubmit} disabled={submitting || submitDisabled}>
            {submitLabel}
          </Button>
        )}
      </Stack>
    </Box>
  );
};

export default JamiahWizard;

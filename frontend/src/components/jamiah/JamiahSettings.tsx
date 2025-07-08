import React, { useState } from 'react';
import { Box, Paper, Typography, TextField, MenuItem, Button } from '@mui/material';
import { Jamiah } from '../../models/Jamiah';
import { PermissionKeyEnum } from '../../enums/PermissionKey.enum';
import { Can } from '../permissions/Can';

interface JamiahSettingsProps {
  jamiah: Jamiah;
  onSave?: (updated: Jamiah) => void;
}

export const JamiahSettings: React.FC<JamiahSettingsProps> = ({ jamiah, onSave }) => {
  const [cycleCount, setCycleCount] = useState<number>(jamiah.cycleCount ?? 1);
  const [rateAmount, setRateAmount] = useState<number>(jamiah.rateAmount ?? 0);
  const [rateInterval, setRateInterval] = useState<'WEEKLY' | 'MONTHLY'>(jamiah.rateInterval ?? 'MONTHLY');

  const handleSave = () => {
    const updated: Jamiah = { ...jamiah, cycleCount, rateAmount, rateInterval };
    onSave?.(updated);
  };

  return (
    <Can permission={PermissionKeyEnum.EDIT_GROUP}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Jamiah Einstellungen
        </Typography>
        <Box display="flex" flexDirection="column" gap={2}>
          <TextField
            label="Anzahl Zyklen"
            type="number"
            value={cycleCount}
            inputProps={{ min: 1 }}
            onChange={e => setCycleCount(Number(e.target.value))}
          />
          <TextField
            label="Beitragsbetrag (€)"
            type="number"
            value={rateAmount}
            inputProps={{ min: 0 }}
            onChange={e => setRateAmount(Number(e.target.value))}
          />
          <TextField
            select
            label="Rhythmus"
            value={rateInterval}
            onChange={e => setRateInterval(e.target.value as 'WEEKLY' | 'MONTHLY')}
          >
            <MenuItem value="MONTHLY">Monatlich</MenuItem>
            <MenuItem value="WEEKLY">Wöchentlich</MenuItem>
          </TextField>
          <Button variant="contained" onClick={handleSave} sx={{ alignSelf: 'flex-start' }}>
            Speichern
          </Button>
        </Box>
      </Paper>
    </Can>
  );
};

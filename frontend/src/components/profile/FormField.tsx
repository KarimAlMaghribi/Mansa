import React from 'react';
import { TextField, MenuItem, TextFieldProps } from '@mui/material';
import { Control, useController } from 'react-hook-form';

interface Option { value: string; label: string }

type FormFieldProps = TextFieldProps & {
  name: string;
  label: string;
  control: Control<any>;
  options?: Option[];
}

export const FormField = ({ name, label, control, options, ...rest }: FormFieldProps) => {
  const {
    field,
    fieldState: { error }
  } = useController({ name, control });

  return (
    <TextField
      {...field}
      {...rest}
      fullWidth
      label={label}
      select={!!options}
      error={!!error}
      helperText={error ? error.message : ' '}
    >
      {options?.map(opt => (
        <MenuItem key={opt.value} value={opt.value}>
          {opt.label}
        </MenuItem>
      ))}
    </TextField>
  );
};

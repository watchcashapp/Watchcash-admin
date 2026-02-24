"use client";

import React, { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  label: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ 
    label, 
    error = false, 
    helperText, 
    fullWidth = true, 
    size = 'small',
    sx,
    ...props 
  }, ref) => {
    return (
      <TextField
        ref={ref}
        label={label}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        size={size}
        variant="outlined"
        sx={{
          '& .MuiInputBase-input': {
            padding: '8px 12px',
            height: '20px',
          },
          '& .MuiInputLabel-root': {
            fontSize: '14px',
          },
          ...sx
        }}
        {...props}
      />
    );
  }
);

Input.displayName = 'Input';

export default Input;

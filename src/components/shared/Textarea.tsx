"use client";

import React, { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export interface TextareaProps extends Omit<TextFieldProps, 'variant' | 'multiline'> {
  rows?: number;
  error?: boolean;
  helperText?: string;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ rows = 4, error = false, helperText, ...props }, ref) => {
    return (
      <TextField
        {...props}
        inputRef={ref}
        multiline
        rows={rows}
        variant="outlined"
        error={error}
        helperText={helperText}
        sx={{
          '& .MuiInputLabel-root': {
            color: 'text.secondary',
            fontSize: '0.875rem',
            transform: 'translate(20px, -8px) scale(0.8)',
            fontWeight: 500,
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            padding: '0 4px',
            borderRadius: '4px',
          },
          '& .MuiInputBase-input': {
            fontSize: '0.75rem',
            lineHeight: 1.5,
          },
          '& .MuiFormLabel-asterisk': {
            color: 'error.main',
          },
          '& .MuiOutlinedInput-root': {
            marginTop: '4px',
          },
          ...props.sx,
        }}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

"use client";

import React, { forwardRef } from 'react';
import { TextField, TextFieldProps } from '@mui/material';

export interface TextareaProps extends Omit<TextFieldProps, 'variant' | 'multiline'> {
  rows?: number;
  error?: boolean;
  helperText?: string;
  maxLength?: number;
  showCount?: boolean;
}

const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ rows = 4, error = false, helperText, maxLength, showCount, onChange, value, ...props }, ref) => {
    const handleInternalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;

      let val = e.target.value;

      // Enforce maxLength
      if (maxLength !== undefined && val.length > maxLength) {
        val = val.substring(0, maxLength);
      }

      // Create a new event-like object to pass to the parent
      const newEvent = {
        ...e,
        target: {
          ...e.target,
          name: props.name || '',
          value: val
        }
      } as React.ChangeEvent<HTMLInputElement>;
      
      onChange(newEvent as any);
    };

    const charCount = typeof value === 'string' ? value.length : 0;
    const countDisplay = showCount && maxLength ? `${charCount}/${maxLength}` : undefined;
    const finalHelperText = helperText || countDisplay;

    return (
      <TextField
        {...props}
        inputRef={ref}
        multiline
        rows={rows}
        variant="outlined"
        error={error}
        helperText={finalHelperText}
        value={value}
        onChange={handleInternalChange}
        slotProps={{
          htmlInput: {
            maxLength: maxLength,
          },
        }}
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
          '& .MuiFormHelperText-root': {
            display: 'flex',
            justifyContent: countDisplay && !helperText ? 'flex-end' : 'space-between',
            margin: '4px 0 0',
          },
          ...props.sx,
        }}
      />
    );
  }
);

Textarea.displayName = 'Textarea';

export default Textarea;

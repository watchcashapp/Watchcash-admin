"use client";

import React, { forwardRef, useState } from 'react';
import { TextField, TextFieldProps, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

export interface InputProps extends Omit<TextFieldProps, 'variant'> {
  label?: string;
  error?: boolean;
  helperText?: string;
  fullWidth?: boolean;
  size?: 'small' | 'medium';
  preventLeadingZeros?: boolean;
  preventNegative?: boolean;
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({
    label,
    error = false,
    helperText,
    fullWidth = true,
    size = 'small',
    type,
    sx,
    preventLeadingZeros = true,
    preventNegative = true,
    onChange,
    ...props
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const [mounted, setMounted] = useState(false);
    const isPasswordField = type === 'password';

    React.useEffect(() => {
      setMounted(true);
    }, []);

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (type === 'number' && preventNegative && (e.key === '-' || e.key === 'e' || e.key === 'E')) {
        e.preventDefault();
      }
      if (props.onKeyDown) props.onKeyDown(e);
    };

    const handleInternalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!onChange) return;

      if (type === 'number') {
        let val = e.target.value;
        
        // Prevent negative values
        if (preventNegative && val.startsWith('-')) {
          val = val.replace('-', '');
        }

        // Prevent leading zeros (but allow "0" and "0.something")
        if (preventLeadingZeros && val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
          val = val.replace(/^0+/, '');
          if (val === '') val = '0';
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
        
        onChange(newEvent);
      } else {
        onChange(e);
      }
    };

    return (
      <TextField
        ref={ref}
        label={label}
        error={error}
        helperText={helperText}
        fullWidth={fullWidth}
        size={size}
        variant="outlined"
        type={isPasswordField && mounted && showPassword ? 'text' : type}
        onChange={handleInternalChange}
        onKeyDown={handleKeyDown}
        suppressHydrationWarning
        slotProps={{
          input: {
            suppressHydrationWarning: true,
            endAdornment: isPasswordField && mounted ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePassword}
                  edge="end"
                  size="small"
                  sx={{ mr: -0.5 }}
                >
                  {showPassword ? <Visibility fontSize="small" /> : <VisibilityOff fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ) : undefined,
          },
          htmlInput: {
            suppressHydrationWarning: true,
          },
        }}
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

export default React.memo(Input);

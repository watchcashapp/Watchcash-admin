"use client";

import React, { forwardRef, useState } from 'react';
import { TextField, TextFieldProps, IconButton, InputAdornment } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

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
    type,
    sx,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const isPasswordField = type === 'password';

    const handleTogglePassword = () => {
      setShowPassword(!showPassword);
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
        type={isPasswordField && showPassword ? 'text' : type}
        slotProps={{
          input: {
            endAdornment: isPasswordField ? (
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleTogglePassword}
                  edge="end"
                  size="small"
                  sx={{ mr: -0.5 }}
                >
                  {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                </IconButton>
              </InputAdornment>
            ) : undefined,
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

export default Input;

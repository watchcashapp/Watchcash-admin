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
    const [mounted, setMounted] = useState(false);
    const isPasswordField = type === 'password';

    React.useEffect(() => {
      setMounted(true);
    }, []);

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
        type={isPasswordField && mounted && showPassword ? 'text' : type}
        suppressHydrationWarning
        slotProps={{
          input: {
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

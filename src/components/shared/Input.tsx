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
  maxLength?: number;
  showCount?: boolean;
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
    maxLength,
    showCount,
    onChange,
    value,
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

      let val = e.target.value;

      // Enforce maxLength
      if (maxLength !== undefined && val.length > maxLength) {
        val = val.substring(0, maxLength);
      }

      if (type === 'number') {
        // Prevent negative values
        if (preventNegative && val.startsWith('-')) {
          val = val.replace('-', '');
        }

        // Prevent leading zeros (but allow "0" and "0.something")
        if (preventLeadingZeros && val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
          val = val.replace(/^0+/, '');
          if (val === '') val = '0';
        }
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
    };

    const charCount = typeof value === 'string' ? value.length : 0;
    const countDisplay = showCount && maxLength ? `${charCount}/${maxLength}` : undefined;
    const finalHelperText = helperText || countDisplay;

    return (
      <TextField
        ref={ref}
        label={label}
        error={error}
        helperText={finalHelperText}
        fullWidth={fullWidth}
        size={size}
        variant="outlined"
        value={value}
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
            maxLength: maxLength,
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
          '& .MuiFormHelperText-root': {
            display: 'flex',
            justifyContent: countDisplay && !helperText ? 'flex-end' : 'space-between',
            margin: '4px 0 0',
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

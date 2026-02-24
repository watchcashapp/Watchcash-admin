"use client";

import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { CircularProgress } from '@mui/material';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'contained' | 'outlined' | 'text';
  loading?: boolean;
  fullWidth?: boolean;
  size?: 'small' | 'medium' | 'large';
  children: React.ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    variant = 'contained',
    loading = false,
    disabled,
    children,
    size = 'medium',
    fullWidth = false,
    sx,
    ...props 
  }, ref) => {
    return (
      <MuiButton
        ref={ref}
        variant={variant}
        disabled={disabled || loading}
        size={size}
        fullWidth={fullWidth}
        sx={{
          minHeight: '40px',
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 500,
          ...sx
        }}
        {...props}
      >
        {loading ? (
          <CircularProgress size={20} color="inherit" />
        ) : (
          children
        )}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export default Button;

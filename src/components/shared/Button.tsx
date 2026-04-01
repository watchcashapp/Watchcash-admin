"use client";

import React, { forwardRef } from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import { CircularProgress, Box } from '@mui/material';

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
        suppressHydrationWarning
        sx={{
          minHeight: '40px',
          textTransform: 'none',
          fontSize: '14px',
          fontWeight: 500,
          position: 'relative',
          ...sx
        }}
        {...props}
      >
        <Box 
          component="span" 
          sx={{ 
            visibility: loading ? 'hidden' : 'visible',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '100%',
            height: '100%'
          }}
        >
          {children}
        </Box>
        {loading && (
          <CircularProgress 
            size={20} 
            color="inherit" 
            sx={{ 
              position: 'absolute',
              top: '50%',
              left: '50%',
              marginTop: '-10px',
              marginLeft: '-10px'
            }} 
          />
        )}
      </MuiButton>
    );
  }
);

Button.displayName = 'Button';

export default React.memo(Button);

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
          // Theme-aware color logic
          color: (theme) => {
            if (variant === 'contained') return '#ffffff !important';
            return theme.palette.mode === 'dark' ? '#ffffff !important' : '#213350 !important';
          },
          '&.MuiButton-contained': {
            color: '#ffffff !important',
            background: 'linear-gradient(135deg, #213350 0%, #6AB344 100%) !important',
            boxShadow: '0 4px 14px 0 rgba(33, 51, 80, 0.25)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1a2940 0%, #5a9e3a 100%) !important',
              boxShadow: '0 6px 20px rgba(33, 51, 80, 0.35)',
              transform: 'translateY(-1px)',
            },
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          },
          '&.MuiButton-outlined': {
            color: (theme) => theme.palette.mode === 'dark' ? '#ffffff !important' : '#213350 !important',
            borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.5) !important' : 'rgba(33, 51, 80, 0.5) !important',
            '&:hover': {
              borderColor: (theme) => theme.palette.mode === 'dark' ? '#ffffff !important' : '#213350 !important',
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1) !important' : 'rgba(33, 51, 80, 0.05) !important',
            }
          },
          '&.MuiButton-text': {
            color: (theme) => theme.palette.mode === 'dark' ? '#ffffff !important' : '#213350 !important',
            '&:hover': {
              background: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.1) !important' : 'rgba(33, 51, 80, 0.05) !important',
            }
          },
          '& .MuiButton-startIcon': {
            marginRight: '6px !important',
            visibility: loading ? 'hidden' : 'visible',
          },
          '& .MuiButton-endIcon': {
            marginLeft: '6px !important',
            visibility: loading ? 'hidden' : 'visible',
          },
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          ...sx
        }}
        {...props}
      >
        <Box 
          component="span" 
          sx={{ 
            display: 'inherit', 
            alignItems: 'inherit', 
            justifyContent: 'inherit',
            visibility: loading ? 'hidden' : 'visible'
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

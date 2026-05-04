"use client";

import React, { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("Global Error:", error);
  }, [error]);

  return (
    <html lang="en">
      <body>
        <Container maxWidth="md">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: '100vh',
              textAlign: 'center',
              fontFamily: 'system-ui, -apple-system, sans-serif'
            }}
          >
            <Box 
              sx={{ 
                p: 3, 
                borderRadius: '50%', 
                bgcolor: 'rgba(239, 68, 68, 0.1)', 
                color: '#ef4444',
                mb: 3,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <Warning sx={{ fontSize: '80px' }} />
            </Box>
            
            <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: '#111827' }}>
              Application Error
            </Typography>
            
            <Typography variant="body1" sx={{ color: '#4b5563', mb: 4, maxWidth: '500px' }}>
              An unexpected client-side error occurred. We have been notified and are working on it.
              {error?.message ? <Box component="span" sx={{ display: 'block', mt: 1, fontSize: '0.875rem', opacity: 0.8 }}>Details: {error.message}</Box> : null}
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Button
                onClick={() => window.location.reload()}
                variant="contained"
                startIcon={<Refresh />}
                sx={{
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  borderRadius: '8px',
                  px: 4,
                  py: 1.5,
                  fontWeight: 600,
                  textTransform: 'none',
                  color: 'white',
                  boxShadow: '0 4px 15px rgba(33, 51, 80, 0.2)',
                  '&:hover': {
                    filter: 'brightness(1.1)',
                    boxShadow: '0 6px 20px rgba(33, 51, 80, 0.3)',
                  }
                }}
              >
                Reload Application
              </Button>
            </Box>
          </Box>
        </Container>
      </body>
    </html>
  );
}

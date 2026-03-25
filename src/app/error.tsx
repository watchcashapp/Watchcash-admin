"use client";

import React, { useEffect } from 'react';
import { Box, Typography, Button, Container } from '@mui/material';
import { Refresh, Warning } from '@mui/icons-material';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error(error);
  }, [error]);

  return (
    <Container maxWidth="md">
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '60vh',
          textAlign: 'center',
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
        
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 2, color: 'text.primary' }}>
          Something went wrong!
        </Typography>
        
        <Typography variant="body1" sx={{ color: 'text.secondary', mb: 4, maxWidth: '500px' }}>
          An unexpected error occurred. We have been notified and are working on it.
        </Typography>

        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            onClick={() => reset()}
            variant="contained"
            startIcon={<Refresh />}
            sx={{
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 15px rgba(33, 51, 80, 0.2)',
              '&:hover': {
                filter: 'brightness(1.1)',
                boxShadow: '0 6px 20px rgba(33, 51, 80, 0.3)',
              }
            }}
          >
            Try Again
          </Button>
          
          <Button
            onClick={() => window.location.href = '/dashboard'}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderColor: 'divider',
              color: 'text.secondary',
              '&:hover': {
                borderColor: 'primary.main',
                bgcolor: 'rgba(33, 51, 80, 0.05)',
              }
            }}
          >
            Go to Home
          </Button>
        </Box>
      </Box>
    </Container>
  );
}

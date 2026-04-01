"use client";

import React from 'react';
import { Box, Typography, Button, Container, Paper } from '@mui/material';
import { Home, ArrowBackIosNew } from '@mui/icons-material';
import Link from 'next/link';

export default function NotFound() {
  return (
    <Box
      sx={{
        minHeight: 'calc(100vh - 200px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'radial-gradient(circle at 50% 50%, rgba(106, 179, 68, 0.05) 0%, rgba(33, 51, 80, 0.02) 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Decorative Blur Orbs */}
      <Box sx={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(106, 179, 68, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />
      <Box sx={{ position: 'absolute', bottom: '-10%', right: '-10%', width: '40%', height: '40%', background: 'radial-gradient(circle, rgba(33, 51, 80, 0.08) 0%, transparent 70%)', filter: 'blur(60px)', zIndex: 0 }} />

      <Container maxWidth="sm" sx={{ position: 'relative', zIndex: 1 }}>
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, md: 8 },
            textAlign: 'center',
            bgcolor: 'background.paper',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(255, 255, 255, 0.3)',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 20px 40px rgba(0, 0, 0, 0.6)'
              : '0 20px 40px rgba(0, 0, 0, 0.05)',
          }}
        >
          <Box
            sx={{
              fontSize: { xs: '32px', md: '56px' },
              fontWeight: 900,
              lineHeight: 1,
              mb: 0.1,
              background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(135deg, #213350 0%, #6AB344 100%)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
              letterSpacing: '-0.05em',
              filter: 'drop-shadow(0 10px 10px rgba(106, 179, 68, 0.1))',
            }}
          >
            404
          </Box>


          <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3, lineHeight: 1.6, fontSize: '0.9rem' }}>
            We couldn't find the page you're looking for. It might have moved or doesn't exist anymore.
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2, justifyContent: 'center' }}>
            <Button
              component={Link}
              href="/dashboard"
              variant="contained"
              startIcon={<Home sx={{ fontSize: '1rem !important' }} />}
              sx={{
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                color: 'white',
                borderRadius: '6px',
                px: 2,
                height: 30,
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.2)',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-1px)',
                  boxShadow: '0 6px 15px rgba(33, 51, 80, 0.3)',
                  background: 'linear-gradient(45deg, #2c456d, #7bc253)',
                }
              }}
            >
              Back to Dashboard
            </Button>

            <Button
              onClick={() => window.history.back()}
              variant="outlined"
              startIcon={<ArrowBackIosNew sx={{ fontSize: '0.8rem !important' }} />}
              sx={{
                borderRadius: '6px',
                px: 2,
                height: 30,
                fontWeight: 700,
                textTransform: 'uppercase',
                fontSize: '0.75rem',
                borderColor: 'rgba(33, 51, 80, 0.2)',
                color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
                transition: 'all 0.3s ease',
                '&:hover': {
                  borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                  bgcolor: 'rgba(33, 51, 80, 0.02)',
                  transform: 'translateY(-1px)',
                }
              }}
            >
              Go Back
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}

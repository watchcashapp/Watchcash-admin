import React from 'react';
import { Box, Typography, Divider, Container } from '@mui/material';

const PublicFooter: React.FC = () => {
  const currentYear = new Date().getFullYear();

  return (
    <Box 
      component="footer" 
      sx={{ 
        py: 6, 
        mt: 'auto', 
        bgcolor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.02)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Divider sx={{ mb: 4, opacity: 0.5 }} />
        <Box 
          sx={{ 
            display: 'flex', 
            flexDirection: { xs: 'column', md: 'row' }, 
            justifyContent: 'space-between', 
            alignItems: 'center',
            gap: 2
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              component="img"
              src="/logo.png"
              alt="WatchCash Logo"
              sx={{ height: 24, width: 'auto' }}
              onError={(e: any) => {
                e.target.style.display = 'none';
              }}
            />
            <Typography 
              variant="subtitle1" 
              sx={{ 
                fontWeight: 800, 
                letterSpacing: '-0.5px',
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              WatchCash
            </Typography>
          </Box>
          
          <Typography 
            variant="body2" 
            color="text.secondary" 
            sx={{ 
              fontWeight: 500,
              fontSize: '0.75rem',
              textAlign: { xs: 'center', md: 'right' }
            }}
          >
            © {currentYear} WatchCash. All rights reserved. 
            <Box component="span" sx={{ mx: 1 }}>|</Box>
            Powered by Secure Technology
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default PublicFooter;

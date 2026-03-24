"use client";

import { Box, CircularProgress } from '@mui/material';

export default function Loading() {
  return (
    <Box 
      sx={{ 
        display: 'flex', 
        height: '100%', 
        minHeight: '400px',
        width: '100%',
        justifyContent: 'center', 
        alignItems: 'center',
        bgcolor: 'transparent'
      }}
    >
      <CircularProgress 
        size={40} 
        thickness={4} 
        sx={{ 
          color: '#213350',
          animationDuration: '750ms'
        }} 
      />
    </Box>
  );
}

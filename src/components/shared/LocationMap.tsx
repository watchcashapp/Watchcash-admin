"use client";

import React from 'react';
import { Box, Typography } from '@mui/material';

interface LocationMapProps {
  lat: number;
  lng: number;
  height?: number | string;
  width?: string;
}

const LocationMap: React.FC<LocationMapProps> = ({ 
  lat, 
  lng, 
  height = 300,
  width = '100%' 
}) => {
  // Using OpenStreetMap with Leaflet (no API key required)
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng-0.01},${lat-0.01},${lng+0.01},${lat+0.01}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <Box
      sx={{
        width,
        height,
        borderRadius: 2,
        overflow: 'hidden',
        border: (theme) => theme.palette.mode === 'dark'
          ? '1px solid rgba(255, 255, 255, 0.1)'
          : '1px solid rgba(0, 0, 0, 0.08)',
        position: 'relative',
      }}
    >
      <iframe
        width="100%"
        height="100%"
        frameBorder="0"
        scrolling="no"
        marginHeight={0}
        marginWidth={0}
        src={mapUrl}
        style={{ border: 0 }}
        title={`Map location: ${lat.toFixed(6)}, ${lng.toFixed(6)}`}
      />
      <Typography
        variant="caption"
        sx={{
          position: 'absolute',
          bottom: 8,
          right: 8,
          bgcolor: 'background.paper',
          px: 1,
          py: 0.5,
          borderRadius: 1,
          fontSize: '0.7rem',
          fontFamily: 'monospace',
          boxShadow: 1,
        }}
      >
        {lat.toFixed(6)}, {lng.toFixed(6)}
      </Typography>
    </Box>
  );
};

export default LocationMap;

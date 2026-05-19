"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Chip,
} from '@mui/material';
import {
  LightMode,
  DarkMode,
  SettingsBrightness,
  Check,
} from '@mui/icons-material';
import { useTheme } from 'next-themes';

interface ThemeSwitcherProps {
  open: boolean;
  onClose: () => void;
}

export default function ThemeSwitcher({ open, onClose }: ThemeSwitcherProps) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const themes = [
    {
      value: 'light',
      label: 'Light',
      icon: <LightMode />,
      description: 'Light theme',
    },
    {
      value: 'dark',
      label: 'Dark',
      icon: <DarkMode />,
      description: 'Dark theme',
    },
    {
      value: 'system',
      label: 'System',
      icon: <SettingsBrightness />,
      description: 'Follow system preference',
    },
  ];

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    onClose();
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        },
      }}
    >
      <DialogTitle>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            Choose Theme
          </Typography>
          <Chip
            label="Ctrl+K"
            size="small"
            sx={{
              fontSize: '0.75rem',
              height: 24,
              fontFamily: 'monospace',
            }}
          />
        </Box>
      </DialogTitle>
      <DialogContent>
        <List sx={{ p: 0 }}>
          {themes.map((themeOption) => (
            <ListItem key={themeOption.value} disablePadding sx={{ mb: 1 }}>
              <ListItemButton
                selected={theme === themeOption.value}
                onClick={() => handleThemeChange(themeOption.value)}
                sx={{
                  borderRadius: 2,
                  '&.Mui-selected': {
                    background: 'linear-gradient(45deg, rgba(33, 51, 80, 0.1), rgba(106, 179, 68, 0.1))',
                    '&:hover': {
                      background: 'linear-gradient(45deg, rgba(33, 51, 80, 0.15), rgba(106, 179, 68, 0.15))',
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ color: theme === themeOption.value ? 'primary.main' : 'text.secondary' }}>
                  {themeOption.icon}
                </ListItemIcon>
                <ListItemText
                  primary={themeOption.label}
                  secondary={themeOption.description}
                  primaryTypographyProps={{
                    fontWeight: theme === themeOption.value ? 600 : 400,
                  }}
                />
                {theme === themeOption.value && (
                  <Check sx={{ color: 'primary.main' }} />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>
        <Box mt={2} p={2} sx={{ bgcolor: 'action.hover', borderRadius: 2 }}>
          <Typography variant="caption" color="text.secondary">
            Current: {resolvedTheme === 'dark' ? 'Dark' : 'Light'} mode
          </Typography>
        </Box>
      </DialogContent>
    </Dialog>
  );
}

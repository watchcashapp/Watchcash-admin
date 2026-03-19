'use client';

import * as React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter';
import { useTheme as useNextTheme } from 'next-themes';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#213350',
    },
    secondary: {
      main: '#6AB344',
    },
    success: {
      main: '#6AB344',
    },
    background: {
      default: '#f5f7fa',
      paper: '#ffffff',
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#213350',
    },
    secondary: {
      main: '#6AB344',
    },
    success: {
      main: '#6AB344',
    },
    background: {
      default: '#0a0e27',
      paper: '#1a1f3a',
    },
  },
});

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const { resolvedTheme } = useNextTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent flash of wrong theme
  if (!mounted) {
    return (
      <AppRouterCacheProvider>
        <ThemeProvider theme={lightTheme}>
          <CssBaseline />
          {children}
        </ThemeProvider>
      </AppRouterCacheProvider>
    );
  }

  const theme = resolvedTheme === 'dark' ? darkTheme : lightTheme;

  return (
    <AppRouterCacheProvider>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </AppRouterCacheProvider>
  );
}

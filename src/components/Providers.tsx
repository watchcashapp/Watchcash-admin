"use client";

import React from 'react';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ThemeProvider } from '@/components/ThemeProvider';
import { ToastProvider } from '@/components/shared/Toaster';
import ThemeRegistry from '@/app/ThemeRegistry';
import AuthInitializer from '@/components/AuthInitializer';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';

interface ProvidersProps {
  children: React.ReactNode;
  initialAuth?: {
    accessToken?: string;
    refreshToken?: string;
  };
  initialTheme?: string;
}

export default function Providers({ children, initialAuth, initialTheme }: ProvidersProps) {
  return (
    <ThemeProvider initialTheme={initialTheme}>
      <ThemeRegistry initialTheme={initialTheme}>
        <Provider store={store}>
          <AuthInitializer initialAuth={initialAuth} />
          <ToastProvider>
            <NotificationsProvider>
              {children}
            </NotificationsProvider>
          </ToastProvider>
        </Provider>
      </ThemeRegistry>
    </ThemeProvider>
  );
}

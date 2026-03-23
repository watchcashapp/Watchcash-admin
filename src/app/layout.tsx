"use client";

import ThemeRegistry from './ThemeRegistry';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ToastProvider } from '@/components/shared';
import AuthInitializer from '@/components/AuthInitializer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) { 
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>WatchCash</title>
        <link rel="icon" type="image/svg+xml" href="/assets/images/favicon.svg" />
        <link rel="alternate icon" href="/assets/images/favicon.svg" />
        <meta name="theme-color" content="#213350" />
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Provider store={store}>
            <AuthInitializer />
            <ToastProvider>
              <NotificationsProvider>
                <ThemeRegistry>
                  <DashboardLayout>
                    {children}
                  </DashboardLayout>
                </ThemeRegistry>
              </NotificationsProvider>
            </ToastProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}

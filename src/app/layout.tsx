"use client";

import ThemeRegistry from './ThemeRegistry';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ToastProvider } from '@/components/shared';
import AuthInitializer from '@/components/AuthInitializer';
import { ThemeProvider } from '@/components/ThemeProvider';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <title>WatchNCash</title>
      </head>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <Provider store={store}>
            <AuthInitializer />
            <ToastProvider>
              <NotificationsProvider>
                <ThemeRegistry>{children}</ThemeRegistry>
              </NotificationsProvider>
            </ToastProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}

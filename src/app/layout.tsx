"use client";

import ThemeRegistry from './ThemeRegistry';
import { Provider } from 'react-redux';
import { store } from '@/store';
import { ToastProvider } from '@/components/shared';
import AuthInitializer from '@/components/AuthInitializer';
import { ThemeProvider } from '@/components/ThemeProvider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <Provider store={store}>
            <AuthInitializer />
            <ToastProvider>
              <ThemeRegistry>{children}</ThemeRegistry>
            </ToastProvider>
          </Provider>
        </ThemeProvider>
      </body>
    </html>
  );
}

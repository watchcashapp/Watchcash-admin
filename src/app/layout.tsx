import React from 'react';
import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import Providers from '@/components/Providers';
import DashboardLayout from '@/components/layout/DashboardLayout';
import HideDevIndicator from '@/components/shared/HideDevIndicator';
import EnvLogger from '@/components/shared/EnvLogger';
import { logEnvConfig } from '@/config/env';
import 'react-quill-new/dist/quill.snow.css';

export const metadata: Metadata = {
  title: 'WatchCash Admin',
  description: 'WatchCash Administration Panel',
  icons: {
    icon: '/assets/images/favicon.svg',
    shortcut: '/assets/images/favicon.svg',
    apple: '/assets/images/favicon.svg',
  },
};

export const viewport: Viewport = {
  themeColor: '#213350',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) { 
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('accessToken')?.value;
  const refreshToken = cookieStore.get('refreshToken')?.value;
  const theme = cookieStore.get('theme')?.value || 'light';

  logEnvConfig('server');

  return (
    <html lang="en" suppressHydrationWarning className={theme}>
      <head />
      <body suppressHydrationWarning>
        <HideDevIndicator />
        <EnvLogger />
        <Providers initialAuth={{ accessToken, refreshToken }} initialTheme={theme}>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </Providers>
      </body>
    </html>
  );
}

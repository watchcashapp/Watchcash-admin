"use client";

import React from 'react';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';

const DashboardShell = dynamic(() => import('./DashboardShell'), {
  ssr: false,
  loading: () => <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }} />
});

const NotificationsProvider = dynamic(() => import('@/components/notifications/NotificationsProvider').then(mod => mod.NotificationsProvider), {
  ssr: false
});

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const { isAuthenticated, isInitialized } = useSelector((state: RootState) => state.auth);
  const isAuthPage = pathname?.startsWith('/auth');

  const isPublicPage = pathname?.startsWith('/pages/privacy-policy') || 
                       pathname?.startsWith('/pages/terms-and-conditions');

  // If it's an auth page OR (is a public page AND not authenticated)
  // we render children directly in a simple container. 
  // We wait for initialization to avoid flicker.
  if (isAuthPage || (isPublicPage && isInitialized && !isAuthenticated)) {
    return (
      <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
        {children}
      </Box>
    );
  }

  // Otherwise, render the heavy dashboard shell wrapped in its provider.
  return (
    <NotificationsProvider>
      <DashboardShell>{children}</DashboardShell>
    </NotificationsProvider>
  );
}

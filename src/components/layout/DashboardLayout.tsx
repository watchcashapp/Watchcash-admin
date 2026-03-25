"use client";

import React from 'react';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import DashboardShell from './DashboardShell';
import { NotificationsProvider } from '@/components/notifications/NotificationsProvider';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const pathname = usePathname();
  const isAuthPage = pathname?.startsWith('/auth');

  // If it's an auth page, return children directly in a simple container.
  // This bypasses all the heavy dashboard hooks (notifications, permissions, etc.).
  if (isAuthPage) {
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

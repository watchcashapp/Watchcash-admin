"use client";

import React from 'react';
import { Box } from '@mui/material';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { isNoAuthPublicRoute, isPublicLegalRoute } from '@/utils/publicRoutes';

const DashboardShell = dynamic(() => import('./DashboardShell'), {
  ssr: false,
  loading: () => (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: 'background.default' }}>
      {/* Sidebar Skeleton */}
      <Box sx={{ width: 240, borderRight: '1px solid', borderColor: 'divider', p: 2, display: { xs: 'none', md: 'block' } }}>
        <Box sx={{ height: 40, width: 120, bgcolor: 'action.hover', mb: 4, borderRadius: 1 }} />
        {[...Array(8)].map((_, i) => (
          <Box key={i} sx={{ height: 32, mb: 1, bgcolor: 'action.hover', borderRadius: 1, opacity: 0.5 }} />
        ))}
      </Box>
      <Box sx={{ flexGrow: 1 }}>
        {/* AppBar Skeleton */}
        <Box sx={{ height: 64, borderBottom: '1px solid', borderColor: 'divider', px: 3, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
          <Box sx={{ height: 32, width: 100, bgcolor: 'action.hover', borderRadius: 1 }} />
          <Box sx={{ height: 40, width: 40, bgcolor: 'action.hover', borderRadius: '50%' }} />
        </Box>
        {/* Content Skeleton */}
        <Box sx={{ p: 3 }}>
          <Box sx={{ height: 40, width: 200, bgcolor: 'action.hover', mb: 3, borderRadius: 1 }} />
          <Box sx={{ height: 200, bgcolor: 'action.hover', borderRadius: 2 }} />
        </Box>
      </Box>
    </Box>
  )
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

  const isNoAuthPublic = isNoAuthPublicRoute(pathname);
  const isPublicLegal = isPublicLegalRoute(pathname);

  // Auth pages + fully public help/billing pages: no admin shell, no login required.
  // Legal pages: public layout for guests only (admins keep shell to edit content).
  if (
    isAuthPage ||
    isNoAuthPublic ||
    (isPublicLegal && isInitialized && !isAuthenticated)
  ) {
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

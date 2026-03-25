"use client";

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useAuth } from '../../hooks/useAuth';
import { usePermissions } from '@/hooks/usePermissions';

interface PermissionGuardProps {
  permission?: string | string[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

/**
 * A central component to handle authentication and permission-based redirects.
 * This simplifies page components by removing repetitive auth/permission checking logic.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isInitialized: isAuthInitialized } = useAuth();
  const { hasPermission, isInitialized: isPermissionsInitialized } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  const isInitialized = isAuthInitialized && isPermissionsInitialized;

  const hasRequiredPermission = React.useMemo(() => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return permission.some(p => hasPermission(p));
    }
    return hasPermission(permission);
  }, [permission, hasPermission]);

  useEffect(() => {
    if (isInitialized) {
      if (!isAuthenticated) {
        // Not authenticated, redirect to login with returnTo path
        router.push(`/auth/login?returnTo=${encodeURIComponent(pathname)}`);
        return;
      }

      if (permission && !hasRequiredPermission) {
        // Authenticated but lacks required permission, redirect to dashboard
        router.push('/dashboard');
      }
    }
  }, [isInitialized, isAuthenticated, permission, hasRequiredPermission, router, pathname]);

  if (!isInitialized) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px" flexDirection="column" gap={2}>
        <CircularProgress size={40} thickness={4} />
        <Typography variant="body2" color="text.secondary">Initializing secure session...</Typography>
      </Box>
    );
  }

  // If authenticated and permissions are met (or no permission required)
  if (isAuthenticated && hasRequiredPermission) {
    return <>{children}</>;
  }

  // If fallback is provided, show it while redirecting or if denied
  return fallback || null;
};

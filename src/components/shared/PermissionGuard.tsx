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
  simple?: boolean;
}

/**
 * A central component to handle authentication and permission-based redirects.
 * This simplifies page components by removing repetitive auth/permission checking logic.
 */
export const PermissionGuard: React.FC<PermissionGuardProps> = ({ 
  permission, 
  children, 
  fallback,
  simple = false
}) => {
  const { isAuthenticated, isInitialized: isAuthInitialized } = useAuth();
  const { hasPermission, isInitialized: isPermissionsInitialized, isFullProfileLoaded } = usePermissions();
  const router = useRouter();
  const pathname = usePathname();

  const isInitialized = isAuthInitialized && isPermissionsInitialized;
  const isWaitState = isAuthenticated && !isFullProfileLoaded;
  
  // Track denial after grace period
  const [isDenied, setIsDenied] = React.useState(false);

  const hasRequiredPermission = React.useMemo(() => {
    if (!permission) return true;
    if (Array.isArray(permission)) {
      return permission.some(p => hasPermission(p));
    }
    return hasPermission(permission);
  }, [permission, hasPermission]);

  useEffect(() => {
    // Simple guards (button-level) should NEVER redirect. They only hide/show content.
    if (simple) return;

    // If initialization is still in progress, we're not denied yet
    if (!isInitialized || isWaitState) {
      setIsDenied(false);
      return;
    }

    // If perfectly authenticated and permitted, we're definitely not denied
    if (isAuthenticated && hasRequiredPermission) {
      setIsDenied(false);
      return;
    }

    // If not authenticated, redirect to login immediately
    if (!isAuthenticated) {
      router.push(`/auth/login?returnTo=${encodeURIComponent(pathname)}`);
      return;
    }

    // If authenticated but missing permissions, redirect to dashboard
    if (permission && !hasRequiredPermission) {
      router.push('/dashboard');
    }
  }, [isInitialized, isWaitState, isAuthenticated, hasRequiredPermission, permission, router, pathname, simple]);

  if (!isInitialized || isWaitState) {
    if (simple) {
      return null; // Don't show any loader for button-level guards during init
    }

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

  // Permission denied — simple guards just hide content, page guards are already redirecting
  return fallback || null;

};

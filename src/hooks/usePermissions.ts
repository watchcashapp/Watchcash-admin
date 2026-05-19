import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useCallback } from 'react';

export const usePermissions = () => {
    const { user } = useSelector((state: RootState) => state.auth);
    const isFullProfileLoaded = useSelector((state: RootState) => state.auth.isFullProfileLoaded);
    const isInitialized = useSelector((state: RootState) => state.auth.isInitialized);

    const hasPermission = useCallback((permissionCode: string | string[]): boolean => {
        if (!user) return false;

        // Check for full admin access
        const isFullAdmin = user.permissions?.some(p => p.code === 'admin:full_access');
        if (isFullAdmin) return true;

        if (Array.isArray(permissionCode)) {
            return permissionCode.some(code => user.permissions?.some(p => p.code === code));
        }

        // Check for specific permission
        return !!user.permissions?.some(p => p.code === permissionCode);
    }, [user]);

    const isFullAdmin = !!user?.permissions?.some(p => p.code === 'admin:full_access');

    return {
        hasPermission,
        isFullAdmin,
        permissions: user?.permissions || [],
        userType: user?.userType,
        isInitialized,
        isFullProfileLoaded
    };
};

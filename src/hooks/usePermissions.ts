import { useSelector } from 'react-redux';
import { RootState } from '@/store';

export const usePermissions = () => {
    const { user } = useSelector((state: RootState) => state.auth);

    const hasPermission = (permissionCode: string): boolean => {
        if (!user) return false;

        // Check for full admin access
        const isFullAdmin = user.permissions?.some(p => p.code === 'admin:full_access');
        if (isFullAdmin) return true;

        // Check for specific permission
        return !!user.permissions?.some(p => p.code === permissionCode);
    };

    const isFullAdmin = !!user?.permissions?.some(p => p.code === 'admin:full_access');

    return {
        hasPermission,
        isFullAdmin,
        permissions: user?.permissions || [],
        userType: user?.userType
    };
};

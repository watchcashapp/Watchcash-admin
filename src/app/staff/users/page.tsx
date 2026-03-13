"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import UserManagementTable from '@/components/features/UserManagementTable';

export default function StaffUsersPage() {
  const router = useRouter();
  const { hasPermission, isInitialized } = usePermissions();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('users:list')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

  if (!isMounted) return null;

  return (
    <UserManagementTable
      title="Staff Users"
      defaultUserType="STAFF"
      hideUserTypeFilter={true}
      showAddButton={true}
      addRoute="/staff/users/add"
      editRoute="/staff/users"
    />
  );
}

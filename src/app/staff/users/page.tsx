"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import DashboardLayout from '@/components/layout/DashboardLayout';
import UserManagementTable from '@/components/features/UserManagementTable';

export default function StaffUsersPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  React.useEffect(() => {
    if (isMounted && !hasPermission('users:list')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

  if (!isMounted) return null;

  return (
    <DashboardLayout>
      <UserManagementTable
        title="Staff Users"
        defaultUserType="STAFF"
        hideUserTypeFilter={true}
        showAddButton={true}
        addRoute="/staff/users/add"
        editRoute="/staff/users"
      />
    </DashboardLayout>
  );
}

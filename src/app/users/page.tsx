"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagementTable from "@/components/features/UserManagementTable";

export default function UsersPage() {
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
    <DashboardLayout>
      <UserManagementTable
        title="User Management"
        defaultUserType="APP"
        hideUserTypeFilter={true}
        viewRoute="/users/view"
      />
    </DashboardLayout>
  );
}

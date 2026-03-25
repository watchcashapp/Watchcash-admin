"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import UserManagementTable from '@/components/features/UserManagementTable';
import { PermissionGuard } from '@/components/shared';

export default function StaffUsersPage() {
  return (
    <PermissionGuard permission="staff:list">
      <UserManagementTable
      title="Staff Users"
      defaultUserType="STAFF"
      hideUserTypeFilter={true}
      showAddButton={true}
      showBanButton={false}
      addRoute="/staff/users/add"
      editRoute="/staff/users"
    />
    </PermissionGuard>
  );
}

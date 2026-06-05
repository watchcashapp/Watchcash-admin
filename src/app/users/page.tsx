"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import UserManagementTable from "@/components/features/UserManagementTable";

import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function UsersPage() {
  return (
    <PermissionGuard permission="users:list">
      <UserManagementTable
        title="User Managements"
        defaultUserType="APP"
        hideUserTypeFilter={true}
        viewRoute="/users/view"
        showEditAction={false}
        showDeleteAction={false}
      />
    </PermissionGuard>
  );
}

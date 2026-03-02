"use client";

import DashboardLayout from "@/components/layout/DashboardLayout";
import UserManagementTable from "@/components/features/UserManagementTable";

export default function UsersPage() {
  return (
    <DashboardLayout>
      <UserManagementTable 
        title="User Management" 
        defaultUserType="APP"
        hideUserTypeFilter={true}
        viewRoute="/users"
      />
    </DashboardLayout>
  );
}

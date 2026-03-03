"use client";

import UserManagementTable from '@/components/features/UserManagementTable';

export default function StaffUsersPage() {
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

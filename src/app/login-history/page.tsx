"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginHistoryTable from "@/components/features/LoginHistoryTable";

import { PermissionGuard } from "@/components/shared/PermissionGuard";

export default function LoginHistoryPage() {
    return (
        <PermissionGuard permission="login_history:list">
            <LoginHistoryTable />
        </PermissionGuard>
    );
}

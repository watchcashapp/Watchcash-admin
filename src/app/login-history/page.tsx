"use client";

import React from 'react';
import { useRouter } from "next/navigation";
import { usePermissions } from "@/hooks/usePermissions";
import DashboardLayout from "@/components/layout/DashboardLayout";
import LoginHistoryTable from "@/components/features/LoginHistoryTable";

export default function LoginHistoryPage() {
    const router = useRouter();
    const { hasPermission, isInitialized } = usePermissions();
    const [isMounted, setIsMounted] = React.useState(false);

    React.useEffect(() => {
        setIsMounted(true);
    }, []);

    React.useEffect(() => {
        if (isMounted && isInitialized && !hasPermission('admin_login_logs:view')) {
            router.push('/dashboard');
        }
    }, [isMounted, isInitialized, hasPermission, router]);

    if (!isMounted) return null;

    return (
        <LoginHistoryTable />
    );
}

"use client";

import React, { useState, useEffect } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
} from '@mui/material';
import { Search, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { IconButton } from '@mui/material';

import { useRouter } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, useToast } from '@/components/shared';
import { useGetAuditLogsQuery } from '@/store/api/auditLogsApi';
import { usePermissions } from '@/hooks/usePermissions';

export default function AuditLogsPage() {
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { showError } = useToast();
    const [page, setPage] = useState(1);
    const rowsPerPage = 6;
    const [isMounted, setIsMounted] = useState(false);
    useEffect(() => {
        setIsMounted(true);
    }, []);

    // Filters
    const [actionSearch, setActionSearch] = useState('');
    const [targetUserSearch, setTargetUserSearch] = useState('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    React.useEffect(() => {
        if (isMounted && !hasPermission('admin_audit_logs:view')) {
            router.push('/dashboard');
        }
    }, [isMounted, hasPermission, router]);

    React.useEffect(() => {
        setPage(1);
    }, [actionSearch, targetUserSearch, fromDate, toDate]);

    const queryArgs = React.useMemo(() => ({
        page,
        limit: rowsPerPage,
        action: actionSearch || undefined,
        targetUser: targetUserSearch || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
    }), [page, rowsPerPage, actionSearch, targetUserSearch, fromDate, toDate]);

    const { data, isLoading } = useGetAuditLogsQuery(queryArgs, {
        refetchOnMountOrArgChange: true,
    });

    const columns = [
        {
            id: 'createdAt',
            label: 'Date',
            minWidth: 140,
            format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) : '',
        },
        {
            id: 'action',
            label: 'Action',
            minWidth: 140,
            format: (value: string) => (
                <Typography sx={{
                    fontSize: '0.75rem',
                    fontWeight: 600,
                    color: 'primary.main',
                    textTransform: 'capitalize',
                    lineHeight: 1.2
                }}>
                    {value.toLowerCase().replace(/_/g, ' ')}
                </Typography>
            ),
        },
        {
            id: 'resourceType',
            label: 'Resource (Category)',
            minWidth: 150,
            format: (value: string, row: any) => (
                <Box>
                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                        {value}
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                        {row.category}
                    </Typography>
                </Box>
            ),
        },
        {
            id: 'admin',
            label: 'Admin',
            minWidth: 150,
            format: (value: any) => (
                <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value ? value.name || value.email : '--'}
                </Typography>
            ),
        },
        {
            id: 'targetUser',
            label: 'Target User',
            minWidth: 150,
            format: (value: any) => value ? (
                <Typography
                    sx={{
                        fontSize: '0.75rem',
                        color: 'primary.main',
                        cursor: 'pointer',
                        textDecoration: 'underline',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        '&:hover': { color: 'primary.dark' }
                    }}
                    onClick={(e) => {
                        if (value?.id) {
                            e.stopPropagation();
                            if (!hasPermission('admin_audit_logs:view')) {
                                showError('You do not have permission to view user audit logs');
                                return;
                            }
                            router.push(`/audit-logs/${value.id}`);
                        }
                    }}
                >
                    {value.name || value.email}
                </Typography>
            ) : '--',
        },
        {
            id: 'ip',
            label: 'IP Address',
            minWidth: 110,
            format: (value: string) => (
                <Typography sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                    {value || '--'}
                </Typography>
            ),
        },
    ];

    return (
        <DashboardLayout>
            <Box mb={4}>
                <Typography
                    variant="h4"
                    sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                    }}
                >
                    Audit Logs
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    View administrative actions across the system.
                </Typography>
            </Box>

            {/* Filters */}
            <Paper
                sx={{
                    p: 2.5,
                    mb: 3,
                    bgcolor: 'background.paper',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                        : '0 4px 12px rgba(0, 0, 0, 0.05)',
                    border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 2,
                }}
            >
                <Grid container spacing={2} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Filter by Action..."
                            value={actionSearch}
                            onChange={(e) => {
                                setActionSearch(e.target.value);
                                setPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            placeholder="Filter by Target User..."
                            value={targetUserSearch}
                            onChange={(e) => {
                                setTargetUserSearch(e.target.value);
                                setPage(1);
                            }}
                            InputProps={{
                                startAdornment: (
                                    <InputAdornment position="start">
                                        <Search fontSize="small" />
                                    </InputAdornment>
                                ),
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            label="From Date"
                            type="date"
                            value={fromDate}
                            onChange={(e) => {
                                setFromDate(e.target.value);
                                setPage(1);
                            }}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            label="To Date"
                            type="date"
                            value={toDate}
                            onChange={(e) => {
                                setToDate(e.target.value);
                                setPage(1);
                            }}
                            size="small"
                            fullWidth
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>
            </Paper>

            <DataTable
                columns={columns}
                data={data?.items || []}
                getRowId={(row: any) => row.id}
                isLoading={isLoading}
                emptyMessage="No audit logs found"
                onView={hasPermission('admin_audit_logs:view') ? (row) => router.push(`/audit-logs/${row.targetUser?.id || 'system'}/details/${row.id}`) : undefined}
                renderPagination={() => data && data.items && data.items.length > 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, (data as any).total || (data as any).pagination?.total || 0)} of {(data as any).total || (data as any).pagination?.total || 0} entries
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={() => setPage(page - 1)}
                                disabled={page <= 1}
                                sx={{ color: page <= 1 ? 'text.disabled' : 'text.secondary' }}
                            >
                                <NavigateBefore />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                                {page} / {(data as any).totalPages || (data as any).pagination?.totalPages || Math.ceil(((data as any).total || (data as any).pagination?.total || 0) / rowsPerPage) || 1}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => setPage(page + 1)}
                                disabled={page >= ((data as any).totalPages || (data as any).pagination?.totalPages || Math.ceil(((data as any).total || (data as any).pagination?.total || 0) / rowsPerPage) || 1)}
                                sx={{ color: page >= ((data as any).totalPages || (data as any).pagination?.totalPages || Math.ceil(((data as any).total || (data as any).pagination?.total || 0) / rowsPerPage) || 1) ? 'text.disabled' : 'text.secondary' }}
                            >
                                <NavigateNext />
                            </IconButton>
                        </Box>
                    </Box>
                ) : null}
            />
        </DashboardLayout>
    );
}

"use client";

import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    CircularProgress,
} from '@mui/material';
import { DataTable, useToast } from '@/components/shared';
import { useGetAuditLogsQuery } from '@/store/api/auditLogsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { config } from '@/config/env';
import { Search, NavigateBefore, NavigateNext, FileDownload } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

export default function AuditLogsPage() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const rowsPerPage = 6;
    const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
    const { hasPermission } = usePermissions();

    // Filters
    const [actionSearch, setActionSearch] = useState('');
    const [targetUserSearch, setTargetUserSearch] = useState('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    React.useEffect(() => {
        reset();
    }, [actionSearch, targetUserSearch, fromDate, toDate, reset]);

    const queryArgs = useMemo(() => ({
        cursor,
        limit: rowsPerPage,
        action: actionSearch || undefined,
        targetUser: targetUserSearch || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
    }), [cursor, rowsPerPage, actionSearch, targetUserSearch, fromDate, toDate]);

    const { data, isLoading } = useGetAuditLogsQuery(queryArgs, {
        refetchOnMountOrArgChange: true,
    });

    const handleExportCSV = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (actionSearch) queryParams.append("action", actionSearch);
            if (targetUserSearch) queryParams.append("targetUser", targetUserSearch);
            if (fromDate) queryParams.append("from", fromDate);
            if (toDate) queryParams.append("to", toDate);

            const accessToken = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
            const url = `${config.apiUrl}/admin/audit-logs/export?${queryParams.toString()}`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'ngrok-skip-browser-warning': 'true'
                }
            });

            if (!response.ok) throw new Error('Export failed');

            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = downloadUrl;
            a.download = `audit_logs_export_${new Date().getTime()}.csv`;
            document.body.appendChild(a);
            a.click();
            a.remove();
            window.URL.revokeObjectURL(downloadUrl);
            showSuccess('Export started successfully');
        } catch (err) {
            showError('Failed to export audit logs');
        }
    };

    const columns = useMemo(() => [
        {
            id: 'createdAt',
            label: 'Date',
            minWidth: 140,
            format: (value: string) => value ? new Date(value).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }) : 'N/A',
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
                    {value?.toLowerCase().replace(/_/g, ' ')}
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
    ], [hasPermission, router, showError]);

    return (
        <PermissionGuard permission="admin_audit_logs:view">
            <Box>
                <Box mb={1} display="flex" justifyContent="space-between" alignItems="center">
                    <Typography
                        sx={{
                            fontWeight: 700,
                            fontSize: '1.1rem',
                            background: 'linear-gradient(45deg, #213350, #6AB344)',
                            WebkitBackgroundClip: 'text',
                            WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text',
                        }}
                    >
                        Audit Logs
                    </Typography>
                    <Box display="flex" gap={1}>
                        {hasPermission('admin_audit_logs:export') && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<FileDownload sx={{ fontSize: '1rem !important' }} />}
                                onClick={handleExportCSV}
                                sx={{
                                    height: '30px',
                                    fontSize: '0.75rem',
                                    background: 'linear-gradient(45deg, #213350, #6AB344)',
                                    boxShadow: '0 2px 8px rgba(33, 51, 80, 0.3)',
                                    px: 2,
                                    '&:hover': {
                                        background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                                        boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                                    },
                                }}
                            >
                                EXPORT
                            </Button>
                        )}
                    </Box>
                </Box>

                {/* Filters */}
                <Paper
                    sx={{
                        p: 1.5,
                        mb: 2,
                        bgcolor: 'background.paper',
                        boxShadow: (theme: any) => theme.palette.mode === 'dark'
                            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                            : '0 4px 12px rgba(0, 0, 0, 0.05)',
                        border: (theme: any) => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.08)',
                        borderRadius: 1.5,
                    }}
                >
                    <Grid container spacing={1.5} alignItems="center">
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Action..."
                                label="Action"
                                value={actionSearch}
                                onChange={(e) => {
                                    setActionSearch(e.target.value);
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                        sx: { fontSize: '0.75rem', height: '32px' }
                                    },
                                    inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                        bgcolor: 'background.paper',
                                        px: 0.5,
                                    },
                                    '& .MuiInputLabel-shrink': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                                fullWidth
                                size="small"
                                placeholder="Target User..."
                                label="Target User"
                                value={targetUserSearch}
                                onChange={(e) => {
                                    setTargetUserSearch(e.target.value);
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                            </InputAdornment>
                                        ),
                                        sx: { fontSize: '0.75rem', height: '32px' }
                                    },
                                    inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                        bgcolor: 'background.paper',
                                        px: 0.5,
                                    },
                                    '& .MuiInputLabel-shrink': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                                type="date"
                                label="From"
                                value={fromDate}
                                onChange={(e) => {
                                    setFromDate(e.target.value);
                                }}
                                size="small"
                                fullWidth
                                slotProps={{
                                    input: { sx: { fontSize: '0.75rem', height: '32px' } },
                                    inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                        bgcolor: 'background.paper',
                                        px: 0.5,
                                    },
                                    '& .MuiInputLabel-shrink': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <TextField
                                type="date"
                                label="To"
                                value={toDate}
                                onChange={(e) => {
                                    setToDate(e.target.value);
                                }}
                                size="small"
                                fullWidth
                                slotProps={{
                                    input: { sx: { fontSize: '0.75rem', height: '32px' } },
                                    inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                                }}
                                sx={{
                                    '& .MuiInputLabel-root': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                        bgcolor: 'background.paper',
                                        px: 0.5,
                                    },
                                    '& .MuiInputLabel-shrink': {
                                        transform: 'translate(14px, -6px) scale(0.75)',
                                    }
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 1 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setActionSearch('');
                                    setTargetUserSearch('');
                                    setFromDate('');
                                    setToDate('');
                                    reset();
                                }}
                                disabled={!actionSearch && !targetUserSearch && !fromDate && !toDate}
                                sx={{
                                    height: '32px',
                                    fontSize: '0.7rem',
                                    borderColor: '#213350',
                                    color: '#213350',
                                    '&:hover': {
                                        borderColor: '#6AB344',
                                        backgroundColor: 'rgba(33, 51, 80, 0.04)',
                                    },
                                }}
                            >
                                Clear
                            </Button>
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
                                Showing {data.items.length}{typeof data.pagination?.total === 'number' ? ` of ${data.pagination.total}` : ''} entries
                            </Typography>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                                <IconButton
                                    size="small"
                                    onClick={goPrevious}
                                    disabled={!canGoBack}
                                    sx={{ color: !canGoBack ? 'text.disabled' : 'text.secondary' }}
                                >
                                    <NavigateBefore />
                                </IconButton>
                                <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                                    Page {pageNumber}
                                </Typography>
                                <IconButton
                                    size="small"
                                    onClick={() => goNext(data.pagination?.nextCursor)}
                                    disabled={!data.pagination?.hasMore || !data.pagination?.nextCursor}
                                    sx={{ color: !data.pagination?.hasMore || !data.pagination?.nextCursor ? 'text.disabled' : 'text.secondary' }}
                                >
                                    <NavigateNext />
                                </IconButton>
                            </Box>
                        </Box>
                    ) : null}
                />
            </Box>
        </PermissionGuard>
    );
}

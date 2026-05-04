"use client";

import React, { useState, useEffect, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Button,
    IconButton,
    Tooltip,
} from '@mui/material';
import { Search, ArrowBack, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { DataTable, useToast, Input } from '@/components/shared';
import { useGetAuditLogsByUserQuery } from '@/store/api/auditLogsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

export default function AuditLogsUserPage() {
    const router = useRouter();
    const { showError } = useToast();
    const params = useParams();
    const userId = params.userId as string;

    const rowsPerPage = 6;
    const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
    const { hasPermission } = usePermissions();
    const today = new Date().toISOString().split('T')[0];

    // Filters
    const [actionSearch, setActionSearch] = useState('');
    const [localActionSearch, setLocalActionSearch] = useState('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    // Debounce Action Search
    useEffect(() => {
        const handler = setTimeout(() => {
            setActionSearch(localActionSearch);
        }, 500);
        return () => clearTimeout(handler);
    }, [localActionSearch]);

    const queryArgs = useMemo(() => ({
        user_id: userId,
        cursor,
        limit: rowsPerPage,
        action: actionSearch || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
    }), [userId, cursor, rowsPerPage, actionSearch, fromDate, toDate]);

    useEffect(() => {
        reset();
    }, [actionSearch, fromDate, toDate, reset]);

    const { data, isLoading } = useGetAuditLogsByUserQuery(queryArgs, {
        skip: !userId,
        refetchOnMountOrArgChange: true,
    });

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
            format: (value: any) => (
                <Typography sx={{ fontSize: '0.75rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {value ? value.name || value.email : '--'}
                </Typography>
            ),
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
    ], []);

    return (
        <PermissionGuard permission="admin_audit_logs:view">
            <Box mb={1.5}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{
                        mb: 1,
                        color: 'text.secondary',
                        height: '28px',
                        fontSize: '0.7rem',
                        '& .MuiButton-startIcon': { mr: 0.5, '& svg': { fontSize: '1rem' } }
                    }}
                >
                    BACK TO AUDIT LOGS
                </Button>
                <Typography
                    sx={{
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                    }}
                >
                    User Audit Logs
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                    Actions for User ID: <strong>{userId}</strong>
                </Typography>
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
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Input
                            fullWidth
                            placeholder="Filter by Action..."
                            value={localActionSearch}
                            onChange={(e) => {
                                setLocalActionSearch(e.target.value);
                            }}
                            slotProps={{
                                input: {
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                    sx: { fontSize: '0.75rem', height: '32px' }
                                }
                            }}
                        />
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Tooltip title="Future dates are not allowed" arrow>
                            <Box>
                                <Input
                                    label="From"
                                    type="date"
                                    value={fromDate}
                                    onChange={(e) => {
                                        setFromDate(e.target.value);
                                        reset();
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    slotProps={{
                                        input: { 
                                            sx: { fontSize: '0.75rem', height: '32px' },
                                        },
                                        htmlInput: {
                                            max: today
                                        }
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    </Grid>
                    <Grid size={{ xs: 12, sm: 4 }}>
                        <Tooltip title="Future dates are not allowed" arrow>
                            <Box>
                                <Input
                                    label="To"
                                    type="date"
                                    value={toDate}
                                    onChange={(e) => {
                                        setToDate(e.target.value);
                                        reset();
                                    }}
                                    fullWidth
                                    InputLabelProps={{ shrink: true }}
                                    slotProps={{
                                        input: { 
                                            sx: { fontSize: '0.75rem', height: '32px' },
                                        },
                                        htmlInput: {
                                            max: today
                                        }
                                    }}
                                />
                            </Box>
                        </Tooltip>
                    </Grid>
                </Grid>
            </Paper>

            <DataTable
                columns={columns}
                data={data?.items || []}
                getRowId={(row: any) => row.id}
                isLoading={isLoading}
                emptyMessage="No audit logs found for this user"
                onView={hasPermission('admin_audit_logs:view') ? (row: any) => router.push(`/audit-logs/${userId}/details/${row.id}`) : undefined}
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
        </PermissionGuard>
    );
}

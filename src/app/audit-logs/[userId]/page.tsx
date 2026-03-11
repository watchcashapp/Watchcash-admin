"use client";

import React, { useState } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    Button,
} from '@mui/material';
import { Search, ArrowBack, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { IconButton } from '@mui/material';

import { useRouter, useParams } from 'next/navigation';

import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/shared';
import { useGetAuditLogsByUserQuery } from '@/store/api/auditLogsApi';

export default function AuditLogsUserPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;

    const [page, setPage] = useState(1);
    const rowsPerPage = 20;

    // Filters
    const [actionSearch, setActionSearch] = useState('');
    const [fromDate, setFromDate] = useState<string>('');
    const [toDate, setToDate] = useState<string>('');

    const [isMounted, setIsMounted] = useState(false);
    React.useEffect(() => setIsMounted(true), []);

    const { data, isLoading } = useGetAuditLogsByUserQuery({
        user_id: userId,
        page,
        limit: rowsPerPage,
        action: actionSearch || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
    }, {
        skip: !userId,
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
    ];

    return (
        <DashboardLayout>
            <Box mb={4}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.push('/audit-logs')}
                    sx={{ mb: 2, color: 'text.secondary' }}
                >
                    BACK TO AUDIT LOGS
                </Button>
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
                    User Audit Logs
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
                    View administrative actions targeted at User ID: <strong>{userId}</strong>
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
                    <Grid size={{ xs: 12, sm: 4 }}>
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
                    <Grid size={{ xs: 12, sm: 4 }}>
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
                    <Grid size={{ xs: 12, sm: 4 }}>
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

            <Paper
                sx={{
                    width: '100%',
                    overflow: 'hidden',
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
                <DataTable
                    columns={columns}
                    data={data?.items || []}
                    getRowId={(row: any) => row.id}
                    isLoading={isLoading}
                    emptyMessage="No audit logs found for this user"
                    onView={(row) => router.push(`/audit-logs/${userId}/details/${row.id}`)}
                />
            </Paper>

            {data?.total ? (
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                        Showing {((page - 1) * rowsPerPage) + 1} to {Math.min(page * rowsPerPage, data.total)} of {data.total} entries
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                            size="small"
                            onClick={() => setPage(page - 1)}
                            disabled={page <= 1}
                            sx={{
                                bgcolor: page <= 1 ? 'action.disabled' : 'primary.main',
                                color: page <= 1 ? 'text.disabled' : 'white',
                                '&:hover': {
                                    bgcolor: page <= 1 ? 'action.disabled' : 'primary.dark',
                                },
                            }}
                        >
                            <NavigateBefore />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                            {page} / {data.totalPages || 1}
                        </Typography>
                        <IconButton
                            size="small"
                            onClick={() => setPage(page + 1)}
                            disabled={page >= (data.totalPages || 1)}
                            sx={{
                                bgcolor: page >= (data.totalPages || 1) ? 'action.disabled' : 'primary.main',
                                color: page >= (data.totalPages || 1) ? 'text.disabled' : 'white',
                                '&:hover': {
                                    bgcolor: page >= (data.totalPages || 1) ? 'action.disabled' : 'primary.dark',
                                },
                            }}
                        >
                            <NavigateNext />
                        </IconButton>
                    </Box>
                </Box>
            ) : null}
        </DashboardLayout>
    );
}

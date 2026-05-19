"use client";


import React, { useState, useMemo } from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    TextField,
    InputAdornment,
    IconButton,
    CircularProgress,
    Tooltip,
} from '@mui/material';
import { DataTable, useToast, TablePagination, Input, Button } from '@/components/shared';
import { useGetAuditLogsQuery } from '@/store/api/auditLogsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { config } from '@/config/env';
import { Search, NavigateBefore, NavigateNext, FileDownload } from '@mui/icons-material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { getTokenFromCookie } from "@/utils/auth";

export default function AuditLogsPage() {
    const router = useRouter();
    const { showSuccess, showError } = useToast();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const [limit, setLimit] = useState(() => {
        if (typeof window !== 'undefined') {
            const isReturning = sessionStorage.getItem('returning_from_detail');
            const savedLimit = sessionStorage.getItem('audit_logs_limit');
            
            // Clear the flag so it doesn't persist for other entries to this page
            sessionStorage.removeItem('returning_from_detail');

            if (isReturning && savedLimit) {
                return parseInt(savedLimit, 10);
            }
        }
        return 8;
    });
    const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
    const { hasPermission } = usePermissions();
    const today = new Date().toISOString().split('T')[0];

    // Filters
    const [actionSearch, setActionSearch] = useState(searchParams.get('action') || '');
    const [localActionSearch, setLocalActionSearch] = useState(searchParams.get('action') || '');
    const [targetUserSearch, setTargetUserSearch] = useState(searchParams.get('targetUser') || '');
    const [localTargetUserSearch, setLocalTargetUserSearch] = useState(searchParams.get('targetUser') || '');
    const [fromDate, setFromDate] = useState<string>(searchParams.get('from') || '');
    const [toDate, setToDate] = useState<string>(searchParams.get('to') || '');

    // Debounce Action Search
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setActionSearch(localActionSearch);
        }, 500);
        return () => clearTimeout(handler);
    }, [localActionSearch]);

    // Debounce Target User Search
    React.useEffect(() => {
        const handler = setTimeout(() => {
            setTargetUserSearch(localTargetUserSearch);
        }, 500);
        return () => clearTimeout(handler);
    }, [localTargetUserSearch]);

    React.useEffect(() => {
        if (actionSearch === '') setLocalActionSearch('');
        if (targetUserSearch === '') setLocalTargetUserSearch('');
    }, [actionSearch, targetUserSearch]);

    // Sync state with URL
    React.useEffect(() => {
        const params = new URLSearchParams(searchParams.toString());
        
        let changed = false;
        const urlAction = searchParams.get('action') || '';
        const urlTargetUser = searchParams.get('targetUser') || '';
        const urlFrom = searchParams.get('from') || '';
        const urlTo = searchParams.get('to') || '';

        if (actionSearch !== urlAction) {
            if (actionSearch) params.set('action', actionSearch); else params.delete('action');
            changed = true;
        }
        if (targetUserSearch !== urlTargetUser) {
            if (targetUserSearch) params.set('targetUser', targetUserSearch); else params.delete('targetUser');
            changed = true;
        }
        if (fromDate !== urlFrom) {
            if (fromDate) params.set('from', fromDate); else params.delete('from');
            changed = true;
        }
        if (toDate !== urlTo) {
            if (toDate) params.set('to', toDate); else params.delete('to');
            changed = true;
        }

        if (changed) {
            const queryString = params.toString();
            const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
            // Use window.history.replaceState to update URL without losing focus
            window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
        }
    }, [actionSearch, targetUserSearch, fromDate, toDate, pathname, router, searchParams]);

    React.useEffect(() => {
        reset();
    }, [actionSearch, targetUserSearch, fromDate, toDate, reset]);

    const queryArgs = useMemo(() => ({
        cursor,
        limit: limit,
        action: actionSearch || undefined,
        targetUser: targetUserSearch || undefined,
        from: fromDate ? new Date(fromDate).toISOString() : undefined,
        to: toDate ? new Date(toDate).toISOString() : undefined,
    }), [cursor, limit, actionSearch, targetUserSearch, fromDate, toDate]);

    const { data, isLoading, isFetching } = useGetAuditLogsQuery(queryArgs, {
        refetchOnMountOrArgChange: true,
    });

    const handleExportCSV = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (actionSearch) queryParams.append("action", actionSearch);
            if (targetUserSearch) queryParams.append("targetUser", targetUserSearch);
            if (fromDate) queryParams.append("from", fromDate);
            if (toDate) queryParams.append("to", toDate);

            const accessToken = getTokenFromCookie("accessToken");
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
                            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                        }}
                    >
                        Audit Logs
                    </Typography>
                    {/* <Box display="flex" gap={1}>
                        {hasPermission('admin_audit_logs:export') && (
                            <Button
                                variant="contained"
                                size="small"
                                startIcon={<FileDownload sx={{ fontSize: '1rem !important' }} />}
                                onClick={handleExportCSV}
                                sx={{
                                    height: '30px',
                                    minHeight: '30px',
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
                    </Box> */}
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
                            <Input
                                placeholder="Action..."
                                label="Action"
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
                                    },
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Input
                                placeholder="Target User..."
                                label="Target User"
                                value={localTargetUserSearch}
                                onChange={(e) => {
                                    setLocalTargetUserSearch(e.target.value);
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
                                }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Tooltip title="Future dates are not allowed" arrow>
                                <Box>
                                    <Input
                                        fullWidth
                                        type="date"
                                        label="From"
                                        value={fromDate}
                                        onChange={(e) => {
                                            setFromDate(e.target.value);
                                        }}
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
                        <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
                            <Tooltip title="Future dates are not allowed" arrow>
                                <Box>
                                    <Input
                                        fullWidth
                                        type="date"
                                        label="To"
                                        value={toDate}
                                        onChange={(e) => {
                                            setToDate(e.target.value);
                                        }}
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
                        <Grid size={{ xs: 12, md: 1 }}>
                            <Button
                                fullWidth
                                variant="outlined"
                                size="small"
                                onClick={() => {
                                    setLocalActionSearch('');
                                    setLocalTargetUserSearch('');
                                    setActionSearch('');
                                    setTargetUserSearch('');
                                    setFromDate('');
                                    setToDate('');
                                    reset();
                                }}
                                disabled={!localActionSearch && !localTargetUserSearch && !fromDate && !toDate}
                                sx={{
                                    height: '32px',
                                    minHeight: '32px',
                                    fontSize: '0.7rem',
                                    borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                                    color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
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
                    isLoading={isLoading || isFetching}
                    emptyMessage="No audit logs found"
                    onView={hasPermission('admin_audit_logs:view') ? (row: any) => {
                        sessionStorage.setItem('returning_from_detail', 'true');
                        router.push(`/audit-logs/${row.targetUser?.id || 'system'}/details/${row.id}`);
                    } : undefined}
                    renderPagination={() => data && data.items && data.items.length > 0 ? (
                        <TablePagination
                            pageNumber={pageNumber}
                            limit={limit}
                            onLimitChange={(newLimit: number) => {
                                setLimit(newLimit);
                                sessionStorage.setItem('audit_logs_limit', newLimit.toString());
                                reset();
                            }}
                            canGoBack={canGoBack}
                            hasMore={!!data?.pagination?.hasMore && !!data?.pagination?.nextCursor}
                            onNext={() => goNext(data?.pagination?.nextCursor)}
                            onPrevious={goPrevious}
                            totalResults={data?.pagination?.total}
                            resultsOnPage={data.items.length}
                            isLoading={isLoading}
                        />
                    ) : null}
                />
            </Box>
        </PermissionGuard>
    );
}

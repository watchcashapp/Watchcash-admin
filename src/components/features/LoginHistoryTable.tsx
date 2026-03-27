"use client";

import React, { useState, useEffect } from "react";
import {
    Box,
    Typography,
    TextField,
    MenuItem,
    Grid,
    Chip,
    InputAdornment,
    Alert,
    IconButton,
    Paper,
    Tooltip,
} from "@mui/material";
import { Search, NavigateBefore, NavigateNext } from "@mui/icons-material";
import DataTable, { Column } from "@/components/shared/DataTable";
import { useToast } from "@/components/shared";
import { useGetLoginHistoryQuery, LoginHistory } from "@/store/api/usersApi";
import { useCursorPagination } from '@/hooks/useCursorPagination';

interface LoginHistoryTableProps {
    title?: string;
    userId?: string;
}

export default function LoginHistoryTable({
    title = "Login History",
    userId: initialUserId = "", // Keeping the variable name for now but it will hold userName
}: LoginHistoryTableProps) {
    const { showError } = useToast();
    const [limit] = useState(6);
    const [userId, setUserId] = useState(initialUserId);
    const [isAdmin, setIsAdmin] = useState<string>("");
    const [debouncedUserName, setDebouncedUserName] = useState(initialUserId);
    const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();

    // Debounce Username
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedUserName(userId);
        }, 500);
        return () => clearTimeout(timer);
    }, [userId]);

    // Reset page when filters change
    useEffect(() => {
        reset();
    }, [debouncedUserName, isAdmin, reset]);

    const queryParams = React.useMemo(() => {
        const params: any = { cursor, limit };
        if (debouncedUserName) params.userName = debouncedUserName;
        if (isAdmin !== "") params.is_admin = isAdmin === "true";
        return params;
    }, [cursor, limit, debouncedUserName, isAdmin]);

    const { data, isLoading, error } = useGetLoginHistoryQuery(queryParams, {
        refetchOnMountOrArgChange: true,
    });

    const columns: Column<LoginHistory>[] = [
        {
            id: 'userId',
            label: 'User',
            minWidth: 150,
            format: (_value: string, row: LoginHistory) => {
                const displayName = row.userName || row.user?.name || row.userId;
                return (
                    <Box>
                        <Typography variant="body2">
                            {displayName}
                        </Typography>
                       
                    </Box>
                );
            },
        },
        {
            id: 'ip',
            label: 'IP Address',
            minWidth: 120,
        },
        {
            id: 'isAdmin',
            label: 'Admin',
            align: 'center',
            minWidth: 100,
            format: (value: boolean) => (
                <Chip
                    label={value ? 'Admin' : 'App User'}
                    size="small"
                    sx={{
                        background: value
                            ? 'linear-gradient(45deg, #213350, #6AB344)'
                            : 'linear-gradient(45deg, #10b981, #059669)',
                        color: 'white',
                        fontWeight: 600,
                    }}
                />
            ),
        },
        {
            id: 'createdAt',
            label: 'Time',
            minWidth: 180,
            format: (value: string) => new Date(value).toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            }),
        },
        {
            id: 'userAgent',
            label: 'User Agent',
            minWidth: 250,
            format: (value: string) => (
                <Tooltip title={value} arrow placement="top">
                    <Typography
                        variant="caption"
                        sx={{
                            display: 'block',
                            maxWidth: 250,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                            cursor: 'help'
                        }}
                    >
                        {value}
                    </Typography>
                </Tooltip>
            )
        }
    ];

    const handleClearFilters = () => {
        setUserId(initialUserId);
        setIsAdmin("");
        reset();
    };

    return (
        <Box sx={{ width: '100%', overflow: 'hidden' }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
                    {title}
                </Typography>
            </Box>

            {/* Filters */}
            <Paper
                sx={{
                    p: 1.5,
                    mb: 2,
                    bgcolor: 'background.paper',
                    border: (theme: any) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                    borderRadius: 1.5,
                }}
            >
                <Grid container spacing={1.5} alignItems="center">
                    <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                        <TextField
                            fullWidth
                            size="small"
                            label="Username"
                            placeholder="Search by Username"
                            value={userId}
                            onChange={(e) => setUserId(e.target.value)}
                            slotProps={{
                                input: {
                                    sx: { fontSize: '0.75rem', height: '32px' },
                                    startAdornment: (
                                        <InputAdornment position="start">
                                            <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                        </InputAdornment>
                                    ),
                                },
                                inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                            }}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    transform: 'translate(14px, -6px) scale(0.75)',
                                    bgcolor: 'background.paper',
                                    px: 0.5,
                                },
                            }}
                        />
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 2 }}>
                        <TextField
                            select
                            fullWidth
                            size="small"
                            label="User Source"
                            value={isAdmin}
                            onChange={(e) => setIsAdmin(e.target.value)}
                            slotProps={{
                                select: { sx: { fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center' } },
                                inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                            }}
                            sx={{
                                '& .MuiInputLabel-root': {
                                    transform: 'translate(14px, -6px) scale(0.75)',
                                    bgcolor: 'background.paper',
                                    px: 0.5,
                                },
                                '& .MuiSelect-select': { py: 0, display: 'flex', alignItems: 'center' }
                            }}
                        >
                            <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Sources</MenuItem>
                            <MenuItem value="true" sx={{ fontSize: '0.75rem' }}>Admin Panel</MenuItem>
                            <MenuItem value="false" sx={{ fontSize: '0.75rem' }}>App</MenuItem>
                        </TextField>
                    </Grid>

                    <Grid size={{ xs: 12, sm: 6, md: 1 }}>
                        <Box
                            component="button"
                            onClick={handleClearFilters}
                            disabled={!userId && !isAdmin}
                            sx={{
                                height: '32px',
                                width: '100%',
                                backgroundColor: 'transparent',
                                border: (theme) => `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#213350'}`,
                                color: (theme) => theme.palette.mode === 'dark' ? 'text.secondary' : '#213350',
                                borderRadius: '4px',
                                fontSize: '0.7rem',
                                cursor: 'pointer',
                                '&:hover': {
                                    backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(106, 179, 68, 0.08)' : 'rgba(33, 51, 80, 0.04)',
                                    borderColor: '#6AB344',
                                },
                                '&:disabled': {
                                    opacity: 0.5,
                                    cursor: 'not-allowed',
                                }
                            }}
                        >
                            Clear
                        </Box>
                    </Grid>
                </Grid>
            </Paper>

            {error && (
                <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8rem' }}>
                    Failed to load login history.
                </Alert>
            )}

            <DataTable
                columns={columns}
                data={data?.items || []}
                isLoading={isLoading}
                getRowId={(row: LoginHistory) => row.id}
                emptyMessage="No login history found."
                renderPagination={() => data ? (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
                        <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
                            Showing {data.items?.length || 0}{typeof data.pagination?.total === 'number' ? ` of ${data.pagination.total}` : ''} results
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <IconButton
                                size="small"
                                onClick={goPrevious}
                                disabled={!canGoBack}
                                sx={{ color: !canGoBack ? 'text.disabled' : 'text.secondary' }}
                            >
                                <NavigateBefore fontSize="small" />
                            </IconButton>
                            <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                                Page {pageNumber}
                            </Typography>
                            <IconButton
                                size="small"
                                onClick={() => goNext(data.pagination?.nextCursor)}
                                disabled={!data.pagination?.hasMore || !data.pagination?.nextCursor}
                                sx={{ color: !data.pagination?.hasMore || !data.pagination?.nextCursor ? 'text.disabled' : 'text.secondary' }}
                            >
                                <NavigateNext fontSize="small" />
                            </IconButton>
                        </Box>
                    </Box>
                ) : null}
            />
        </Box>
    );
}

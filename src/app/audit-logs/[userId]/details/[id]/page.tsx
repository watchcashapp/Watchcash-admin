"use client";

import React from 'react';
import {
    Box,
    Typography,
    Paper,
    Grid,
    Button,
    Divider,
    Chip,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableRow,
    CircularProgress,
    Skeleton,
} from '@mui/material';
import { ArrowBack, History, AdminPanelSettings, Person, Language, Description } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';
import { useGetAuditLogQuery } from '@/store/api/auditLogsApi';

export default function AuditLogDetailPage() {
    const router = useRouter();
    const { hasPermission, isInitialized } = usePermissions();
    const params = useParams();
    const userId = params.userId as string;
    const logId = params.id as string;

    React.useEffect(() => {
        if (isInitialized && !hasPermission('admin_audit_logs:view')) {
            router.push('/dashboard');
        }
    }, [isInitialized, hasPermission, router]);

    const { data: log, isLoading, error } = useGetAuditLogQuery({ userId, logId }, {
        skip: !userId || !logId,
    });

    if (isLoading) {
        return (
            <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 2 }}>
                    <Skeleton width={80} height={28} sx={{ mb: 1 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Skeleton width={150} height={32} />
                        <Skeleton variant="rectangular" width={80} height={22} sx={{ borderRadius: 4 }} />
                    </Box>
                </Box>
                <Grid container spacing={1.5}>
                    <Grid size={{ xs: 12, md: 5 }}>
                        <Paper sx={{ p: 1.5, borderRadius: 1.5, height: 150 }}>
                            <Skeleton width={150} height={24} sx={{ mb: 2 }} />
                            {[...Array(3)].map((_, i) => (
                                <Box key={i} sx={{ mb: 1, display: 'flex', gap: 2 }}>
                                    <Skeleton width={80} height={16} />
                                    <Skeleton width="100%" height={16} />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12, md: 7 }}>
                        <Paper sx={{ p: 1.5, borderRadius: 1.5, height: 150 }}>
                            <Skeleton width={150} height={24} sx={{ mb: 2 }} />
                            <Box display="flex" gap={2}>
                                {[...Array(3)].map((_, i) => (
                                    <Box key={i} display="flex" alignItems="center" gap={1}>
                                        <Skeleton variant="rectangular" width={32} height={32} sx={{ borderRadius: 1 }} />
                                        <Box>
                                            <Skeleton width={40} height={12} />
                                            <Skeleton width={80} height={20} />
                                        </Box>
                                    </Box>
                                ))}
                            </Box>
                        </Paper>
                    </Grid>
                    <Grid size={{ xs: 12 }}>
                        <Paper sx={{ p: 1.5, borderRadius: 1.5 }}>
                            <Skeleton width={120} height={24} sx={{ mb: 2 }} />
                            {[...Array(4)].map((_, i) => (
                                <Box key={i} sx={{ mb: 1, display: 'flex', gap: 4 }}>
                                    <Skeleton width={150} height={20} />
                                    <Skeleton width="100%" height={24} />
                                </Box>
                            ))}
                        </Paper>
                    </Grid>
                </Grid>
            </Box>
        );
    }

    if (error || !log) {
        return (
            <Box p={4} textAlign="center">
                <Typography variant="h5" color="error" gutterBottom>
                    Log Entry Not Found
                </Typography>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                >
                    Back to Audit Logs
                </Button>
            </Box>
        );
    }

    const renderMetadataValue = (value: any): React.ReactNode => {
        if (typeof value === 'object' && value !== null) {
            return (
                <pre style={{ margin: 0, fontSize: '0.75rem', whiteSpace: 'pre-wrap', color: 'inherit' }}>
                    {JSON.stringify(value, null, 2)}
                </pre>
            );
        }
        return String(value);
    };

    return (
        <>
            <Box mb={2}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{ mb: 1, color: 'text.secondary', fontWeight: 600, height: '28px', fontSize: '0.75rem' }}
                >
                    BACK
                </Button>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
                    <Box>
                        <Typography
                            variant="h5"
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
                            Log Detail
                        </Typography>

                    </Box>
                    <Chip
                        label={(log?.action || 'Unknown').toLowerCase().replace(/_/g, ' ')}
                        sx={{
                            height: '22px',
                            fontSize: '0.7rem',
                            background: 'linear-gradient(45deg, #213350, #6AB344)',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            px: 0.5,
                        }}
                    />
                </Box>
            </Box>

            <Grid container spacing={1.5}>
                <Grid size={{ xs: 12, md: 5 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            height: '100%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="body2" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>
                            <History sx={{ fontSize: '1rem' }} /> Basic Information
                        </Typography>
                        <Divider sx={{ mb: 1 }} />

                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow sx={{ '& td': { border: 0, py: 0.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '100px', fontSize: '0.7rem' }}>Date</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem' }}>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 0.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>Category</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem' }}>{log.category}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 0.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>Resource</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem' }}>{log.resourceType}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 0.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.7rem' }}>ID</TableCell>
                                        <TableCell sx={{ fontSize: '0.7rem', fontFamily: 'monospace' }}>{log.resourceId?.split('-')[0]}...</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 7 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            height: '100%',
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="body2" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>
                            <AdminPanelSettings sx={{ fontSize: '1rem' }} /> Participants
                        </Typography>
                        <Divider sx={{ mb: 1 }} />

                        <Box display="flex" flexDirection="row" gap={2} flexWrap="wrap">
                            <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(33, 51, 80, 0.1)', color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350', display: 'flex' }}>
                                    <AdminPanelSettings sx={{ fontSize: '1rem' }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', display: 'block', lineHeight: 1 }}>Admin</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{log.admin?.name || 'Unknown'}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(106, 179, 68, 0.1)', color: '#6AB344', display: 'flex' }}>
                                    <Person sx={{ fontSize: '1rem' }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', display: 'block', lineHeight: 1 }}>Target</Typography>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>{log.targetUser?.name || 'System'}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="center" gap={1}>
                                <Box sx={{ p: 0.5, borderRadius: 1, bgcolor: 'rgba(0, 0, 0, 0.05)', color: 'text.secondary', display: 'flex' }}>
                                    <Language sx={{ fontSize: '1rem' }} />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', fontSize: '0.6rem', display: 'block', lineHeight: 1 }}>IP Address</Typography>
                                    <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>{log.ip}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            borderRadius: 1.5,
                            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                            border: '1px solid',
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="body2" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 700, fontSize: '0.85rem' }}>
                            <Description sx={{ fontSize: '1rem' }} /> Metadata
                        </Typography>
                        <Divider sx={{ mb: 1 }} />

                        {Object.keys(log?.metadata || {}).length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        {Object.entries(log.metadata).map(([key, value]) => (
                                            <TableRow key={key} sx={{ '& td': { py: 0.5, borderBottom: '1px solid rgba(0,0,0,0.04)' } }}>
                                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '150px', verticalAlign: 'top', fontSize: '0.7rem' }}>
                                                    {key.replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell sx={{ fontSize: '0.7rem', color: 'text.primary' }}>
                                                    {renderMetadataValue(value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 1, textAlign: 'center', fontSize: '0.75rem' }}>
                                No metadata entry.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </>
    );
}

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
} from '@mui/material';
import { ArrowBack, History, AdminPanelSettings, Person, Language, Description } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGetAuditLogQuery } from '@/store/api/auditLogsApi';

export default function AuditLogDetailPage() {
    const router = useRouter();
    const params = useParams();
    const userId = params.userId as string;
    const logId = params.id as string;

    const { data: log, isLoading, error } = useGetAuditLogQuery({ userId, logId }, {
        skip: !userId || !logId,
    });

    if (isLoading) {
        return (
            <DashboardLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress sx={{ color: '#667eea' }} />
                </Box>
            </DashboardLayout>
        );
    }

    if (error || !log) {
        return (
            <DashboardLayout>
                <Box p={4} textAlign="center">
                    <Typography variant="h5" color="error" gutterBottom>
                        Log Entry Not Found
                    </Typography>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => router.push('/audit-logs')}
                    >
                        Back to Audit Logs
                    </Button>
                </Box>
            </DashboardLayout>
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
        <DashboardLayout>
            <Box mb={4}>
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{ mb: 2, color: 'text.secondary', fontWeight: 600 }}
                >
                    BACK
                </Button>
                <Box display="flex" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={2}>
                    <Box>
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
                            Log Detail
                        </Typography>

                    </Box>
                    <Chip
                        label={(log?.action || 'Unknown').toLowerCase().replace(/_/g, ' ')}
                        sx={{
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            color: 'white',
                            fontWeight: 600,
                            textTransform: 'capitalize',
                            px: 1,
                        }}
                    />
                </Box>
            </Box>

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '100%',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 600 }}>
                            <History fontSize="small" /> Basic Information
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <TableContainer>
                            <Table size="small">
                                <TableBody>
                                    <TableRow sx={{ '& td': { border: 0, py: 1.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '140px' }}>Date</TableCell>
                                        <TableCell>{new Date(log.createdAt).toLocaleString()}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 1.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Category</TableCell>
                                        <TableCell>{log.category}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 1.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Resource Type</TableCell>
                                        <TableCell>{log.resourceType}</TableCell>
                                    </TableRow>
                                    <TableRow sx={{ '& td': { border: 0, py: 1.5 } }}>
                                        <TableCell sx={{ fontWeight: 600, color: 'text.secondary' }}>Resource ID</TableCell>
                                        <TableCell>{log.resourceId || '--'}</TableCell>
                                    </TableRow>
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 6 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            height: '100%',
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 600 }}>
                            <AdminPanelSettings fontSize="small" /> Participants
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        <Box display="flex" flexDirection="column" gap={3}>
                            <Box display="flex" alignItems="flex-start" gap={2}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(102, 126, 234, 0.1)', color: 'primary.main' }}>
                                    <AdminPanelSettings />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Admin / Performing User</Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 600 }}>{log.admin?.name || 'Unknown'}</Typography>
                                    <Typography variant="body2" color="text.secondary">{log.admin?.email || 'N/A'}</Typography>
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="flex-start" gap={2}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(118, 75, 162, 0.1)', color: '#764ba2' }}>
                                    <Person />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Target User</Typography>
                                    {log.targetUser ? (
                                        <>
                                            <Typography variant="body1" sx={{ fontWeight: 600 }}>{log.targetUser.name}</Typography>
                                            <Typography variant="body2" color="text.secondary">{log.targetUser.email}</Typography>
                                        </>
                                    ) : (
                                        <Typography variant="body1" color="text.secondary">System / No Target</Typography>
                                    )}
                                </Box>
                            </Box>

                            <Box display="flex" alignItems="flex-start" gap={2}>
                                <Box sx={{ p: 1, borderRadius: 2, bgcolor: 'rgba(0, 0, 0, 0.05)', color: 'text.secondary' }}>
                                    <Language />
                                </Box>
                                <Box>
                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>Connection Info</Typography>
                                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{log.ip}</Typography>
                                </Box>
                            </Box>
                        </Box>
                    </Paper>
                </Grid>

                <Grid size={{ xs: 12 }}>
                    <Paper
                        sx={{
                            p: 3,
                            borderRadius: 3,
                            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)',
                        }}
                    >
                        <Typography variant="h6" gutterBottom display="flex" alignItems="center" gap={1} sx={{ color: 'primary.main', fontWeight: 600 }}>
                            <Description fontSize="small" /> Metadata
                        </Typography>
                        <Divider sx={{ mb: 2 }} />

                        {Object.keys(log?.metadata || {}).length > 0 ? (
                            <TableContainer>
                                <Table size="small">
                                    <TableBody>
                                        {Object.entries(log.metadata).map(([key, value]) => (
                                            <TableRow key={key} sx={{ '& td': { py: 1.5 } }}>
                                                <TableCell sx={{ fontWeight: 600, color: 'text.secondary', width: '200px', verticalAlign: 'top' }}>
                                                    {key.replace(/_/g, ' ')}
                                                </TableCell>
                                                <TableCell sx={{ fontFamily: typeof value === 'object' ? 'monospace' : 'inherit' }}>
                                                    {renderMetadataValue(value)}
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        ) : (
                            <Typography variant="body2" color="text.secondary" sx={{ py: 2, textAlign: 'center' }}>
                                No additional metadata for this logs entry.
                            </Typography>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </DashboardLayout>
    );
}

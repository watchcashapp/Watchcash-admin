"use client";

import { use, useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    Button,
    CircularProgress,
    Grid,
    Chip,
    Card,
    CardContent,
    Divider,
} from '@mui/material';
import {
    ArrowBack,
    AccountBalanceWallet,
    Schedule,
    Link as LinkIcon,
    StickyNote2,
    Tune,
    Person,
    CheckCircle,
    Error as ErrorIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useGetTransactionDetailQuery } from '@/store/api/usersApi';

interface InfoRowProps {
    label: string;
    value: React.ReactNode;
}

function InfoRow({ label, value }: InfoRowProps) {
    return (
        <Box
            sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                py: 1.5,
                borderBottom: (theme) =>
                    `1px solid ${theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'}`,
                '&:last-child': { borderBottom: 'none' },
            }}
        >
            <Typography variant="body2" color="text.secondary" sx={{ minWidth: 160, fontWeight: 500 }}>
                {label}
            </Typography>
            <Box sx={{ textAlign: 'right', flex: 1 }}>
                {typeof value === 'string' || typeof value === 'number' ? (
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {value || '—'}
                    </Typography>
                ) : (
                    value
                )}
            </Box>
        </Box>
    );
}

function SectionCard({
    title,
    icon,
    children,
}: {
    title: string;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    return (
        <Card
            sx={{
                bgcolor: 'background.paper',
                boxShadow: (theme) =>
                    theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0,0,0,0.4)'
                        : '0 4px 20px rgba(0,0,0,0.06)',
                border: (theme) =>
                    theme.palette.mode === 'dark'
                        ? '1px solid rgba(255,255,255,0.08)'
                        : '1px solid rgba(0,0,0,0.07)',
                borderRadius: 3,
            }}
        >
            <CardContent sx={{ p: 3 }}>
                <Box display="flex" alignItems="center" gap={1.2} mb={2}>
                    <Box sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : '#213350' }}>{icon}</Box>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem' }}>
                        {title}
                    </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />
                {children}
            </CardContent>
        </Card>
    );
}

function formatDate(dateStr?: string, isMounted?: boolean) {
    if (!dateStr || !isMounted) return '—';
    return new Date(dateStr).toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    });
}

export default function TransactionDetailPage({
    params,
}: {
    params: Promise<{ id: string; transactionId: string }>;
}) {
    const resolvedParams = use(params);
    const router = useRouter();
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const { data: transaction, isLoading, error } = useGetTransactionDetailQuery({
        userId: resolvedParams.id,
        transactionId: resolvedParams.transactionId,
    });

    const isCredit = transaction?.transactionType === 'CREDIT';

    if (isLoading) {
        return (
            <DashboardLayout>
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
                    <CircularProgress sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main' }} />
                </Box>
            </DashboardLayout>
        );
    }

    if (error || !transaction) {
        return (
            <DashboardLayout>
                <Box>
                    <Button
                        startIcon={<ArrowBack />}
                        onClick={() => router.back()}
                        sx={{ mb: 3, '&:hover': { backgroundColor: 'rgba(102,126,234,0.08)' } }}
                    >
                        Back
                    </Button>
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <ErrorIcon sx={{ fontSize: 48, color: '#ef4444', mb: 2 }} />
                        <Typography color="error">
                            Failed to load transaction details. Please try again.
                        </Typography>
                    </Paper>
                </Box>
            </DashboardLayout>
        );
    }

    return (
        <DashboardLayout>
            <Box>
                {/* Back button */}
                <Button
                    startIcon={<ArrowBack />}
                    onClick={() => router.back()}
                    sx={{ mb: 2, '&:hover': { backgroundColor: 'rgba(102,126,234,0.08)' } }}
                >
                    Back to User Details
                </Button>

                {/* Page title + badge */}
                <Box display="flex" alignItems="center" gap={2} mb={3} flexWrap="wrap">
                    <Typography
                        variant="h4"
                        sx={{
                            fontWeight: 700,
                            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                        }}
                    >
                        Transaction Details
                    </Typography>
                    <Chip
                        label={transaction.transactionType}
                        sx={{
                            background: isCredit
                                ? 'linear-gradient(45deg, #10b981, #059669)'
                                : 'linear-gradient(45deg, #ef4444, #dc2626)',
                            color: 'white',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                            px: 0.5,
                        }}
                    />
                </Box>

                {/* Compact Amount Hero Card */}
                <Card
                    sx={{
                        mb: 3,
                        background: isCredit
                            ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)'
                            : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                        color: 'white',
                        borderRadius: 3,
                        boxShadow: isCredit
                            ? '0 6px 24px rgba(16,185,129,0.30)'
                            : '0 6px 24px rgba(239,68,68,0.30)',
                    }}
                >
                    <CardContent sx={{ py: 2, px: 3, '&:last-child': { pb: 2 } }}>
                        <Box display="flex" justifyContent="space-between" alignItems="center" gap={2}>
                            <Box display="flex" alignItems="center" gap={3}>
                                <AccountBalanceWallet sx={{ fontSize: 36, opacity: 0.75 }} />
                                <Box>
                                    <Typography variant="caption" sx={{ opacity: 0.8, letterSpacing: 0.5, textTransform: 'uppercase', fontSize: '0.68rem' }}>
                                        Transaction Amount
                                    </Typography>
                                    <Typography variant="h5" sx={{ fontWeight: 800, lineHeight: 1.2 }}>
                                        {isCredit ? '+' : '-'}{isMounted ? Math.abs(transaction.amount).toLocaleString() : ''} pts
                                    </Typography>
                                </Box>
                            </Box>
                            {transaction.balanceAfter !== undefined && (
                                <Box sx={{ textAlign: 'right' }}>
                                    <Typography variant="caption" sx={{ opacity: 0.75, textTransform: 'uppercase', fontSize: '0.68rem', letterSpacing: 0.5 }}>
                                        Balance After
                                    </Typography>
                                    <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                        {isMounted ? transaction.balanceAfter.toLocaleString() : ''} pts
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </CardContent>
                </Card>

                <Grid container spacing={3}>
                    {/* Row 1: Transaction Info + Linked Session side by side */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        <SectionCard title="Transaction Info" icon={<AccountBalanceWallet />}>
                            <InfoRow label="Transaction ID" value={
                                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {transaction.id}
                                </Typography>
                            } />
                            <InfoRow label="Type" value={
                                <Chip
                                    size="small"
                                    label={transaction.transactionType}
                                    sx={{
                                        background: isCredit
                                            ? 'linear-gradient(45deg, #10b981, #059669)'
                                            : 'linear-gradient(45deg, #ef4444, #dc2626)',
                                        color: 'white',
                                        fontWeight: 600,
                                    }}
                                />
                            } />
                            <InfoRow label="Reason Code" value={transaction.reasonCode} />
                            <InfoRow label="Reference Type" value={transaction.referenceType} />
                            <InfoRow label="Reference ID" value={
                                <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                    {transaction.referenceId || '—'}
                                </Typography>
                            } />
                            <InfoRow label="Created At" value={formatDate(transaction.createdAt, isMounted)} />
                        </SectionCard>
                    </Grid>

                    {/* Linked Session — parallel to Transaction Info */}
                    <Grid size={{ xs: 12, md: 6 }}>
                        {transaction.session ? (
                            <SectionCard title="Linked Session" icon={<Schedule />}>
                                <InfoRow label="Session ID" value={
                                    <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                        {transaction.session.session_id || transaction.session.id}
                                    </Typography>
                                } />
                                <InfoRow label="Status" value={
                                    <Chip
                                        size="small"
                                        label={transaction.session.status}
                                        icon={<CheckCircle sx={{ fontSize: '14px !important' }} />}
                                        sx={{
                                            background: 'linear-gradient(45deg, #213350, #6AB344)',
                                            color: 'white',
                                            fontWeight: 600,
                                        }}
                                    />
                                } />
                                {transaction.session.device_id && (
                                    <InfoRow label="Device ID" value={
                                        <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                            {transaction.session.device_id}
                                        </Typography>
                                    } />
                                )}
                                <InfoRow label="Created At" value={formatDate(transaction.session.created_at || transaction.session.startTime, isMounted)} />
                                {transaction.session.duration_seconds != null && (
                                    <InfoRow
                                        label="Duration"
                                        value={
                                            transaction.session.duration_seconds >= 60
                                                ? `${Math.floor(transaction.session.duration_seconds / 60)} min ${transaction.session.duration_seconds % 60} sec`
                                                : `${transaction.session.duration_seconds} sec`
                                        }
                                    />
                                )}
                                {transaction.session.pointsEarned != null && (
                                    <InfoRow label="Points Earned" value={`${transaction.session.pointsEarned} pts`} />
                                )}
                            </SectionCard>
                        ) : (
                            <SectionCard title="Linked Session" icon={<Schedule />}>
                                <Typography variant="body2" color="text.disabled" sx={{ fontStyle: 'italic', py: 2, textAlign: 'center' }}>
                                    No linked session for this transaction.
                                </Typography>
                            </SectionCard>
                        )}
                    </Grid>

                    {/* Row 2: Note — full width */}
                    <Grid size={{ xs: 12 }}>
                        <SectionCard title="Note" icon={<StickyNote2 />}>
                            <Typography
                                variant="body2"
                                sx={{
                                    p: 2,
                                    borderRadius: 2,
                                    bgcolor: (theme) =>
                                        theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                                    lineHeight: 1.8,
                                    color: transaction.note ? 'text.primary' : 'text.disabled',
                                    fontStyle: transaction.note ? 'normal' : 'italic',
                                }}
                            >
                                {transaction.note || 'No note attached to this transaction.'}
                            </Typography>
                        </SectionCard>
                    </Grid>

                    {/* Linked Adjustment — full width if present */}
                    {transaction.adjustment && (
                        <Grid size={{ xs: 12 }}>
                            <SectionCard title="Linked Adjustment" icon={<Tune />}>
                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <InfoRow label="Adjustment ID" value={
                                            <Typography variant="body2" sx={{ fontWeight: 600, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: '0.75rem' }}>
                                                {transaction.adjustment.id}
                                            </Typography>
                                        } />
                                        <InfoRow label="Type" value={transaction.adjustment.adjustmentType} />
                                        <InfoRow label="Amount" value={`${transaction.adjustment.amount} pts`} />
                                        <InfoRow label="Created At" value={formatDate(transaction.adjustment.createdAt, isMounted)} />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <InfoRow label="Made By" value={
                                            <Chip
                                                size="small"
                                                label={transaction.adjustment.madeByAdmin ? 'Admin' : 'System'}
                                                icon={transaction.adjustment.madeByAdmin ? <Person sx={{ fontSize: '14px !important' }} /> : <Tune sx={{ fontSize: '14px !important' }} />}
                                                sx={{
                                                    background: transaction.adjustment.madeByAdmin
                                                        ? 'linear-gradient(45deg, #213350, #6AB344)'
                                                        : 'linear-gradient(45deg, #6b7280, #4b5563)',
                                                    color: 'white',
                                                    fontWeight: 600,
                                                }}
                                            />
                                        } />
                                        <InfoRow label="Note" value={transaction.adjustment.note || '—'} />
                                    </Grid>
                                </Grid>
                            </SectionCard>
                        </Grid>
                    )}
                </Grid>
            </Box>
        </DashboardLayout>
    );
}

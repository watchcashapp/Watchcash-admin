"use client";

import { use, useState, useEffect } from 'react';
import {
    Box,
    Paper,
    Typography,
    CircularProgress,
    Grid,
    Chip,
    Divider,
    Button,
    Drawer,
    TextField,
    MenuItem,
    IconButton,
} from '@mui/material';
import { ArrowBack, RateReview } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
    useGetRewardRedemptionByIdQuery,
    useReviewRewardRedemptionMutation,
} from '@/store/api/rewardRedemptionsApi';
import { useToast } from '@/components/shared';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { usePermissions } from '@/hooks/usePermissions';

const PREDEFINED_REASONS = [
    { value: 'fraud_suspected', label: 'Fraud Suspicion' },
    { value: 'duplicate_account', label: 'Multi Account' },
    { value: 'device_mismatch', label: 'Device Mismatch' },
    { value: 'impossible_travel', label: 'Impossible Travel' },
    { value: 'vpn_or_proxy_detected', label: 'VPN/Proxy Detected' },
    { value: 'bot_or_automation', label: 'Bot/Automation' },
    { value: 'invalid_activity', label: 'Invalid Activity' },
    { value: 'ineligible_country', label: 'Ineligible Country' },
    { value: 'terms_violated', label: 'Terms Violated' },
    { value: 'age_restriction', label: 'Age Restriction' },
    { value: 'quota_exceeded', label: 'Quota Exceeded' },
    { value: 'tango_insufficient_funds', label: 'Tango Insufficient Funds' },
    { value: 'tango_config_error', label: 'Tango Config Error' },
    { value: 'internal_error', label: 'Internal Error' },
    { value: 'manual_review_required', label: 'Manual Review' },
    { value: 'user_request_cancel', label: 'User Cancel' },
];

export default function RewardRedemptionDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const router = useRouter();
    const { hasPermission } = usePermissions();
    const { showSuccess, showError } = useToast();

    const { data: response, isLoading, error } = useGetRewardRedemptionByIdQuery(resolvedParams.id);
    const redemption = response?.data;
    const [reviewRewardRedemption, { isLoading: isReviewing }] = useReviewRewardRedemptionMutation();

    const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
    const [reviewForm, setReviewForm] = useState<{
        decision: 'approve' | 'reject' | 'hold';
        admin_reason_code: string;
        admin_note: string;
    }>({
        decision: 'approve',
        admin_reason_code: '',
        admin_note: '',
    });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    const handleReviewSubmit = async () => {
        try {
            await reviewRewardRedemption({
                id: resolvedParams.id,
                data: reviewForm,
            }).unwrap();
            showSuccess('Reward redemption reviewed successfully');
            setReviewDialogOpen(false);
        } catch (err: any) {
            showError(err?.data?.message || err?.message || 'Failed to review redemption');
        }
    };

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'APPROVED':
            case 'PROCESSED':
                return '#10b981';
            case 'PENDING':
                return '#f59e0b';
            case 'REJECTED':
            case 'FAILED':
                return '#ef4444';
            default:
                return '#9ca3af';
        }
    };

    if (isLoading) {
        return (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
                <CircularProgress sx={{ color: '#667eea' }} />
            </Box>
        );
    }

    if (error || !redemption) {
        return (
            <Box p={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
                <Typography color="error" variant="h6">
                    Failed to load reward redemption details.
                </Typography>
                <Button startIcon={<ArrowBack />} onClick={() => router.back()}>
                    Go Back
                </Button>
            </Box>
        );
    }

    return (
        <DashboardLayout>
            <Box sx={{ p: { xs: 2, md: 4 }, display: 'flex', flexDirection: 'column', gap: 3, height: '100%' }}>
                {/* Header */}
                <Box>
                    <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        sx={{
                            cursor: 'pointer',
                            mb: 1,
                            color: 'text.secondary',
                            '&:hover': { color: 'primary.main' },
                            width: 'fit-content'
                        }}
                        onClick={() => router.push('/reward-redemptions')}
                    >
                        <ArrowBack sx={{ fontSize: 16 }} />
                        <Typography variant="body2" fontWeight={500}>Back to reward redemptions</Typography>
                    </Box>
                    <Box display="flex" alignItems="center" justifyContent="space-between">
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
                            Redemption Details
                        </Typography>
                        {hasPermission('reward_redemptions:mark_reviewed') && redemption.status === 'PENDING' && (
                            <Button
                                variant="contained"
                                startIcon={<RateReview />}
                                onClick={() => setReviewDialogOpen(!reviewDialogOpen)}
                                disabled={isReviewing}
                                sx={{
                                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                                    '&:hover': { background: 'linear-gradient(45deg, #5a67d8, #6a3f92)' },
                                }}
                            >
                                {reviewDialogOpen ? 'Hide Review' : 'Mark Review'}
                            </Button>
                        )}
                    </Box>
                </Box>

                <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3} alignItems="flex-start">
                    {/* Main Content */}
                    <Box sx={{ flex: 1, width: '100%' }}>
                        <Paper
                            sx={{
                                p: 4,
                                bgcolor: 'background.paper',
                                backdropFilter: 'blur(20px)',
                                boxShadow: (theme) => theme.palette.mode === 'dark'
                                    ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                                border: (theme) => theme.palette.mode === 'dark'
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(0, 0, 0, 0.05)',
                                borderRadius: 3,
                            }}
                        >
                            <Box display="flex" alignItems="center" gap={2} mb={4}>
                                <Typography variant="h6" fontWeight={600}>Status:</Typography>
                                <Chip
                                    label={redemption.status || 'UNKNOWN'}
                                    sx={{
                                        background: getStatusColor(redemption.status),
                                        color: 'white',
                                        fontWeight: 600,
                                    }}
                                />
                            </Box>

                            <Divider sx={{ my: 3 }} />

                            <Grid container spacing={4}>
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                                        User Information
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">User ID</Typography>
                                            <Box
                                                onClick={() => router.push(`/users/view/${redemption.userId}`)}
                                                sx={{ fontFamily: 'monospace', p: 1, bgcolor: 'action.hover', borderRadius: 1, cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                {redemption.userId}
                                            </Box>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Session ID</Typography>
                                            <Box
                                                onClick={() => router.push(`/sessions/${redemption.sessionId}`)}
                                                sx={{ fontFamily: 'monospace', p: 1, bgcolor: 'action.hover', borderRadius: 1, cursor: 'pointer', color: 'primary.main', '&:hover': { textDecoration: 'underline' } }}
                                            >
                                                {redemption.sessionId}
                                            </Box>
                                        </Box>
                                    </Box>
                                </Grid>

                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Typography variant="h6" gutterBottom fontWeight={600} color="primary">
                                        Redemption Information
                                    </Typography>
                                    <Box display="flex" flexDirection="column" gap={2}>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Reward Type & Value</Typography>
                                            <Typography variant="body1" fontWeight={500}>{redemption.rewardType} - {redemption.rewardValue} {redemption.rewardCurrency}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Points Deducted</Typography>
                                            <Typography variant="body1" fontWeight={600} color="error.main">-{redemption.points}</Typography>
                                        </Box>
                                        <Box>
                                            <Typography variant="caption" color="text.secondary">Requested At</Typography>
                                            <Typography variant="body1" fontWeight={500}>
                                                {redemption.createdAt && isMounted ? new Date(redemption.createdAt).toLocaleString() : (redemption.createdAt ? 'Loading...' : 'N/A')}
                                            </Typography>
                                        </Box>
                                        {redemption.decidedAt && (
                                            <Box>
                                                <Typography variant="caption" color="text.secondary">Decided At</Typography>
                                                <Typography variant="body1" fontWeight={500}>
                                                    {isMounted ? new Date(redemption.decidedAt).toLocaleString() : 'Loading...'}
                                                </Typography>
                                            </Box>
                                        )}
                                    </Box>
                                </Grid>

                                {(redemption.adminReasonCode || redemption.adminNote || redemption.tangoErrorMessage) && (
                                    <Grid size={{ xs: 12 }}>
                                        <Divider sx={{ my: 1 }} />
                                        <Typography variant="h6" gutterBottom fontWeight={600} color="primary" mt={2}>
                                            Additional Context
                                        </Typography>
                                        <Grid container spacing={4}>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Box display="flex" flexDirection="column" gap={2}>
                                                    {redemption.adminReasonCode && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Admin Reason Code</Typography>
                                                            <Typography variant="body1">{redemption.adminReasonCode}</Typography>
                                                        </Box>
                                                    )}
                                                    {redemption.adminNote && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Admin Note</Typography>
                                                            <Typography variant="body1" sx={{ whiteSpace: 'pre-line', fontWeight: 500 }}>{redemption.adminNote}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Grid>
                                            <Grid size={{ xs: 12, md: 6 }}>
                                                <Box display="flex" flexDirection="column" gap={2}>
                                                    {redemption.tangoOrderId && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Tango Order ID</Typography>
                                                            <Typography variant="body1">{redemption.tangoOrderId}</Typography>
                                                        </Box>
                                                    )}
                                                    {redemption.tangoReferenceId && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Tango Reference ID</Typography>
                                                            <Typography variant="body1">{redemption.tangoReferenceId}</Typography>
                                                        </Box>
                                                    )}
                                                    {redemption.tangoErrorCode && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Tango Error Code</Typography>
                                                            <Typography variant="body1" color="error.main">{redemption.tangoErrorCode}</Typography>
                                                        </Box>
                                                    )}
                                                    {redemption.tangoErrorMessage && (
                                                        <Box>
                                                            <Typography variant="caption" color="text.secondary">Tango Error Message</Typography>
                                                            <Typography variant="body1" color="error.main" sx={{ fontStyle: 'italic' }}>{redemption.tangoErrorMessage}</Typography>
                                                        </Box>
                                                    )}
                                                </Box>
                                            </Grid>
                                        </Grid>
                                    </Grid>
                                )}

                            </Grid>
                        </Paper>
                    </Box>

                    {/* Integrated Side Panel (Desktop) */}
                    <Box
                        sx={{
                            display: { xs: 'none', lg: reviewDialogOpen ? 'flex' : 'none' },
                            flexDirection: 'column',
                            width: 380,
                            flexShrink: 0,
                            position: 'sticky',
                            top: 24,
                            maxHeight: 'calc(100vh - 120px)',
                        }}
                    >
                        <Paper
                            sx={{
                                flex: 1,
                                display: 'flex',
                                flexDirection: 'column',
                                overflow: 'hidden',
                                bgcolor: 'background.paper',
                                boxShadow: (theme) => theme.palette.mode === 'dark'
                                    ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                                    : '0 4px 12px rgba(0, 0, 0, 0.05)',
                                border: (theme) => theme.palette.mode === 'dark'
                                    ? '1px solid rgba(255, 255, 255, 0.1)'
                                    : '1px solid rgba(0, 0, 0, 0.08)',
                                borderRadius: 3,
                            }}
                        >
                            {hasPermission('reward_redemptions:mark_reviewed') && (
                                <ReviewForm
                                    reviewForm={reviewForm}
                                    setReviewForm={setReviewForm}
                                    isReviewing={isReviewing}
                                    handleReviewSubmit={handleReviewSubmit}
                                />
                            )}
                        </Paper>
                    </Box>
                </Box>

                {/* Drawer (Mobile) */}
                <Drawer
                    anchor="right"
                    open={reviewDialogOpen}
                    onClose={() => !isReviewing && setReviewDialogOpen(false)}
                    sx={{ display: { lg: 'none' } }}
                    PaperProps={{
                        sx: {
                            width: { xs: '100%', sm: 400 },
                            borderTopLeftRadius: { xs: 16, sm: 0 },
                            boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
                        }
                    }}
                >
                    {hasPermission('reward_redemptions:mark_reviewed') && (
                        <ReviewForm
                            mobile
                            reviewForm={reviewForm}
                            setReviewForm={setReviewForm}
                            isReviewing={isReviewing}
                            handleReviewSubmit={handleReviewSubmit}
                            setReviewDialogOpen={setReviewDialogOpen}
                        />
                    )}
                </Drawer>
            </Box>
        </DashboardLayout>
    );
}

interface ReviewFormProps {
    mobile?: boolean;
    reviewForm: {
        decision: 'approve' | 'reject' | 'hold';
        admin_reason_code: string;
        admin_note: string;
    };
    setReviewForm: (form: any) => void;
    isReviewing: boolean;
    handleReviewSubmit: () => void;
    setReviewDialogOpen?: (open: boolean) => void;
}

function ReviewForm({
    mobile,
    reviewForm,
    setReviewForm,
    isReviewing,
    handleReviewSubmit,
    setReviewDialogOpen
}: ReviewFormProps) {
    return (
        <Box display="flex" flexDirection="column" flex={1} minHeight={0} sx={{ overflow: 'hidden' }}>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
                <Typography variant="h6" sx={{ fontWeight: 700 }}>Mark Review</Typography>
                {mobile && setReviewDialogOpen && (
                    <Button size="small" onClick={() => setReviewDialogOpen(false)} disabled={isReviewing} sx={{ minWidth: 'auto', p: 1 }}>✕</Button>
                )}
            </Box>
            <Box flex={1} sx={{ overflowY: 'auto' }} p={3}>
                <Box mb={3}>
                    <TextField
                        select
                        fullWidth
                        label="Decision"
                        value={reviewForm.decision}
                        onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as 'approve' | 'reject' | 'hold' })}
                        disabled={isReviewing}
                        InputLabelProps={{ shrink: true, required: true }}
                    >
                        <MenuItem value="approve">Approve</MenuItem>
                        <MenuItem value="reject">Reject</MenuItem>
                        <MenuItem value="hold">Hold</MenuItem>
                    </TextField>
                </Box>
                <Box mb={3}>
                    <TextField
                        select
                        fullWidth
                        label="Reason Code"
                        value={reviewForm.admin_reason_code}
                        onChange={(e) => setReviewForm({ ...reviewForm, admin_reason_code: e.target.value })}
                        disabled={isReviewing}
                        placeholder="Select a reason..."
                        InputLabelProps={{ shrink: true, required: true }}
                    >
                        {PREDEFINED_REASONS.map((reason) => (
                            <MenuItem key={reason.value} value={reason.value}>
                                {reason.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                <Box mb={3}>
                    <TextField
                        fullWidth
                        multiline
                        rows={3}
                        label="Internal Note"
                        value={reviewForm.admin_note}
                        onChange={(e) => setReviewForm({ ...reviewForm, admin_note: e.target.value })}
                        disabled={isReviewing}
                        placeholder="Add admin note..."
                        InputLabelProps={{ shrink: true }}
                    />
                </Box>
            </Box>
            <Box p={2} borderTop="1px solid" borderColor="divider" bgcolor="background.paper">
                <Button
                    fullWidth
                    variant="contained"
                    onClick={handleReviewSubmit}
                    disabled={isReviewing || !reviewForm.admin_reason_code}
                    sx={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}
                >
                    {isReviewing ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
                </Button>
            </Box>
        </Box>
    );
}

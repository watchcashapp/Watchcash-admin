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
    Skeleton,
} from '@mui/material';
import { ArrowBack, RateReview } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import {
    useGetRewardRedemptionByIdQuery,
    useReviewRewardRedemptionMutation,
} from '@/store/api/rewardRedemptionsApi';
import { useGetRewardCatalogsQuery } from '@/store/api/rewardCatalogsApi';
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

import { PermissionGuard } from '@/components/shared/PermissionGuard';

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
        utid: string;
    }>({
        decision: 'approve',
        admin_reason_code: '',
        admin_note: '',
        utid: '',
    });

    const handleReviewSubmit = async () => {
        try {
            await reviewRewardRedemption({
                id: resolvedParams.id,
                data: {
                    decision: reviewForm.decision,
                    admin_note: reviewForm.admin_note,
                    admin_reason_code: reviewForm.admin_reason_code,
                    utid: reviewForm.utid
                },
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
            <Box sx={{ p: 1.5 }}>
                <Box sx={{ mb: 1 }}>
                    <Skeleton width={60} height={20} sx={{ mb: 0.5 }} />
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                        <Skeleton width={180} height={32} />
                        <Skeleton variant="rectangular" width={100} height={30} sx={{ borderRadius: 1 }} />
                    </Box>
                </Box>
                <Paper sx={{ p: 2, borderRadius: 1.5, mt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                        <Skeleton width={60} height={20} />
                        <Skeleton variant="rectangular" width={80} height={20} sx={{ borderRadius: 1 }} />
                    </Box>
                    <Divider sx={{ my: 1.5 }} />
                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Skeleton width={150} height={24} sx={{ mb: 2 }} />
                            {[...Array(2)].map((_, i) => (
                                <Box key={i} sx={{ mb: 1.5 }}>
                                    <Skeleton width={100} height={16} sx={{ mb: 0.5 }} />
                                    <Skeleton width="100%" height={24} />
                                </Box>
                            ))}
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <Skeleton width={180} height={24} sx={{ mb: 2 }} />
                            {[...Array(3)].map((_, i) => (
                                <Box key={i} sx={{ mb: 1.5 }}>
                                    <Skeleton width={120} height={16} sx={{ mb: 0.5 }} />
                                    <Skeleton width="100%" height={24} />
                                </Box>
                            ))}
                        </Grid>
                    </Grid>
                </Paper>
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
        <PermissionGuard permission="reward_redemptions:list">
            <Box sx={{ p: 1.5, display: 'flex', flexDirection: 'column', gap: 1.5, height: '100%', overflow: 'hidden' }}>
                    {/* Header */}
                    <Box>
                        <Box
                            display="flex"
                            alignItems="center"
                            gap={0.5}
                            sx={{
                                cursor: 'pointer',
                                mb: 0.5,
                                color: 'text.secondary',
                                '&:hover': { color: 'primary.main' },
                                width: 'fit-content'
                            }}
                            onClick={() => router.back()}
                        >
                            <ArrowBack sx={{ fontSize: 14 }} />
                            <Typography variant="caption" sx={{ fontWeight: 600 }}>Back</Typography>
                        </Box>
                        <Box display="flex" alignItems="center" justifyContent="space-between">
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
                                Redemption Details
                            </Typography>
                            {hasPermission('reward_redemptions:mark_reviewed') && redemption.status === 'PENDING' && (
                                <Box
                                    component="button"
                                    onClick={() => setReviewDialogOpen(!reviewDialogOpen)}
                                    disabled={isReviewing}
                                    sx={{
                                        display: 'inline-flex',
                                        alignItems: 'center',
                                        gap: 1,
                                        height: '30px',
                                        px: 2,
                                        fontSize: '0.75rem',
                                        fontWeight: 600,
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: isReviewing ? 'not-allowed' : 'pointer',
                                        background: 'linear-gradient(45deg, #213350, #6AB344)',
                                        '&:hover': { background: 'linear-gradient(45deg, #1a2940, #6AB344)' },
                                        '&:disabled': { opacity: 0.7 }
                                    }}
                                >
                                    <RateReview sx={{ fontSize: '1rem' }} />
                                    {reviewDialogOpen ? 'Hide' : 'Review'}
                                </Box>
                            )}
                        </Box>
                    </Box>

                    <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3} alignItems="flex-start">
                        {/* Main Content */}
                        <Box sx={{ flex: 1, width: '100%' }}>
                            <Paper
                                sx={{
                                    p: 2,
                                    bgcolor: 'background.paper',
                                    boxShadow: (theme) => theme.palette.mode === 'dark'
                                        ? '0 4px 12px rgba(0, 0, 0, 0.3)'
                                        : '0 4px 12px rgba(0, 0, 0, 0.05)',
                                    border: (theme) => theme.palette.mode === 'dark'
                                        ? '1px solid rgba(255, 255, 255, 0.1)'
                                        : '1px solid rgba(0, 0, 0, 0.05)',
                                    borderRadius: 1.5,
                                }}
                            >
                                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem' }}>Status:</Typography>
                                    <Chip
                                        label={redemption.status || 'UNKNOWN'}
                                        sx={{
                                            background: getStatusColor(redemption.status),
                                            color: 'white',
                                            fontWeight: 700,
                                            fontSize: '0.65rem',
                                            height: '20px',
                                        }}
                                    />
                                </Box>

                                <Divider sx={{ my: 1.5 }} />

                                <Grid container spacing={2}>
                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'primary.main', mb: 1.5 }}>
                                            User Information
                                        </Typography>
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>User ID</Typography>
                                                <Box
                                                    onClick={() => router.push(`/users/view/${redemption.userId}`)}
                                                    sx={{ fontFamily: 'monospace', mt: 0.25, p: 0.5, bgcolor: 'action.hover', borderRadius: 0.5, cursor: 'pointer', color: 'primary.main', fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}
                                                >
                                                    {redemption.userId}
                                                </Box>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Session ID</Typography>
                                                <Box
                                                    onClick={() => router.push(`/sessions/${redemption.sessionId}`)}
                                                    sx={{ fontFamily: 'monospace', mt: 0.25, p: 0.5, bgcolor: 'action.hover', borderRadius: 0.5, cursor: 'pointer', color: 'primary.main', fontSize: '0.75rem', '&:hover': { textDecoration: 'underline' } }}
                                                >
                                                    {redemption.sessionId}
                                                </Box>
                                            </Box>
                                        </Box>
                                    </Grid>

                                    <Grid size={{ xs: 12, md: 6 }}>
                                        <Typography variant="body2" gutterBottom sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'primary.main', mb: 1.5 }}>
                                            Redemption Information
                                        </Typography>
                                        <Box display="flex" flexDirection="column" gap={1}>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Reward Type & Value</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem', color: 'text.primary' }}>{redemption.rewardType} - {redemption.rewardValue} {redemption.rewardCurrency}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Points Deducted</Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem', color: 'error.main' }}>-{redemption.points}</Typography>
                                            </Box>
                                            <Box>
                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Requested At</Typography>
                                                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                                    {redemption.createdAt ? new Date(redemption.createdAt).toLocaleString() : 'N/A'}
                                                </Typography>
                                            </Box>
                                            {redemption.decidedAt && (
                                                <Box>
                                                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Decided At</Typography>
                                                    <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>
                                                        {new Date(redemption.decidedAt).toLocaleString()}
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </Grid>

                                    {(redemption.adminReasonCode || redemption.adminNote || redemption.tangoErrorMessage) && (
                                        <Grid size={{ xs: 12 }}>
                                            <Divider sx={{ my: 1 }} />
                                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem', color: 'primary.main', mt: 1, mb: 1.5 }}>
                                                Additional Context
                                            </Typography>
                                            <Grid container spacing={2}>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Box display="flex" flexDirection="column" gap={1}>
                                                        {redemption.adminReasonCode && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Admin Reason Code</Typography>
                                                                <Typography variant="body2" sx={{ fontSize: '0.75rem', fontWeight: 500 }}>{redemption.adminReasonCode}</Typography>
                                                            </Box>
                                                        )}
                                                        {redemption.adminNote && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Admin Note</Typography>
                                                                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', fontWeight: 500, fontSize: '0.75rem', color: 'text.primary' }}>{redemption.adminNote}</Typography>
                                                            </Box>
                                                        )}
                                                    </Box>
                                                </Grid>
                                                <Grid size={{ xs: 12, md: 6 }}>
                                                    <Box display="flex" flexDirection="column" gap={1}>
                                                        {redemption.tangoOrderId && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Tango Order ID</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{redemption.tangoOrderId}</Typography>
                                                            </Box>
                                                        )}
                                                        {redemption.tangoReferenceId && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Tango Reference ID</Typography>
                                                                <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{redemption.tangoReferenceId}</Typography>
                                                            </Box>
                                                        )}
                                                        {redemption.tangoErrorCode && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Tango Error Code</Typography>
                                                                <Typography variant="body2" color="error.main" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{redemption.tangoErrorCode}</Typography>
                                                            </Box>
                                                        )}
                                                        {redemption.tangoErrorMessage && (
                                                            <Box>
                                                                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Tango Error Message</Typography>
                                                                <Typography variant="body2" color="error.main" sx={{ fontStyle: 'italic', fontWeight: 500, fontSize: '0.75rem' }}>{redemption.tangoErrorMessage}</Typography>
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
            </PermissionGuard>
        );
}

interface ReviewFormProps {
    mobile?: boolean;
    reviewForm: {
        decision: 'approve' | 'reject' | 'hold';
        admin_reason_code: string;
        admin_note: string;
        utid: string;
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
            <Box p={1.5} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
                <Typography variant="body1" sx={{ fontWeight: 700, fontSize: '0.9rem' }}>Mark Review</Typography>
                {mobile && setReviewDialogOpen && (
                    <Button size="small" onClick={() => setReviewDialogOpen(false)} disabled={isReviewing} sx={{ minWidth: 'auto', p: 0.5 }}>✕</Button>
                )}
            </Box>
            <Box flex={1} sx={{ overflowY: 'auto' }} p={2}>
                <Box mb={2}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Decision"
                        value={reviewForm.decision}
                        onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as 'approve' | 'reject' | 'hold' })}
                        disabled={isReviewing}
                        slotProps={{
                            input: { sx: { fontSize: '0.75rem', height: '32px' } },
                            inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true, required: true }
                        }}
                    >
                        <MenuItem value="approve" sx={{ fontSize: '0.75rem' }}>Approve</MenuItem>
                        <MenuItem value="reject" sx={{ fontSize: '0.75rem' }}>Reject</MenuItem>
                        <MenuItem value="hold" sx={{ fontSize: '0.75rem' }}>Hold</MenuItem>
                    </TextField>
                </Box>
                <Box mb={2}>
                    <TextField
                        select
                        fullWidth
                        size="small"
                        label="Reason Code"
                        value={reviewForm.admin_reason_code}
                        onChange={(e) => setReviewForm({ ...reviewForm, admin_reason_code: e.target.value })}
                        disabled={isReviewing}
                        placeholder="Select..."
                        slotProps={{
                            input: { sx: { fontSize: '0.75rem', height: '32px' } },
                            inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true, required: true }
                        }}
                    >
                        {PREDEFINED_REASONS.map((reason) => (
                            <MenuItem key={reason.value} value={reason.value} sx={{ fontSize: '0.75rem' }}>
                                {reason.label}
                            </MenuItem>
                        ))}
                    </TextField>
                </Box>
                <RewardCatalogField reviewForm={reviewForm} setReviewForm={setReviewForm} isReviewing={isReviewing} />
                <Box mb={2}>
                    <TextField
                        fullWidth
                        size="small"
                        multiline
                        rows={2}
                        label="Internal Note"
                        value={reviewForm.admin_note}
                        onChange={(e) => setReviewForm({ ...reviewForm, admin_note: e.target.value })}
                        disabled={isReviewing}
                        placeholder="Add note..."
                        slotProps={{
                            input: { sx: { fontSize: '0.75rem' } },
                            inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                        }}
                    />
                </Box>
            </Box>
            <Box p={1.5} borderTop="1px solid" borderColor="divider" bgcolor="background.paper">
                <Button
                    fullWidth
                    variant="contained"
                    size="small"
                    onClick={handleReviewSubmit}
                    disabled={isReviewing || !reviewForm.admin_reason_code || !reviewForm.utid}
                    sx={{
                        background: 'linear-gradient(45deg, #213350, #6AB344)',
                        height: '32px',
                        fontSize: '0.75rem',
                    }}
                >
                    {isReviewing ? <CircularProgress size={18} color="inherit" /> : 'Submit Review'}
                </Button>
            </Box>
        </Box>
    );
}

function RewardCatalogField({ reviewForm, setReviewForm, isReviewing }: { reviewForm: any, setReviewForm: any, isReviewing: boolean }) {
    const { data: catalogResponse, isLoading } = useGetRewardCatalogsQuery({ status: 'ACTIVE', limit: 100 });
    const catalogs = catalogResponse?.items || [];

    return (
        <Box mb={2}>
            <TextField
                select
                fullWidth
                size="small"
                label="Reward Catalog"
                value={reviewForm.utid}
                onChange={(e) => setReviewForm({ ...reviewForm, utid: e.target.value })}
                disabled={isReviewing || isLoading}
                placeholder={isLoading ? "Loading..." : "Select catalog item..."}
                slotProps={{
                    input: { sx: { fontSize: '0.75rem', height: '32px' } },
                    inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true, required: true }
                }}
            >
                {catalogs.map((item: any) => (
                    <MenuItem key={item.id} value={item.utid} sx={{ fontSize: '0.75rem' }}>
                        {item.brandName} - {item.rewardName} ({item.currencyCode || item.currency})
                    </MenuItem>
                ))}
            </TextField>
        </Box>
    );
}

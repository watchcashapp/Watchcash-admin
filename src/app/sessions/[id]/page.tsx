"use client";

import { use, useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
  Chip,
  Divider,
  Button,
  Tabs,
  Tab,
  IconButton,
  Skeleton,
  Drawer,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';
import { ArrowBack, RateReview, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useGetSessionByIdQuery, useReviewSessionMutation, ReviewSessionRequest } from '@/store/api/sessionsApi';
import { Input, GroupedPermissionsSelect, useToast, PermissionGuard, DataTable } from '@/components/shared';
import { getFieldErrors } from '@/utils/form-errors';
import { usePermissions } from '@/hooks/usePermissions';

// Dynamic import for heavy map component
const LocationMap = dynamic(() => import('@/components/shared/LocationMap'), {
  ssr: false,
  loading: () => <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
});

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

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`session-tabpanel-${index}`}
      aria-labelledby={`session-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { hasPermission, isInitialized } = usePermissions();
  const [activeTab, setActiveTab] = useState(0);
  const [isReviewingSession, setIsReviewingSession] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [transactionsPage, setTransactionsPage] = useState(1);
  const [reviewsPage, setReviewsPage] = useState(1);
  const itemsPerPage = 6;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('sessions:list')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

  const { data: response, isLoading, error } = useGetSessionByIdQuery(resolvedParams.id);
  const [reviewSession, { isLoading: refreshingIsReviewing }] = useReviewSessionMutation();

  // Debug logging
  useEffect(() => {

  }, [resolvedParams.id, response, isLoading, error]);

  const [reviewDialogOpen, setReviewDialogOpen] = useState(false);
  const [reviewForm, setReviewForm] = useState<Partial<ReviewSessionRequest>>({
    decision: 'approve',
    reason: '',
    note: '',
    deduct_points: false,
    deduction_type: 'percentage',
    deduction_value: 0,
    block_user: false,
    block_minutes: 0,
  });

  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleReviewSubmit = async () => {
    if (!reviewForm.reason) {
      showError('Reason is required');
      return;
    }

    setFormErrors({});

    try {
      await reviewSession({
        sessionId: resolvedParams.id,
        data: reviewForm as ReviewSessionRequest,
      }).unwrap();
      showSuccess('Session reviewed successfully');
      setReviewDialogOpen(false);
    } catch (err: any) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors);
      }
      showError(err);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return 'N/A';
    const hours = Math.floor(duration / 3600);
    const minutes = Math.floor((duration % 3600) / 60);
    const seconds = duration % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    }
    return `${minutes}m ${seconds}s`;
  };

  if (isLoading) {
    return (
      <Box sx={{ p: 0 }}>
        {/* Header Skeleton */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
          <Skeleton variant="rectangular" width={140} height={28} sx={{ borderRadius: 1 }} />
          <Skeleton variant="rectangular" width={130} height={28} sx={{ borderRadius: 1 }} />
        </Box>
        
        {/* Title Skeleton */}
        <Skeleton variant="text" width="180px" height={36} sx={{ mb: 1.5, borderRadius: 1 }} />
        
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', lg: 'row' }, gap: 2 }}>
          <Paper sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {/* Tabs Skeleton */}
            <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, height: 36, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Skeleton width={60} height={20} />
              <Skeleton width={80} height={20} />
              <Skeleton width={100} height={20} />
            </Box>
            
            <Box sx={{ p: 3 }}>
              {/* Status Badge Skeleton */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                <Skeleton width={50} height={16} />
                <Skeleton variant="rectangular" width={70} height={20} sx={{ borderRadius: 1 }} />
              </Box>
              
              <Divider sx={{ my: 1 }} />
              
              {/* Info Section Skeleton */}
              <Skeleton width={160} height={24} sx={{ mb: 1.5 }} />
              <Grid container spacing={1}>
                {[...Array(6)].map((_, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Skeleton width={80} height={14} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rectangular" width="95%" height={26} sx={{ borderRadius: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
                {/* Map Skeleton */}
                <Grid size={{ xs: 12 }}>
                  <Box sx={{ mb: 1 }}>
                    <Skeleton width={80} height={14} sx={{ mb: 0.5 }} />
                    <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
                  </Box>
                </Grid>
              </Grid>
              
              <Divider sx={{ my: 1 }} />
              
              {/* User Section Skeleton */}
              <Skeleton width={140} height={24} sx={{ mb: 1.5 }} />
              <Grid container spacing={1} mb={2}>
                {[...Array(3)].map((_, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Skeleton width={80} height={14} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rectangular" width="95%" height={26} sx={{ borderRadius: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 1 }} />

              {/* Reward Section Skeleton */}
              <Skeleton width={150} height={24} sx={{ mb: 1.5 }} />
              <Grid container spacing={1}>
                {[...Array(3)].map((_, i) => (
                  <Grid key={i} size={{ xs: 12, md: 6 }}>
                    <Box sx={{ mb: 1 }}>
                      <Skeleton width={80} height={14} sx={{ mb: 0.5 }} />
                      <Skeleton variant="rectangular" width="95%" height={26} sx={{ borderRadius: 0.5 }} />
                    </Box>
                  </Grid>
                ))}
              </Grid>
            </Box>
          </Paper>
        </Box>
      </Box>
    );
  }

  if (error || !response?.data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
        >
          Back to Sessions
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            Session not found or error loading session details
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session ID: {resolvedParams.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Error: {error && 'message' in error ? error.message : 'Unknown error'}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Response: {JSON.stringify(response, null, 2)}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const sessionFallback = response.data as any;
  const session = sessionFallback.session || sessionFallback;

  const user = sessionFallback.user || {
    id: session.user_id || 'N/A',
    name: session.user_name || 'N/A',
    email: session.user_email || 'N/A',
  };

  const reward = sessionFallback.reward || {
    id: session.id || 'N/A',
    points_earned: session.points_earned || 0,
    calculated_at: session.created_at || new Date().toISOString(),
  };

  const wallet_transactions = sessionFallback.wallet_transactions || [];

  // Additional safety check
  if (!session || (!session.id && !session.session_id)) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{ mb: 3 }}
        >
          Back to Sessions
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error" sx={{ mb: 2 }}>
            No session data available
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Session ID: {resolvedParams.id}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Response data: {JSON.stringify(response?.data, null, 2)}
          </Typography>
        </Paper>
      </Box>
    );
  }

  const transactionColumns = [
    {
      id: 'transactionType',
      label: 'Type',
      minWidth: 100,
      format: (value: string) => (
        <Chip
          label={value}
          color={value === 'CREDIT' ? 'success' : 'error'}
          size="small"
          sx={{ fontWeight: 600, color: 'white' }}
        />
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      minWidth: 100,
      format: (value: number) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          {value}
        </Typography>
      ),
    },
    { id: 'reasonCode', label: 'Reason', minWidth: 150 },
    { id: 'referenceType', label: 'Reference Type', minWidth: 150 },
    {
      id: 'note',
      label: 'Note',
      minWidth: 250,
      format: (value: string) => value || 'N/A',
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 180,
      format: (value: string) => isMounted ? new Date(value).toLocaleString() : '',
    },
  ];

  // Review History columns
  const reviewColumns = [
    { id: 'reviewer', label: 'Reviewer', minWidth: 150 },
    { id: 'decision', label: 'Decision', minWidth: 120 },
    { id: 'notes', label: 'Notes', minWidth: 250 },
    { id: 'timestamp', label: 'Timestamp', minWidth: 180, format: (value: string) => isMounted ? new Date(value).toLocaleString() : '' },
  ];

  // Review History data
  const reviews = sessionFallback.reviews || [];

  const totalTransactionsPages = Math.ceil(wallet_transactions.length / itemsPerPage);
  const paginatedTransactions = wallet_transactions.slice((transactionsPage - 1) * itemsPerPage, transactionsPage * itemsPerPage);

  const totalReviewsPages = Math.ceil(reviews.length / itemsPerPage);
  const paginatedReviews = reviews.slice((reviewsPage - 1) * itemsPerPage, reviewsPage * itemsPerPage);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.back()}
          sx={{
            height: '28px',
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: 'rgba(33, 51, 80, 0.08)',
            },
            '& .MuiButton-startIcon': {
              mr: { xs: 0, sm: 0.5 },
              ml: { xs: 0, sm: -0.5 }
            }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Back to Sessions
          </Box>
        </Button>
        {hasPermission('sessions:review') && (
          <Button
            variant="contained"
            startIcon={<RateReview sx={{ fontSize: '1rem !important' }} />}
            onClick={() => setReviewDialogOpen(true)}
            sx={{
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              boxShadow: '0 2px 8px rgba(33, 51, 80, 0.3)',
              minWidth: { xs: 'auto', sm: '120px' },
              px: { xs: 1.5, sm: 2 },
              height: '28px',
              fontSize: '0.75rem',
              '&:hover': {
                background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
              },
              '& .MuiButton-startIcon': {
                mr: { xs: 0, sm: 0.5 },
                ml: { xs: 0, sm: -0.5 }
              }
            }}
          >
            <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
              Review Session
            </Box>
          </Button>
        )}
      </Box>

      <Typography
        variant="h5"
        sx={{
          mb: 1.5,
          fontWeight: 700,
          fontSize: '1.1rem',
          background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
        }}
      >
        Session Details
      </Typography>

      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={2}>
        <Paper
          sx={{
            flex: 1,
            minWidth: 0, // Allow the main content to shrink if the side panel needs space
            width: '100%',
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            sx={{
              flexShrink: 0,
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              minHeight: '36px',
              '& .MuiTabs-flexContainer': {
                height: '36px',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '0.8rem',
                fontWeight: 600,
                minHeight: '36px',
                py: 0.5,
              },
            }}
          >
            <Tab label="Details" />
            <Tab label="Transactions" />
            <Tab label="Review History" />
          </Tabs>

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 2 }}>
                {/* Status Badge */}
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                    Status:
                  </Typography>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status)}
                    sx={{ 
                      textTransform: 'capitalize', 
                      fontWeight: 600, 
                      fontSize: '0.65rem', 
                      height: '20px',
                      color: session.status === 'completed' ? 'white' : 'inherit'
                    }}
                  />
                </Box>

                <Divider sx={{ my: 1 }} />

                {/* Session Information */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                  Session Information
                </Typography>
                <Grid container spacing={1} mb={1}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Session ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontSize: '0.7rem',
                        }}
                      >
                        {session.session_id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Device ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontSize: '0.7rem',
                        }}
                      >
                        {session.device_id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Duration
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.1, fontWeight: 600, fontSize: '0.75rem' }}>
                        {formatDuration(session.duration_seconds)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Created At
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.1, fontSize: '0.75rem' }}>
                        {isMounted ? new Date(session.created_at).toLocaleString() : ''}
                      </Typography>
                    </Box>
                  </Grid>

                  {session.metadata?.app_name && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          App Name
                        </Typography>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.1,
                            p: 0.25,
                            px: 0.5,
                            bgcolor: 'action.hover',
                            borderRadius: 0.5,
                            fontFamily: 'monospace',
                            fontSize: '0.7rem',
                          }}
                        >
                          {session.metadata.app_name}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.risk_rating && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                          Risk Rating
                        </Typography>
                        <Box mt={0.1}>
                          <Chip
                            label={session.metadata.risk_rating}
                            color={session.metadata.risk_rating === 'low' ? 'success' : session.metadata.risk_rating === 'medium' ? 'warning' : 'error'}
                            sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.65rem', height: '20px' }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.lat && session.metadata?.lng && (
                    <Grid size={{ xs: 12 }}>
                      <Box mb={1}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 0.5, display: 'block', fontSize: '0.7rem' }}>
                          Location
                        </Typography>
                        <LocationMap
                          lat={session.metadata.lat}
                          lng={session.metadata.lng}
                          height={200}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 1 }} />

                {/* User Information */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                  User Information
                </Typography>
                <Grid container spacing={1} mb={1}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        User ID
                      </Typography>
                      <Typography
                        onClick={() => router.push(`/users/view/${user.id}`)}
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontSize: '0.7rem',
                          cursor: 'pointer',
                          color: 'primary.main',
                          '&:hover': {
                            textDecoration: 'underline'
                          }
                        }}
                      >
                        {user.id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Name
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontWeight: 600,
                          fontSize: '0.75rem',
                        }}
                      >
                        {user.name}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Email
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontSize: '0.75rem',
                        }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 1 }} />

                {/* Reward Information */}
                <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem' }}>
                  Reward Information
                </Typography>
                <Grid container spacing={1}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Reward ID
                      </Typography>
                      <Typography
                        variant="body2"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.1,
                          p: 0.25,
                          px: 0.5,
                          bgcolor: 'action.hover',
                          borderRadius: 0.5,
                          fontSize: '0.7rem',
                        }}
                      >
                        {reward.id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Points Earned
                      </Typography>
                      <Typography
                        variant="h6"
                        sx={{
                          mt: 0.1,
                          fontWeight: 700,
                          color: 'success.main',
                          fontSize: '1rem',
                        }}
                      >
                        {reward.points_earned}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={1}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                        Calculated At
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 0.1, fontSize: '0.75rem' }}>
                        {isMounted ? new Date(reward.calculated_at).toLocaleString() : ''}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            {hasPermission('users:view_transactions') && (
              <TabPanel value={activeTab} index={1}>
                <Box sx={{ px: 2, pb: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 700, fontSize: '0.9rem' }}>
                    Wallet Transactions ({wallet_transactions.length})
                  </Typography>
                  {wallet_transactions.length > 0 ? (
                    <>
                      <DataTable
                        columns={transactionColumns}
                        data={paginatedTransactions}
                        getRowId={(row: any) => row.id}
                      />
                      {/* Pagination */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Showing {paginatedTransactions.length} of {wallet_transactions.length} results
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => setTransactionsPage(transactionsPage - 1)}
                            disabled={transactionsPage <= 1}
                            sx={{
                              bgcolor: transactionsPage <= 1 ? 'action.disabled' : 'primary.main',
                              color: transactionsPage <= 1 ? 'text.disabled' : 'white',
                              '&:hover': {
                                bgcolor: transactionsPage <= 1 ? 'action.disabled' : 'primary.dark',
                              },
                            }}
                          >
                            <NavigateBefore />
                          </IconButton>
                          <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                            {transactionsPage} / {totalTransactionsPages || 1}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setTransactionsPage(transactionsPage + 1)}
                            disabled={transactionsPage >= (totalTransactionsPages || 1)}
                            sx={{
                              bgcolor: transactionsPage >= (totalTransactionsPages || 1) ? 'action.disabled' : 'primary.main',
                              color: transactionsPage >= (totalTransactionsPages || 1) ? 'text.disabled' : 'white',
                              '&:hover': {
                                bgcolor: transactionsPage >= (totalTransactionsPages || 1) ? 'action.disabled' : 'primary.dark',
                              },
                            }}
                          >
                            <NavigateNext />
                          </IconButton>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                      <Typography variant="body1" color="text.secondary">
                        No transactions found for this session
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </TabPanel>
            )}

            {hasPermission('sessions:review') && (
              <TabPanel value={activeTab} index={2}>
                <Box sx={{ p: 2 }}>
                  <Typography variant="body1" sx={{ mb: 2, fontWeight: 700, fontSize: '0.9rem' }}>
                    Review History ({reviews.length})
                  </Typography>
                  {reviews.length > 0 ? (
                    <>
                      <DataTable
                        columns={reviewColumns}
                        data={paginatedReviews}
                        getRowId={(row: any) => `${row.reviewer}-${row.timestamp}`}
                      />
                      {/* Pagination */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                        <Typography variant="body2" color="text.secondary">
                          Showing {paginatedReviews.length} of {reviews.length} results
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <IconButton
                            size="small"
                            onClick={() => setReviewsPage(reviewsPage - 1)}
                            disabled={reviewsPage <= 1}
                            sx={{
                              bgcolor: reviewsPage <= 1 ? 'action.disabled' : 'primary.main',
                              color: reviewsPage <= 1 ? 'text.disabled' : 'white',
                              '&:hover': {
                                bgcolor: reviewsPage <= 1 ? 'action.disabled' : 'primary.dark',
                              },
                            }}
                          >
                            <NavigateBefore />
                          </IconButton>
                          <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                            {reviewsPage} / {totalReviewsPages || 1}
                          </Typography>
                          <IconButton
                            size="small"
                            onClick={() => setReviewsPage(reviewsPage + 1)}
                            disabled={reviewsPage >= (totalReviewsPages || 1)}
                            sx={{
                              bgcolor: reviewsPage >= (totalReviewsPages || 1) ? 'action.disabled' : 'primary.main',
                              color: reviewsPage >= (totalReviewsPages || 1) ? 'text.disabled' : 'white',
                              '&:hover': {
                                bgcolor: reviewsPage >= (totalReviewsPages || 1) ? 'action.disabled' : 'primary.dark',
                              },
                            }}
                          >
                            <NavigateNext />
                          </IconButton>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                      <Typography variant="body1" color="text.secondary">
                        No reviews found for this session
                      </Typography>
                    </Paper>
                  )}
                </Box>
              </TabPanel>
            )}
          </Box>
        </Paper>

        {/* Mobile Drawer */}
        <Drawer
          anchor="right"
          open={reviewDialogOpen}
          onClose={() => !refreshingIsReviewing && setReviewDialogOpen(false)}
          sx={{ display: { xs: 'block', lg: 'none' } }}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
              borderTopLeftRadius: { xs: 16, sm: 0 },
              borderBottomLeftRadius: { xs: 0, sm: 0 },
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            }
          }}
        >
          <ReviewFormComponent
            reviewForm={reviewForm}
            setReviewForm={setReviewForm}
            formErrors={formErrors}
            refreshingIsReviewing={refreshingIsReviewing}
            handleReviewSubmit={handleReviewSubmit}
            setReviewDialogOpen={setReviewDialogOpen}
            reward={reward}
          />
        </Drawer>

        <Box
          sx={{
            display: { xs: 'none', lg: reviewDialogOpen ? 'flex' : 'none' },
            flexDirection: 'column',
            width: 400,
            flexShrink: 0,
            position: 'sticky',
            top: 24,
            height: 'calc(100vh - 120px)',
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
              borderRadius: 2,
            }}
          >
            <ReviewFormComponent
              reviewForm={reviewForm}
              setReviewForm={setReviewForm}
              formErrors={formErrors}
              refreshingIsReviewing={refreshingIsReviewing}
              handleReviewSubmit={handleReviewSubmit}
              setReviewDialogOpen={setReviewDialogOpen}
              reward={reward}
            />
          </Paper>
        </Box>
      </Box>
    </Box>
  );
}

function ReviewFormComponent({
  reviewForm,
  setReviewForm,
  formErrors,
  refreshingIsReviewing,
  handleReviewSubmit,
  setReviewDialogOpen,
  reward
}: any) {
  return (
    <Box display="flex" flexDirection="column" flex={1} minHeight={0} sx={{ overflow: 'hidden' }}>
      <Box
        p={2}
        display="flex"
        alignItems="center"
        justifyContent="space-between"
        borderBottom="1px solid"
        borderColor="divider"
      >
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Manual Review</Typography>
        <Button
          size="small"
          onClick={() => setReviewDialogOpen(false)}
          disabled={refreshingIsReviewing}
          sx={{ minWidth: 'auto', p: 1 }}
        >
          ✕
        </Button>
      </Box>

      <Box
        flex={1}
        sx={{
          minHeight: 0,
        }}
        p={3}
      >
        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Decision"
              value={reviewForm.decision}
              onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as any })}
              disabled={refreshingIsReviewing}
              error={!!formErrors.decision}
              helperText={formErrors.decision}
              InputLabelProps={{ shrink: true, required: true }}
            >
              <MenuItem value="approve">Approve</MenuItem>
              <MenuItem value="reject">Reject</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              select
              fullWidth
              label="Reason Code"
              value={reviewForm.reason}
              onChange={(e) => setReviewForm({ ...reviewForm, reason: e.target.value })}
              disabled={refreshingIsReviewing}
              error={!!formErrors.reason}
              helperText={formErrors.reason}
              placeholder="Select a reason..."
              InputLabelProps={{ shrink: true, required: true }}
            >
              {PREDEFINED_REASONS.map((reason) => (
                <MenuItem key={reason.value} value={reason.value}>
                  {reason.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Internal Note"
              placeholder="Add admin note..."
              value={reviewForm.note}
              onChange={(e) => setReviewForm({ ...reviewForm, note: e.target.value })}
              disabled={refreshingIsReviewing}
              error={!!formErrors.note}
              helperText={formErrors.note}
              InputLabelProps={{ shrink: true }}
            />
          </Grid>

          {reviewForm.deduct_points && reward && (
            <Grid size={{ xs: 12 }}>
              <Box pl={2} borderLeft="2px solid" borderColor="divider">
                <Grid container spacing={2}>
                  <Grid size={{ xs: 12 }}>
                    <Typography variant="body2" color="text.secondary" mb={1}>Deduction Type</Typography>
                    <Box display="flex" gap={1}>
                      <Button
                        variant={reviewForm.deduction_type === 'percentage' ? 'outlined' : 'text'}
                        size="small"
                        onClick={() => setReviewForm({ ...reviewForm, deduction_type: 'percentage' })}
                        sx={{ borderRadius: 4, px: 2 }}
                      >
                        Percentage
                      </Button>
                      <Button
                        variant={reviewForm.deduction_type === 'fixed' ? 'outlined' : 'text'}
                        size="small"
                        onClick={() => setReviewForm({ ...reviewForm, deduction_type: 'fixed' })}
                        sx={{ borderRadius: 4, px: 2 }}
                      >
                        Fixed
                      </Button>
                    </Box>
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      type="number"
                      fullWidth
                      size="small"
                      label="Value"
                      value={reviewForm.deduction_value}
                      onChange={(e) => setReviewForm({ ...reviewForm, deduction_value: Number(e.target.value) })}
                      disabled={refreshingIsReviewing}
                      InputProps={{
                        endAdornment: reviewForm.deduction_type === 'percentage' ? <Typography color="text.secondary">%</Typography> : null
                      }}
                    />
                    {reviewForm.deduction_type === 'percentage' && reviewForm.deduction_value && (
                      <Typography variant="caption" color="text.secondary" display="block" mt={0.5}>
                        ({Math.round((reward.points_earned * (reviewForm.deduction_value || 0)) / 100)} points will be deducted)
                      </Typography>
                    )}
                  </Grid>
                </Grid>
              </Box>
            </Grid>
          )}
        </Grid>
      </Box>

      <Box p={2} borderTop="1px solid" borderColor="divider">
        <Button
          onClick={handleReviewSubmit}
          variant="contained"
          fullWidth
          disabled={refreshingIsReviewing || !reviewForm.reason}
          sx={{
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            py: 1.5,
          }}
        >
          {refreshingIsReviewing ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
        </Button>
      </Box>
    </Box>
  );
}

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
  Tabs,
  Tab,
} from '@mui/material';
import { ArrowBack, RateReview } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useGetSessionByIdQuery, useReviewSessionMutation, ReviewSessionRequest } from '@/store/api/sessionsApi';
import { DataTable, LocationMap, useToast } from '@/components/shared';
import {
  Drawer,
  TextField,
  MenuItem,
  FormControlLabel,
  Switch,
} from '@mui/material';

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
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SessionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [activeTab, setActiveTab] = useState(0);
  const [isReviewingSession, setIsReviewingSession] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: response, isLoading, error } = useGetSessionByIdQuery(resolvedParams.id);
  const [reviewSession, { isLoading: refreshingIsReviewing }] = useReviewSessionMutation();

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

  const handleReviewSubmit = async () => {
    if (!reviewForm.reason) {
      showError('Reason is required');
      return;
    }

    try {
      await reviewSession({
        sessionId: resolvedParams.id,
        data: reviewForm as ReviewSessionRequest,
      }).unwrap();
      showSuccess('Session reviewed successfully');
      setReviewDialogOpen(false);
    } catch (err: any) {
      showError(err?.data?.message || err?.message || 'Failed to review session');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'success';
      case 'completed':
        return 'info';
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (error || !response?.data) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/sessions')}
          sx={{ mb: 3 }}
        >
          Back to Sessions
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Session not found or error loading session details
          </Typography>
        </Paper>
      </Box>
    );
  }

  const { session, user, reward, wallet_transactions } = response.data;

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
          sx={{ fontWeight: 500 }}
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

  // Mock review history data
  const mockReviews = [
    { id: 'r1', reviewer: 'Admin', decision: 'Approve', notes: 'All good', timestamp: '2024-01-01T10:00:00Z' },
    { id: 'r2', reviewer: 'Supervisor', decision: 'Reject', notes: 'Insufficient info', timestamp: '2024-01-02T14:30:00Z' },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/sessions')}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
            '& .MuiButton-startIcon': {
              mr: { xs: 0, sm: 1 },
              ml: { xs: 0, sm: -0.5 }
            }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Back to Sessions
          </Box>
        </Button>
        <Button
          variant="contained"
          startIcon={<RateReview />}
          onClick={() => setReviewDialogOpen(true)}
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
            minWidth: { xs: 'auto', sm: '160px' },
            px: { xs: 2, sm: 3 },
            '&:hover': {
              background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
            },
            '& .MuiButton-startIcon': {
              mr: { xs: 0, sm: 1 },
              ml: { xs: 0, sm: -0.5 }
            }
          }}
        >
          <Box component="span" sx={{ display: { xs: 'none', sm: 'inline' } }}>
            Review Session
          </Box>
        </Button>
      </Box>

      <Typography
        variant="h4"
        sx={{
          mb: 3,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Session Details
      </Typography>

      <Box display="flex" flexDirection={{ xs: 'column', lg: 'row' }} gap={3}>
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
              px: 4,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontSize: '1rem',
                fontWeight: 600,
              },
            }}
          >
            <Tab label="Details" />
            <Tab label="Transactions" />
            <Tab label="Review History" />
          </Tabs>

          <Box sx={{ flexGrow: 1, minHeight: 0 }}>

            <TabPanel value={activeTab} index={0}>
              <Box sx={{ p: 4 }}>
                {/* Status Badge */}
                <Box display="flex" alignItems="center" gap={2} mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Status:
                  </Typography>
                  <Chip
                    label={session.status}
                    color={getStatusColor(session.status)}
                    sx={{ textTransform: 'capitalize', fontWeight: 600, fontSize: '0.875rem' }}
                  />
                </Box>

                <Divider sx={{ my: 3 }} />

                {/* Session Information */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Session Information
                </Typography>
                <Grid container spacing={3} mb={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Session ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {session.session_id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Device ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {session.device_id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Duration
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5, fontWeight: 600 }}>
                        {formatDuration(session.duration_seconds)}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Created At
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {isMounted ? new Date(session.created_at).toLocaleString() : ''}
                      </Typography>
                    </Box>
                  </Grid>

                  {session.metadata?.start_time && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Start Time
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {isMounted ? new Date(session.metadata.start_time).toLocaleString() : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.end_time && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          End Time
                        </Typography>
                        <Typography variant="body1" sx={{ mt: 0.5 }}>
                          {isMounted ? new Date(session.metadata.end_time).toLocaleString() : ''}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.app_name && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          App Name
                        </Typography>
                        <Typography
                          variant="body1"
                          sx={{
                            mt: 0.5,
                            p: 1,
                            bgcolor: 'action.hover',
                            borderRadius: 1,
                            fontFamily: 'monospace',
                            fontSize: '0.875rem',
                          }}
                        >
                          {session.metadata.app_name}
                        </Typography>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.risk_rating && (
                    <Grid size={{ xs: 12, md: 6 }}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                          Risk Rating
                        </Typography>
                        <Box mt={0.5}>
                          <Chip
                            label={session.metadata.risk_rating}
                            color={session.metadata.risk_rating === 'low' ? 'success' : session.metadata.risk_rating === 'medium' ? 'warning' : 'error'}
                            sx={{ textTransform: 'capitalize', fontWeight: 600 }}
                          />
                        </Box>
                      </Box>
                    </Grid>
                  )}

                  {session.metadata?.lat && session.metadata?.lng && (
                    <Grid size={{ xs: 12 }}>
                      <Box mb={2}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, mb: 1, display: 'block' }}>
                          Location
                        </Typography>
                        <LocationMap
                          lat={session.metadata.lat}
                          lng={session.metadata.lng}
                          height={250}
                        />
                      </Box>
                    </Grid>
                  )}
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* User Information */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  User Information
                </Typography>
                <Grid container spacing={3} mb={4}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        User ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {user.id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Name
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontWeight: 600,
                        }}
                      >
                        {user.name}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Email
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                        }}
                      >
                        {user.email}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>

                <Divider sx={{ my: 3 }} />

                {/* Reward Information */}
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                  Reward Information
                </Typography>
                <Grid container spacing={3}>
                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Reward ID
                      </Typography>
                      <Typography
                        variant="body1"
                        sx={{
                          fontFamily: 'monospace',
                          mt: 0.5,
                          p: 1,
                          bgcolor: 'action.hover',
                          borderRadius: 1,
                          fontSize: '0.875rem',
                        }}
                      >
                        {reward.id}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Points Earned
                      </Typography>
                      <Typography
                        variant="h5"
                        sx={{
                          mt: 0.5,
                          fontWeight: 700,
                          color: 'success.main',
                        }}
                      >
                        {reward.points_earned}
                      </Typography>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, md: 6 }}>
                    <Box mb={2}>
                      <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                        Calculated At
                      </Typography>
                      <Typography variant="body1" sx={{ mt: 0.5 }}>
                        {isMounted ? new Date(reward.calculated_at).toLocaleString() : ''}
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Box sx={{ px: 4, pb: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Wallet Transactions ({wallet_transactions.length})
                </Typography>
                {wallet_transactions.length > 0 ? (
                  <DataTable
                    columns={transactionColumns}
                    data={wallet_transactions}
                    getRowId={(row) => row.id}
                  />
                ) : (
                  <Paper sx={{ p: 4, textAlign: 'center', bgcolor: 'action.hover' }}>
                    <Typography variant="body1" color="text.secondary">
                      No transactions found for this session
                    </Typography>
                  </Paper>
                )}
              </Box>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Box sx={{ p: 4 }}>
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Review History ({mockReviews.length})
                </Typography>
                <DataTable
                  columns={reviewColumns}
                  data={mockReviews}
                  getRowId={(row) => row.id}
                />
              </Box>
            </TabPanel>
          </Box>
        </Paper>

        {(reviewDialogOpen || { xs: false, lg: true }) && (
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
            <ReviewForm />
          </Drawer>
        )}

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
            <ReviewForm />
          </Paper>
        </Box>
      </Box>
    </Box>
  );

  function ReviewForm() {
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
                InputLabelProps={{ shrink: true, required: true }}
              >
                <MenuItem value="approve">Approve</MenuItem>
                <MenuItem value="reject">Reject</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                required
                label="Reason"
                value={reviewForm.reason}
                onChange={(e) => setReviewForm({ ...reviewForm, reason: e.target.value })}
                disabled={refreshingIsReviewing}
                placeholder="Select a reason..."
              />
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
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600}>Deduct Points</Typography>
                <Switch
                  checked={reviewForm.deduct_points}
                  onChange={(e) => setReviewForm({ ...reviewForm, deduct_points: e.target.checked })}
                  disabled={refreshingIsReviewing}
                />
              </Box>
            </Grid>

            {reviewForm.deduct_points && (
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

            <Grid size={{ xs: 12 }}>
              <Divider sx={{ my: 1 }} />
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2" fontWeight={600}>Block User</Typography>
                <Switch
                  checked={reviewForm.block_user}
                  onChange={(e) => setReviewForm({ ...reviewForm, block_user: e.target.checked })}
                  disabled={refreshingIsReviewing}
                />
              </Box>
            </Grid>

            {reviewForm.block_user && (
              <Grid size={{ xs: 12 }}>
                <Box pl={2} borderLeft="2px solid" borderColor="divider">
                  <TextField
                    type="number"
                    size="small"
                    fullWidth
                    label="Block Duration (minutes)"
                    value={reviewForm.block_minutes}
                    onChange={(e) => setReviewForm({ ...reviewForm, block_minutes: Number(e.target.value) })}
                    disabled={refreshingIsReviewing}
                    helperText="User won't be able to create sessions"
                    InputLabelProps={{ shrink: true }}
                  />
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
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              py: 1.5,
            }}
          >
            {refreshingIsReviewing ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
          </Button>
        </Box>
      </Box>
    );
  }
}

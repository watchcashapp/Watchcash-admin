"use client";

import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  Chip,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
} from '@mui/material';
import {
  Search,
  Add,
  Visibility,
  RateReview,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, Column, useToast } from '@/components/shared';
import { useGetRewardRedemptionsQuery, useReviewRewardRedemptionMutation, RewardRedemption } from '@/store/api/rewardRedemptionsApi';

// Mock data removed
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

export default function RewardRedemptionsPage() {
  const router = useRouter();
  const { data: response, isLoading, error } = useGetRewardRedemptionsQuery({});
  const redemptions = response?.data?.items || [];
  const { showSuccess, showError } = useToast();
  const [reviewRewardRedemption, { isLoading: isReviewing }] = useReviewRewardRedemptionMutation();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);

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

  const handleReviewSubmit = async () => {
    if (!selectedRedemption) return;
    try {
      await reviewRewardRedemption({
        id: selectedRedemption.id,
        data: reviewForm,
      }).unwrap();
      showSuccess('Reward redemption reviewed successfully');
      setReviewDialogOpen(false);
      handleMenuClose();
    } catch (err: any) {
      showError(err?.data?.message || err?.message || 'Failed to review redemption');
    }
  };

  const handleReviewClick = (redemption: RewardRedemption) => {
    setSelectedRedemption(redemption);
    setReviewDialogOpen(true);
    handleMenuClose();
  };

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, redemption: RewardRedemption) => {
    setAnchorEl(event.currentTarget);
    setSelectedRedemption(redemption);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRedemption(null);
  };

  const handleView = (redemption: RewardRedemption) => {
    handleMenuClose();
    router.push(`/reward-redemptions/${redemption.id}`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'linear-gradient(45deg, #f59e0b, #d97706)';
      case 'APPROVED':
        return 'linear-gradient(45deg, #10b981, #059669)';
      case 'REJECTED':
        return 'linear-gradient(45deg, #ef4444, #dc2626)';
      case 'FAILED':
        return 'linear-gradient(45deg, #ef4444, #dc2626)';
      case 'PROCESSED':
        return 'linear-gradient(45deg, #3b82f6, #2563eb)';
      default:
        return 'linear-gradient(45deg, #6b7280, #4b5563)';
    }
  };

  const columns: Column<RewardRedemption>[] = [
    {
      id: 'id',
      label: 'ID',
      minWidth: 150,
      format: (value: string) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {value.split('-')[0]}...
        </Typography>
      ),
    },
    {
      id: 'userId',
      label: 'User ID',
      minWidth: 150,
      format: (value: string) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {value.split('-')[0]}...
        </Typography>
      ),
    },
    {
      id: 'rewardType',
      label: 'Type',
      align: 'center',
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => (
        <Typography sx={{ fontWeight: 600, color: '#667eea' }}>
          {isMounted ? value?.toLocaleString() : ''}
        </Typography>
      ),
    },
    {
      id: 'rewardValue',
      label: 'Value',
      align: 'right',
      minWidth: 100,
      format: (value: number | undefined, row: RewardRedemption) => (
        <Typography sx={{ fontWeight: 600 }}>
          {value ? `${row.rewardCurrency} ${value}` : '-'}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          sx={{
            background: getStatusColor(value),
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 180,
      format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    },
  ];

  const filteredData = redemptions.filter((redemption: RewardRedemption) => {
    const matchesSearch = !search ||
      redemption.id.toLowerCase().includes(search.toLowerCase()) ||
      redemption.userId.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = !status || redemption.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <DashboardLayout>
      <Box sx={{ width: '100%', overflow: 'hidden' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
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
            Reward Redemptions
          </Typography>
        </Box>

        {/* Filters */}
        <Box
          sx={{
            mb: 3,
            p: { xs: 1.5, sm: 2 },
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
          <Box display="flex" gap={2}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name, email, or reward..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667eea', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }
              }}
              sx={{
                flex: 1,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            />
            <TextField
              select
              size="small"
              label="Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              sx={{
                minWidth: 150,
                '& .MuiOutlinedInput-root': {
                  '&:hover fieldset': {
                    borderColor: '#667eea',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#667eea',
                  },
                },
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="PENDING">Pending</MenuItem>
              <MenuItem value="APPROVED">Approved</MenuItem>
              <MenuItem value="REJECTED">Rejected</MenuItem>
              <MenuItem value="PROCESSED">Processed</MenuItem>
            </TextField>
          </Box>
        </Box>

        <DataTable
          columns={columns}
          data={filteredData}
          getRowId={(row) => row.id}
          emptyMessage="No reward redemptions found. Try adjusting your filters."
          onView={handleView}
        />

        {/* Action Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          PaperProps={{
            elevation: 3,
            sx: {
              minWidth: 200,
              '& .MuiList-root': {
                padding: '8px',
              },
            },
          }}
        >
          <MenuItem onClick={() => selectedRedemption && handleView(selectedRedemption)}>
            <Visibility sx={{ mr: 1, fontSize: '1.2rem', color: '#10b981' }} />
            View Details
          </MenuItem>
        </Menu>

        <Drawer
          anchor="right"
          open={reviewDialogOpen}
          onClose={() => !isReviewing && setReviewDialogOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
              borderTopLeftRadius: { xs: 16, sm: 0 },
              borderBottomLeftRadius: { xs: 0, sm: 0 },
              boxShadow: '-4px 0 24px rgba(0,0,0,0.1)',
            }
          }}
        >
          <Box display="flex" flexDirection="column" flex={1} minHeight={0} sx={{ overflow: 'hidden' }}>
            <Box p={2} display="flex" alignItems="center" justifyContent="space-between" borderBottom="1px solid" borderColor="divider">
              <Typography variant="h6" sx={{ fontWeight: 700 }}>Mark Review</Typography>
              <Button size="small" onClick={() => setReviewDialogOpen(false)} disabled={isReviewing} sx={{ minWidth: 'auto', p: 1 }}>✕</Button>
            </Box>
            <Box flex={1} sx={{ overflowY: 'auto' }} p={3}>
              <Box mb={3}>
                <TextField select fullWidth label="Decision" value={reviewForm.decision} onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as 'approve' | 'reject' | 'hold' })} disabled={isReviewing} InputLabelProps={{ shrink: true, required: true }}>
                  <MenuItem value="approve">Approve</MenuItem>
                  <MenuItem value="reject">Reject</MenuItem>
                  <MenuItem value="hold">Hold</MenuItem>
                </TextField>
              </Box>
              <Box mb={3}>
                <TextField fullWidth label="Reason Code" value={reviewForm.admin_reason_code} onChange={(e) => setReviewForm({ ...reviewForm, admin_reason_code: e.target.value })} disabled={isReviewing} placeholder="E.g. valid_activity" />
                <Box mt={2} display="flex" flexWrap="wrap" gap={1}>
                  {PREDEFINED_REASONS.map((reason) => (
                    <Chip
                      key={reason.value}
                      label={reason.label}
                      variant={reviewForm.admin_reason_code === reason.value ? 'filled' : 'outlined'}
                      color={reviewForm.admin_reason_code === reason.value ? 'primary' : 'default'}
                      onClick={() => setReviewForm({ ...reviewForm, admin_reason_code: reason.value })}
                      disabled={isReviewing}
                      sx={{ cursor: 'pointer', '&:hover': { backgroundColor: 'action.hover' } }}
                    />
                  ))}
                </Box>
              </Box>
              <Box mb={3}>
                <TextField fullWidth multiline rows={3} label="Internal Note" value={reviewForm.admin_note} onChange={(e) => setReviewForm({ ...reviewForm, admin_note: e.target.value })} disabled={isReviewing} placeholder="Add admin note..." InputLabelProps={{ shrink: true }} />
              </Box>
            </Box>
            <Box p={2} borderTop="1px solid" borderColor="divider" bgcolor="background.paper">
              <Button fullWidth variant="contained" onClick={handleReviewSubmit} disabled={isReviewing} sx={{ background: 'linear-gradient(45deg, #667eea, #764ba2)' }}>
                {isReviewing ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </DashboardLayout>
  );
}

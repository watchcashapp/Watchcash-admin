"use client";

import React, { useState, useEffect, useMemo } from 'react';
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
  Grid,
  FormControl,
  InputLabel,
  Select,
  Drawer,
  MenuItem,
  Alert,
} from '@mui/material';
import {
  Search,
  NavigateBefore,
  NavigateNext,
  FileDownload,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { config } from '@/config/env';
import { DataTable, Column, useToast, TablePagination } from '@/components/shared';
import { useGetRewardRedemptionsQuery, useReviewRewardRedemptionMutation, RewardRedemption } from '@/store/api/rewardRedemptionsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { getTokenFromCookie } from "@/utils/auth";

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
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();

  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [limit, setLimit] = useState(6);
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);
  const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
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

  const hasFilters = search || status || fromDate || toDate;

  useEffect(() => {
    reset();
  }, [search, status, fromDate, toDate, reset]);

  const { data: response, isLoading, error } = useGetRewardRedemptionsQuery({
    search,
    status,
    from: fromDate,
    to: toDate,
    cursor,
    limit,
  });

  const [reviewRewardRedemption, { isLoading: isReviewing }] = useReviewRewardRedemptionMutation();

  const redemptions = response?.items || [];
  const pagination = response?.pagination;

  const handleReviewSubmit = async () => {
    if (!selectedRedemption) return;
    try {
      await reviewRewardRedemption({
        id: selectedRedemption.id,
        data: reviewForm,
      }).unwrap();
      showSuccess('Reward redemption reviewed successfully');
      setReviewDialogOpen(false);
      setSelectedRedemption(null);
    } catch (err: any) {
      showError(err?.data?.message || err?.message || 'Failed to review redemption');
    }
  };

  const handleReviewClick = (redemption: RewardRedemption) => {
    setSelectedRedemption(redemption);
    setReviewDialogOpen(true);
  };

  const handleView = (redemption: RewardRedemption) => {
    if (!hasPermission('reward_redemptions:view')) {
      showError('You do not have permission to view reward redemption details');
      return;
    }
    router.push(`/reward-redemptions/${redemption.id}`);
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (status) queryParams.append("status", status);
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);

      const accessToken = getTokenFromCookie("accessToken");
      const url = `${config.apiUrl}/admin/reward-redemptions/export?${queryParams.toString()}`;

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
      a.download = `reward_redemptions_export_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showSuccess('Export started successfully');
    } catch (err) {
      showError('Failed to export reward redemptions');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'linear-gradient(45deg, #f59e0b, #d97706)';
      case 'APPROVED':
        return 'linear-gradient(45deg, #10b981, #059669)';
      case 'REJECTED':
      case 'FAILED':
        return 'linear-gradient(45deg, #ef4444, #dc2626)';
      case 'PROCESSED':
        return 'linear-gradient(45deg, #3b82f6, #2563eb)';
      default:
        return 'linear-gradient(45deg, #6b7280, #4b5563)';
    }
  };

  const columns: Column<RewardRedemption>[] = useMemo(() => [
    {
      id: 'id',
      label: 'ID',
      minWidth: 150,
      format: (value: string) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.8rem' }}>
          {value?.split('-')[0]}...
        </Typography>
      ),
    },
    {
      id: 'userName',
      label: 'User',
      minWidth: 150,
      format: (value: string | undefined, row: RewardRedemption) => (
        <Typography sx={{ fontWeight: 500, fontSize: '0.8rem' }}>
          {value || (row.userId ? `${row.userId.split('-')[0]}...` : 'N/A')}
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
            background: 'linear-gradient(45deg, #213350, #6AB344)',
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
        <Typography 
          sx={{ 
            fontWeight: 600, 
            color: (theme: any) => theme.palette.mode === 'dark' ? 'secondary.main' : '#213350', 
            fontSize: '0.8rem' 
          }}
        >
          {value?.toLocaleString()}
        </Typography>
      ),
    },
    {
      id: 'rewardValue',
      label: 'Value',
      align: 'right',
      minWidth: 100,
      format: (value: number | undefined, row: RewardRedemption) => (
        <Typography sx={{ fontWeight: 600, fontSize: '0.75rem', whiteSpace: 'nowrap' }}>
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
            fontSize: '0.7rem'
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 180,
      format: (value: string) => value ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : 'N/A',
    },
  ], []);

  return (
    <PermissionGuard permission="reward_redemptions:list">
      <Box sx={{ width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
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
            Reward Redemptions
          </Typography>
          {hasPermission('reward_redemptions:list') && (
            <Box display="flex" gap={1}>
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
            </Box>
          )}
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
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                slotProps={{
                  input: { sx: { fontSize: '0.75rem', height: '32px' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                    bgcolor: 'background.paper',
                    px: 0.5,
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                slotProps={{
                  input: { sx: { fontSize: '0.75rem', height: '32px' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                    bgcolor: 'background.paper',
                    px: 0.5,
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
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
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                  '& .MuiSelect-select': {
                    py: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                <MenuItem value="PENDING" sx={{ fontSize: '0.75rem' }}>Pending</MenuItem>
                <MenuItem value="APPROVED" sx={{ fontSize: '0.75rem' }}>Approved</MenuItem>
                <MenuItem value="REJECTED" sx={{ fontSize: '0.75rem' }}>Rejected</MenuItem>
                <MenuItem value="PROCESSED" sx={{ fontSize: '0.75rem' }}>Processed</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="Search"
                placeholder="ID or User ID"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
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
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setSearch('');
                  setStatus('');
                  setFromDate('');
                  setToDate('');
                  reset();
                }}
                disabled={!hasFilters}
                sx={{
                  height: '32px',
                  minHeight: '32px',
                  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#213350',
                  color: (theme: any) => theme.palette.mode === 'dark' ? 'text.secondary' : '#213350',
                  fontSize: '0.7rem',
                  '&:hover': {
                    borderColor: '#6AB344',
                    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(106, 179, 68, 0.08)' : 'rgba(33, 51, 80, 0.04)',
                  },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8rem' }}>
            Failed to load redemptions. Please try again.
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={redemptions}
          isLoading={isLoading}
          getRowId={(row: any) => row.id}
          emptyMessage="No reward redemptions found. Try adjusting your filters."
          onView={hasPermission('reward_redemptions:view') ? handleView : undefined}
        />

        <TablePagination
          pageNumber={pageNumber}
          limit={limit}
          onLimitChange={(newLimit: number) => {
            setLimit(newLimit);
            reset();
          }}
          canGoBack={canGoBack}
          hasMore={!!pagination?.hasMore && !!pagination?.nextCursor}
          onNext={() => goNext(pagination?.nextCursor)}
          onPrevious={goPrevious}
          totalResults={pagination?.total}
          resultsOnPage={redemptions.length}
          isLoading={isLoading}
        />

        {/* Review Drawer */}
        <Drawer
          anchor="right"
          open={reviewDialogOpen}
          onClose={() => !isReviewing && setReviewDialogOpen(false)}
          PaperProps={{
            sx: {
              width: { xs: '100%', sm: 400 },
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
                <TextField select fullWidth label="Decision" value={reviewForm.decision} onChange={(e) => setReviewForm({ ...reviewForm, decision: e.target.value as 'approve' | 'reject' | 'hold' })} disabled={isReviewing} slotProps={{ inputLabel: { shrink: true, required: true } }}>
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
                <TextField fullWidth multiline rows={3} label="Internal Note" value={reviewForm.admin_note} onChange={(e) => setReviewForm({ ...reviewForm, admin_note: e.target.value })} disabled={isReviewing} placeholder="Add admin note..." slotProps={{ inputLabel: { shrink: true } }} />
              </Box>
            </Box>
            <Box p={2} borderTop="1px solid" borderColor="divider" bgcolor="background.paper">
              <Button fullWidth variant="contained" onClick={handleReviewSubmit} disabled={isReviewing} sx={{ background: 'linear-gradient(45deg, #213350, #6AB344)' }}>
                {isReviewing ? <CircularProgress size={24} color="inherit" /> : 'Submit Review'}
              </Button>
            </Box>
          </Box>
        </Drawer>
      </Box>
    </PermissionGuard>
  );
}

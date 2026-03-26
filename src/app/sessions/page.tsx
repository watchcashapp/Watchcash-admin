"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  MenuItem,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Grid,
} from '@mui/material';
import { Visibility, NavigateBefore, NavigateNext, GetApp } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { config } from '@/config/env';
import { DataTable, useToast } from '@/components/shared';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

import { useMemo } from 'react';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

export default function SessionsPage() {
  const router = useRouter();
  const { showError } = useToast();
  const [limit, setLimit] = useState(6);
  const [status, setStatus] = useState('');
  const [userName, setUserName] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [debouncedUserName, setDebouncedUserName] = useState('');
  const [debouncedDeviceId, setDebouncedDeviceId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
  const { hasPermission } = usePermissions();

  // Debounce User Name and Device ID
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedUserName(userName);
      setDebouncedDeviceId(deviceId);
    }, 500);
    return () => clearTimeout(timer);
  }, [userName, deviceId]);

  // Reset page when filters change
  useEffect(() => {
    reset();
  }, [status, debouncedUserName, debouncedDeviceId, fromDate, toDate, reset]);

  const { data: sessionsData, isLoading } = useGetSessionsQuery({
    cursor,
    limit,
    status: status || undefined,
    userName: debouncedUserName || undefined,
    deviceId: debouncedDeviceId || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }, {
    refetchOnMountOrArgChange: true
  });

  const sessions = sessionsData?.sessions || [];
  const pagination = sessionsData?.pagination;

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
    const minutes = Math.floor(duration / 60);
    const seconds = duration % 60;
    return `${minutes}m ${seconds}s`;
  };

  const columns = useMemo(() => [
    {
      id: 'session_id',
      label: 'Session ID',
      minWidth: 200,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {value?.substring(0, 20)}...
        </Typography>
      ),
    },
    {
      id: 'user_name',
      label: 'User Name',
      minWidth: 150,
      format: (value: any, row: any) => (
        <Typography 
          variant="body2" 
          onClick={() => router.push(`/users/view/${row.user_id}`)}
          sx={{ 
            color: 'primary.main', 
            cursor: 'pointer', 
            fontWeight: 600,
            '&:hover': { textDecoration: 'underline' } 
          }}
        >
          {value}
        </Typography>
      ),
    },
    {
      id: 'user_email',
      label: 'User Email',
      minWidth: 200,
    },
    {
      id: 'device_id',
      label: 'Device ID',
      minWidth: 150,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.7rem' }}>
          {value}
        </Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 120,
      format: (value: any) => (
        <Chip
          label={value}
          color={getStatusColor(value)}
          size="small"
          sx={{ textTransform: 'capitalize', fontWeight: 500 }}
        />
      ),
    },
    {
      id: 'duration_seconds',
      label: 'Duration',
      minWidth: 120,
      format: (value: any) => formatDuration(value),
    },
    {
      id: 'points_earned',
      label: 'Points',
      minWidth: 100,
      format: (value: any) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'success.main' }}>
          {value || 0}
        </Typography>
      ),
    },
    {
      id: 'created_at',
      label: 'Created At',
      minWidth: 180,
      format: (value: any) => value ? new Date(value).toLocaleString() : 'N/A',
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value: any, row: any) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => {
              if (hasPermission('sessions:review') || hasPermission('sessions:view_live')) {
                router.push(`/sessions/${row.session_id}`);
              } else {
                showError('You do not have permission to view session details');
              }
            }}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(33, 51, 80, 0.08)',
              },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ], [hasPermission, router, showError]);

  return (
    <PermissionGuard permission={['sessions:view_sessions_count', 'sessions:view_live']}>
      <Box>
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
            Session Management
          </Typography>
          {hasPermission('sessions:view_live') && (
            <Button
              variant="contained"
              startIcon={<GetApp sx={{ fontSize: '1rem !important' }} />}
              onClick={() => {
                const queryParams = new URLSearchParams();
                if (status) queryParams.append("status", status);
                if (debouncedUserName) queryParams.append("userName", debouncedUserName);
                if (debouncedDeviceId) queryParams.append("deviceId", debouncedDeviceId);
                if (fromDate) queryParams.append("from", fromDate);
                if (toDate) queryParams.append("to", toDate);

                const accessToken = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
                const url = `${config.apiUrl}/admin/sessions/export?${queryParams.toString()}`;

                fetch(url, {
                  headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'ngrok-skip-browser-warning': 'true'
                  }
                })
                  .then(response => response.blob())
                  .then(blob => {
                    const downloadUrl = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = downloadUrl;
                    a.download = `sessions_export_${new Date().getTime()}.csv`;
                    document.body.appendChild(a);
                    a.click();
                    a.remove();
                    window.URL.revokeObjectURL(downloadUrl);
                  })
                  .catch(err => {
                    showError('Failed to export sessions');
                  });
              }}
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
          )}
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 1.5,
          }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="User Name"
                value={userName}
                onChange={(e) => {
                  setUserName(e.target.value);
                }}
                size="small"
                fullWidth
                placeholder="Search name"
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
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="Device ID"
                value={deviceId}
                onChange={(e) => {
                  setDeviceId(e.target.value);
                }}
                size="small"
                fullWidth
                placeholder="Search device"
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
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                label="Status"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                }}
                size="small"
                fullWidth
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
                {statusOptions.map((option) => (
                  <MenuItem key={option.value} value={option.value} sx={{ fontSize: '0.75rem' }}>
                    {option.label}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="From"
                type="date"
                value={fromDate}
                onChange={(e) => {
                  setFromDate(e.target.value);
                }}
                size="small"
                fullWidth
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
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                label="To"
                type="date"
                value={toDate}
                onChange={(e) => {
                  setToDate(e.target.value);
                }}
                size="small"
                fullWidth
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
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setStatus('');
                  setUserName('');
                  setDeviceId('');
                  setFromDate('');
                  setToDate('');
                  reset();
                }}
                sx={{
                  height: '32px',
                  minHeight: '32px',
                  borderColor: '#213350',
                  color: '#213350',
                  '&:hover': {
                    borderColor: '#6AB344',
                    backgroundColor: 'rgba(33, 51, 80, 0.04)',
                  },
                  fontSize: '0.7rem',
                  minWidth: { xs: 'auto', md: '80px' },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Sessions Table */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
            <CircularProgress />
          </Box>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={sessions}
              getRowId={(row: any) => row.session_id || row.id}
            />

            {/* Pagination */}
            {sessionsData && (
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
                <Typography variant="body2" color="text.secondary">
                  Showing {sessions.length}{typeof pagination?.total === 'number' ? ` of ${pagination.total}` : ''} results
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                  <IconButton
                    size="small"
                    onClick={goPrevious}
                    disabled={!canGoBack}
                    sx={{ color: !canGoBack ? 'text.disabled' : 'text.secondary' }}
                  >
                    <NavigateBefore />
                  </IconButton>
                  <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                    Page {pageNumber}
                  </Typography>
                  <IconButton
                    size="small"
                    onClick={() => goNext(pagination?.nextCursor)}
                    disabled={!pagination?.hasMore || !pagination?.nextCursor}
                    sx={{ color: !pagination?.hasMore || !pagination?.nextCursor ? 'text.disabled' : 'text.secondary' }}
                  >
                    <NavigateNext />
                  </IconButton>
                </Box>
              </Box>
            )}
          </>
        )}
      </Box>
    </PermissionGuard>
  );
}

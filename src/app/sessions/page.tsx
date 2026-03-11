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
import { Visibility, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { config } from '@/config/env';
import { DataTable } from '@/components/shared';
import { useGetSessionsQuery } from '@/store/api/sessionsApi';

const statusOptions = [
  { value: '', label: 'All Status' },
  { value: 'pending', label: 'Pending' },
  { value: 'active', label: 'Active' },
  { value: 'completed', label: 'Completed' },
  { value: 'failed', label: 'Failed' },
];

export default function SessionsPage() {
  const router = useRouter();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(6);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [isMounted, setIsMounted] = useState(false);
  const hasFilters = status || userId || deviceId || fromDate || toDate;

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [status, userId, deviceId, fromDate, toDate]);

  const { data: sessionsData, isLoading } = useGetSessionsQuery({
    page,
    limit,
    status: status || undefined,
    userId: userId || undefined,
    deviceId: deviceId || undefined,
    from: fromDate || undefined,
    to: toDate || undefined,
  }, {
    refetchOnMountOrArgChange: true
  });

  const sessions = sessionsData?.data.sessions || [];
  const pagination = sessionsData?.data;
  const calculatedTotalPages = pagination?.totalPages || Math.ceil((pagination?.total || 0) / (pagination?.limit || 10));

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

  const columns = [
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
    },
    {
      id: 'user_email',
      label: 'User Email',
      minWidth: 200,
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
      format: (value: any) => isMounted ? new Date(value).toLocaleString() : '',
    },
    {
      id: 'actions',
      label: 'Actions',
      minWidth: 100,
      format: (value: any, row: any) => (
        <Tooltip title="View Details">
          <IconButton
            size="small"
            onClick={() => router.push(`/sessions/${row.session_id}`)}
            sx={{
              color: 'primary.main',
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            <Visibility fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
          Session Management
        </Typography>
        <Button
          variant="outlined"
          onClick={() => {
            const queryParams = new URLSearchParams();
            if (status) queryParams.append("status", status);
            if (userId) queryParams.append("userId", userId);
            if (deviceId) queryParams.append("deviceId", deviceId);
            if (fromDate) queryParams.append("from", fromDate);
            if (toDate) queryParams.append("to", toDate);

            const accessToken = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
            const url = `${config.apiUrl}/admin/sessions/export?${queryParams.toString()}`;

            // Trigger download using fetch
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
                console.error('Export failed:', err);
              });
          }}
          sx={{
            borderColor: '#667eea',
            color: '#667eea',
            '&:hover': {
              borderColor: '#5a67d8',
              backgroundColor: 'rgba(102, 126, 234, 0.04)',
            },
          }}
        >
          Export CSV
        </Button>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              label="User ID"
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              size="small"
              fullWidth
              placeholder="Search by user ID"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              label="Device ID"
              value={deviceId}
              onChange={(e) => {
                setDeviceId(e.target.value);
                setPage(1);
              }}
              size="small"
              fullWidth
              placeholder="Search by device ID"
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              select
              label="Status"
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              size="small"
              fullWidth
            >
              {statusOptions.map((option) => (
                <MenuItem key={option.value} value={option.value}>
                  {option.label}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="From Date"
              type="date"
              value={fromDate}
              onChange={(e) => {
                setFromDate(e.target.value);
                setPage(1);
              }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              label="To Date"
              type="date"
              value={toDate}
              onChange={(e) => {
                setToDate(e.target.value);
                setPage(1);
              }}
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
            />
          </Grid>
          {hasFilters && (
            <Grid size={{ xs: 12, sm: 6, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setStatus('');
                  setUserId('');
                  setDeviceId('');
                  setFromDate('');
                  setToDate('');
                  setPage(1);
                }}
                sx={{
                  height: '40px',
                  borderColor: '#667eea',
                  color: '#667eea',
                  '&:hover': {
                    borderColor: '#5a67d8',
                    backgroundColor: 'rgba(102, 126, 234, 0.04)',
                  },
                  fontSize: { xs: '0.75rem', sm: '0.875rem' },
                  minWidth: { xs: 'auto', md: '100px' },
                }}
              >
                Clear
              </Button>
            </Grid>
          )}
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
            data={sessionsData?.data.sessions || []}
            getRowId={(row) => row.id}
          />

          {/* Pagination */}
          {sessionsData?.data && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {sessionsData.data.sessions.length} of {sessionsData.data.total} results
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  sx={{ color: page <= 1 ? 'text.disabled' : 'text.secondary' }}
                >
                  <NavigateBefore />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                  {page} / {calculatedTotalPages || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (calculatedTotalPages || 1)}
                  sx={{ color: page >= (calculatedTotalPages || 1) ? 'text.disabled' : 'text.secondary' }}
                >
                  <NavigateNext />
                </IconButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

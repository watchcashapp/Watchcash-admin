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
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
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
  const [limit, setLimit] = useState(10);
  const [status, setStatus] = useState('');
  const [userId, setUserId] = useState('');
  const [deviceId, setDeviceId] = useState('');
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: sessionsData, isLoading } = useGetSessionsQuery({
    page,
    limit,
    status: status || undefined,
    userId: userId || undefined,
    deviceId: deviceId || undefined,
  });

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
        Session Management
      </Typography>

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
        <Box display="flex" gap={2} flexWrap="wrap">
          <TextField
            label="User ID"
            value={userId}
            onChange={(e) => {
              setUserId(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 200 }}
            placeholder="Search by user ID"
          />
          <TextField
            label="Device ID"
            value={deviceId}
            onChange={(e) => {
              setDeviceId(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 200 }}
            placeholder="Search by device ID"
          />
          <TextField
            select
            label="Status"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            size="small"
            sx={{ minWidth: 150 }}
          >
            {statusOptions.map((option) => (
              <MenuItem key={option.value} value={option.value}>
                {option.label}
              </MenuItem>
            ))}
          </TextField>
        </Box>
      </Paper>

      {/* Sessions Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <DataTable
          columns={columns}
          data={sessionsData?.data.sessions || []}
          getRowId={(row) => row.id}
        />
      )}
    </Box>
  );
}

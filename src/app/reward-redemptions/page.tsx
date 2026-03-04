"use client";

import React, { useState } from 'react';
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
} from '@mui/material';
import {
  Search,
  Add,
  MoreVert,
  Visibility,
  Edit,
  Delete,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, Column } from '@/components/shared';
import { useGetRewardRedemptionsQuery } from '@/store/api/rewardRedemptionsApi';

// Mock data for reward redemptions

interface RewardRedemption {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  rewardName: string;
  rewardType: string;
  points: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
  requestedAt: string;
  processedAt: string | null;
  notes: string;
}

export default function RewardRedemptionsPage() {
  const { data: response, isLoading, error } = useGetRewardRedemptionsQuery({});
  const redemptions = response?.data?.reward_redemptions || [];
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedRedemption, setSelectedRedemption] = useState<RewardRedemption | null>(null);

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>, redemption: RewardRedemption) => {
    setAnchorEl(event.currentTarget);
    setSelectedRedemption(redemption);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedRedemption(null);
  };

  const handleView = (redemption: RewardRedemption) => {
    console.log('View redemption:', redemption);
    handleMenuClose();
  };

  const handleEdit = (redemption: RewardRedemption) => {
    console.log('Edit redemption:', redemption);
    handleMenuClose();
  };

  const handleDelete = (redemption: RewardRedemption) => {
    console.log('Delete redemption:', redemption);
    handleMenuClose();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'linear-gradient(45deg, #f59e0b, #d97706)';
      case 'APPROVED':
        return 'linear-gradient(45deg, #10b981, #059669)';
      case 'REJECTED':
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
      minWidth: 80,
    },
    {
      id: 'userName',
      label: 'User Name',
      minWidth: 150,
    },
    {
      id: 'userEmail',
      label: 'Email',
      minWidth: 200,
    },
    {
      id: 'rewardName',
      label: 'Reward Name',
      minWidth: 180,
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
            background: value === 'VOUCHER'
              ? 'linear-gradient(45deg, #667eea, #764ba2)'
              : 'linear-gradient(45deg, #10b981, #059669)',
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
          {value.toLocaleString()}
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
      id: 'requestedAt',
      label: 'Requested At',
      minWidth: 180,
      format: (value: string) => new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
  ];

  const filteredData = redemptions.filter((redemption) => {
    const matchesSearch = !search || 
      redemption.userName.toLowerCase().includes(search.toLowerCase()) ||
      redemption.userEmail.toLowerCase().includes(search.toLowerCase()) ||
      redemption.rewardName.toLowerCase().includes(search.toLowerCase());
    
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
          <Button
            variant="contained"
            startIcon={<Add />}
            sx={{
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 2, sm: 3 },
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
              },
            }}
          >
            Add Reward
          </Button>
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
          onEdit={handleEdit}
          onDelete={handleDelete}
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
          <MenuItem onClick={() => selectedRedemption && handleEdit(selectedRedemption)}>
            <Edit sx={{ mr: 1, fontSize: '1.2rem', color: '#667eea' }} />
            Edit
          </MenuItem>
          <MenuItem onClick={() => selectedRedemption && handleDelete(selectedRedemption)}>
            <Delete sx={{ mr: 1, fontSize: '1.2rem', color: '#ef4444' }} />
            Delete
          </MenuItem>
        </Menu>
      </Box>
    </DashboardLayout>
  );
}

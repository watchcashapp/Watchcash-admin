"use client";

import { use, useState } from 'react';
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
import { ArrowBack } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useGetSessionByIdQuery } from '@/store/api/sessionsApi';
import { DataTable } from '@/components/shared';

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
  const [activeTab, setActiveTab] = useState(0);
  const { data: response, isLoading, error } = useGetSessionByIdQuery(resolvedParams.id);

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
      format: (value: string) => new Date(value).toLocaleString(),
    },
  ];

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push('/sessions')}
        sx={{ 
          mb: 3,
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08)',
          },
        }}
      >
        Back to Sessions
      </Button>

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

      <Paper
        sx={{
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{
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
        </Tabs>

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
                    {new Date(session.created_at).toLocaleString()}
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
                      {new Date(session.metadata.start_time).toLocaleString()}
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
                      {new Date(session.metadata.end_time).toLocaleString()}
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
                <Grid size={{ xs: 12, md: 6 }}>
                  <Box mb={2}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600 }}>
                      Location
                    </Typography>
                    <Typography 
                      variant="body1" 
                      sx={{ 
                        mt: 0.5,
                        fontFamily: 'monospace',
                        fontSize: '0.875rem',
                      }}
                    >
                      {session.metadata.lat.toFixed(6)}, {session.metadata.lng.toFixed(6)}
                    </Typography>
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
                    {new Date(reward.calculated_at).toLocaleString()}
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
      </Paper>
    </Box>
  );
}

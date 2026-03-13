"use client";

import { use, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Tabs,
  Tab,
  Grid,
  Chip,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import { ArrowBack, Person, AccountBalanceWallet, History, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, Column } from '@/components/shared';
import { useGetUserByIdQuery, useGetUserWalletQuery, useGetUserRedeemHistoryQuery, WalletTransaction } from '@/store/api/usersApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useCursorPagination } from '@/hooks/useCursorPagination';

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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const walletPagination = useCursorPagination();
  const historyPagination = useCursorPagination();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('users:view')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    { userId: resolvedParams.id, cursor: walletPagination.cursor, limit: 6 },
    { skip: tabValue !== 1 }
  );
  const { data: historyData, isLoading: loadingHistory } = useGetUserRedeemHistoryQuery(
    { userId: resolvedParams.id, cursor: historyPagination.cursor, limit: 6 },
    { skip: tabValue !== 2 }
  );

  useEffect(() => {
    walletPagination.reset();
  }, [resolvedParams.id, walletPagination.reset]);

  useEffect(() => {
    historyPagination.reset();
  }, [resolvedParams.id, historyPagination.reset]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const walletColumns: Column<WalletTransaction>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    },
    {
      id: 'transactionType',
      label: 'Type',
      align: 'center',
      minWidth: 100,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          sx={{
            background: value === 'CREDIT'
              ? 'linear-gradient(45deg, #10b981, #059669)'
              : 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      minWidth: 100,
      format: (value: number, row: WalletTransaction) => (
        <Typography
          sx={{
            fontWeight: 600,
            color: row.transactionType === 'CREDIT' ? '#10b981' : '#ef4444',
          }}
        >
          {row.transactionType === 'CREDIT' ? '+' : '-'}{Math.abs(value)}
        </Typography>
      ),
    },
    {
      id: 'reasonCode',
      label: 'Reason',
      minWidth: 150,
    },
    {
      id: 'referenceType',
      label: 'Reference Type',
      minWidth: 150,
    },
    {
      id: 'note',
      label: 'Note',
      minWidth: 200,
      format: (value: string) => value || 'N/A',
    },
  ];

  const historyColumns: Column<any>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    },
    {
      id: 'rewardType',
      label: 'Reward Type',
      minWidth: 150,
      format: (value: string) => value ? value : '--',
    },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => value != null ? (
        <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>
          -{value}
        </Typography>
      ) : '--',
    },
    {
      id: 'rewardValue',
      label: 'Value',
      align: 'right',
      minWidth: 100,
      format: (value: number, row: any) => value != null ? `${value} ${row.rewardCurrency || ''}` : '--',
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
            background: getStatusBadgeColor(value),
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
  ];

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'APPROVED':
      case 'PROCESSED':
        return 'linear-gradient(45deg, #10b981, #059669)';
      case 'PENDING':
        return 'linear-gradient(45deg, #f59e0b, #d97706)';
      case 'REJECTED':
      case 'FAILED':
        return 'linear-gradient(45deg, #ef4444, #dc2626)';
      default:
        return 'linear-gradient(45deg, #9ca3af, #4b5563)';
    }
  }

  if (loadingUser) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      </DashboardLayout>
    );
  }

  if (userError || !userResponse) {
    return (
      <DashboardLayout>
        <Box>
          <Button
            startIcon={<ArrowBack />}
            onClick={() => router.push('/users')}
            sx={{
              mb: 3,
              '&:hover': {
                backgroundColor: 'rgba(102, 126, 234, 0.08)',
              },
            }}
          >
            Back to User Management
          </Button>
          <Paper sx={{ p: 4, textAlign: 'center' }}>
            <Typography color="error">
              Failed to load user details. Please try again.
            </Typography>
          </Paper>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
          onClick={() => router.push('/users')}
          sx={{
            mb: 1,
            height: '28px',
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to User Management
        </Button>

        <Typography
          variant="h5"
          sx={{
            mb: 1,
            fontWeight: 700,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          User Details
        </Typography>

        <Paper
          sx={{
            p: 1.5,
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
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              minHeight: '36px',
              '& .MuiTabs-flexContainer': {
                height: '36px',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.8rem',
                minHeight: '36px',
                py: 0.5,
              },
              '& .Mui-selected': {
                color: '#667eea',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
              },
            }}
          >
            <Tab icon={<Person sx={{ fontSize: '1.2rem !important' }} />} iconPosition="start" label="Details" />
            {hasPermission('users:view_transactions') && (
              <Tab icon={<AccountBalanceWallet sx={{ fontSize: '1.2rem !important' }} />} iconPosition="start" label="Wallet" />
            )}
            {hasPermission('users:view_rewards') && (
              <Tab icon={<History sx={{ fontSize: '1.2rem !important' }} />} iconPosition="start" label="Redeem History" />
            )}
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 1.5 }}>
              <Grid container spacing={1.5}>
                {/* User Information */}
                <Grid size={{ xs: 12 }}>
                  <Card
                    elevation={0}
                    sx={{
                      bgcolor: 'action.hover',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 1,
                    }}
                  >
                    <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                      <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: 'primary.main' }}>
                        User Information
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            Name
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {userResponse.name}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            Email
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {userResponse.email}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            User Type
                          </Typography>
                          <Box mt={0.1}>
                            <Chip
                              label={userResponse.userType}
                              size="small"
                              sx={{
                                height: '18px',
                                fontSize: '0.65rem',
                                background: userResponse.userType === 'ADMIN'
                                  ? 'linear-gradient(45deg, #667eea, #764ba2)'
                                  : 'linear-gradient(45deg, #10b981, #059669)',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            Status
                          </Typography>
                          <Box mt={0.1}>
                            <Chip
                              label={userResponse.isActive ? 'Active' : 'Inactive'}
                              size="small"
                              sx={{
                                height: '18px',
                                fontSize: '0.65rem',
                                background: userResponse.isActive
                                  ? 'linear-gradient(45deg, #10b981, #059669)'
                                  : 'linear-gradient(45deg, #6b7280, #4b5563)',
                                color: 'white',
                                fontWeight: 600,
                              }}
                            />
                          </Box>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                            Created At
                          </Typography>
                          <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                            {isMounted ? new Date(userResponse.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            }) : ''}
                          </Typography>
                        </Grid>
                      </Grid>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={1}>
            <Box sx={{ p: 3 }}>
              {/* Wallet Balance */}
              {walletData && (
                <Card
                  sx={{
                    mb: 3,
                    bgcolor: 'background.paper',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <CardContent sx={{ p: 1.5 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>
                      Current Balance
                    </Typography>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: 700,
                        fontSize: '1.25rem',
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {isMounted ? walletData.walletBalance.toLocaleString() : ''} Points
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Transactions Table */}
              {loadingWallet ? (
                <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                  <CircularProgress />
                </Box>
              ) : walletData && walletData.transactions.length > 0 ? (
                <>
                  <DataTable
                    columns={walletColumns}
                    data={walletData.transactions}
                    getRowId={(row) => row.id}
                    emptyMessage="No transactions found"
                  />

                  {/* Pagination */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Showing {walletData.transactions.length}{typeof walletData.pagination.total === 'number' ? ` of ${walletData.pagination.total}` : ''} results
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={walletPagination.goPrevious}
                        disabled={!walletPagination.canGoBack}
                        sx={{ color: !walletPagination.canGoBack ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                      >
                        <NavigateBefore fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" sx={{ mx: 0.5, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                        Page {walletPagination.pageNumber}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => walletPagination.goNext(walletData.pagination.nextCursor)}
                        disabled={!walletData.pagination.hasMore || !walletData.pagination.nextCursor}
                        sx={{ color: !walletData.pagination.hasMore || !walletData.pagination.nextCursor ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                      >
                        <NavigateNext fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No transactions found
                  </Typography>
                </Paper>
              )}
            </Box>
          </TabPanel>

          <TabPanel value={tabValue} index={2}>
            <Box sx={{ p: 3 }}>
              {loadingHistory ? (
                <Box display="flex" justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
                  <CircularProgress />
                </Box>
              ) : historyData && historyData.items.length > 0 ? (
                <>
                  <DataTable
                    columns={historyColumns}
                    data={historyData.items}
                    getRowId={(row) => row.id}
                    emptyMessage="No redemption history found"
                    onView={(row: any) =>
                      router.push(`/reward-redemptions/${row.id}`)
                    }
                  />

                  {/* Pagination */}
                  <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      Showing {historyData.items.length}{typeof historyData.pagination.total === 'number' ? ` of ${historyData.pagination.total}` : ''} results
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <IconButton
                        size="small"
                        onClick={historyPagination.goPrevious}
                        disabled={!historyPagination.canGoBack}
                        sx={{ color: !historyPagination.canGoBack ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                      >
                        <NavigateBefore fontSize="small" />
                      </IconButton>
                      <Typography variant="caption" sx={{ mx: 0.5, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                        Page {historyPagination.pageNumber}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => historyPagination.goNext(historyData.pagination.nextCursor)}
                        disabled={!historyData.pagination.hasMore || !historyData.pagination.nextCursor}
                        sx={{ color: !historyData.pagination.hasMore || !historyData.pagination.nextCursor ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                      >
                        <NavigateNext fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                </>
              ) : (
                <Paper
                  sx={{
                    p: 4,
                    textAlign: 'center',
                    bgcolor: 'background.paper',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.08)',
                    overflow: 'visible',
                  }}
                >
                  <Typography variant="body1" color="text.secondary">
                    No redemption history found
                  </Typography>
                </Paper>
              )}
            </Box>
          </TabPanel>
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

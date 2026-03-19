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
  TextField,
  Divider,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ArrowBack, Person, AccountBalanceWallet, History, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, Column } from '@/components/shared';
import {
  useGetUserByIdQuery,
  useGetUserWalletQuery,
  useGetUserRedeemHistoryQuery,
  useGetUserLoginHistoryQuery,
  useGetUserSubscriptionQuery,
  WalletTransaction,
  LoginHistory,
  SubscriptionLog
} from '@/store/api/usersApi';
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
  const { hasPermission, isInitialized } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [isMounted, setIsMounted] = useState(false);
  const [subscriptionSearch, setSubscriptionSearch] = useState('');
  const [subscriptionLogsPage, setSubscriptionLogsPage] = useState(1);
  const logsPerPage = 6;
  const walletPagination = useCursorPagination();
  const historyPagination = useCursorPagination();
  const loginPagination = useCursorPagination();

  // Helper function to safely get subscription data
  const getSubscriptionData = () => {
    return subscriptionData?.subscription || null;
  };

  const getLogsData = () => {
    return subscriptionData?.logs?.items || [];
  };

  const getPlanHistoryData = () => {
    return subscriptionData?.planHistory?.items || [];
  };

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const visibleTabs = [
    { id: 'details', label: 'Details', icon: <Person sx={{ fontSize: '1.2rem !important' }} /> },
    { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWallet sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_transactions' },
    { id: 'rewards', label: 'Redeem History', icon: <History sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_rewards' },
    { id: 'logins', label: 'Login Details', icon: <History sx={{ fontSize: '1.2rem !important' }} /> },
    { id: 'subscription', label: 'Subscription', icon: <History sx={{ fontSize: '1.2rem !important' }} /> },
  ].filter(tab => !tab.permission || hasPermission(tab.permission));

  useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('users:view')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);

  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    { userId: resolvedParams.id, cursor: walletPagination.cursor, limit: 6 },
    { skip: tabValue !== visibleTabs.findIndex(t => t.id === 'wallet') }
  );

  const { data: historyData, isLoading: loadingHistory } = useGetUserRedeemHistoryQuery(
    { userId: resolvedParams.id, cursor: historyPagination.cursor, limit: 6 },
    { skip: tabValue !== visibleTabs.findIndex(t => t.id === 'rewards') }
  );

  const { data: loginData, isLoading: loadingLogins } = useGetUserLoginHistoryQuery(
    { userId: resolvedParams.id, cursor: loginPagination.cursor, limit: 6 },
    { skip: tabValue !== visibleTabs.findIndex(t => t.id === 'logins') }
  );

  const { data: subscriptionData, data, isLoading: loadingSubscription, error: subscriptionError } = useGetUserSubscriptionQuery(
    {
      userId: resolvedParams.id,
      search: subscriptionSearch || undefined,
      logsLimit: 100,
      planLimit: 100,
    },
    { skip: tabValue !== visibleTabs.findIndex(t => t.id === 'subscription') }
  );

  useEffect(() => {
    walletPagination.reset();
  }, [resolvedParams.id, walletPagination.reset]);

  useEffect(() => {
    historyPagination.reset();
  }, [resolvedParams.id, historyPagination.reset]);

  useEffect(() => {
    loginPagination.reset();
  }, [resolvedParams.id, loginPagination.reset]);

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
              ? 'linear-gradient(45deg, #6AB344, #488a2e)'
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
            color: row.transactionType === 'CREDIT' ? '#6AB344' : '#ef4444',
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

  const loginColumns: Column<LoginHistory>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    },
    {
      id: 'ip',
      label: 'IP Address',
      minWidth: 120,
    },
    {
      id: 'isAdmin',
      label: 'Admin',
      align: 'center',
      minWidth: 100,
      format: (value: boolean) => (
        <Chip
          label={value ? 'Admin' : 'App User'}
          size="small"
          sx={{
            height: '18px',
            fontSize: '0.65rem',
            background: value
              ? 'linear-gradient(45deg, #213350, #6AB344)'
              : 'linear-gradient(45deg, #6AB344, #488a2e)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'userAgent',
      label: 'User Agent',
      minWidth: 250,
      format: (value: string) => (
        <Typography variant="caption" sx={{ display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '0.7rem' }} title={value}>
          {value}
        </Typography>
      )
    }
  ];

  const subscriptionLogColumns: Column<SubscriptionLog>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) : '',
    },
    {
      id: 'amount',
      label: 'Amount',
      minWidth: 100,
      format: (value: string, row: SubscriptionLog) => `${value} ${row.currency}`,
    },
    {
      id: 'status',
      label: 'Status',
      minWidth: 150,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          sx={{
            height: '18px',
            fontSize: '0.65rem',
            background: value.includes('succeeded')
              ? 'linear-gradient(45deg, #6AB344, #488a2e)'
              : 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'stripeEventId',
      label: 'Stripe Event ID',
      minWidth: 200,
    },
  ];

  function getStatusBadgeColor(status: string) {
    switch (status) {
      case 'APPROVED':
      case 'PROCESSED':
        return 'linear-gradient(45deg, #6AB344, #488a2e)';
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
                backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
              backgroundColor: 'rgba(33, 51, 80, 0.08)',
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
            background: 'linear-gradient(45deg, #213350, #6AB344)',
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
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
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
                color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main',
              },
            }}
          >
            {visibleTabs.map((tab) => (
              <Tab key={tab.id} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
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
                                  ? 'linear-gradient(45deg, #213350, #6AB344)'
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
                                  ? 'linear-gradient(45deg, #6AB344, #488a2e)'
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

          {visibleTabs.some(t => t.id === 'wallet') && (
            <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'wallet')}>
              <Box sx={{ p: 3 }}>
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
                          background: 'linear-gradient(45deg, #213350, #6AB344)',
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
          )}

          {visibleTabs.some(t => t.id === 'rewards') && (
            <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'rewards')}>
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
          )}

          {visibleTabs.some(t => t.id === 'logins') && (
            <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'logins')}>
              <Box sx={{ p: 1.5 }}>
                {loadingLogins ? (
                  <Box display="flex" justifyContent="center" alignItems="center" minHeight="300px">
                    <CircularProgress size={24} />
                  </Box>
                ) : loginData && loginData.items.length > 0 ? (
                  <>
                    <DataTable
                      columns={loginColumns}
                      data={loginData.items}
                      getRowId={(row) => row.id}
                      emptyMessage="No login history found"
                    />

                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="caption" color="text.secondary">
                        Showing {loginData.items.length}{typeof loginData.pagination.total === 'number' ? ` of ${loginData.pagination.total}` : ''} results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={loginPagination.goPrevious}
                          disabled={!loginPagination.canGoBack}
                          sx={{ color: !loginPagination.canGoBack ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                        >
                          <NavigateBefore fontSize="small" />
                        </IconButton>
                        <Typography variant="caption" sx={{ mx: 0.5, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                          Page {loginPagination.pageNumber}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => loginPagination.goNext(loginData.pagination.nextCursor)}
                          disabled={!loginData.pagination.hasMore || !loginData.pagination.nextCursor}
                          sx={{ color: !loginData.pagination.hasMore || !loginData.pagination.nextCursor ? 'text.disabled' : 'text.secondary', p: 0.5 }}
                        >
                          <NavigateNext fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                  </>
                ) : (
                  <Paper
                    elevation={0}
                    sx={{
                      p: 4,
                      textAlign: 'center',
                      bgcolor: 'action.hover',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                      borderRadius: 1,
                    }}
                  >
                    <Typography variant="body2" color="text.secondary">
                      No login history found
                    </Typography>
                  </Paper>
                )}
              </Box>
            </TabPanel>
          )}

          {visibleTabs.some(t => t.id === 'subscription') && (
            <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'subscription')}>
              <Box sx={{ p: 1.5 }}>
                {loadingSubscription ? (
                  <Box display="flex" justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    {getSubscriptionData() ? (
                      <Grid container spacing={2} sx={{ mb: 3 }}>
                        <Grid size={{ xs: 12, md: 8 }}>
                          <Card
                            sx={{
                              height: '100%',
                              bgcolor: 'background.paper',
                              border: (theme) => theme.palette.mode === 'dark'
                                ? '1px solid rgba(255, 255, 255, 0.1)'
                                : '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: 1.5,
                            }}
                          >
                            <CardContent>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Active Plan</Typography>
                                <Chip
                                  label={getSubscriptionData()?.status || 'N/A'}
                                  size="small"
                                  sx={{
                                    background: getSubscriptionData()?.status === 'ACTIVE'
                                      ? 'linear-gradient(45deg, #6AB344, #488a2e)'
                                      : 'linear-gradient(45deg, #f59e0b, #d97706)',
                                    color: 'white',
                                    fontWeight: 600,
                                  }}
                                />
                              </Box>

                              <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="caption" color="text.secondary">Plan Name</Typography>
                                  <Typography sx={{ color: 'primary.main', fontWeight: 600 }}>
                                    {getSubscriptionData()?.plan || 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="caption" color="text.secondary">Stripe Customer ID</Typography>
                                  <Typography variant="body2">{getSubscriptionData()?.stripeCustomerId || 'N/A'}</Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                  <Typography variant="caption" color="text.secondary">Stripe Subscription ID</Typography>
                                  <Typography variant="body2">{getSubscriptionData()?.stripeSubscriptionId || 'N/A'}</Typography>
                                </Grid>
                              </Grid>

                              <Divider sx={{ my: 1.5 }} />

                              <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="caption" color="text.secondary">Period Start</Typography>
                                  <Typography variant="body2">
                                    {getSubscriptionData()?.currentPeriodStart
                                      ? new Date(getSubscriptionData()?.currentPeriodStart!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="caption" color="text.secondary">Period End</Typography>
                                  <Typography variant="body2">
                                    {getSubscriptionData()?.currentPeriodEnd
                                      ? new Date(getSubscriptionData()?.currentPeriodEnd!).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                                      : 'N/A'}
                                  </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 4 }}>
                                  <Typography variant="caption" color="text.secondary">Auto-Renewal</Typography>
                                  <Typography variant="body2">
                                    {getSubscriptionData()?.cancelAtPeriodEnd ? 'Disabled (Cancels at end)' : 'Enabled'}
                                  </Typography>
                                </Grid>
                              </Grid>
                            </CardContent>
                          </Card>
                        </Grid>

                        <Grid size={{ xs: 12, md: 4 }}>
                          <Card
                            sx={{
                              height: '100%',
                              bgcolor: 'background.paper',
                              border: (theme) => theme.palette.mode === 'dark'
                                ? '1px solid rgba(255, 255, 255, 0.1)'
                                : '1px solid rgba(0, 0, 0, 0.08)',
                              borderRadius: 1.5,
                            }}
                          >
                            <CardContent>
                              <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>Plan History</Typography>
                              {getPlanHistoryData().length > 0 ? (
                                <Box sx={{ maxHeight: 200, overflow: 'auto' }}>
                                  <List disablePadding>
                                    {getPlanHistoryData().map((history: any, idx: number) => (
                                      <ListItem key={idx} sx={{ px: 0, py: 0.5 }}>
                                        <ListItemText
                                          primary={
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                              {history.previousPlan && (
                                                <>
                                                  <Typography variant="caption" sx={{ textDecoration: 'line-through', color: 'text.secondary' }}>
                                                    {history.previousPlan}
                                                  </Typography>
                                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>→</Typography>
                                                </>
                                              )}
                                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                                {history.newPlan || 'N/A'}
                                              </Typography>
                                            </Box>
                                          }
                                          secondary={new Date(history.createdAt).toLocaleDateString()}
                                          secondaryTypographyProps={{ variant: 'caption' }}
                                        />
                                        <Chip
                                          label={history.status}
                                          size="small"
                                          sx={{
                                            fontSize: '0.65rem',
                                            height: 18,
                                            background: history.status === 'ACTIVE'
                                              ? 'linear-gradient(45deg, #6AB344, #488a2e)'
                                              : 'linear-gradient(45deg, #9ca3af, #4b5563)',
                                            color: 'white'
                                          }}
                                        />
                                      </ListItem>
                                    ))}
                                  </List>
                                </Box>
                              ) : (
                                <Box sx={{ py: 2, textAlign: 'center' }}>
                                  <Typography variant="caption" color="text.secondary">No previous plans</Typography>
                                </Box>
                              )}
                            </CardContent>
                          </Card>
                        </Grid>
                      </Grid>
                    ) : (
                      <Paper
                        sx={{
                          p: 4,
                          textAlign: 'center',
                          bgcolor: 'background.paper',
                          border: (theme) => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 1.5,
                          mb: 3,
                        }}
                      >
                        <Typography variant="body1" color="text.secondary">
                          {subscriptionError ? 'Subscription information not found' : 'No active subscription found'}
                        </Typography>
                      </Paper>
                    )}

                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center', mb: 1.5 }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Transaction Logs</Typography>
                      <Box sx={{ ml: 'auto' }}>
                        <TextField
                          size="small"
                          placeholder="Search logs"
                          value={subscriptionSearch}
                          onChange={(e) => {
                            setSubscriptionSearch(e.target.value);
                          }}
                          sx={{
                            '& .MuiInputBase-root': {
                              height: 32,
                              fontSize: '0.8rem',
                            }
                          }}
                        />
                      </Box>
                    </Box>

                    {getLogsData() && getLogsData().length > 0 ? (
                      <>
                        <DataTable
                          columns={subscriptionLogColumns}
                          data={getLogsData()}
                          getRowId={(row) => row.id}
                          emptyMessage="No subscription logs found"
                        />

                        <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', alignItems: 'center' }}>
                          <Typography variant="caption" color="text.secondary" sx={{ mr: 2 }}>
                            Total {getLogsData().length} results
                          </Typography>
                        </Box>
                      </>
                    ) : (
                      <Paper
                        sx={{
                          p: 3,
                          textAlign: 'center',
                          bgcolor: 'background.paper',
                          border: (theme) => theme.palette.mode === 'dark'
                            ? '1px solid rgba(255, 255, 255, 0.1)'
                            : '1px solid rgba(0, 0, 0, 0.08)',
                          borderRadius: 1.5,
                        }}
                      >
                        <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                          No logs available
                        </Typography>
                      </Paper>
                    )}
                  </>
                )}
              </Box>
            </TabPanel>
          )}
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

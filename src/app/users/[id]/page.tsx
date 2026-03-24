"use client";

import React, { use, useState, useEffect } from 'react';
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
  ListItem,
  ListItemText,
  Skeleton,
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
      style={{ minHeight: 'auto', display: value === index ? 'block' : 'none' }}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
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
  
  const walletPagination = useCursorPagination();
  const historyPagination = useCursorPagination();
  const loginPagination = useCursorPagination();
  const subscriptionLogsPagination = useCursorPagination();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('users:view')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  
  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    { userId: resolvedParams.id, cursor: walletPagination.cursor, limit: 6 },
    { skip: tabValue !== 1 }
  );
  
  const { data: historyData, isLoading: loadingHistory } = useGetUserRedeemHistoryQuery(
    { userId: resolvedParams.id, cursor: historyPagination.cursor, limit: 6 },
    { skip: tabValue !== 2 }
  );
  
  const { data: loginData, isLoading: loadingLogins } = useGetUserLoginHistoryQuery(
    { userId: resolvedParams.id, cursor: loginPagination.cursor, limit: 6 },
    { skip: tabValue !== 3 }
  );
  
  const { data: subscriptionData, error: subscriptionError } = useGetUserSubscriptionQuery(
    {
      userId: resolvedParams.id,
      search: subscriptionSearch || undefined,
      logsLimit: 6,
      planLimit: 6,
    },
    { skip: tabValue !== 4 }
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

  const getSubscriptionData = () => subscriptionData?.subscription || null;
  const getLogsData = () => subscriptionData?.logs?.items || [];
  const getPlanHistoryData = () => subscriptionData?.planHistory?.items || [];

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

  const walletColumns: Column<WalletTransaction>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString() : '',
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
            background: value === 'CREDIT' ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white'
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
        <Typography sx={{ fontWeight: 600, color: row.transactionType === 'CREDIT' ? '#10b981' : '#ef4444' }}>
          {row.transactionType === 'CREDIT' ? '+' : '-'}{Math.abs(value)}
        </Typography>
      ),
    },
    { id: 'reasonCode', label: 'Reason', minWidth: 150 },
    { id: 'note', label: 'Note', minWidth: 200, format: (v: string) => v || 'N/A' },
  ];

  const historyColumns: Column<any>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString() : '',
    },
    { id: 'rewardType', label: 'Reward Type', minWidth: 150 },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => (
        <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>-{value}</Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 120,
      format: (value: string) => (
        <Chip label={value} size="small" sx={{ background: getStatusBadgeColor(value), color: 'white' }} />
      ),
    },
  ];

  const loginColumns: Column<LoginHistory>[] = [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => isMounted ? new Date(value).toLocaleString() : '',
    },
    { id: 'ip', label: 'IP Address', minWidth: 120 },
    {
      id: 'isAdmin',
      label: 'Admin',
      align: 'center',
      minWidth: 100,
      format: (value: boolean) => (
        <Chip label={value ? 'Admin' : 'App User'} size="small" sx={{ background: value ? 'linear-gradient(45deg, #213350, #6AB344)' : 'linear-gradient(45deg, #10b981, #059669)', color: 'white' }} />
      ),
    },
    {
      id: 'userAgent',
      label: 'User Agent',
      minWidth: 250,
      format: (value: string) => (
        <Typography variant="caption" sx={{ display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
          {value}
        </Typography>
      )
    }
  ];

  const subscriptionLogColumns: Column<SubscriptionLog>[] = [
    { id: 'createdAt', label: 'Date', minWidth: 150, format: (v: string) => isMounted ? new Date(v).toLocaleString() : '' },
    { id: 'amount', label: 'Amount', minWidth: 100, format: (v: string, row: any) => `${v} ${row.currency}` },
    { id: 'status', label: 'Status', minWidth: 150, format: (v: string) => <Chip label={v} size="small" sx={{ fontSize: '0.65rem' }} /> },
  ];

  if (loadingUser) {
    return (
      <Box sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
          <Skeleton variant="rectangular" width={80} height={28} sx={{ borderRadius: 1 }} />
          <Skeleton variant="text" width={150} height={32} />
        </Box>
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2, py: 1 }}>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <Skeleton width={80} height={24} />
              <Skeleton width={120} height={24} />
              <Skeleton width={120} height={24} />
            </Box>
          </Box>
          <Box sx={{ p: 3 }}>
            <Card sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Skeleton width={150} height={24} sx={{ mb: 2 }} />
                <Grid container spacing={2}>
                  {[...Array(3)].map((_, i) => (
                    <Grid key={i} size={{ xs: 12, sm: 6 }}>
                      <Skeleton width={60} height={16} sx={{ mb: 0.5 }} />
                      <Skeleton width="100%" height={24} />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Box>
        </Paper>
      </Box>
    );
  }

  if (userError || !userResponse) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/users')} sx={{ mb: 2 }}>Back</Button>
        <Typography color="error">Failed to load user details.</Typography>
      </Box>
    );
  }

  const allTabs = [
    {
      label: 'Details',
      icon: <Person />,
      content: (
        <Box sx={{ p: 2 }}>
          <Card sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>User Information</Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Name</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{userResponse.name}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">Email</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>{userResponse.email}</Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary">User Type</Typography>
                  <Chip label={userResponse.userType} size="small" sx={{ mt: 0.5, background: 'linear-gradient(45deg, #213350, #6AB344)', color: 'white' }} />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Box>
      )
    },
    {
      label: 'Wallet Transactions',
      icon: <AccountBalanceWallet />,
      permission: 'users:view_transactions',
      content: (
        <Box sx={{ p: 2 }}>
          {walletData && (
            <Card sx={{ mb: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="caption" color="text.secondary">Current Balance</Typography>
                <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
                  {walletData.walletBalance.toLocaleString()} Points
                </Typography>
              </CardContent>
            </Card>
          )}
          {loadingWallet ? <CircularProgress /> : walletData?.transactions.length ? (
            <DataTable columns={walletColumns} data={walletData.transactions} getRowId={(row) => row.id} />
          ) : <Typography color="text.secondary">No transactions found</Typography>}
        </Box>
      )
    },
    {
      label: 'Redemption History',
      icon: <History />,
      permission: 'users:view_rewards',
      content: (
        <Box sx={{ p: 2 }}>
          {loadingHistory ? <CircularProgress /> : historyData?.items.length ? (
            <DataTable columns={historyColumns} data={historyData.items} getRowId={(row) => row.id} />
          ) : <Typography color="text.secondary">No redemption history found</Typography>}
        </Box>
      )
    },
    {
      label: 'Login Details',
      icon: <History />,
      permission: 'users:view_login_history',
      content: (
        <Box sx={{ p: 2 }}>
          {loadingLogins ? <CircularProgress /> : loginData?.items.length ? (
            <DataTable columns={loginColumns} data={loginData.items} getRowId={(row) => row.id} />
          ) : <Typography color="text.secondary">No login history found</Typography>}
        </Box>
      )
    },
    {
      label: 'Subscription',
      icon: <History />,
      permission: 'users:view_subscriptions',
      content: (
        <Box sx={{ p: 2 }}>
          {getSubscriptionData() ? (
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Card sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
                  <CardContent>
                    <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Active Plan</Typography>
                    <Typography variant="body1">Plan: {getSubscriptionData()?.plan}</Typography>
                    <Typography variant="body2" color="text.secondary">Status: {getSubscriptionData()?.status}</Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Transaction Logs</Typography>
                <DataTable columns={subscriptionLogColumns} data={getLogsData()} getRowId={(row) => row.id} />
              </Grid>
            </Grid>
          ) : <Typography color="text.secondary">No active subscription found</Typography>}
        </Box>
      )
    }
  ];

  const visibleTabs = React.useMemo(() => {
    return allTabs.filter(tab => !tab.permission || hasPermission(tab.permission));
  }, [hasPermission]);

  return (
    <Box sx={{ p: 2 }}>
        <Box display="flex" alignItems="center" gap={1} mb={3}>
          <Button startIcon={<ArrowBack />} onClick={() => router.push('/users')}>Back</Button>
          <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>User Details</Typography>
        </Box>
        <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
          <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
            {visibleTabs.map((tab, idx) => (
              <Tab key={idx} icon={tab.icon} iconPosition="start" label={tab.label} sx={{ textTransform: 'none', fontWeight: 600 }} />
            ))}
          </Tabs>
          {visibleTabs.map((tab, idx) => (
            <TabPanel key={idx} value={tabValue} index={idx}>
              {tab.content}
            </TabPanel>
          ))}
        </Paper>
    </Box>
  );
}

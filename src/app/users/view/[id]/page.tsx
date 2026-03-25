"use client";

import React, { use, useState, useEffect, useMemo } from 'react';
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
import { PermissionGuard } from '@/components/shared/PermissionGuard';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = React.memo(({ children, value, index, ...other }: TabPanelProps) => {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-view-tabpanel-${index}`}
      aria-labelledby={`user-view-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

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

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [tabValue, setTabValue] = useState(0);
  const [subscriptionSearch] = useState('');
  
  const walletPagination = useCursorPagination();
  const historyPagination = useCursorPagination();
  const loginPagination = useCursorPagination();

  // Consolidate pagination resets
  useEffect(() => {
    walletPagination.reset();
    historyPagination.reset();
    loginPagination.reset();
  }, [resolvedParams.id]);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);

  const walletColumns = useMemo<Column<WalletTransaction>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
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
    { id: 'reasonCode', label: 'Reason', minWidth: 150 },
    { id: 'referenceType', label: 'Reference Type', minWidth: 150 },
    { id: 'note', label: 'Note', minWidth: 200, format: (value: string) => value || 'N/A' },
  ], []);

  const historyColumns = useMemo<Column<any>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { id: 'rewardType', label: 'Reward Type', minWidth: 150, format: (value: string) => value || '--' },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => value != null ? (
        <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>-{value}</Typography>
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
          sx={{ background: getStatusBadgeColor(value), color: 'white', fontWeight: 600 }}
        />
      ),
    },
  ], []);

  const loginColumns = useMemo<Column<LoginHistory>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { id: 'ip', label: 'IP Address', minWidth: 120 },
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
            background: value ? 'linear-gradient(45deg, #213350, #6AB344)' : 'linear-gradient(45deg, #6AB344, #488a2e)',
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
  ], []);

  const subscriptionLogColumns = useMemo<Column<SubscriptionLog>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { id: 'amount', label: 'Amount', minWidth: 100, format: (value: string, row: SubscriptionLog) => `${value} ${row.currency}` },
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
            background: value.includes('succeeded') ? 'linear-gradient(45deg, #6AB344, #488a2e)' : 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    { id: 'stripeEventId', label: 'Stripe Event ID', minWidth: 200 },
  ], []);

  const visibleTabs = useMemo(() => [
    { id: 'details', label: 'Details', icon: <Person sx={{ fontSize: '1.2rem !important' }} /> },
    { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWallet sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_transactions' },
    { id: 'rewards', label: 'Redeem History', icon: <History sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_rewards' },
    { id: 'logins', label: 'Login Details', icon: <History sx={{ fontSize: '1.2rem !important' }} /> },
    { id: 'subscription', label: 'Subscription', icon: <History sx={{ fontSize: '1.2rem !important' }} /> },
  ].filter(tab => !tab.permission || hasPermission(tab.permission)), [hasPermission]);

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

  const { data: subscriptionData, isLoading: loadingSubscription } = useGetUserSubscriptionQuery(
    {
      userId: resolvedParams.id,
      search: subscriptionSearch || undefined,
      logsLimit: 100,
      planLimit: 100,
    },
    { skip: tabValue !== visibleTabs.findIndex(t => t.id === 'subscription') }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  if (loadingUser) {
    return (
      <Box p={4} display="flex" flexDirection="column" alignItems="center" gap={2}>
        <CircularProgress />
        <Typography color="text.secondary">Loading user details...</Typography>
      </Box>
    );
  }

  if (userError || !userResponse) {
    return (
      <Box p={4}>
        <Button startIcon={<ArrowBack />} onClick={() => router.push('/users')} sx={{ mb: 3 }}>
          Back to User Management
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">Failed to load user details. Please try again.</Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <PermissionGuard permission="users:view">
      <Box>
          <Button
            startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
            onClick={() => router.push('/users')}
            sx={{ mb: 1, height: '28px', fontSize: '0.75rem' }}
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
              sx={{
                borderBottom: 1,
                borderColor: 'divider',
                px: 2,
                minHeight: '36px',
                '& .MuiTabs-flexContainer': { height: '36px' },
                '& .MuiTab-root': { textTransform: 'none', fontWeight: 600, fontSize: '0.8rem', minHeight: '36px', py: 0.5 },
              }}
            >
              {visibleTabs.map((tab) => (
                <Tab key={tab.id} icon={tab.icon} iconPosition="start" label={tab.label} />
              ))}
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <Box sx={{ p: 1.5 }}>
                <Card sx={{ bgcolor: 'action.hover', border: '1px solid rgba(0, 0, 0, 0.08)', borderRadius: 1 }}>
                  <CardContent sx={{ p: 1.25, '&:last-child': { pb: 1.25 } }}>
                    <Typography variant="body2" sx={{ mb: 1, fontWeight: 700, fontSize: '0.85rem', color: 'primary.main' }}>
                      User Information
                    </Typography>
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Name</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{userResponse.name}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Email</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{userResponse.email}</Typography>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>User Type</Typography>
                        <Box mt={0.1}>
                          <Chip label={userResponse.userType} size="small" sx={{ height: '18px', fontSize: '0.65rem', background: 'linear-gradient(45deg, #213350, #6AB344)', color: 'white', fontWeight: 600 }} />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Status</Typography>
                        <Box mt={0.1}>
                          <Chip label={userResponse.isActive ? 'Active' : 'Inactive'} size="small" sx={{ height: '18px', fontSize: '0.65rem', background: userResponse.isActive ? 'linear-gradient(45deg, #6AB344, #488a2e)' : 'gray', color: 'white', fontWeight: 600 }} />
                        </Box>
                      </Grid>
                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.65rem', textTransform: 'uppercase' }}>Created At</Typography>
                        <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>{new Date(userResponse.createdAt).toLocaleString()}</Typography>
                      </Grid>
                    </Grid>
                  </CardContent>
                </Card>
              </Box>
            </TabPanel>

            {visibleTabs.some(t => t.id === 'wallet') && (
              <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'wallet')}>
                <Box sx={{ p: 3 }}>
                  {walletData && (
                    <Card sx={{ mb: 3, border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                      <CardContent sx={{ p: 1.5 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block', fontWeight: 600 }}>Current Balance</Typography>
                        <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1.25rem', color: 'primary.main' }}>
                          {walletData.walletBalance.toLocaleString()} Points
                        </Typography>
                      </CardContent>
                    </Card>
                  )}
                  {loadingWallet ? <CircularProgress /> : walletData && walletData.transactions.length > 0 ? (
                    <>
                      <DataTable columns={walletColumns} data={walletData.transactions} getRowId={(row) => row.id} />
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Showing {walletData.transactions.length} results</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={walletPagination.goPrevious} disabled={!walletPagination.canGoBack}><NavigateBefore /></IconButton>
                          <Typography variant="caption">Page {walletPagination.pageNumber}</Typography>
                          <IconButton size="small" onClick={() => walletPagination.goNext(walletData.pagination.nextCursor)} disabled={!walletData.pagination.hasMore}><NavigateNext /></IconButton>
                        </Box>
                      </Box>
                    </>
                  ) : <Typography>No transactions found</Typography>}
                </Box>
              </TabPanel>
            )}

            {visibleTabs.some(t => t.id === 'rewards') && (
              <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'rewards')}>
                <Box sx={{ p: 3 }}>
                  {loadingHistory ? <CircularProgress /> : historyData && historyData.items.length > 0 ? (
                    <>
                      <DataTable columns={historyColumns} data={historyData.items} getRowId={(row) => row.id} onView={(row: any) => router.push(`/reward-redemptions/${row.id}`)} />
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Showing {historyData.items.length} results</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={historyPagination.goPrevious} disabled={!historyPagination.canGoBack}><NavigateBefore /></IconButton>
                          <Typography variant="caption">Page {historyPagination.pageNumber}</Typography>
                          <IconButton size="small" onClick={() => historyPagination.goNext(historyData.pagination.nextCursor)} disabled={!historyData.pagination.hasMore}><NavigateNext /></IconButton>
                        </Box>
                      </Box>
                    </>
                  ) : <Typography>No redemption history found</Typography>}
                </Box>
              </TabPanel>
            )}

            {visibleTabs.some(t => t.id === 'logins') && (
              <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'logins')}>
                <Box sx={{ p: 1.5 }}>
                  {loadingLogins ? <CircularProgress /> : loginData && loginData.items.length > 0 ? (
                    <>
                      <DataTable columns={loginColumns} data={loginData.items} getRowId={(row) => row.id} />
                      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Typography variant="caption" color="text.secondary">Showing {loginData.items.length} results</Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <IconButton size="small" onClick={loginPagination.goPrevious} disabled={!loginPagination.canGoBack}><NavigateBefore /></IconButton>
                          <Typography variant="caption">Page {loginPagination.pageNumber}</Typography>
                          <IconButton size="small" onClick={() => loginPagination.goNext(loginData.pagination.nextCursor)} disabled={!loginData.pagination.hasMore}><NavigateNext /></IconButton>
                        </Box>
                      </Box>
                    </>
                  ) : <Typography>No login history found</Typography>}
                </Box>
              </TabPanel>
            )}

            {visibleTabs.some(t => t.id === 'subscription') && (
              <TabPanel value={tabValue} index={visibleTabs.findIndex(t => t.id === 'subscription')}>
                 <Box sx={{ p: 3 }}>
                  {loadingSubscription ? <CircularProgress /> : subscriptionData?.subscription ? (
                    <Grid container spacing={2}>
                      <Grid size={{ xs: 12 }}>
                        <Card sx={{ border: '1px solid rgba(0, 0, 0, 0.08)' }}>
                          <CardContent>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Active Plan</Typography>
                            <Typography>Plan: {subscriptionData.subscription.plan}</Typography>
                            <Typography color="text.secondary">Status: {subscriptionData.subscription.status}</Typography>
                          </CardContent>
                        </Card>
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Transaction Logs</Typography>
                        <DataTable columns={subscriptionLogColumns} data={subscriptionData.logs?.items || []} getRowId={(row) => row.id} />
                      </Grid>
                    </Grid>
                  ) : <Typography>No active subscription found</Typography>}
                </Box>
              </TabPanel>
            )}
          </Paper>
      </Box>
    </PermissionGuard>
  );
}


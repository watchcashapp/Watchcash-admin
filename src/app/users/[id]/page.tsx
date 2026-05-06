"use client";

import React, { use, useState, useMemo } from 'react';
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
  Skeleton,
} from '@mui/material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGetUserByIdQuery, useUnbanUserMutation } from '@/store/api/usersApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast, ConfirmDialog } from '@/components/shared';
import BanUserDialog from '@/components/features/BanUserDialog';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { ArrowBack, Person, AccountBalanceWallet, History as HistoryIcon, Block, CheckCircle } from '@mui/icons-material';

// Dynamic imports for tabs
const UserWalletTab = dynamic(() => import('@/components/features/user-details/UserWalletTab'), { 
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box> 
});
const UserRewardsTab = dynamic(() => import('@/components/features/user-details/UserRewardsTab'), { 
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box> 
});
const UserLoginsTab = dynamic(() => import('@/components/features/user-details/UserLoginsTab'), { 
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box> 
});
const UserSubscriptionTab = dynamic(() => import('@/components/features/user-details/UserSubscriptionTab'), { 
  loading: () => <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress size={24} /></Box> 
});

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
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      style={{ minHeight: 'auto' }}
      {...other}
    >
      {value === index && children}
    </div>
  );
});

TabPanel.displayName = 'TabPanel';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [tabValue, setTabValue] = useState(0);
  const [banDialogOpen, setBanDialogOpen] = useState(false);
  const [unbanConfirmOpen, setUnbanConfirmOpen] = useState(false);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const [unbanUser, { isLoading: isUnbanning }] = useUnbanUserMutation();
  
  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const visibleTabs = useMemo(() => {
    const tabs = [
      {
        id: 'details',
        label: 'Details',
        icon: <Person />,
        content: userResponse && (
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
        id: 'wallet',
        label: 'Wallet Transactions',
        icon: <AccountBalanceWallet />,
        permission: 'users:view_transactions',
        content: <UserWalletTab userId={resolvedParams.id} />
      },
      {
        id: 'rewards',
        label: 'Redemption History',
        icon: <HistoryIcon />,
        permission: 'users:view_rewards',
        content: <UserRewardsTab userId={resolvedParams.id} />
      },
      {
        id: 'logins',
        label: 'Login Details',
        icon: <HistoryIcon />,
        permission: 'users:view_login_history',
        content: <UserLoginsTab userId={resolvedParams.id} />
      },
      {
        id: 'subscription',
        label: 'Subscription',
        icon: <HistoryIcon />,
        permission: 'users:view_subscriptions',
        content: <UserSubscriptionTab userId={resolvedParams.id} />
      }
    ];

    return tabs.filter(tab => !tab.permission || hasPermission(tab.permission));
  }, [hasPermission, userResponse, resolvedParams.id]);

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

  return (
    <PermissionGuard permission="users:view">
      <Box sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
            <Box display="flex" alignItems="center" gap={1}>
              <Button 
                startIcon={<ArrowBack />} 
                onClick={() => router.push('/users')}
                sx={{
                  height: '30px',
                  minHeight: '30px',
                  fontSize: '0.75rem',
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
                }}
              >
                Back
              </Button>
              <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>User Details</Typography>
            </Box>
            <Box display="flex" gap={1}>
              {hasPermission('users:ban') && userResponse.userType !== 'STAFF' && !userResponse.isBanned && (
                <Button
                  variant="contained"
                  startIcon={<Block sx={{ fontSize: '1rem !important' }} />}
                  onClick={() => setBanDialogOpen(true)}
                  sx={{
                    height: '30px',
                    minHeight: '30px',
                    fontSize: '0.75rem',
                    background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                    boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
                    px: 2,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #b71c1c, #d32f2f)',
                      boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
                    },
                  }}
                >
                  BAN USER
                </Button>
              )}
              {hasPermission('users:unban') && userResponse.userType !== 'STAFF' && userResponse.isBanned && (
                <Button
                  variant="contained"
                  startIcon={<CheckCircle sx={{ fontSize: '1rem !important' }} />}
                  onClick={() => setUnbanConfirmOpen(true)}
                  sx={{
                    height: '30px',
                    minHeight: '30px',
                    fontSize: '0.75rem',
                    background: 'linear-gradient(45deg, #10b981, #059669)',
                    boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                    px: 2,
                    '&:hover': {
                      background: 'linear-gradient(45deg, #059669, #047857)',
                      boxShadow: '0 6px 16px rgba(16, 185, 129, 0.3)',
                    },
                  }}
                >
                  UNBAN USER
                </Button>
              )}
            </Box>
          </Box>
          <Paper sx={{ borderRadius: 2, overflow: 'hidden' }}>
            <Tabs value={tabValue} onChange={handleTabChange} variant="scrollable" sx={{ borderBottom: 1, borderColor: 'divider' }}>
              {visibleTabs.map((tab, idx) => (
                <Tab key={tab.id || idx} icon={tab.icon} iconPosition="start" label={tab.label} sx={{ textTransform: 'none', fontWeight: 600 }} />
              ))}
            </Tabs>
            {visibleTabs.map((tab, idx) => (
              <TabPanel key={tab.id || idx} value={tabValue} index={idx}>
                {tab.content}
              </TabPanel>
            ))}
          </Paper>
      </Box>
      <BanUserDialog
        open={banDialogOpen}
        onCancel={() => setBanDialogOpen(false)}
        user={userResponse}
        onSuccess={() => {
          setBanDialogOpen(false);
          // Mutation already happened in dialog, invalidating Users tag.
        }}
      />
      <ConfirmDialog
        open={unbanConfirmOpen}
        title="Unban User"
        message={`Are you sure you want to unban ${userResponse.name}? This will restore their access to the platform.`}
        confirmText="Unban"
        severity="success"
        isLoading={isUnbanning}
        onConfirm={async () => {
          try {
            await unbanUser(userResponse.id).unwrap();
            showSuccess('User unbanned successfully!');
            setUnbanConfirmOpen(false);
          } catch (error: any) {
            showError(error);
          }
        }}
        onCancel={() => setUnbanConfirmOpen(false)}
      />
    </PermissionGuard>
  );
}

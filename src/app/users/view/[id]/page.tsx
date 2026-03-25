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
  IconButton,
} from '@mui/material';
import { ArrowBack, Person, AccountBalanceWallet, History as HistoryIcon, NavigateBefore, NavigateNext, Block } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { useGetUserByIdQuery } from '@/store/api/usersApi';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/components/shared';
import BanUserDialog from '@/components/features/BanUserDialog';
import { PermissionGuard } from '@/components/shared/PermissionGuard';

// Dynamic imports for tabs with centered loaders
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
      id={`user-view-tabpanel-${index}`}
      aria-labelledby={`user-view-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
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

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);

  const visibleTabs = useMemo(() => [
    { 
      id: 'details', 
      label: 'Details', 
      icon: <Person sx={{ fontSize: '1.2rem !important' }} />,
      content: userResponse && (
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
      )
    },
    { id: 'wallet', label: 'Wallet', icon: <AccountBalanceWallet sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_transactions', content: <UserWalletTab userId={resolvedParams.id} /> },
    { id: 'rewards', label: 'Redeem History', icon: <HistoryIcon sx={{ fontSize: '1.2rem !important' }} />, permission: 'users:view_rewards', content: <UserRewardsTab userId={resolvedParams.id} /> },
    { id: 'logins', label: 'Login Details', icon: <HistoryIcon sx={{ fontSize: '1.2rem !important' }} />, content: <UserLoginsTab userId={resolvedParams.id} /> },
    { id: 'subscription', label: 'Subscription', icon: <HistoryIcon sx={{ fontSize: '1.2rem !important' }} />, content: <UserSubscriptionTab userId={resolvedParams.id} /> },
  ].filter(tab => !tab.permission || hasPermission(tab.permission)), [hasPermission, userResponse, resolvedParams.id]);

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
          <Box display="flex" justifyContent="space-between" alignItems="flex-end" mb={1}>
            <Box>
              <Button
                startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
                onClick={() => router.push('/users')}
                sx={{ mb: 1, height: '28px', fontSize: '0.75rem', color: 'text.secondary', textTransform: 'uppercase' }}
              >
                Back to User Management
              </Button>

              <Typography
                variant="h5"
                sx={{
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
            </Box>

            {hasPermission('users:ban') && userResponse && userResponse.userType !== 'STAFF' && (
              <Button
                variant="contained"
                startIcon={<Block sx={{ fontSize: '1rem !important' }} />}
                onClick={() => setBanDialogOpen(true)}
                sx={{
                  mb: 0.5,
                  height: '30px',
                  minHeight: '30px',
                  fontSize: '0.75rem',
                  background: 'linear-gradient(45deg, #d32f2f, #f44336)',
                  boxShadow: '0 4px 12px rgba(211, 47, 47, 0.2)',
                  px: 3,
                  '&:hover': {
                    background: 'linear-gradient(45deg, #b71c1c, #d32f2f)',
                    boxShadow: '0 6px 16px rgba(211, 47, 47, 0.3)',
                  },
                }}
              >
                BAN USER
              </Button>
            )}
          </Box>

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
              {visibleTabs.map((tab, idx) => (
                <Tab key={tab.id || idx} icon={tab.icon} iconPosition="start" label={tab.label} />
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
          // Mutation handled inside dialog.
        }}
      />
    </PermissionGuard>
  );
}

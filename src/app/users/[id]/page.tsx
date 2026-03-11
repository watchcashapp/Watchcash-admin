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
      style={{ minHeight: 'auto' }}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const [tabValue, setTabValue] = useState(0);
  const [walletPage, setWalletPage] = useState(1);

  const [historyPage, setHistoryPage] = useState(1);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    { userId: resolvedParams.id, page: walletPage, limit: 6 },
    { skip: tabValue !== 1 }
  );
  const { data: historyData, isLoading: loadingHistory } = useGetUserRedeemHistoryQuery(
    { userId: resolvedParams.id, page: historyPage, limit: 6 },
    { skip: tabValue !== 2 }
  );

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
    },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => (
        <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>
          -{value}
        </Typography>
      ),
    },
    {
      id: 'rewardValue',
      label: 'Value',
      align: 'right',
      minWidth: 100,
      format: (value: number, row: any) => `${value} ${row.rewardCurrency}`,
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
        <Box display="flex" justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
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
          startIcon={<ArrowBack />}
          onClick={() => router.push('/users')}
          sx={{
            mb: 2,
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to User Management
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
          User Details
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
            overflow: 'visible',
          }}
        >
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              px: 2,
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '1rem',
              },
              '& .Mui-selected': {
                color: '#667eea',
              },
              '& .MuiTabs-indicator': {
                backgroundColor: '#667eea',
              },
            }}
          >
            <Tab icon={<Person />} iconPosition="start" label="Details" />
            <Tab icon={<AccountBalanceWallet />} iconPosition="start" label="Wallet Transactions" />
            <Tab icon={<History />} iconPosition="start" label="Redemption History" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <Box sx={{ p: 3 }}>
              <Grid container spacing={3}>
                {/* User Information */}
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                      overflow: 'visible',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        User Information
                      </Typography>
                      <Grid container spacing={2}>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Name
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {userResponse.name}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Email
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {userResponse.email}
                          </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            User Type
                          </Typography>
                          <Chip
                            label={userResponse.userType}
                            size="small"
                            sx={{
                              mt: 0.5,
                              background: userResponse.userType === 'ADMIN'
                                ? 'linear-gradient(45deg, #667eea, #764ba2)'
                                : 'linear-gradient(45deg, #10b981, #059669)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Status
                          </Typography>
                          <Chip
                            label={userResponse.isActive ? 'Active' : 'Inactive'}
                            size="small"
                            sx={{
                              mt: 0.5,
                              background: userResponse.isActive
                                ? 'linear-gradient(45deg, #10b981, #059669)'
                                : 'linear-gradient(45deg, #6b7280, #4b5563)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                          <Typography variant="body2" color="text.secondary">
                            Created At
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {isMounted ? new Date(userResponse.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
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
                    overflow: 'visible',
                  }}
                >
                  <CardContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      Current Balance
                    </Typography>
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        background: 'linear-gradient(45deg, #667eea, #764ba2)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        backgroundClip: 'text',
                      }}
                    >
                      {walletData.walletBalance.toLocaleString()} Points
                    </Typography>
                  </CardContent>
                </Card>
              )}

              {/* Transactions Table */}
              {loadingWallet ? (
                <Box display="flex" justifyContent="center" alignItems="center" style={{ minHeight: '200px' }}>
                  <CircularProgress />
                </Box>
              ) : walletData && walletData.transactions.length > 0 ? (
                <>
                  <DataTable
                    columns={walletColumns}
                    data={walletData.transactions}
                    getRowId={(row) => row.id}
                    emptyMessage="No transactions found"
                    onView={(row: WalletTransaction) =>
                      router.push(`/users/${resolvedParams.id}/transactions/${row.id}`)
                    }
                  />

                  {/* Pagination */}
                  {walletData.totalPages > 1 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {walletData.transactions.length} of {walletData.total} results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => setWalletPage(walletPage - 1)}
                          disabled={walletPage <= 1}
                          sx={{
                            bgcolor: walletPage <= 1 ? 'action.disabled' : 'primary.main',
                            color: walletPage <= 1 ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: walletPage <= 1 ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateBefore />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                          {walletPage} / {walletData.totalPages}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setWalletPage(walletPage + 1)}
                          disabled={walletPage >= walletData.totalPages}
                          sx={{
                            bgcolor: walletPage >= walletData.totalPages ? 'action.disabled' : 'primary.main',
                            color: walletPage >= walletData.totalPages ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: walletPage >= walletData.totalPages ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateNext />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
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
                  {historyData.totalPages > 1 && (
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {historyData.items.length} of {historyData.total} results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => setHistoryPage(historyPage - 1)}
                          disabled={historyPage <= 1}
                          sx={{
                            bgcolor: historyPage <= 1 ? 'action.disabled' : 'primary.main',
                            color: historyPage <= 1 ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: historyPage <= 1 ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateBefore />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                          {historyPage} / {historyData.totalPages}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setHistoryPage(historyPage + 1)}
                          disabled={historyPage >= historyData.totalPages}
                          sx={{
                            bgcolor: historyPage >= historyData.totalPages ? 'action.disabled' : 'primary.main',
                            color: historyPage >= historyData.totalPages ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: historyPage >= historyData.totalPages ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateNext />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
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

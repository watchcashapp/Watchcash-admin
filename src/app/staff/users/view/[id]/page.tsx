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
} from '@mui/material';
import { ArrowBack, Person, AccountBalanceWallet, Edit, History } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
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
    { userId: resolvedParams.id, page: walletPage, limit: 20 },
    { skip: tabValue !== 1 }
  );
  const { data: historyData, isLoading: loadingHistory } = useGetUserRedeemHistoryQuery(
    { userId: resolvedParams.id, page: historyPage, limit: 20 },
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (userError || !userResponse) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/staff/users')}
          sx={{
            mb: 3,
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to Staff Users
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">
            Failed to load user details. Please try again.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/staff/users')}
          sx={{
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to Staff Users
        </Button>
        <Button
          variant="contained"
          startIcon={<Edit />}
          onClick={() => router.push(`/staff/users/${resolvedParams.id}`)}
          sx={{
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
            },
          }}
        >
          Edit User
        </Button>
      </Box>

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

              {/* Roles */}
              {userResponse.roles && userResponse.roles.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Roles
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {userResponse.roles.map((role) => (
                          <Chip
                            key={role.id}
                            label={role.name}
                            sx={{
                              background: 'linear-gradient(45deg, #667eea, #764ba2)',
                              color: 'white',
                              fontWeight: 600,
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}

              {/* Permissions */}
              {userResponse.permissions && userResponse.permissions.length > 0 && (
                <Grid size={{ xs: 12 }}>
                  <Card
                    sx={{
                      bgcolor: 'background.paper',
                      border: (theme) => theme.palette.mode === 'dark'
                        ? '1px solid rgba(255, 255, 255, 0.1)'
                        : '1px solid rgba(0, 0, 0, 0.08)',
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                        Permissions ({userResponse.permissions.length})
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {userResponse.permissions.map((permission) => (
                          <Chip
                            key={permission.id}
                            label={permission.code}
                            size="small"
                            variant="outlined"
                            sx={{
                              borderColor: '#667eea',
                              color: 'text.primary',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              )}
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
                {walletData.totalPages > 1 && (
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <button
                      onClick={() => setWalletPage(walletPage - 1)}
                      disabled={walletPage === 1}
                      style={{
                        padding: '8px 16px',
                        background: walletPage === 1 ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: walletPage === 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: walletPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                      Page {walletPage} of {walletData.totalPages}
                    </span>
                    <button
                      onClick={() => setWalletPage(walletPage + 1)}
                      disabled={walletPage === walletData.totalPages}
                      style={{
                        padding: '8px 16px',
                        background: walletPage === walletData.totalPages ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: walletPage === walletData.totalPages ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: walletPage === walletData.totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Next
                    </button>
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
                  <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
                    <button
                      onClick={() => setHistoryPage(historyPage - 1)}
                      disabled={historyPage === 1}
                      style={{
                        padding: '8px 16px',
                        background: historyPage === 1 ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: historyPage === 1 ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: historyPage === 1 ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Previous
                    </button>
                    <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                      Page {historyPage} of {historyData.totalPages}
                    </span>
                    <button
                      onClick={() => setHistoryPage(historyPage + 1)}
                      disabled={historyPage === historyData.totalPages}
                      style={{
                        padding: '8px 16px',
                        background: historyPage === historyData.totalPages ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
                        color: historyPage === historyData.totalPages ? '#9ca3af' : 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: historyPage === historyData.totalPages ? 'not-allowed' : 'pointer',
                        fontWeight: 600,
                      }}
                    >
                      Next
                    </button>
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
  );
}

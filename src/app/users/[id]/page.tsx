"use client";

import { use, useState } from 'react';
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
import { ArrowBack, Person, AccountBalanceWallet } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { DataTable, Column } from '@/components/shared';
import { useGetUserByIdQuery, useGetUserWalletQuery, WalletTransaction } from '@/store/api/usersApi';

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

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);
  const { data: walletData, isLoading: loadingWallet } = useGetUserWalletQuery(
    { userId: resolvedParams.id, page: walletPage, limit: 20 },
    { skip: tabValue !== 1 }
  );

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const walletColumns: Column<WalletTransaction>[] = [
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
                            {new Date(userResponse.createdAt).toLocaleString('en-US', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
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
                    onView={(row: WalletTransaction) =>
                      router.push(`/users/${resolvedParams.id}/transactions/${row.id}`)
                    }
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
        </Paper>
      </Box>
    </DashboardLayout>
  );
}

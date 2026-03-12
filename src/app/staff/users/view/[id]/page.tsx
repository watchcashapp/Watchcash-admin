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
import { ArrowBack, Edit } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useGetUserByIdQuery } from '@/store/api/usersApi';
import { usePermissions } from '@/hooks/usePermissions';

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
  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { hasPermission } = usePermissions();

  useEffect(() => {
    if (isMounted && !hasPermission('users:view')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Button
          startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
          onClick={() => router.push('/staff/users')}
          sx={{
            height: '28px',
            fontSize: '0.75rem',
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to Staff Users
        </Button>
        <Button
          variant="contained"
          startIcon={<Edit sx={{ fontSize: '1rem !important' }} />}
          onClick={() => router.push(`/staff/users/${resolvedParams.id}`)}
          sx={{
            height: '28px',
            fontSize: '0.75rem',
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
        Staff User Details
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      Name
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.75rem' }}>
                      {userResponse.name}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
                      Email
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
                      {userResponse.email}
                    </Typography>
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
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
                    <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, fontSize: '0.7rem' }}>
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

          {/* Roles */}
          {userResponse.roles && userResponse.roles.length > 0 && (
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
                    Roles
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {userResponse.roles.map((role: any) => (
                      <Chip
                        key={role.id}
                        label={role.name}
                        size="small"
                        sx={{
                          height: '20px',
                          fontSize: '0.7rem',
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
                    Permissions ({userResponse.permissions.length})
                  </Typography>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                    {userResponse.permissions.map((permission: any) => (
                      <Chip
                        key={permission.id}
                        label={permission.code}
                        size="small"
                        variant="outlined"
                        sx={{
                          height: '18px',
                          fontSize: '0.65rem',
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
      </Paper>
    </Box>
  );
}

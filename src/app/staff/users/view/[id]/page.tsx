"use client";

import { use, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  Chip,
  Card,
  CardContent,
} from '@mui/material';
import { ArrowBack, Edit } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { useGetUserByIdQuery } from '@/store/api/usersApi';

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();

  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const { data: userResponse, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(resolvedParams.id);

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
          p: 3,
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
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
      </Paper>
    </Box>
  );
}

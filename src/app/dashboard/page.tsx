"use client";

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  IconButton,
  Button,
} from '@mui/material';
import {
  People,
  BarChart,
  PersonAdd,
  VerifiedUser,
  Block,
  AccessTime,
  NavigateBefore,
  NavigateNext,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetDashboardStatsQuery, useGetSessionsSummaryQuery } from '@/store/api/dashboardApi';
import { useRouter } from 'next/navigation';
import { usePermissions } from '@/hooks/usePermissions';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, isLoading } = useGetDashboardStatsQuery();
  const { data: summaryData, isLoading: isLoadingSummary, error: summaryError } = useGetSessionsSummaryQuery();
  const router = useRouter();
  const { hasPermission } = usePermissions();

  // Pagination states
  const [flaggedPage, setFlaggedPage] = React.useState(1);
  const [highRiskPage, setHighRiskPage] = React.useState(1);
  const itemsPerPage = 6;



  // Fallback data for demo purposes when APIs don't exist
  const fallbackFlaggedSessions: any[] = [];
  const fallbackHighRiskSessions: any[] = [];

  const displayFlaggedSessions = summaryError ? fallbackFlaggedSessions : (summaryData?.data?.flagged || []);
  const displayHighRiskSessions = summaryError ? fallbackHighRiskSessions : (summaryData?.data?.high_risk || []);

  // Pagination calculations
  const flaggedTotalPages = Math.ceil(displayFlaggedSessions.length / itemsPerPage);
  const highRiskTotalPages = Math.ceil(displayHighRiskSessions.length / itemsPerPage);

  const flaggedStartIndex = (flaggedPage - 1) * itemsPerPage;
  const highRiskStartIndex = (highRiskPage - 1) * itemsPerPage;

  const paginatedFlaggedSessions = displayFlaggedSessions.slice(flaggedStartIndex, flaggedStartIndex + itemsPerPage);

  const paginatedHighRiskSessions = displayHighRiskSessions.slice(highRiskStartIndex, highRiskStartIndex + itemsPerPage);

  const handleCardClick = (title: string) => {
    switch (title) {
      case 'Total Users':
        router.push('/users');
        break;
      case 'Active Users':
      case 'Banned Users':
        router.push('/staff/users');
        break;
      case 'Total Staff':
      case 'Active Staff':
        router.push('/staff/users');
        break;
      case "Today's Sessions":
        router.push('/sessions');
        break;
      default:
        break;
    }
  };

  const stats = data ? [
    {
      title: 'Total Users',
      value: data.data.totalUsers.toString(),
      icon: <People />,
      color: '#213350',
      bgColor: 'rgba(33, 51, 80, 0.1)',
    },
    {
      title: 'Active Users',
      value: data.data.activeUsers.toString(),
      icon: <VerifiedUser />,
      color: '#10b981',
      bgColor: 'rgba(16, 185, 129, 0.1)',
    },
    {
      title: 'Total Staff',
      value: data.data.totalStaffUsers.toString(),
      icon: <PersonAdd />,
      color: '#3b82f6',
      bgColor: 'rgba(59, 130, 246, 0.1)',
    },
    {
      title: 'Active Staff',
      value: data.data.activeStaffUsers.toString(),
      icon: <VerifiedUser />,
      color: '#0ea5e9',
      bgColor: 'rgba(14, 165, 233, 0.1)',
    },
    {
      title: 'Banned Users',
      value: data.data.bannedUsers.toString(),
      icon: <Block />,
      color: '#ef4444',
      bgColor: 'rgba(239, 68, 68, 0.1)',
    },
    {
      title: 'Today\'s Sessions',
      value: data.data.totalSessionsInDay.toString(),
      icon: <AccessTime />,
      color: '#6AB344',
      bgColor: 'rgba(106, 179, 68, 0.1)',
    },
  ] : [];

  const filteredStats = stats.filter(stat => {
    if (stat.title === 'Total Users') return hasPermission('dashboard:view_total_users');
    if (stat.title === 'Active Users') return hasPermission('dashboard:view_active_users');
    if (stat.title === 'Total Staff') return hasPermission('dashboard:view_total_staff');
    if (stat.title === 'Active Staff') return hasPermission('dashboard:view_active_staff');
    if (stat.title === "Today's Sessions") return hasPermission('dashboard:view_total_device_sessions');
    if (stat.title === 'Banned Users') return hasPermission('dashboard:view_banned_users');
    return true;
  });

  return (
    <Box>
      <Box>
        {/* Welcome Message */}
        <Box mb={2}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              mb: 0.25,
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ fontWeight: 400, display: 'block' }}
          >
            Here's what's happening with your platform today.
          </Typography>
        </Box>

        {/* Stats Cards */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
            <CircularProgress />
          </Box>
        ) : (
          <Grid container spacing={1.5}>
            {filteredStats.map((stat, index) => (
              <Grid size={{ xs: 12, sm: 6, md: 4 }} key={index}>
                <Card
                  sx={{
                    height: '100%',
                    bgcolor: 'background.paper',
                    backdropFilter: 'blur(20px)',
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                      : '0 8px 32px rgba(0, 0, 0, 0.1)',
                    border: (theme) => theme.palette.mode === 'dark'
                      ? '1px solid rgba(255, 255, 255, 0.1)'
                      : '1px solid rgba(0, 0, 0, 0.05)',
                    borderRadius: 3,
                    transition: 'all 0.3s ease-in-out',
                    cursor: 'pointer',
                    '&:hover': {
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 12px 40px rgba(0, 0, 0, 0.8)'
                        : '0 12px 40px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                  onClick={() => handleCardClick(stat.title)}
                >
                  <CardContent sx={{ p: 1.5, '&:last-child': { pb: 1.5 } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ mb: 0.5, fontWeight: 500, display: 'block' }}
                        >
                          {stat.title}
                        </Typography>
                        <Typography
                          sx={{
                            fontWeight: 700,
                            fontSize: '1.5rem',
                            color: stat.color,
                            lineHeight: 1,
                          }}
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          backgroundColor: stat.bgColor,
                          color: stat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '& svg': {
                            fontSize: 24,
                          },
                        }}
                      >
                        {stat.icon}
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}

        {/* Recent Data Cards */}
        <Grid container spacing={1.5} sx={{ mt: 1 }}>
          {/* Flagged Sessions Card */}
          {hasPermission('dashboard:view_flagged_sessions_widget') && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  backdropFilter: 'blur(20px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 12px 40px rgba(0, 0, 0, 0.8)'
                      : '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="h6"
                    sx={{
                      fontWeight: 600,
                      mb: 2,
                      color: 'text.primary',
                    }}
                  >
                    Flagged Sessions
                  </Typography>
                  {isLoadingSummary ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <CircularProgress size={24} />
                    </Box>
                  ) : displayFlaggedSessions.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <Typography variant="body2" color="text.secondary">
                        No data found
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Risk Rating</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Duration</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Status</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedFlaggedSessions.map((session: any) => (
                            <TableRow key={session.id} hover>
                              <TableCell sx={{ fontSize: '0.875rem' }}>
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 500 }}>
                                    {session.user_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {session.user_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.875rem' }}>
                                <Chip
                                  size="small"
                                  label={session.metadata.risk_rating}
                                  color={
                                    session.metadata.risk_rating === 'high' ? 'error' :
                                      session.metadata.risk_rating === 'medium' ? 'warning' : 'default'
                                  }
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.875rem' }}>
                                {Math.floor(session.duration_seconds / 60)}m {session.duration_seconds % 60}s
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.875rem' }}>
                                <Chip
                                  size="small"
                                  label={session.status}
                                  color={session.status === 'completed' ? 'success' : 'default'}
                                  sx={{ fontSize: '0.75rem' }}
                                />
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Pagination for Flagged Sessions */}
                  {!isLoadingSummary && displayFlaggedSessions.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {paginatedFlaggedSessions.length} of {displayFlaggedSessions.length} results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => setFlaggedPage(flaggedPage - 1)}
                          disabled={flaggedPage <= 1}
                          sx={{
                            bgcolor: flaggedPage <= 1 ? 'action.disabled' : 'primary.main',
                            color: flaggedPage <= 1 ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: flaggedPage <= 1 ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateBefore />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                          {flaggedPage} / {flaggedTotalPages || 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setFlaggedPage(flaggedPage + 1)}
                          disabled={flaggedPage >= (flaggedTotalPages || 1)}
                          sx={{
                            bgcolor: flaggedPage >= (flaggedTotalPages || 1) ? 'action.disabled' : 'primary.main',
                            color: flaggedPage >= (flaggedTotalPages || 1) ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: flaggedPage >= (flaggedTotalPages || 1) ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateNext />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}

          {/* High Risk Sessions Card */}
          {hasPermission('dashboard:view_high_risk_sessions_widget') && (
            <Grid size={{ xs: 12, lg: 6 }}>
              <Card
                sx={{
                  height: '100%',
                  bgcolor: 'background.paper',
                  backdropFilter: 'blur(20px)',
                  boxShadow: (theme) => theme.palette.mode === 'dark'
                    ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                    : '0 8px 32px rgba(0, 0, 0, 0.1)',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.05)',
                  borderRadius: 3,
                  transition: 'all 0.3s ease-in-out',
                  '&:hover': {
                    boxShadow: (theme) => theme.palette.mode === 'dark'
                      ? '0 12px 40px rgba(0, 0, 0, 0.8)'
                      : '0 12px 40px rgba(0, 0, 0, 0.15)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                <CardContent sx={{ p: 3 }}>
                  <Typography
                    variant="subtitle2"
                    sx={{
                      fontWeight: 600,
                      mb: 1.5,
                      color: 'text.primary',
                      fontSize: '0.9rem',
                    }}
                  >
                    High Risk Sessions
                  </Typography>
                  {isLoadingSummary ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <CircularProgress size={24} />
                    </Box>
                  ) : displayHighRiskSessions.length === 0 ? (
                    <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
                      <Typography variant="body2" color="text.secondary">
                        No data found
                      </Typography>
                    </Box>
                  ) : (
                    <TableContainer component={Paper} sx={{ bgcolor: 'transparent', boxShadow: 'none' }}>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>User</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Risk Reason</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Points</TableCell>
                            <TableCell sx={{ fontWeight: 600, fontSize: '0.75rem', py: 0.75 }}>Created</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {paginatedHighRiskSessions.map((session: any) => (
                            <TableRow key={session.id} hover>
                              <TableCell sx={{ fontSize: '0.75rem', py: 0.5 }}>
                                <Box>
                                  <Typography variant="caption" sx={{ fontWeight: 600, display: 'block' }}>
                                    {session.user_name}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
                                    {session.user_email}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Typography variant="caption" sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', display: 'block' }}>
                                  {session.metadata.risk_reason}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600 }}>
                                  {session.points_earned}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ fontSize: '0.7rem', py: 0.5 }}>
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(session.created_at).toLocaleDateString()}
                                </Typography>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}

                  {/* Pagination for High Risk Sessions */}
                  {!isLoadingSummary && displayHighRiskSessions.length > 0 && (
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        Showing {paginatedHighRiskSessions.length} of {displayHighRiskSessions.length} results
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <IconButton
                          size="small"
                          onClick={() => setHighRiskPage(highRiskPage - 1)}
                          disabled={highRiskPage <= 1}
                          sx={{
                            bgcolor: highRiskPage <= 1 ? 'action.disabled' : 'primary.main',
                            color: highRiskPage <= 1 ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: highRiskPage <= 1 ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateBefore />
                        </IconButton>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                          {highRiskPage} / {highRiskTotalPages || 1}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={() => setHighRiskPage(highRiskPage + 1)}
                          disabled={highRiskPage >= (highRiskTotalPages || 1)}
                          sx={{
                            bgcolor: highRiskPage >= (highRiskTotalPages || 1) ? 'action.disabled' : 'primary.main',
                            color: highRiskPage >= (highRiskTotalPages || 1) ? 'text.disabled' : 'white',
                            '&:hover': {
                              bgcolor: highRiskPage >= (highRiskTotalPages || 1) ? 'action.disabled' : 'primary.dark',
                            },
                          }}
                        >
                          <NavigateNext />
                        </IconButton>
                      </Box>
                    </Box>
                  )}
                </CardContent>
              </Card>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
}

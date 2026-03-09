"use client";

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
} from '@mui/material';
import {
  People,
  BarChart,
  PersonAdd,
  VerifiedUser,
  Block,
  AccessTime,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { useGetDashboardStatsQuery } from '@/store/api/dashboardApi';

export default function DashboardPage() {
  const { user } = useSelector((state: RootState) => state.auth);
  const { data, isLoading } = useGetDashboardStatsQuery();

  const stats = data ? [
    {
      title: 'Total Users',
      value: data.data.totalUsers.toString(),
      icon: <People />,
      color: '#667eea',
      bgColor: 'rgba(102, 126, 234, 0.1)',
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
      color: '#8b5cf6',
      bgColor: 'rgba(139, 92, 246, 0.1)',
    },
  ] : [];

  return (
    <DashboardLayout>
      <Box>
        {/* Welcome Message */}
        <Box mb={4}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              mb: 1,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Welcome back{user?.name ? `, ${user.name}` : ''}!
          </Typography>
          <Typography
            variant="body1"
            color="text.secondary"
            sx={{ fontWeight: 400 }}
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
          <Grid container spacing={3}>
            {stats.map((stat, index) => (
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
                    '&:hover': {
                      boxShadow: (theme) => theme.palette.mode === 'dark'
                        ? '0 12px 40px rgba(0, 0, 0, 0.8)'
                        : '0 12px 40px rgba(0, 0, 0, 0.15)',
                      transform: 'translateY(-4px)',
                    },
                  }}
                >
                  <CardContent sx={{ p: 3 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <Box>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mb: 1, fontWeight: 500 }}
                        >
                          {stat.title}
                        </Typography>
                        <Typography
                          variant="h3"
                          sx={{
                            fontWeight: 700,
                            color: stat.color,
                          }}
                        >
                          {stat.value}
                        </Typography>
                      </Box>
                      <Box
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          backgroundColor: stat.bgColor,
                          color: stat.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          '& svg': {
                            fontSize: 32,
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
      </Box>
    </DashboardLayout>
  );
}

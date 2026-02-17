"use client";

import React from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from '@mui/material';
import {
  AccountBalance,
  TrendingUp,
  AccountBalanceWallet,
  ArrowUpward,
  ArrowDownward,
  Timeline,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';

export default function DashboardPage() {
  const stats = [
    {
      title: 'Total Balance',
      value: '$12,450.00',
      change: '+12.5%',
      icon: <AccountBalanceWallet />,
      color: 'primary.main',
    },
    {
      title: 'Monthly Income',
      value: '$3,250.00',
      change: '+8.2%',
      icon: <TrendingUp />,
      color: 'success.main',
    },
    {
      title: 'Monthly Expenses',
      value: '$1,850.00',
      change: '-3.1%',
      icon: <AccountBalance />,
      color: 'error.main',
    },
    {
      title: 'Investments',
      value: '$8,750.00',
      change: '+15.3%',
      icon: <Timeline />,
      color: 'info.main',
    },
  ];

  const recentTransactions = [
    { id: 1, name: 'Salary Deposit', amount: '+$3,250.00', date: '2024-01-15', type: 'income' },
    { id: 2, name: 'Grocery Store', amount: '-$125.50', date: '2024-01-14', type: 'expense' },
    { id: 3, name: 'Electric Bill', amount: '-$85.00', date: '2024-01-13', type: 'expense' },
    { id: 4, name: 'Freelance Project', amount: '+$500.00', date: '2024-01-12', type: 'income' },
    { id: 5, name: 'Restaurant', amount: '-$45.00', date: '2024-01-11', type: 'expense' },
  ];

  return (
    <DashboardLayout>
      <Box>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, mb: 4 }}>
          Dashboard Overview
        </Typography>

        <Grid container spacing={3}>
          {stats.map((stat, index) => (
            <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={index}>
              <Card
                sx={{
                  height: '100%',
                  boxShadow: 2,
                  '&:hover': {
                    boxShadow: 4,
                    transform: 'translateY(-2px)',
                    transition: 'all 0.2s ease-in-out',
                  },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Box
                      sx={{
                        p: 1,
                        borderRadius: 2,
                        backgroundColor: `${stat.color}15`,
                        color: stat.color,
                      }}
                    >
                      {stat.icon}
                    </Box>
                    <Box sx={{ ml: 'auto' }}>
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          fontWeight: 500,
                        }}
                      >
                        {stat.change.startsWith('+') ? (
                          <ArrowUpward sx={{ fontSize: 16, mr: 0.5 }} />
                        ) : (
                          <ArrowDownward sx={{ fontSize: 16, mr: 0.5 }} />
                        )}
                        {stat.change}
                      </Typography>
                    </Box>
                  </Box>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {stat.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {stat.title}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}

          <Grid size={{ xs: 12, lg: 8 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Financial Overview
              </Typography>
              <Box
                sx={{
                  height: 300,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'grey.50',
                  borderRadius: 2,
                  border: '2px dashed',
                  borderColor: 'grey.300',
                }}
              >
                <Typography variant="body1" color="text.secondary">
                  Chart Component Placeholder
                </Typography>
              </Box>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, lg: 4 }}>
            <Paper sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
                Recent Transactions
              </Typography>
              <List sx={{ p: 0 }}>
                {recentTransactions.map((transaction) => (
                  <ListItem
                    key={transaction.id}
                    sx={{
                      px: 0,
                      py: 1,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      '&:last-child': { borderBottom: 'none' },
                    }}
                  >
                    <ListItemIcon>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1,
                          backgroundColor:
                            transaction.type === 'income'
                              ? 'success.light'
                              : 'error.light',
                          color:
                            transaction.type === 'income'
                              ? 'success.dark'
                              : 'error.dark',
                        }}
                      >
                        {transaction.type === 'income' ? (
                          <ArrowUpward sx={{ fontSize: 16 }} />
                        ) : (
                          <ArrowDownward sx={{ fontSize: 16 }} />
                        )}
                      </Box>
                    </ListItemIcon>
                    <ListItemText
                      primary={transaction.name}
                      secondary={transaction.date}
                      primaryTypographyProps={{
                        variant: 'body2',
                        fontWeight: 500,
                      }}
                      secondaryTypographyProps={{
                        variant: 'caption',
                      }}
                    />
                    <Typography
                      variant="body2"
                      fontWeight={600}
                      color={
                        transaction.type === 'income' ? 'success.main' : 'error.main'
                      }
                    >
                      {transaction.amount}
                    </Typography>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}

"use client";

import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  Divider,
  CircularProgress,
  FormControlLabel,
  Switch,
  IconButton,
  Alert,
} from '@mui/material';
import { DoneAll, MarkEmailRead, Refresh } from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast } from '@/components/shared';
import { useNotifications } from '@/components/notifications/NotificationsProvider';
import type { Notification as AppNotification } from '@/store/api/notificationsApi';

export default function NotificationsPage() {
  const { showError, showSuccess } = useToast();
  const {
    items: notifications,
    unreadCount,
    unreadOnly,
    setUnreadOnly,
    nextCursor,
    isInitialLoading,
    isLoadingMore,
    isRefreshing,
    apiError,
    refresh,
    loadMore,
    markAllAsRead,
    markOneAsRead,
    isMarkingAllRead: isMarkingAll,
    isMarkingOneRead: isMarkingOne,
  } = useNotifications();

  const handleRefresh = async () => {
    try {
      await refresh();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to refresh notifications';
      showError(errorMessage);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllAsRead();
      showSuccess('All notifications marked as read');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to mark all notifications as read';
      showError(errorMessage);
    }
  };

  const handleMarkSingleRead = async (notification: AppNotification) => {
    if (notification.is_read) {
      return;
    }

    try {
      await markOneAsRead(notification.id);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to mark notification as read';
      showError(errorMessage);
    }
  };

  const formatDate = (value: string) => {
    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return 'Unknown date';
    }

    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  return (
    <DashboardLayout>
      <Box>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: { xs: 'flex-start', md: 'center' },
            flexDirection: { xs: 'column', md: 'row' },
            gap: 2,
            mb: 3,
          }}
        >
          <Box>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 700,
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Notifications
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Keep track of platform updates and activity alerts.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
            <Chip color={unreadCount > 0 ? 'error' : 'default'} label={`${unreadCount} unread`} />
            <Button
              variant="outlined"
              startIcon={<DoneAll />}
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || unreadCount === 0}
            >
              Mark all as read
            </Button>
            <IconButton onClick={handleRefresh} aria-label="refresh notifications">
              <Refresh />
            </IconButton>
          </Box>
        </Box>

        <Paper
          sx={{
            p: 2,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          {apiError && (
            <Alert severity="error" sx={{ mb: 2, width: '100%' }}>
              {apiError}
            </Alert>
          )}

          <FormControlLabel
            control={<Switch checked={unreadOnly} onChange={(event) => setUnreadOnly(event.target.checked)} />}
            label="Unread only"
          />
        </Paper>

        {isInitialLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="220px">
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Paper sx={{ p: 4 }}>
            <Typography variant="body1" sx={{ fontWeight: 600, mb: 1 }}>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Try changing filters or check again later.
            </Typography>
          </Paper>
        ) : (
          <>
            <Paper sx={{ overflow: 'hidden' }}>
              {notifications.map((notification, index) => (
                <Box key={notification.id}>
                  <Box
                    sx={{
                      p: 2,
                      backgroundColor: notification.is_read ? 'transparent' : 'rgba(102, 126, 234, 0.08)',
                      transition: 'background-color 0.2s ease',
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: notification.is_read ? 600 : 700 }}>
                          {notification.title}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          {notification.message}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                          {notification.section && <Chip size="small" label={notification.section} variant="outlined" />}
                          <Typography variant="caption" color="text.disabled">
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      {!notification.is_read && (
                        <Button
                          size="small"
                          startIcon={<MarkEmailRead />}
                          onClick={() => void handleMarkSingleRead(notification)}
                          disabled={isMarkingOne}
                        >
                          Mark read
                        </Button>
                      )}
                    </Box>
                  </Box>
                  {index < notifications.length - 1 && <Divider />}
                </Box>
              ))}
            </Paper>

            <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
              {nextCursor ? (
                <Button variant="contained" onClick={() => void loadMore()} disabled={isLoadingMore}>
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  You have reached the end of your notifications.
                </Typography>
              )}
            </Box>

            {isRefreshing && (
              <Box sx={{ mt: 1, display: 'flex', justifyContent: 'center' }}>
                <Typography variant="caption" color="text.secondary">Refreshing...</Typography>
              </Box>
            )}
          </>
        )}
      </Box>
    </DashboardLayout>
  );
}

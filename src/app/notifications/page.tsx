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
  Card,
  Theme,
} from '@mui/material';
import {
  DoneAll,
  MarkEmailRead,
  Refresh,
  Delete,
  DeleteSweep,
  CheckBoxOutlineBlank,
  CheckBox,
} from '@mui/icons-material';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useToast, ConfirmDialog } from '@/components/shared';
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
    deleteNotification,
    deleteMultipleNotifications,
    deleteAllNotifications,
  } = useNotifications();

  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [isDeleteAllDialogOpen, setIsDeleteAllDialogOpen] = React.useState(false);
  const [isDeletingAll, setIsDeletingAll] = React.useState(false);
  const [isDeletingSelected, setIsDeletingSelected] = React.useState(false);

  const handleSelectOne = (id: string) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      setSelectedIds(notifications.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.length === 0) return;

    setIsDeletingSelected(true);
    try {
      await deleteMultipleNotifications(selectedIds);
      showSuccess(`${selectedIds.length} notifications deleted`);
      setSelectedIds([]);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete notifications';
      showError(errorMessage);
    } finally {
      setIsDeletingSelected(false);
    }
  };

  const handleDeleteAll = async () => {
    setIsDeletingAll(true);
    try {
      await deleteAllNotifications();
      showSuccess('All notifications deleted');
      setIsDeleteAllDialogOpen(false);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to delete all notifications';
      showError(errorMessage);
    } finally {
      setIsDeletingAll(false);
    }
  };

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
            mb: 2,
            pt: 2
          }}
        >
          <Box>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                mb: 0.5,
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Notifications
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500 }}>
              Stay updated with the latest platform activity and alerts.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
            <Typography variant="caption" sx={{
              fontWeight: 700,
              bgcolor: unreadCount > 0 ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
              color: unreadCount > 0 ? 'error.main' : 'success.main',
              px: 1.5,
              py: 0.5,
              borderRadius: 2,
              border: '1px solid',
              borderColor: unreadCount > 0 ? 'rgba(239, 68, 68, 0.2)' : 'rgba(16, 185, 129, 0.2)',
            }}>
              {unreadCount} Unread
            </Typography>

            <Button
              variant="contained"
              startIcon={<DoneAll sx={{ fontSize: '1rem' }} />}
              onClick={handleMarkAllRead}
              disabled={isMarkingAll || unreadCount === 0}
              sx={{
                height: '32px',
                fontSize: '0.75rem',
                borderRadius: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 2,
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.3)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                  boxShadow: '0 6px 16px rgba(33, 51, 80, 0.4)',
                }
              }}
            >
              Mark All Read
            </Button>

            <IconButton
              onClick={handleRefresh}
              size="small"
              sx={{
                bgcolor: 'background.paper',
                width: 32,
                height: 32,
                boxShadow: (theme: Theme) => theme.palette.mode === 'dark' ? '0 4px 12px rgba(0,0,0,0.4)' : '0 4px 12px rgba(0,0,0,0.05)',
                border: '1px solid rgba(0,0,0,0.05)',
                '&:hover': { transform: 'rotate(180deg)' },
                transition: 'transform 0.5s ease'
              }}
            >
              <Refresh sx={{ fontSize: '1.1rem' }} />
            </IconButton>

            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteSweep sx={{ fontSize: '1rem' }} />}
              onClick={() => setIsDeleteAllDialogOpen(true)}
              disabled={notifications.length === 0 || isDeletingAll}
              sx={{
                height: '32px',
                fontSize: '0.75rem',
                borderRadius: 1.5,
                textTransform: 'uppercase',
                fontWeight: 600,
                px: 2,
                borderColor: 'rgba(239, 68, 68, 0.5)',
                '&:hover': {
                  borderColor: 'error.main',
                  bgcolor: 'rgba(239, 68, 68, 0.04)'
                }
              }}
            >
              Clear All
            </Button>
          </Box>
        </Box>

        <ConfirmDialog
          open={isDeleteAllDialogOpen}
          title="Delete All Notifications"
          message="Are you sure you want to permanently delete all notifications? This action cannot be undone."
          confirmText="Delete All"
          severity="error"
          onConfirm={() => void handleDeleteAll()}
          onCancel={() => setIsDeleteAllDialogOpen(false)}
          isLoading={isDeletingAll}
        />

        <Box
          sx={{
            p: 1,
            mb: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            border: '1px solid',
            borderColor: (theme: Theme) => theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
            boxShadow: (theme: Theme) => theme.palette.mode === 'dark' ? '0 4px 20px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.05)',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  size="small"
                  checked={unreadOnly}
                  onChange={(event) => setUnreadOnly(event.target.checked)}
                />
              }
              label={
                <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary' }}>
                  Unread Only
                </Typography>
              }
              sx={{ m: 0, ml: 1 }}
            />

            {apiError && (
              <Alert severity="error" variant="outlined" sx={{ py: 0, px: 1, border: 'none', bgcolor: 'transparent', fontSize: '0.75rem' }}>
                {apiError}
              </Alert>
            )}
          </Box>

          {selectedIds.length > 0 && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: 'primary.main' }}>
                {selectedIds.length} Selected
              </Typography>
              <Button
                variant="contained"
                color="error"
                size="small"
                startIcon={<Delete sx={{ fontSize: '1rem' }} />}
                onClick={() => void handleDeleteSelected()}
                disabled={isDeletingSelected}
                sx={{
                  height: '28px',
                  borderRadius: 1,
                  fontSize: '0.7rem',
                  textTransform: 'none',
                  fontWeight: 700,
                }}
              >
                {isDeletingSelected ? 'Deleting...' : 'Delete Selected'}
              </Button>
            </Box>
          )}
        </Box>

        {isInitialLoading ? (
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="220px">
            <CircularProgress size={30} sx={{ color: '#213350' }} />
          </Box>
        ) : notifications.length === 0 ? (
          <Card
            sx={{
              bgcolor: 'background.paper',
              boxShadow: (theme: Theme) => theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)',
              border: (theme: Theme) => theme.palette.mode === 'dark' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(0,0,0,0.05)',
              borderRadius: 1.5,
              p: 3,
              textAlign: 'center'
            }}
          >
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              No notifications found
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Try changing filters or check again later.
            </Typography>
          </Card>
        ) : (
          <>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {notifications.map((notification) => (
                <Card
                  key={notification.id}
                  sx={{
                    borderRadius: 1.5,
                    border: '1px solid',
                    borderColor: (theme: Theme) =>
                      notification.is_read
                        ? theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)'
                        : 'rgba(33, 51, 80, 0.3)',
                    backgroundColor: 'background.paper',
                    transition: 'all 0.2s ease',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: (theme: Theme) => theme.palette.mode === 'dark'
                        ? '0 4px 20px rgba(0, 0, 0, 0.5)'
                        : '0 4px 20px rgba(0, 0, 0, 0.06)',
                      transform: 'translateX(4px)'
                    },
                  }}
                >
                  <Box sx={{ p: 1.5, display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                    <IconButton
                      size="small"
                      onClick={() => handleSelectOne(notification.id)}
                      sx={{
                        mt: 0.25,
                        color: selectedIds.includes(notification.id) ? 'primary.main' : 'text.disabled',
                        p: 0.5
                      }}
                    >
                      {selectedIds.includes(notification.id) ? (
                        <CheckBox sx={{ fontSize: '1.2rem' }} />
                      ) : (
                        <CheckBoxOutlineBlank sx={{ fontSize: '1.2rem' }} />
                      )}
                    </IconButton>

                    <Box sx={{ flex: 1, display: 'flex', justifyContent: 'space-between', gap: 2, alignItems: 'flex-start' }}>
                      <Box sx={{ maxWidth: '85%' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.25 }}>
                          {!notification.is_read && (
                            <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: 'primary.main' }} />
                          )}
                          <Typography
                            variant="subtitle2"
                            sx={{
                              fontWeight: 600,
                              color: 'text.primary',
                              fontSize: '0.85rem'
                            }}
                          >
                            {notification.title}
                          </Typography>
                        </Box>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{
                            fontSize: '0.75rem',
                            lineHeight: 1.5,
                            display: 'block',
                            mb: 1
                          }}
                        >
                          {notification.message}
                        </Typography>

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          {notification.section && (
                            <Chip
                              size="small"
                              label={notification.section}
                              sx={{
                                height: 18,
                                fontSize: '0.65rem',
                                fontWeight: 600,
                                bgcolor: 'rgba(33, 51, 80, 0.08)',
                                color: '#213350',
                                border: 'none',
                                borderRadius: 1
                              }}
                            />
                          )}
                          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
                            {formatDate(notification.created_at)}
                          </Typography>
                        </Box>
                      </Box>

                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        {!notification.is_read && (
                          <Button
                            size="small"
                            onClick={() => void handleMarkSingleRead(notification)}
                            disabled={isMarkingOne}
                            sx={{
                              minWidth: 'auto',
                              fontSize: '0.7rem',
                              fontWeight: 700,
                              color: 'primary.main',
                              textTransform: 'none',
                              p: 0.5,
                              px: 1,
                              '&:hover': { bgcolor: 'rgba(33, 51, 80, 0.05)' }
                            }}
                          >
                            Mark Read
                          </Button>
                        )}
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => void deleteNotification(notification.id)}
                          sx={{
                            opacity: 0.4,
                            '&:hover': { opacity: 1, backgroundColor: 'rgba(239, 68, 68, 0.05)' }
                          }}
                        >
                          <Delete sx={{ fontSize: '1rem' }} />
                        </IconButton>
                      </Box>
                    </Box>
                  </Box>
                </Card>
              ))}
            </Box>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
              {nextCursor ? (
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => void loadMore()}
                  disabled={isLoadingMore}
                  sx={{
                    borderRadius: 50,
                    fontSize: '0.75rem',
                    px: 4,
                    borderColor: 'divider',
                    color: 'text.secondary'
                  }}
                >
                  {isLoadingMore ? 'Loading...' : 'Load more'}
                </Button>
              ) : (
                <Typography variant="caption" color="text.disabled">
                  End of notifications
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

"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import {
  Notification,
  useLazyGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
  useDeleteNotificationMutation,
  useDeleteMultipleNotificationsMutation,
  useDeleteAllNotificationsMutation,
} from '@/store/api/notificationsApi';
import {
  NotificationsSocketStatus,
  connectNotificationsSocket,
  disconnectNotificationsSocket,
  emitSocketTestPing,
  subscribeToNotificationEvents,
  subscribeToPermissionEvents,
  subscribeToSocketStatus,
} from '@/lib/socket/notificationsSocketClient';
import { useDispatch } from 'react-redux';
import { clearAuth, updatePermissionsAndRoles, Permission, Role } from '@/store/slices/authSlice';
import { useRouter } from 'next/navigation';
import { useToast } from '@/components/shared';
import { rbacApi } from '@/store/api/rbacApi';
import { usersApi } from '@/store/api/usersApi';

const DEFAULT_LIMIT = 20;

interface NotificationsContextValue {
  items: Notification[];
  bellItems: Notification[];
  unreadCount: number;
  nextCursor: string | null;
  unreadOnly: boolean;
  isInitialLoading: boolean;
  isLoadingMore: boolean;
  isRefreshing: boolean;
  isMarkingAllRead: boolean;
  isMarkingOneRead: boolean;
  socketStatus: NotificationsSocketStatus;
  socketMessage?: string;
  apiError?: string;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
  setUnreadOnly: (value: boolean) => void;
  markAllAsRead: () => Promise<void>;
  markOneAsRead: (notificationId: string) => Promise<void>;
  deleteNotification: (notificationId: string) => Promise<void>;
  deleteMultipleNotifications: (notificationIds: string[]) => Promise<void>;
  deleteAllNotifications: () => Promise<void>;
  emitTestPing: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(undefined);

const normalizeLiveNotification = (raw: unknown): Notification | null => {
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  const data = raw as Record<string, unknown>;
  const id = typeof data.id === 'string' ? data.id : '';
  if (!id) {
    return null;
  }

  return {
    id,
    recipient_type: (data.recipient_type as string | undefined) ?? (data.recipientType as string | undefined),
    recipient_user_id: (data.recipient_user_id as string | undefined) ?? (data.recipientUserId as string | undefined),
    title: (data.title as string | undefined) ?? 'Notification',
    message: (data.message as string | undefined) ?? '',
    section: data.section as string | undefined,
    action: data.action as string | undefined,
    entity_type: (data.entity_type as string | undefined) ?? (data.entityType as string | undefined),
    entity_id: (data.entity_id as string | undefined) ?? (data.entityId as string | undefined),
    entity_public_id: (data.entity_public_id as string | undefined) ?? (data.entityPublicId as string | undefined),
    payload: (data.payload as Record<string, unknown> | null | undefined) ?? null,
    is_read: (data.is_read as boolean | undefined) ?? (data.isRead as boolean | undefined) ?? false,
    read_at: (data.read_at as string | null | undefined) ?? (data.readAt as string | null | undefined) ?? null,
    created_by_user_id:
      (data.created_by_user_id as string | undefined) ?? (data.createdByUserId as string | undefined),
    created_at: (data.created_at as string | undefined) ?? (data.createdAt as string | undefined) ?? new Date().toISOString(),
    updated_at: (data.updated_at as string | undefined) ?? (data.updatedAt as string | undefined),
  };
};

const sortByCreatedAtDesc = (items: Notification[]) =>
  [...items].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

const mergeById = (current: Notification[], incoming: Notification[]) => {
  const map = new Map<string, Notification>();

  for (const item of current) {
    map.set(item.id, item);
  }

  for (const item of incoming) {
    map.set(item.id, item);
  }

  return sortByCreatedAtDesc(Array.from(map.values()));
};

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const resolvedToken = useSelector((state: RootState) => state.auth.accessToken);

  const [items, setItems] = useState<Notification[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [unreadOnly, setUnreadOnly] = useState(false);

  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [socketStatus, setSocketStatus] = useState<NotificationsSocketStatus>('idle');
  const [socketMessage, setSocketMessage] = useState<string | undefined>(undefined);
  const [apiError, setApiError] = useState<string | undefined>(undefined);
  const unreadOnlyRef = useRef(unreadOnly);
  const dispatch = useDispatch();
  const router = useRouter();
  const { showSuccess, showWarning, showError } = useToast();

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const currentRolesRef = useRef<Role[]>(currentUser?.roles || []);

  useEffect(() => {
    currentRolesRef.current = currentUser?.roles || [];
  }, [currentUser?.roles]);

  const [fetchNotifications] = useLazyGetNotificationsQuery();
  const [markAllNotificationsRead, { isLoading: isMarkingAllRead }] = useMarkAllNotificationsReadMutation();
  const [markNotificationRead, { isLoading: isMarkingOneRead }] = useMarkNotificationReadMutation();
  const [deleteNotificationMutation] = useDeleteNotificationMutation();
  const [deleteMultipleNotificationsMutation] = useDeleteMultipleNotificationsMutation();
  const [deleteAllNotificationsMutation] = useDeleteAllNotificationsMutation();

  const pullNotifications = useCallback(
    async (params: { reset?: boolean; cursor?: string; asRefresh?: boolean } = {}) => {
      const { reset = false, cursor, asRefresh = false } = params;

      if (!resolvedToken) {
        setItems([]);
        setNextCursor(null);
        setUnreadCount(0);
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
        return;
      }

      if (reset && !asRefresh) {
        setIsInitialLoading(true);
      }
      if (!reset) {
        setIsLoadingMore(true);
      }
      if (asRefresh) {
        setIsRefreshing(true);
      }

      setApiError(undefined);

      try {
        const result = await fetchNotifications({
          limit: DEFAULT_LIMIT,
          cursor,
          unreadOnly,
        }).unwrap();

        setItems((prev) => (reset ? result.items : mergeById(prev, result.items)));
        setNextCursor(result.nextCursor);
        setUnreadCount(result.unreadCount);
      } catch (error: any) {
        const message = error?.data?.message || error?.message || 'Failed to fetch notifications';
        setApiError(message);
        throw error;
      } finally {
        setIsInitialLoading(false);
        setIsLoadingMore(false);
        setIsRefreshing(false);
      }
    },
    [fetchNotifications, resolvedToken, unreadOnly]
  );

  useEffect(() => {
    void pullNotifications({ reset: true });
  }, [pullNotifications]);

  const markOneAsRead = useCallback(
    async (notificationId: string) => {
      const target = items.find((item) => item.id === notificationId);
      if (!target || target.is_read) {
        return;
      }

      await markNotificationRead({ notificationId }).unwrap();

      if (unreadOnly) {
        setItems((prev) => prev.filter((item) => item.id !== notificationId));
      } else {
        setItems((prev) =>
          prev.map((item) =>
            item.id === notificationId
              ? { ...item, is_read: true, read_at: item.read_at ?? new Date().toISOString() }
              : item
          )
        );
      }

      setUnreadCount((prev) => Math.max(0, prev - 1));
    },
    [items, markNotificationRead, unreadOnly]
  );

  const markAllAsRead = useCallback(async () => {
    await markAllNotificationsRead().unwrap();

    setItems((prev) => {
      if (unreadOnly) {
        return [];
      }

      return prev.map((item) => ({
        ...item,
        is_read: true,
        read_at: item.read_at ?? new Date().toISOString(),
      }));
    });
    setUnreadCount(0);
  }, [markAllNotificationsRead, unreadOnly]);

  const deleteNotification = useCallback(
    async (notificationId: string) => {
      const target = items.find((item) => item.id === notificationId);
      if (!target) return;

      await deleteNotificationMutation({ notificationId }).unwrap();

      setItems((prev) => prev.filter((item) => item.id !== notificationId));
      if (!target.is_read) {
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    },
    [deleteNotificationMutation, items]
  );

  const deleteMultipleNotifications = useCallback(
    async (notificationIds: string[]) => {
      if (notificationIds.length === 0) return;

      const deletedItems = items.filter((item) => notificationIds.includes(item.id));
      const unreadDeletedCount = deletedItems.filter((item) => !item.is_read).length;

      await deleteMultipleNotificationsMutation({ notificationIds }).unwrap();

      setItems((prev) => prev.filter((item) => !notificationIds.includes(item.id)));
      setUnreadCount((prev) => Math.max(0, prev - unreadDeletedCount));
    },
    [deleteMultipleNotificationsMutation, items]
  );

  const deleteAllNotifications = useCallback(async () => {
    await deleteAllNotificationsMutation().unwrap();

    setItems([]);
    setUnreadCount(0);
    setNextCursor(null);
  }, [deleteAllNotificationsMutation]);

  const refresh = useCallback(async () => {
    await pullNotifications({ reset: true, asRefresh: true });
  }, [pullNotifications]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) {
      return;
    }

    await pullNotifications({ cursor: nextCursor });
  }, [isLoadingMore, nextCursor, pullNotifications]);

  useEffect(() => {
    unreadOnlyRef.current = unreadOnly;
  }, [unreadOnly]);

  useEffect(() => {
    if (!resolvedToken) {
      disconnectNotificationsSocket();
      setSocketStatus('unauthorized');
      setSocketMessage('Missing access token');
      return;
    }

    connectNotificationsSocket(resolvedToken);

    const unsubscribeStatus = subscribeToSocketStatus((status, message) => {
      setSocketStatus(status);
      setSocketMessage(message);
    });

    const unsubscribeEvents = subscribeToNotificationEvents((payload) => {
      const liveItem = normalizeLiveNotification(payload);
      if (!liveItem) {
        return;
      }

      setItems((prev) => {
        const existing = prev.find((item) => item.id === liveItem.id);

        if (existing) {
          const merged = prev.map((item) => (item.id === liveItem.id ? { ...item, ...liveItem } : item));
          return sortByCreatedAtDesc(merged);
        }

        if (unreadOnlyRef.current && liveItem.is_read) {
          return prev;
        }

        return sortByCreatedAtDesc([liveItem, ...prev]);
      });

      if (!liveItem.is_read) {
        setUnreadCount((prev) => prev + 1);
      }
    });

    const unsubscribePermissions = subscribeToPermissionEvents((payload: any) => {
      console.log('Socket - permissions:updated received:', payload);
      const newPermissions = payload.permissions as Permission[];
      const newRoles = payload.roles as Role[];

      if (!newPermissions || !newRoles) return;

      // Check if roles have changed to determine if logout is needed
      const currentRoleIds = currentRolesRef.current.map(r => r.id).sort();
      const newRoleIds = newRoles.map(r => r.id).sort();

      const rolesChanged = currentRoleIds.length !== newRoleIds.length ||
        currentRoleIds.some((id, index) => id !== newRoleIds[index]);

      if (rolesChanged) {
        showWarning('Your roles have been updated. Please log in again.');
        dispatch(clearAuth());
        router.push('/auth/login');
        return;
      }

      // Update permissions and roles without logout
      dispatch(updatePermissionsAndRoles({ permissions: newPermissions, roles: newRoles }));

      // Invalidate tags to force re-fetch of relevant data
      dispatch(rbacApi.util.invalidateTags(['Roles', 'Permissions']));
      dispatch(usersApi.util.invalidateTags(['Users']));

      showSuccess('Your permissions have been updated in real-time.');
    });

    const handleOnline = () => {
      if (resolvedToken) {
        connectNotificationsSocket(resolvedToken);
      }
    };

    const handleOffline = () => {
      setSocketStatus('offline');
      setSocketMessage('Network offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      unsubscribeStatus();
      unsubscribeEvents();
      unsubscribePermissions();
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      disconnectNotificationsSocket();
    };
  }, [resolvedToken]);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      items,
      bellItems: items.slice(0, 8),
      unreadCount,
      nextCursor,
      unreadOnly,
      isInitialLoading,
      isLoadingMore,
      isRefreshing,
      isMarkingAllRead,
      isMarkingOneRead,
      socketStatus,
      socketMessage,
      apiError,
      refresh,
      loadMore,
      setUnreadOnly,
      markAllAsRead,
      markOneAsRead,
      deleteNotification,
      deleteMultipleNotifications,
      deleteAllNotifications,
      emitTestPing: emitSocketTestPing,
    }),
    [
      items,
      unreadCount,
      nextCursor,
      unreadOnly,
      isInitialLoading,
      isLoadingMore,
      isRefreshing,
      isMarkingAllRead,
      isMarkingOneRead,
      socketStatus,
      socketMessage,
      apiError,
      refresh,
      loadMore,
      markAllAsRead,
      markOneAsRead,
    ]
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export const useNotifications = () => {
  const context = useContext(NotificationsContext);

  if (!context) {
    throw new Error('useNotifications must be used within NotificationsProvider');
  }

  return context;
};

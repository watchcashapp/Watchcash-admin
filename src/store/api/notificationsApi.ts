import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface Notification {
  id: string;
  recipient_type?: string;
  recipient_user_id?: string;
  title: string;
  message: string;
  section?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  entity_public_id?: string;
  payload?: Record<string, unknown> | null;
  is_read: boolean;
  read_at?: string | null;
  created_by_user_id?: string;
  created_at: string;
  updated_at?: string;
}

export interface GetNotificationsArgs {
  limit?: number;
  cursor?: string;
  unreadOnly?: boolean;
}

export interface NotificationsListResult {
  items: Notification[];
  nextCursor: string | null;
  hasMore: boolean;
  unreadCount: number;
}

interface RawNotification {
  id: string;
  recipient_type?: string;
  recipient_user_id?: string;
  title?: string;
  message?: string;
  section?: string;
  action?: string;
  entity_type?: string;
  entity_id?: string;
  entity_public_id?: string;
  payload?: Record<string, unknown> | null;
  is_read?: boolean;
  isRead?: boolean;
  read_at?: string | null;
  readAt?: string | null;
  created_by_user_id?: string;
  created_at?: string;
  createdAt?: string;
  updated_at?: string;
  updatedAt?: string;
}

const normalizeNotification = (raw: RawNotification): Notification => ({
  id: raw.id,
  recipient_type: raw.recipient_type,
  recipient_user_id: raw.recipient_user_id,
  title: raw.title ?? 'Notification',
  message: raw.message ?? '',
  section: raw.section,
  action: raw.action,
  entity_type: raw.entity_type,
  entity_id: raw.entity_id,
  entity_public_id: raw.entity_public_id,
  payload: raw.payload,
  is_read: raw.is_read ?? raw.isRead ?? false,
  read_at: raw.read_at ?? raw.readAt ?? null,
  created_by_user_id: raw.created_by_user_id,
  created_at: raw.created_at ?? raw.createdAt ?? new Date().toISOString(),
  updated_at: raw.updated_at ?? raw.updatedAt,
});

const normalizeNotificationsResponse = (response: unknown): NotificationsListResult => {
  const responseRecord = (response ?? {}) as Record<string, unknown>;
  const root = ((responseRecord.data as Record<string, unknown> | undefined) ?? responseRecord) as Record<string, unknown>;
  const pagination = (root.pagination as Record<string, unknown> | undefined) ?? {};

  const rawItems = ((root.notifications as RawNotification[] | undefined) ??
    (root.items as RawNotification[] | undefined) ??
    (root.results as RawNotification[] | undefined) ??
    []) as RawNotification[];

  const items = rawItems.map(normalizeNotification);

  const nextCursorRaw =
    (root.nextCursor as string | null | undefined) ??
    (root.next_cursor as string | null | undefined) ??
    (root.nextcursor as string | null | undefined) ??
    (pagination.nextCursor as string | null | undefined) ??
    (pagination.next_cursor as string | null | undefined) ??
    (pagination.nextcursor as string | null | undefined) ??
    null;

  const nextCursor = typeof nextCursorRaw === 'string' && nextCursorRaw.trim().length > 0
    ? nextCursorRaw
    : null;

  const hasMoreRaw =
    (root.hasMore as boolean | undefined) ??
    (root.has_more as boolean | undefined) ??
    (root.hasmore as boolean | undefined) ??
    (pagination.hasMore as boolean | undefined) ??
    (pagination.has_more as boolean | undefined) ??
    (pagination.hasmore as boolean | undefined);
  const hasMore = hasMoreRaw ?? Boolean(nextCursor);

  const unreadCountRaw = (root.unreadCount as number | undefined) ??
    (root.unread_count as number | undefined);
  const unreadCount = Number.isFinite(unreadCountRaw) ? Number(unreadCountRaw) : items.filter((item) => !item.is_read).length;

  return {
    items,
    nextCursor,
    hasMore,
    unreadCount,
  };
};

export const notificationsApi = createApi({
  reducerPath: 'notificationsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Notifications'],
  endpoints: (builder) => ({
    getNotifications: builder.query<NotificationsListResult, GetNotificationsArgs | void>({
      query: (args) => {
        const params = new URLSearchParams();

        if (args?.limit) {
          params.set('limit', String(args.limit));
        }

        if (args?.cursor) {
          params.set('cursor', args.cursor);
        }

        if (typeof args?.unreadOnly === 'boolean') {
          params.set('unreadOnly', String(args.unreadOnly));
        }

        const queryString = params.toString();
        return queryString ? `/notifications?${queryString}` : '/notifications';
      },
      transformResponse: (response: unknown) => normalizeNotificationsResponse(response),
      providesTags: (result) => {
        const itemTags = result?.items.map((notification) => ({
          type: 'Notifications' as const,
          id: notification.id,
        })) ?? [];

        return [{ type: 'Notifications' as const, id: 'LIST' }, ...itemTags];
      },
    }),
    markAllNotificationsRead: builder.mutation<{ status?: string; message?: string }, void>({
      query: () => ({
        url: '/notifications/read-all',
        method: 'PATCH',
      }),
      invalidatesTags: [{ type: 'Notifications', id: 'LIST' }],
    }),
    markNotificationRead: builder.mutation<{ status?: string; message?: string }, { notificationId: string }>({
      query: ({ notificationId }) => ({
        url: `/notifications/${notificationId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, { notificationId }) => [
        { type: 'Notifications', id: notificationId },
        { type: 'Notifications', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetNotificationsQuery,
  useLazyGetNotificationsQuery,
  useMarkAllNotificationsReadMutation,
  useMarkNotificationReadMutation,
} = notificationsApi;
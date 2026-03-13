import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';
import {
    appendCursorPagination,
    CursorPaginationMeta,
    CursorPaginationParams,
    getResponseDataRoot,
    normalizeCursorPaginationMeta,
    readCollection,
} from './pagination';

export interface AuditLogAdmin {
    id: string;
    email: string;
    name: string;
}

export interface AuditLogTargetUser {
    id: string;
    email: string;
    name: string;
}

export interface AuditLog {
    id: string;
    admin: AuditLogAdmin;
    targetUser: AuditLogTargetUser | null;
    action: string;
    category: string;
    resourceType: string;
    resourceId: string | null;
    ip: string;
    metadata: Record<string, any>;
    createdAt: string;
}

export interface AuditLogsResponse {
    items: AuditLog[];
    pagination: CursorPaginationMeta;
}

export interface GetAuditLogsParams extends CursorPaginationParams {
    targetUser?: string;
    action?: string;
    from?: string;
    to?: string;
}

export const auditLogsApi = createApi({
    reducerPath: 'auditLogsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['AuditLogs'],
    endpoints: (builder) => ({
        getAuditLogs: builder.query<AuditLogsResponse, GetAuditLogsParams>({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();

                appendCursorPagination(queryParams, params);
                if (params.targetUser) queryParams.append('targetUser', params.targetUser);
                if (params.action) queryParams.append('action', params.action);
                if (params.from) queryParams.append('from', params.from);
                if (params.to) queryParams.append('to', params.to);

                const queryString = queryParams.toString();
                return queryString ? `/admin/audit-logs?${queryString}` : '/admin/audit-logs';
            },
            providesTags: ['AuditLogs'],
            transformResponse: (response: unknown, _meta, arg) => {
                const root = getResponseDataRoot(response);

                return {
                    items: readCollection<AuditLog>(root, ['items', 'auditLogs', 'audit_logs', 'results']),
                    pagination: normalizeCursorPaginationMeta(response, arg.limit),
                };
            },
        }),
        getAuditLogsByUser: builder.query<AuditLogsResponse, { user_id: string } & Omit<GetAuditLogsParams, 'userId'>>({
            query: ({ user_id, ...params }) => {
                const queryParams = new URLSearchParams();

                appendCursorPagination(queryParams, params);
                if (params.action) queryParams.append('action', params.action);
                if (params.from) queryParams.append('from', params.from);
                if (params.to) queryParams.append('to', params.to);

                const queryString = queryParams.toString();
                return queryString ? `/admin/audit-logs/${user_id}?${queryString}` : `/admin/audit-logs/${user_id}`;
            },
            providesTags: ['AuditLogs'],
            transformResponse: (response: unknown, _meta, arg) => {
                const root = getResponseDataRoot(response);

                return {
                    items: readCollection<AuditLog>(root, ['items', 'auditLogs', 'audit_logs', 'results']),
                    pagination: normalizeCursorPaginationMeta(response, arg.limit),
                };
            },
        }),
        getAuditLog: builder.query<AuditLog, { userId: string; logId: string }>({
            query: ({ userId }) => `/admin/audit-logs/${userId}?limit=100`,
            providesTags: (_result, _error, { logId }) => [{ type: 'AuditLogs', id: logId }],
            transformResponse: (response: unknown, _meta, { logId }) => {
                const root = getResponseDataRoot(response);
                const items = readCollection<AuditLog>(root, ['items', 'auditLogs', 'audit_logs', 'results']);
                // Search for the logId. Try exact match first, then partial match if ID seems truncated (at least 30 chars)
                return items.find((item: AuditLog) =>
                    item.id === logId ||
                    (logId.length >= 30 && item.id.startsWith(logId)) ||
                    (item.id.length >= 30 && logId.startsWith(item.id))
                ) || null as any;
            },
        }),
    }),
});

export const {
    useGetAuditLogsQuery,
    useGetAuditLogsByUserQuery,
    useGetAuditLogQuery,
} = auditLogsApi;

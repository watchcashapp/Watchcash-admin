import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

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
    status: string;
    data: {
        items: AuditLog[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export interface GetAuditLogsParams {
    page?: number;
    limit?: number;
    userId?: string;
    action?: string;
    from?: string;
    to?: string;
}

export const auditLogsApi = createApi({
    reducerPath: 'auditLogsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['AuditLogs'],
    endpoints: (builder) => ({
        getAuditLogs: builder.query<AuditLogsResponse['data'], GetAuditLogsParams>({
            query: (params = {}) => {
                const queryParams = new URLSearchParams();

                if (params.page) queryParams.append('page', params.page.toString());
                if (params.limit) queryParams.append('limit', params.limit.toString());
                if (params.userId) queryParams.append('userId', params.userId);
                if (params.action) queryParams.append('action', params.action);
                if (params.from) queryParams.append('from', params.from);
                if (params.to) queryParams.append('to', params.to);

                return `/admin/audit-logs?${queryParams.toString()}`;
            },
            providesTags: ['AuditLogs'],
            transformResponse: (response: AuditLogsResponse) => response.data,
        }),
        getAuditLogsByUser: builder.query<AuditLogsResponse['data'], { user_id: string } & Omit<GetAuditLogsParams, 'userId'>>({
            query: ({ user_id, ...params }) => {
                const queryParams = new URLSearchParams();

                if (params.page) queryParams.append('page', params.page.toString());
                if (params.limit) queryParams.append('limit', params.limit.toString());
                if (params.action) queryParams.append('action', params.action);
                if (params.from) queryParams.append('from', params.from);
                if (params.to) queryParams.append('to', params.to);

                return `/admin/audit-logs/${user_id}?${queryParams.toString()}`;
            },
            providesTags: ['AuditLogs'],
            transformResponse: (response: AuditLogsResponse) => response.data,
        }),
    }),
});

export const {
    useGetAuditLogsQuery,
    useGetAuditLogsByUserQuery,
} = auditLogsApi;

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface DashboardStats {
    status: string;
    data: {
        totalUsers: number;
        activeUsers: number;
        totalStaffUsers: number;
        activeStaffUsers: number;
        bannedUsers: number;
        totalSessionsInDay: number;
    };
}

export interface FlaggedSession {
    id: string;
    session_id: string;
    user_id: string;
    user_email: string;
    user_name: string;
    device_id: string;
    status: string;
    duration_seconds: number;
    points_earned: number;
    created_at: string;
    metadata: {
        lat: number;
        lng: number;
        flagged: boolean;
        app_name: string;
        end_time: string;
        start_time: string;
        risk_rating: string;
        risk_reason: string;
        risk_flagged: boolean;
        risk_metrics: {
            speed_kmh: number;
            distance_km: number;
            time_diff_minutes: number;
        };
    };
}

export interface SessionsSummaryResponse {
    status: string;
    data: {
        flagged: FlaggedSession[];
        high_risk: FlaggedSession[];
    };
}

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        getDashboardStats: builder.query<DashboardStats, void>({
            query: () => '/admin/dashboard',
            providesTags: ['Dashboard'],
        }),
        getSessionsSummary: builder.query<SessionsSummaryResponse, void>({
            query: () => '/admin/sessions/summary',
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardStatsQuery, useGetSessionsSummaryQuery } = dashboardApi;

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

export const dashboardApi = createApi({
    reducerPath: 'dashboardApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Dashboard'],
    endpoints: (builder) => ({
        getDashboardStats: builder.query<DashboardStats, void>({
            query: () => '/admin/dashboard',
            providesTags: ['Dashboard'],
        }),
    }),
});

export const { useGetDashboardStatsQuery } = dashboardApi;

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface RewardRedemption {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    rewardName: string;
    rewardType: string;
    points: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED';
    requestedAt: string;
    processedAt: string | null;
    notes: string;
}

export interface RewardRedemptionsResponse {
    status: string;
    data: {
        reward_redemptions: RewardRedemption[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    };
}

export const rewardRedemptionsApi = createApi({
    reducerPath: 'rewardRedemptionsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['RewardRedemptions'],
    endpoints: (builder) => ({
        getRewardRedemptions: builder.query<RewardRedemptionsResponse, { page?: number; limit?: number; status?: string; search?: string }>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());
                if (params?.status) queryParams.append('status', params.status);
                if (params?.search) queryParams.append('search', params.search);
                return `/admin/reward-redemptions?${queryParams.toString()}`;
            },
            providesTags: ['RewardRedemptions'],
        }),
        getRewardRedemptionById: builder.query<any, string>({
            query: (id) => `/admin/reward-redemptions/${id}`,
            providesTags: ['RewardRedemptions'],
        }),
        reviewRewardRedemption: builder.mutation<void, { id: string; data: { decision: string; reason?: string } }>({
            query: ({ id, data }) => ({
                url: `/admin/reward-redemptions/${id}/review`,
                method: 'POST',
                body: data,
            }),
            invalidatesTags: ['RewardRedemptions'],
        }),
    }),
});

export const {
    useGetRewardRedemptionsQuery,
    useGetRewardRedemptionByIdQuery,
    useReviewRewardRedemptionMutation
} = rewardRedemptionsApi;

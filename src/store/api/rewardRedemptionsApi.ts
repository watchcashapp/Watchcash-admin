import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface RewardRedemption {
    id: string;
    userId: string;
    sessionId: string;
    points: number;
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'FAILED';
    idempotencyKey?: string | null;
    rewardType: string;
    rewardCurrency: string;
    rewardValue: number;
    tangoOrderId?: string | null;
    tangoReferenceId?: string | null;
    tangoErrorCode?: string | null;
    tangoErrorMessage?: string | null;
    requestMetadata?: any;
    adminNote?: string | null;
    adminReasonCode?: string | null;
    createdBy?: string;
    reviewedBy?: string | null;
    createdAt: string;
    updatedAt: string;
    decidedAt?: string | null;
}

export interface RewardRedemptionsResponse {
    status: string;
    data: {
        items: RewardRedemption[];
        total: number;
        page: number;
        limit: number;
        totalPages?: number;
    };
}

export interface RewardRedemptionsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    from?: string;
    to?: string;
}

export const rewardRedemptionsApi = createApi({
    reducerPath: 'rewardRedemptionsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['RewardRedemptions'],
    endpoints: (builder) => ({
        getRewardRedemptions: builder.query<RewardRedemptionsResponse, RewardRedemptionsQueryParams>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params?.page) queryParams.append('page', params.page.toString());
                if (params?.limit) queryParams.append('limit', params.limit.toString());
                if (params?.status) queryParams.append('status', params.status);
                if (params?.search) queryParams.append('search', params.search);
                if (params?.from) queryParams.append('from', params.from);
                if (params?.to) queryParams.append('to', params.to);
                return `/admin/reward-redemptions?${queryParams.toString()}`;
            },
            providesTags: ['RewardRedemptions'],
        }),
        getRewardRedemptionById: builder.query<any, string>({
            query: (id) => `/admin/reward-redemptions/${id}`,
            providesTags: ['RewardRedemptions'],
        }),
        reviewRewardRedemption: builder.mutation<void, { id: string; data: { decision: 'approve' | 'reject' | 'hold'; admin_note?: string; admin_reason_code?: string; utid?: string } }>({
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

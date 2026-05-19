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

export interface RewardRedemption {
    id: string;
    userId: string;
    userName?: string;
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
    items: RewardRedemption[];
    pagination: CursorPaginationMeta;
}

export interface RewardRedemptionsQueryParams extends CursorPaginationParams {
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
                appendCursorPagination(queryParams, params);
                if (params?.status) queryParams.append('status', params.status);
                if (params?.search) queryParams.append('search', params.search);
                if (params?.from) queryParams.append('from', params.from);
                if (params?.to) queryParams.append('to', params.to);
                const queryString = queryParams.toString();
                return queryString ? `/admin/reward-redemptions?${queryString}` : '/admin/reward-redemptions';
            },
            providesTags: ['RewardRedemptions'],
            transformResponse: (response: unknown, _meta, arg) => {
                const root = getResponseDataRoot(response);

                return {
                    items: readCollection<RewardRedemption>(root, ['items', 'rewardRedemptions', 'reward_redemptions', 'results']),
                    pagination: normalizeCursorPaginationMeta(response, arg.limit),
                };
            },
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

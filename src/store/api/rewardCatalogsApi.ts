import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface RewardCatalog {
    id: string;
    catalogName: string;
    brandKey: string;
    brandName: string;
    utid: string;
    rewardName: string;
    currencyCode: string;
    status: 'ACTIVE' | 'INACTIVE';
    valueType: string;
    rewardType: string;
    minValue: string;
    maxValue: string;
    faceValue: string;
    imageUrl: string | null;
    createdAt: string;
    updatedAt: string;
}

export interface RewardCatalogsResponse {
    items: RewardCatalog[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export interface RewardCatalogsQueryParams {
    page?: number;
    limit?: number;
    search?: string;
    currency?: string;
    status?: string;
}

export const rewardCatalogsApi = createApi({
    reducerPath: 'rewardCatalogsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['RewardCatalogs'],
    endpoints: (builder) => ({
        getRewardCatalogs: builder.query<RewardCatalogsResponse, RewardCatalogsQueryParams | void>({
            query: (params) => {
                const queryParams = new URLSearchParams();
                if (params) {
                    if (params.page) queryParams.append('page', params.page.toString());
                    if (params.limit) queryParams.append('limit', params.limit.toString());
                    if (params.search) queryParams.append('search', params.search);
                    if (params.currency) queryParams.append('currency', params.currency);
                    if (params.status) queryParams.append('status', params.status);
                }
                return `/admin/reward-catalogs?${queryParams.toString()}`;
            },
            providesTags: ['RewardCatalogs'],
        }),
    }),
});

export const {
    useGetRewardCatalogsQuery,
} = rewardCatalogsApi;

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
    pagination: CursorPaginationMeta;
}

export interface RewardCatalogsQueryParams extends CursorPaginationParams {
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
                    appendCursorPagination(queryParams, params);
                    if (params.search) queryParams.append('search', params.search);
                    if (params.currency) queryParams.append('currency', params.currency);
                    if (params.status) queryParams.append('status', params.status);
                }
                const queryString = queryParams.toString();
                return queryString ? `/admin/reward-catalogs?${queryString}` : '/admin/reward-catalogs';
            },
            providesTags: ['RewardCatalogs'],
            transformResponse: (response: unknown, _meta, arg) => {
                const root = getResponseDataRoot(response);

                return {
                    items: readCollection<RewardCatalog>(root, ['items', 'rewardCatalogs', 'reward_catalogs', 'results']),
                    pagination: normalizeCursorPaginationMeta(response, arg?.limit),
                };
            },
        }),
    }),
});

export const {
    useGetRewardCatalogsQuery,
} = rewardCatalogsApi;

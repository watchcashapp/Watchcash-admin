import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface PlanFeature {
    [key: string]: any;
}

export interface Plan {
    id: string;
    code: string;
    name: string;
    priceUsd: number;
    earningPointsPerMin: number;
    dailyLimitMinutes: number;
    isActive: boolean;
    features: string[];
    createdAt: string;
    updatedAt: string;
}

export interface PlanUpdate {
    code: string;
    name: string;
    price_usd: number;
    earning_points_per_min: number;
    daily_limit_minutes: number;
    is_active: boolean;
    features: string[];
}

export interface PlanSettingsRequest {
    plans: PlanUpdate[];
}

export interface PlanSettingsResponse {
    status: string;
    data: PlanSettingsRequest;
}

export const planSettingsApi = createApi({
    reducerPath: 'planSettingsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['PlanSettings'],
    endpoints: (builder) => ({
        getPlanSettings: builder.query<PlanSettingsRequest, void>({
            query: () => '/admin/plan-settings',
            providesTags: ['PlanSettings'],
            transformResponse: (response: PlanSettingsResponse | any) => {
                if (response?.data?.plans) {
                    return response.data;
                }
                return { plans: response?.data || [] };
            },
        }),
        updatePlanSettings: builder.mutation<PlanSettingsRequest, PlanSettingsRequest>({
            query: (body) => ({
                url: '/admin/plan-settings',
                method: 'PUT',
                body,
            }),
            invalidatesTags: ['PlanSettings'],
            transformResponse: (response: PlanSettingsResponse | any) => {
                if (response?.data?.plans) {
                    return response.data;
                }
                return { plans: response?.data || [] };
            },
        }),
    }),
});

export const {
    useGetPlanSettingsQuery,
    useUpdatePlanSettingsMutation,
} = planSettingsApi;

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface SettingsRequest {
    settings: Record<string, any>;
}

export interface SettingsResponse {
    status: string;
    data: SettingsRequest;
}

export const settingsApi = createApi({
    reducerPath: 'settingsApi',
    baseQuery: baseQueryWithReauth,
    tagTypes: ['Settings'],
    endpoints: (builder) => ({
        getSettings: builder.query<SettingsRequest, void>({
            query: () => '/admin/settings',
            providesTags: ['Settings'],
            transformResponse: (response: SettingsResponse | any) => {
                // Handle both { data: { settings: {...} } } and { data: {...} }
                if (response?.data?.settings) {
                    return response.data;
                }
                return { settings: response?.data || {} };
            },
        }),
        updateSettings: builder.mutation<SettingsRequest, SettingsRequest>({
            query: (body) => ({
                url: '/admin/settings',
                method: 'POST',
                body,
            }),
            invalidatesTags: ['Settings'],
            transformResponse: (response: SettingsResponse | any) => {
                if (response?.data?.settings) {
                    return response.data;
                }
                return { settings: response?.data || {} };
            },
        }),
    }),
});

export const {
    useGetSettingsQuery,
    useUpdateSettingsMutation,
} = settingsApi;

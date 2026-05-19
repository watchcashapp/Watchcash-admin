import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface AdSettings {
  points_per_ad: number;
  max_ads_per_day: number;
  max_points_per_day: number;
  cooldown_seconds: number;
}

export interface AdProvider {
  id?: string;
  provider_code: string;
  provider_name: string;
  is_enabled: boolean;
  config: any;
}

export interface AdProvidersResponse {
  providers: AdProvider[];
  nextCursor: string | null;
  hasMore: boolean;
}

export const adsApi = createApi({
  reducerPath: 'adsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AdSettings', 'AdProviders'],
  endpoints: (builder) => ({
    getAdSettings: builder.query<AdSettings, void>({
      query: () => '/admin/ad-settings',
      transformResponse: (response: any) => {
        const data = response.data || response;
        return {
          points_per_ad: data.points_per_ad ?? data.pointsPerAd ?? 1,
          max_ads_per_day: data.max_ads_per_day ?? data.maxAdsPerDay ?? 1,
          max_points_per_day: data.max_points_per_day ?? data.maxPointsPerDay ?? 1,
          cooldown_seconds: data.cooldown_seconds ?? data.cooldownSeconds ?? 1,
        };
      },
      providesTags: ['AdSettings'],
    }),
    updateAdSettings: builder.mutation<AdSettings, AdSettings>({
      query: (body) => ({
        url: '/admin/ad-settings',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['AdSettings'],
    }),
    getAdProviders: builder.query<AdProvidersResponse, { cursor?: string; limit?: number } | void>({
      query: (params) => ({
        url: '/admin/ad-providers',
        params: params || { limit: 10 },
      }),
      transformResponse: (response: any) => {
        const data = response.data || response;
        const rawProviders = data.providers || [];
        
        return {
          providers: Array.isArray(rawProviders) ? rawProviders.map((p: any) => ({
            id: p.id,
            provider_code: p.provider_code ?? p.providerCode ?? '',
            provider_name: p.provider_name ?? p.providerName ?? '',
            is_enabled: p.is_enabled ?? p.isEnabled ?? false,
            config: p.config ?? {},
          })) : [],
          nextCursor: data.nextCursor || null,
          hasMore: data.hasMore ?? false,
        };
      },
      providesTags: ['AdProviders'],
    }),
    saveAdProvider: builder.mutation<AdProvider, AdProvider>({
      query: (body) => ({
        url: '/admin/ad-providers',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AdProviders'],
    }),
    updateProviderStatus: builder.mutation<void, { provider_code: string; is_enabled: boolean }>({
      query: ({ provider_code, is_enabled }) => ({
        url: `/admin/ad-providers/${provider_code}/status`,
        method: 'PUT',
        body: { is_enabled },
      }),
      invalidatesTags: ['AdProviders'],
    }),
  }),
});

export const {
  useGetAdSettingsQuery,
  useUpdateAdSettingsMutation,
  useGetAdProvidersQuery,
  useSaveAdProviderMutation,
  useUpdateProviderStatusMutation,
} = adsApi;

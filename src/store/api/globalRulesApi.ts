import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/config/env';

export interface GlobalRules {
  defaultPointsPerMinute: number;
  dailyHardCap: number;
  dailySoftCap: number;
  softCapMultiplier: number;
  maxSessionDuration: number;
  minSessionDuration: number;
  maxDailySessions: number;
}

export interface GlobalRulesResponse {
  status: string;
  data: GlobalRules;
}

export interface UpdateGlobalRulesRequest extends GlobalRules {}

// Custom base query with error handling
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers) => {
    const accessToken = typeof window !== 'undefined' 
      ? document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, '$1')
      : '';
    
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const globalRulesApi = createApi({
  reducerPath: 'globalRulesApi',
  baseQuery,
  tagTypes: ['GlobalRules'],
  endpoints: (builder) => ({
    getGlobalRules: builder.query<GlobalRules, void>({
      query: () => '/admin/global-rules',
      providesTags: ['GlobalRules'],
      transformResponse: (response: GlobalRulesResponse) => response.data,
    }),
    
    updateGlobalRules: builder.mutation<GlobalRules, UpdateGlobalRulesRequest>({
      query: (body) => ({
        url: '/admin/global-rules',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['GlobalRules'],
      transformResponse: (response: GlobalRulesResponse) => response.data,
    }),
  }),
});

export const {
  useGetGlobalRulesQuery,
  useUpdateGlobalRulesMutation,
} = globalRulesApi;

import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface GlobalRules {
  defaultPointsPerMinute: number;
  dailyHardCap: number;
  dailySoftCap: number;
  softCapMultiplier: number;
  maxSessionDuration: number;
  minSessionDuration: number;
  maxDailySessions: number;
  mediumRiskReductionPercent: number;
  highRiskFirstReductionPercent: number;
  highRiskSecondReductionPercent: number;
  highRiskBlockMinutes: number;
  veryHighBlockMinutes: number;
}

export interface GlobalRulesResponse {
  status: string;
  data: GlobalRules;
}

export interface UpdateGlobalRulesRequest extends GlobalRules { }

export const globalRulesApi = createApi({
  reducerPath: 'globalRulesApi',
  baseQuery: baseQueryWithReauth,
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

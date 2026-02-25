import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface AppRule {
  id: string;
  appName: string;
  pointsPerMinute: number;
  dailyHardCap: number;
  dailySoftCap: number;
  softCapMultiplier: number;
  maxSessionDuration: number;
  minSessionDuration: number;
  maxDailySessions: number;
  enabled: boolean;
  permissions?: string[]; // Array of permission IDs
  createdAt: string;
  updatedAt: string;
}

export interface AppRulesResponse {
  status: string;
  data: AppRule[];
}

export interface AppRuleResponse {
  status: string;
  data: AppRule;
}

export interface CreateAppRuleRequest {
  appName: string;
  pointsPerMinute: number;
  dailyHardCap: number;
  dailySoftCap: number;
  softCapMultiplier: number;
  maxSessionDuration: number;
  minSessionDuration: number;
  maxDailySessions: number;
  enabled: boolean;
  permissions?: string[]; // Array of permission IDs
}

export interface UpdateAppRuleRequest extends CreateAppRuleRequest {}

export const appRulesApi = createApi({
  reducerPath: 'appRulesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['AppRules'],
  endpoints: (builder) => ({
    getAppRules: builder.query<AppRule[], void>({
      query: () => '/admin/app-rules',
      providesTags: ['AppRules'],
      transformResponse: (response: AppRulesResponse) => response.data,
    }),
    
    getAppRuleById: builder.query<AppRule, string>({
      query: (id) => `/admin/app-rules/${id}`,
      providesTags: ['AppRules'],
      transformResponse: (response: AppRuleResponse) => response.data,
    }),
    
    createAppRule: builder.mutation<AppRule, CreateAppRuleRequest>({
      query: (body) => ({
        url: '/admin/app-rules',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['AppRules'],
      transformResponse: (response: AppRuleResponse) => response.data,
    }),
    
    updateAppRule: builder.mutation<AppRule, { id: string; data: UpdateAppRuleRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/app-rules/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['AppRules'],
      transformResponse: (response: AppRuleResponse) => response.data,
    }),
    
    deleteAppRule: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/admin/app-rules/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['AppRules'],
    }),
    
    toggleAppRuleStatus: builder.mutation<AppRule, { id: string; enabled: boolean }>({
      query: ({ id, enabled }) => ({
        url: `/admin/app-rules/${id}/toggle-status`,
        method: 'PUT',
        body: { enabled },
      }),
      invalidatesTags: ['AppRules'],
      transformResponse: (response: AppRuleResponse) => response.data,
    }),
  }),
});

export const {
  useGetAppRulesQuery,
  useGetAppRuleByIdQuery,
  useCreateAppRuleMutation,
  useUpdateAppRuleMutation,
  useDeleteAppRuleMutation,
  useToggleAppRuleStatusMutation,
} = appRulesApi;

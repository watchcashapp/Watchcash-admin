import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/config/env';

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
}

export interface UpdateAppRuleRequest extends CreateAppRuleRequest {}

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

export const appRulesApi = createApi({
  reducerPath: 'appRulesApi',
  baseQuery,
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

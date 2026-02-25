import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface Session {
  id: string;
  session_id: string;
  user_id: string;
  user_email: string;
  user_name: string;
  device_id: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
  duration_seconds: number;
  points_earned: number;
  created_at: string;
  metadata?: {
    lat?: number;
    lng?: number;
    flagged?: boolean;
    app_name?: string;
    end_time?: string;
    start_time?: string;
    risk_rating?: string;
    risk_reason?: string | null;
    risk_flagged?: boolean;
    risk_metrics?: any;
  };
}

export interface SessionDetailResponse {
  status: string;
  data: {
    session: {
      session_id: string;
      device_id: string;
      status: 'pending' | 'active' | 'completed' | 'failed';
      duration_seconds: number;
      created_at: string;
      metadata?: {
        lat?: number;
        lng?: number;
        flagged?: boolean;
        app_name?: string;
        end_time?: string;
        start_time?: string;
        risk_rating?: string;
        risk_reason?: string | null;
        risk_flagged?: boolean;
        risk_metrics?: any;
      };
    };
    user: {
      id: string;
      email: string;
      name: string;
    };
    reward: {
      id: string;
      points_earned: number;
      calculated_at: string;
    };
    wallet_transactions: Array<{
      id: string;
      amount: number;
      transactionType: string;
      reasonCode: string;
      referenceType: string;
      referenceId: string;
      note: string;
      createdAt: string;
    }>;
  };
}

export interface SessionsResponse {
  status: string;
  data: {
    sessions: Session[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Sessions'],
  endpoints: (builder) => ({
    getSessions: builder.query<SessionsResponse, {
      page?: number;
      limit?: number;
      status?: string;
      userId?: string;
      deviceId?: string;
    }>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.status) queryParams.append('status', params.status);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.deviceId) queryParams.append('deviceId', params.deviceId);
        
        return `/admin/sessions?${queryParams.toString()}`;
      },
      providesTags: ['Sessions'],
    }),
    getSessionById: builder.query<SessionDetailResponse, string>({
      query: (sessionId) => `/admin/sessions/${sessionId}`,
      providesTags: ['Sessions'],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetSessionByIdQuery,
} = sessionsApi;

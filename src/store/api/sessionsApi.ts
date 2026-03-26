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
    reviews?: Array<{
      reviewer: string;
      decision: string;
      notes: string;
      timestamp: string;
    }>;
  };
}

export interface SessionsResponse {
  sessions: Session[];
  pagination: CursorPaginationMeta;
}

export interface ReviewSessionRequest {
  decision: 'approve' | 'reject';
  reason: string;
  note?: string;
  deduct_points: boolean;
  deduction_type?: 'percentage' | 'fixed';
  deduction_value?: number;
  block_user: boolean;
  block_minutes?: number;
}

export interface GetSessionsParams extends CursorPaginationParams {
  status?: string;
  userId?: string;
  userName?: string;
  deviceId?: string;
  from?: string;
  to?: string;
}

export const sessionsApi = createApi({
  reducerPath: 'sessionsApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Sessions', 'Users'] as const,

  endpoints: (builder) => ({
    getSessions: builder.query<SessionsResponse, GetSessionsParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, params);
        if (params.status) queryParams.append('status', params.status);
        if (params.userId) queryParams.append('userId', params.userId);
        if (params.userName) queryParams.append('userName', params.userName);
        if (params.deviceId) queryParams.append('deviceId', params.deviceId);
        if (params.from) queryParams.append('from', params.from);
        if (params.to) queryParams.append('to', params.to);

        const queryString = queryParams.toString();
        return queryString ? `/admin/sessions?${queryString}` : '/admin/sessions';
      },
      providesTags: ['Sessions'],
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          sessions: readCollection<Session>(root, ['sessions', 'items', 'results']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getSessionById: builder.query<SessionDetailResponse, string>({
      query: (sessionId) => `/admin/sessions/${sessionId}`,
      providesTags: ['Sessions'],
    }),
    reviewSession: builder.mutation<void, { sessionId: string; data: ReviewSessionRequest }>({
      query: ({ sessionId, data }) => ({
        url: `/admin/sessions/${sessionId}/review`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Sessions', 'Users'], // Invalidating Users as well since points/blocking might affect user data
    }),
  }),
});
export const {
  useGetSessionsQuery,
  useGetSessionByIdQuery,
  useReviewSessionMutation,
} = sessionsApi;

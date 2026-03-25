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

export enum BanReasonCode {
  ACCOUNT_DELETED = 'ACCOUNT_DELETED',
  USER_BANNED = 'USER_BANNED',
  KYC_VERIFICATION_FAILED = 'KYC_VERIFICATION_FAILED',
  IDENTITY_MISMATCH = 'IDENTITY_MISMATCH',
  FRAUD_SUSPICION = 'FRAUD_SUSPICION',
  CHARGEBACK_DISPUTE = 'CHARGEBACK_DISPUTE',
  PAYMENT_FRAUD = 'PAYMENT_FRAUD',
  PAYMENT_ABUSE = 'PAYMENT_ABUSE',
  MULTI_ACCOUNTING = 'MULTI_ACCOUNTING',
  BOT_ACTIVITY = 'BOT_ACTIVITY',
  TERMS_VIOLATION = 'TERMS_VIOLATION',
  ILLEGAL_ACTIVITY = 'ILLEGAL_ACTIVITY',
  SCAM_REPORT = 'SCAM_REPORT',
  CHEATING_OR_EXPLOITING = 'CHEATING_OR_EXPLOITING',
  REWARD_MANIPULATION = 'REWARD_MANIPULATION',
  WALLET_ABUSE = 'WALLET_ABUSE',
  LEDGER_DISPUTE = 'LEDGER_DISPUTE',
  DOUBLE_SPEND_SUSPECTED = 'DOUBLE_SPEND_SUSPECTED',
  RISK_SCORE_HIGH = 'RISK_SCORE_HIGH',
  REPEATED_POLICY_VIOLATIONS = 'REPEATED_POLICY_VIOLATIONS',
  SPAM_OR_ABUSE = 'SPAM_OR_ABUSE',
  HARASSMENT = 'HARASSMENT',
  CONTENT_VIOLATION = 'CONTENT_VIOLATION',
  ACCOUNT_TAKEOVER = 'ACCOUNT_TAKEOVER',
  UNAUTHORIZED_ACCESS = 'UNAUTHORIZED_ACCESS',
  REFERRAL_ABUSE = 'REFERRAL_ABUSE',
  DEVICE_TAMPERING = 'DEVICE_TAMPERING',
  SYSTEM_ERROR_MITIGATION = 'SYSTEM_ERROR_MITIGATION',
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'APP' | 'ADMIN' | 'STAFF';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  permissions?: Array<{
    id: string;
    name: string;
    code: string;
    isDirect?: boolean;
  }>;
  roles?: Array<{
    id: string;
    name: string;
    code: string;
  }>;
}

export interface UsersResponse {
  status: string;
  data: {
    users: User[];
    pagination: CursorPaginationMeta;
  };
}

export interface GetUsersParams extends CursorPaginationParams {
  search?: string;
  isActive?: boolean;
  userType?: string;
  from?: string;
  to?: string;
}

export interface LoginHistory {
  id: string;
  userId: string;
  userName?: string;
  deviceId: string | null;
  userAgent: string;
  ip: string;
  isAdmin: boolean;
  createdAt: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface GetLoginHistoryParams extends CursorPaginationParams {
  user_id?: string;
  is_admin?: boolean;
}

export interface LoginHistoryResponse {
  status: string;
  data: {
    items: LoginHistory[];
    pagination: CursorPaginationMeta;
  };
}

export interface CreateUserRequest {
  name: string;
  email: string;
  userType: 'APP' | 'ADMIN' | 'STAFF';
  permissions?: string[];
  roles?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  userType?: 'APP' | 'ADMIN' | 'STAFF';
  permissions?: string[];
  roles?: string[];
  isActive?: boolean;
}

export interface BanUserRequest {
  reasonCode: BanReasonCode;
  durationSeconds: number;
  note: string;
}

export interface UserDetailResponse {
  status: string;
  data: {
    user: User;
    totalPointsFromSessions: number;
    totalPointsFromAdjustments: number;
    totalPoints: number;
    sessionsCount: number;
    devicesCount: number;
    permissions: Array<{
      id: string;
      code: string;
      description: string;
      isDirect?: boolean;
    }>;
    roles: Array<{
      id: string;
      name: string;
      code: string;
      description: string;
    }>;
  };
}

export interface WalletTransaction {
  id: string;
  amount: number;
  transactionType: 'CREDIT' | 'DEBIT';
  reasonCode: string;
  referenceType: string;
  referenceId: string;
  note: string;
  createdAt: string;
}

export interface UserWalletResponse {
  status: string;
  data: {
    user: User;
    walletBalance: number;
    transactions: WalletTransaction[];
    pagination: CursorPaginationMeta;
  };
}

export interface TransactionDetailSession {
  id: string;
  session_id?: string;
  device_id?: string;
  user_id?: string;
  created_at: string;
  duration_seconds: number;
  status: string;
  // camelCase variants (in case API transforms)
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  pointsEarned?: number;
}

export interface TransactionDetailAdjustment {
  id: string;
  adjustmentType: string;
  amount: number;
  note: string;
  createdAt: string;
  madeByAdmin: boolean;
}

export interface TransactionDetail extends WalletTransaction {
  balanceAfter?: number;
  session?: TransactionDetailSession | null;
  adjustment?: TransactionDetailAdjustment | null;
}

export interface TransactionDetailResponse {
  status: string;
  data: TransactionDetail;
}

export interface UserRedeemHistoryResponse {
  items: any[];
  pagination: CursorPaginationMeta;
}

export interface SubscriptionLog {
  id: string;
  userId: string;
  subscriptionId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string | null;
  stripeInvoiceId: string | null;
  stripeEventId: string;
  amount: string;
  currency: string;
  status: string;
  rawEvent: any;
  createdAt: string;
}

export interface SubscriptionLogsResponse {
  items: SubscriptionLog[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface PlanHistoryResponse {
  items: any[];
  nextCursor: string | null;
  hasMore: boolean;
  limit: number;
}

export interface UserSubscription {
  id: string;
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  plan: string;
  priceId: string;
  status: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserSubscriptionResponse {
  status: string;
  data: {
    subscription: UserSubscription;
    logs: SubscriptionLogsResponse;
    planHistory: PlanHistoryResponse;
  };
}

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse['data'], GetUsersParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();

        appendCursorPagination(queryParams, params);
        if (params.search) queryParams.append('search', params.search);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params.userType) queryParams.append('userType', params.userType);
        if (params.from) queryParams.append('from', params.from);
        if (params.to) queryParams.append('to', params.to);

        const queryString = queryParams.toString();
        return queryString ? `/admin/users?${queryString}` : '/admin/users';
      },
      providesTags: ['Users'],
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          users: readCollection<User>(root, ['users', 'items', 'results']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getUserById: builder.query<User, string>({
      query: (id) => `/admin/users/${id}`,
      providesTags: ['Users'],
      transformResponse: (response: UserDetailResponse) => {
        // Merge permissions and roles from the data level into the user object
        return {
          ...response.data.user,
          permissions: response.data.permissions.map(p => ({
            id: p.id,
            code: p.code,
            name: p.description, // Use description as name
            isDirect: p.isDirect,
          })),
          roles: response.data.roles.map(r => ({
            id: r.id,
            name: r.name,
            code: r.code,
          })),
        };
      },
    }),
    createUser: builder.mutation<User, CreateUserRequest>({
      query: (body) => ({
        url: '/admin/users',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Users'],
      transformResponse: (response: { status: string; data: User }) => response.data,
    }),
    updateUser: builder.mutation<User, { id: string; data: UpdateUserRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Users'],
      transformResponse: (response: { status: string; data: User }) => response.data,
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/users/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Users'],
    }),
    banUser: builder.mutation<void, { id: string; data: BanUserRequest }>({
      query: ({ id, data }) => ({
        url: `/admin/users/${id}/ban`,
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Users'],
    }),
    getUserWallet: builder.query<UserWalletResponse['data'], { userId: string } & CursorPaginationParams>({
      query: ({ userId, cursor, limit = 20 }) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, { cursor, limit });

        return `/admin/users/${userId}/wallet?${queryParams.toString()}`;
      },
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);
        const walletBalanceRaw = root.walletBalance ?? root.wallet_balance ?? 0;
        const walletBalance = typeof walletBalanceRaw === 'number'
          ? walletBalanceRaw
          : Number(walletBalanceRaw) || 0;

        return {
          user: root.user as User,
          walletBalance,
          transactions: readCollection<WalletTransaction>(root, ['transactions', 'items', 'results']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getTransactionDetail: builder.query<TransactionDetail, { userId: string; transactionId: string }>({
      query: ({ userId, transactionId }) =>
        `/admin/users/${userId}/transactions/${transactionId}`,
      transformResponse: (response: TransactionDetailResponse) => response.data,
    }),
    getUserRedeemHistory: builder.query<UserRedeemHistoryResponse, { userId: string } & CursorPaginationParams>({
      query: ({ userId, cursor, limit = 20 }) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, { cursor, limit });
        return `/admin/users/${userId}/redeemhistory?${queryParams.toString()}`;
      },
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          items: readCollection<any>(root, ['items', 'results', 'redeemHistory', 'redeem_history']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getLoginHistory: builder.query<LoginHistoryResponse['data'], GetLoginHistoryParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, params);
        if (params.user_id) queryParams.append('user_id', params.user_id);
        if (params.is_admin !== undefined) queryParams.append('is_admin', params.is_admin.toString());

        const queryString = queryParams.toString();
        return queryString ? `/admin/logins?${queryString}` : '/admin/logins';
      },
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          items: readCollection<LoginHistory>(root, ['items', 'results', 'logins']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getUserLoginHistory: builder.query<LoginHistoryResponse['data'], { userId: string } & CursorPaginationParams>({
      query: ({ userId, ...params }) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, params);
        return `/admin/users/${userId}/logins?${queryParams.toString()}`;
      },
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);
        return {
          items: readCollection<LoginHistory>(root, ['items', 'results', 'logins']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getUserSubscription: builder.query<UserSubscriptionResponse['data'], { userId: string; search?: string; logsLimit?: number; planLimit?: number } | string>({
      query: (arg) => {
        let userId: string;
        let search: string | undefined;
        let logsLimit: number | undefined;
        let planLimit: number | undefined;

        if (typeof arg === 'string') {
          userId = arg;
        } else {
          userId = arg.userId;
          search = arg.search;
          logsLimit = arg.logsLimit;
          planLimit = arg.planLimit;
        }

        const queryParams = new URLSearchParams();
        if (search) queryParams.append('search', search);
        if (logsLimit !== undefined) queryParams.append('logs_limit', logsLimit.toString());
        if (planLimit !== undefined) queryParams.append('plan_limit', planLimit.toString());

        const qs = queryParams.toString();
        return qs ? `/admin/users/${userId}/subscription?${qs}` : `/admin/users/${userId}/subscription`;
      },
      transformResponse: (response: UserSubscriptionResponse) => {
        return response.data;
      },
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
  useGetUserWalletQuery,
  useGetTransactionDetailQuery,
  useGetUserRedeemHistoryQuery,
  useGetLoginHistoryQuery,
  useGetUserLoginHistoryQuery,
  useGetUserSubscriptionQuery,
  useBanUserMutation,
} = usersApi;

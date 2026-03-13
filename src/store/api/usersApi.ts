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
} = usersApi;

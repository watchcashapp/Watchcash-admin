import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface User {
  id: string;
  name: string;
  email: string;
  userType: 'APP' | 'ADMIN';
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
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
}

export interface GetUsersParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
  userType?: 'APP' | 'ADMIN';
}

export interface CreateUserRequest {
  name: string;
  email: string;
  userType: 'APP' | 'ADMIN';
  permissions?: string[];
  roles?: string[];
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  userType?: 'APP' | 'ADMIN';
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

export const usersApi = createApi({
  reducerPath: 'usersApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Users'],
  endpoints: (builder) => ({
    getUsers: builder.query<UsersResponse['data'], GetUsersParams>({
      query: (params = {}) => {
        const queryParams = new URLSearchParams();
        
        if (params.page) queryParams.append('page', params.page.toString());
        if (params.limit) queryParams.append('limit', params.limit.toString());
        if (params.search) queryParams.append('search', params.search);
        if (params.isActive !== undefined) queryParams.append('isActive', params.isActive.toString());
        if (params.userType) queryParams.append('userType', params.userType);
        
        return `/admin/users?${queryParams.toString()}`;
      },
      providesTags: ['Users'],
      transformResponse: (response: UsersResponse) => response.data,
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
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useCreateUserMutation,
  useUpdateUserMutation,
  useDeleteUserMutation,
} = usersApi;

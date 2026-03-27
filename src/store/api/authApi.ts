import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/config/env';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { Mutex } from 'async-mutex';

// Create a mutex to prevent multiple refresh requests
const mutex = new Mutex();

// Custom base query with error handling
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers, { endpoint }) => {
    // Public endpoints that don't need authentication
    // Public endpoints that don't need authentication
    const publicEndpoints = ['login', 'register', 'forgotPassword', 'resetPassword', 'refreshToken'];

    // Only add Authorization header for private/protected endpoints
    if (!publicEndpoints.includes(endpoint)) {
      const accessToken = typeof window !== 'undefined'
        ? (document.cookie.split('; ').find(row => row.trim().startsWith('accessToken='))?.split('=')[1] || '')
        : '';

      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }


    // Add ngrok-skip-browser-warning header to bypass ngrok warning page
    headers.set('ngrok-skip-browser-warning', 'true');

    return headers;
  },
});

// Base query with automatic token refresh on 401
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  // Wait until the mutex is available without locking it
  await mutex.waitForUnlock();

  let result = await baseQuery(args, api, extraOptions);

  // Check for 401 HTTP status
  const is401Error = result.error && result.error.status === 401;

  if (is401Error) {
    // Check if the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();

      try {
        const refreshToken = typeof window !== 'undefined'
          ? (document.cookie.split('; ').find(row => row.trim().startsWith('refreshToken='))?.split('=')[1] || '')
          : '';

        if (refreshToken) {
          // Try to get a new token
          const refreshResult = await baseQuery(
            {
              url: '/admin/refresh',
              method: 'POST',
              body: { refreshToken },
            },
            api,
            extraOptions
          );

          // Check if refresh was successful
          if (refreshResult.data &&
            typeof refreshResult.data === 'object' &&
            'status' in refreshResult.data &&
            (refreshResult.data as any).status === 'success' &&
            'data' in refreshResult.data) {

            const data = (refreshResult.data as any).data as { accessToken: string; refreshToken: string };

            // Store the new tokens (without secure flag for localhost)
            if (typeof window !== 'undefined') {
              const isSecure = window.location.protocol === 'https:';
              const cookieOptions = isSecure
                ? 'path=/; secure; samesite=lax'
                : 'path=/; samesite=lax';

              document.cookie = `accessToken=${data.accessToken}; ${cookieOptions}; max-age=3600`;
              document.cookie = `refreshToken=${data.refreshToken}; ${cookieOptions}; max-age=604800`;
            }

            // Retry the initial query with new token
            result = await baseQuery(args, api, extraOptions);
          } else {
            // Refresh failed - clear tokens and redirect to login
            if (typeof window !== 'undefined') {
              document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
              document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
              window.location.replace('/auth/login');
            }
          }
        } else {
          // No refresh token - redirect to login
          if (typeof window !== 'undefined') {
            document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            window.location.replace('/auth/login');
          }
        }
      } finally {
        release();
      }
    } else {
      // Wait for the mutex to be available
      await mutex.waitForUnlock();
      result = await baseQuery(args, api, extraOptions);
    }
  }

  return result;
};

export interface LoginRequest {
  email: string;
  password: string;
}

export interface Permission {
  id: string;
  code: string;
  description: string;
}

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
}

export interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
    permissions?: Permission[];
    roles?: Role[];
    agency_owner_gs_authtoken?: string; // Optional token for agency owners
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  isActive: boolean;
  permissions?: Permission[];
  roles?: Role[];
  createdAt: string;
  updatedAt: string;
}

export interface ProfileResponse {
  status: string;
  data: User;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
    agency_owner_gs_authtoken?: string; // Optional token for agency owners
  };
}

export interface ApiError {
  status: number;
  data: string | { message: string; errors?: Record<string, string[]> };
}

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: LoginResponse) => {
        // Store both tokens in cookies (without secure flag for localhost)
        if (typeof window !== 'undefined' && response.data) {
          const isSecure = window.location.protocol === 'https:';
          const cookieOptions = isSecure
            ? 'path=/; secure; samesite=lax'
            : 'path=/; samesite=lax';

          document.cookie = `accessToken=${response.data.accessToken}; ${cookieOptions}; max-age=3600`;
          document.cookie = `refreshToken=${response.data.refreshToken}; ${cookieOptions}; max-age=604800`;
        }
        return response;
      },
    }),

    register: builder.mutation<RegisterResponse, RegisterRequest>({
      query: (userData) => ({
        url: '/admin/register',
        method: 'POST',
        body: userData,
      }),
    }),

    forgotPassword: builder.mutation<{ message: string }, { email: string }>({
      query: (body) => ({
        url: '/admin/forgot-password',
        method: 'POST',
        body,
      }),
    }),





    logout: builder.mutation<{ message: string }, { refreshToken: string }>({
      query: (body) => ({
        url: '/auth/logout',
        method: 'POST',
        body,
      }),
      transformResponse: (response: { message: string }) => {
        // Clear all auth data after successful logout
        if (typeof window !== 'undefined') {
          // Clear accessToken cookie
          document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';

          // Clear all auth-related cookies
          const cookies = document.cookie.split(';');
          cookies.forEach(cookie => {
            const eqPos = cookie.indexOf('=');
            const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
            if (name.includes('token') || name.includes('auth') || name.includes('session') || name.includes('refresh')) {
              document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
            }
          });

          // Clear localStorage
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          localStorage.removeItem('auth');

          // Clear sessionStorage
          sessionStorage.removeItem('token');
          sessionStorage.removeItem('refreshToken');
          sessionStorage.removeItem('user');
          sessionStorage.removeItem('auth');
        }
        return response;
      },
    }),

    resetPassword: builder.mutation<{ message: string }, { token: string; newPassword: string }>({
      query: (body) => ({
        url: '/admin/reset-password',
        method: 'POST',
        body,
      }),
    }),

    getProfile: builder.query<User, void>({
      query: () => '/admin/profile',
      providesTags: ['User'],
      keepUnusedDataFor: 300, // 5 minutes
      transformResponse: (response: ProfileResponse) => response.data,
    }),

    updateProfile: builder.mutation<User, { name: string; email: string }>({
      query: (body) => ({
        url: '/admin/profile',
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['User'],
      transformResponse: (response: ProfileResponse) => response.data,
    }),

    refreshToken: builder.mutation<void, void>({
      query: () => ({
        url: '/admin/refresh',
        method: 'POST',
        body: {
          refreshToken: typeof window !== 'undefined'
            ? document.cookie.replace(/(?:(?:^|.*;\s*)refreshToken\s*=\s*([^;]*).*$)|^.*$/, '$1')
            : '',
        },
      }),
    }),

    getCurrentUser: builder.query<User, void>({
      query: () => '/admin/me',
      providesTags: ['User'],
      transformResponse: (response: ProfileResponse) => response.data,
    }),

    changePassword: builder.mutation<{ message: string }, { currentPassword: string; newPassword: string }>({
      query: (body) => ({
        url: '/admin/change-password',
        method: 'POST',
        body,
      }),
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useForgotPasswordMutation,
  useLogoutMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCurrentUserQuery,
  useChangePasswordMutation,
  useRefreshTokenMutation,
} = authApi;

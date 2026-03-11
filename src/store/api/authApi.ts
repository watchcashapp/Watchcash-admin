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
    const publicEndpoints = ['login', 'register', 'forgotPassword', 'resetPassword'];
    
    // Only add Authorization header for private/protected endpoints
    if (!publicEndpoints.includes(endpoint)) {
      const accessToken = typeof window !== 'undefined' 
        ? document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, '$1')
        : '';
      
      if (accessToken) {
        headers.set('Authorization', `Bearer ${accessToken}`);
      }
    }
    
    headers.set('Content-Type', 'application/json');
    
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
  
  console.log('[Auth] API call result:', { 
    url: typeof args === 'string' ? args : args.url,
    status: result.error?.status,
    hasError: !!result.error,
    hasData: !!result.data,
  });
  
  // Check for 401 HTTP status
  const is401Error = result.error && result.error.status === 401;
  
  if (is401Error) {
    console.log('[Auth] 401 error detected, attempting token refresh');
    
    // Check if the mutex is locked
    if (!mutex.isLocked()) {
      const release = await mutex.acquire();
      
      try {
        const refreshToken = typeof window !== 'undefined'
          ? document.cookie.replace(/(?:(?:^|.*;\s*)refreshToken\s*=\s*([^;]*).*$)|^.*$/, '$1')
          : '';
        
        if (refreshToken) {
          console.log('[Auth] Attempting token refresh...');
          
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
          
          console.log('[Auth] Refresh result:', { 
            hasData: !!refreshResult.data,
            hasError: !!refreshResult.error,
          });
          
          // Check if refresh was successful
          if (refreshResult.data && 
              typeof refreshResult.data === 'object' &&
              'status' in refreshResult.data &&
              refreshResult.data.status === 'success' &&
              'data' in refreshResult.data) {
            
            const data = refreshResult.data as { status: string; data: { accessToken: string; refreshToken: string } };
            
            console.log('[Auth] Token refresh successful, updating cookies');
            
            // Store the new tokens (without secure flag for localhost)
            if (typeof window !== 'undefined') {
              const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
              const cookieOptions = isLocalhost 
                ? 'path=/; samesite=strict'
                : 'path=/; secure; samesite=strict';
              
              document.cookie = `accessToken=${data.data.accessToken}; ${cookieOptions}; max-age=3600`;
              document.cookie = `refreshToken=${data.data.refreshToken}; ${cookieOptions}; max-age=604800`;
            }
            
            // Retry the initial query with new token
            console.log('[Auth] Retrying original request with new token');
            result = await baseQuery(args, api, extraOptions);
            console.log('[Auth] Retry result:', { 
              hasData: !!result.data,
              hasError: !!result.error,
            });
          } else {
            console.log('[Auth] Token refresh failed, redirecting to login');
            
            // Refresh failed - clear tokens and redirect to login
            if (typeof window !== 'undefined') {
              document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
              document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
              window.location.replace('/auth/login');
            }
          }
        } else {
          console.log('[Auth] No refresh token found, redirecting to login');
          
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

export interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
    agency_owner_gs_authtoken?: string; // Optional token for agency owners
  };
}

export interface User {
  id: string;
  name: string;
  email: string;
  userType: string;
  isActive: boolean;
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
          const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
          const cookieOptions = isLocalhost 
            ? 'path=/; samesite=strict'
            : 'path=/; secure; samesite=strict';
          
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

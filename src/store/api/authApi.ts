import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/config/env';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export interface RegisterResponse {
  token: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
}

export interface ApiError {
  status: number;
  data: string | { message: string; errors?: Record<string, string[]> };
}

// Custom base query with error handling
const baseQuery = fetchBaseQuery({
  baseUrl: config.apiUrl,
  prepareHeaders: (headers) => {
    const token = typeof window !== 'undefined' 
      ? document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1')
      : '';
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    headers.set('Content-Type', 'application/json');
    return headers;
  },
});

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery,
  tagTypes: ['User'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, LoginRequest>({
      query: (credentials) => ({
        url: '/admin/login',
        method: 'POST',
        body: credentials,
      }),
      transformResponse: (response: LoginResponse) => {
        // Set token in cookie on successful login
        if (typeof document !== 'undefined' && response.token) {
          document.cookie = `token=${response.token}; path=/; max-age=3600; secure; samesite=strict`;
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
      transformResponse: (response: RegisterResponse) => {
        // Set token in cookie on successful registration
        if (typeof document !== 'undefined' && response.token) {
          document.cookie = `token=${response.token}; path=/; max-age=3600; secure; samesite=strict`;
        }
        return response;
      },
    }),
    
    logout: builder.mutation<void, void>({
      queryFn: async () => {
        try {
          // Manual logout - clear session and cookies
          if (typeof document !== 'undefined') {
            // Clear token cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            
            // Clear all auth-related cookies
            const cookies = document.cookie.split(';');
            cookies.forEach(cookie => {
              const eqPos = cookie.indexOf('=');
              const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
              if (name.includes('token') || name.includes('auth') || name.includes('session')) {
                document.cookie = `${name}=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT`;
              }
            });
            
            // Clear localStorage
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('auth');
            
            // Clear sessionStorage
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('user');
            sessionStorage.removeItem('auth');
          }
          
          // Return success with explicit data
          return { data: undefined };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Logout failed'
            }
          };
        }
      },
    }),
    
    getCurrentUser: builder.query<LoginResponse['user'], void>({
      query: () => '/admin/me',
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
} = authApi;

import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { config } from '@/config/env';

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  status: string;
  data: {
    accessToken: string;
    refreshToken: string;
  };
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
        }
        return response;
      },
    }),

    forgotPassword: builder.mutation<{ email: string }, { message: string }>({
      queryFn: async ({ email }) => {
        try {
          const response = await fetch(`${config.apiUrl}/admin/forgot-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email }),
          });

          if (!response.ok) {
            throw new Error('Failed to send reset link');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Failed to send reset link'
            }
          };
        }
      },
    }),
    
    forgotPasswlogin: builder.mutation<LoginResponse, LoginRequest>({
      queryFn: async ({ email, password }) => {
        try {
          const response = await fetch(`${config.apiUrl}/admin/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ email, password }),
          });

          if (!response.ok) {
            throw new Error('Login failed');
          }

          const data = await response.json();
          
          // Set token in cookie
          if (typeof window !== 'undefined') {
            document.cookie = `accessToken=${data.data.accessToken}; path=/; max-age=3600; secure; samesite=strict`;
            console.log('Cookie set:', document.cookie); // Debug log
          }
          
          return { data };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Login failed'
            }
          };
        }
      },
    }),

    forgotPasswlogout: builder.mutation<{ refreshToken: string }, { message: string }>({
      queryFn: async ({ refreshToken }) => {
        try {
          const response = await fetch(`${config.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${typeof window !== 'undefined' 
                ? document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1')
                : ''}`,
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Logout failed');
          }

          // Clear all auth data
          if (typeof window !== 'undefined') {
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
            localStorage.removeItem('token');
            sessionStorage.removeItem('token');
          }

          const data = await response.json();
          return { data };
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

    logout: builder.mutation<{ refreshToken: string }, { message: string }>({
      queryFn: async ({ refreshToken }) => {
        try {
          const response = await fetch(`${config.apiUrl}/auth/logout`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ refreshToken }),
          });

          if (!response.ok) {
            throw new Error('Failed to logout');
          }

          const data = await response.json();
          
          // Manual logout - clear session and cookies after API call
          if (typeof window !== 'undefined') {
            // Clear token cookie
            document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
            
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
          
          return { data };
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

    resetPassword: builder.mutation<{ token: string; newPassword: string }, { message: string }>({
      queryFn: async ({ token, newPassword }) => {
        try {
          const response = await fetch(`${config.apiUrl}/admin/reset-password`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ token, newPassword }),
          });

          if (!response.ok) {
            throw new Error('Failed to reset password');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Failed to reset password'
            }
          };
        }
      },
    }),

    getProfile: builder.query<LoginResponse['user'], void>({
      queryFn: async () => {
        try {
          const response = await fetch(`${config.apiUrl}/admin/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${typeof window !== 'undefined' 
                ? document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1')
                : ''}`,
            },
          });

          if (!response.ok) {
            throw new Error('Failed to fetch profile');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Failed to fetch profile'
            }
          };
        }
      },
    }),

    updateProfile: builder.mutation<Partial<LoginResponse['user']>, Partial<LoginResponse['user']>>({
      queryFn: async (profileData) => {
        try {
          const response = await fetch(`${config.apiUrl}/admin/profile`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${typeof window !== 'undefined' 
                ? document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1')
                : ''}`,
            },
            body: JSON.stringify(profileData),
          });

          if (!response.ok) {
            throw new Error('Failed to update profile');
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { 
            error: {
              status: 400,
              data: error instanceof Error ? error.message : 'Failed to update profile'
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
  useForgotPasswordMutation,
  useLogoutMutation,
  useResetPasswordMutation,
  useGetProfileQuery,
  useUpdateProfileMutation,
  useGetCurrentUserQuery,
} = authApi;

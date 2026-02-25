import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface Staff {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StaffListResponse {
  status: string;
  data: {
    staff: Staff[];
    total: number;
    page: number;
    limit: number;
  };
}

export interface StaffFilters {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
  isActive?: boolean;
}

export interface CreateStaffRequest {
  name: string;
  email: string;
  role: string;
  password: string;
}

export interface UpdateStaffRequest {
  id: string;
  name: string;
  email: string;
  role: string;
}

export const staffApi = createApi({
  reducerPath: 'staffApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Staff'],
  endpoints: (builder) => ({
    getStaff: builder.query<StaffListResponse, StaffFilters>({
      query: (filters) => {
        const params = new URLSearchParams();
        if (filters.page) params.append('page', filters.page.toString());
        if (filters.limit) params.append('limit', filters.limit.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        
        return `/admin/staff?${params.toString()}`;
      },
      providesTags: ['Staff'],
    }),
    
    createStaff: builder.mutation<any, CreateStaffRequest>({
      query: (data) => ({
        url: '/admin/staff',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Staff'],
    }),
    
    updateStaff: builder.mutation<any, UpdateStaffRequest>({
      query: ({ id, ...data }) => ({
        url: `/admin/staff/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Staff'],
    }),
    
    deleteStaff: builder.mutation<any, string>({
      query: (id) => ({
        url: `/admin/staff/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Staff'],
    }),
    
    toggleStaffStatus: builder.mutation<any, { id: string; enabled: boolean }>({
      query: ({ id, enabled }) => ({
        url: `/admin/staff/${id}/status`,
        method: 'PATCH',
        body: { enabled },
      }),
      invalidatesTags: ['Staff'],
    }),
  }),
});

export const {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffStatusMutation,
} = staffApi;

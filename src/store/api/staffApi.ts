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
  staff: Staff[];
  pagination: CursorPaginationMeta;
}

export interface StaffFilters extends CursorPaginationParams {
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
        appendCursorPagination(params, filters);
        if (filters.search) params.append('search', filters.search);
        if (filters.role) params.append('role', filters.role);
        if (filters.isActive !== undefined) params.append('isActive', filters.isActive.toString());
        
        const queryString = params.toString();
        return queryString ? `/admin/staff?${queryString}` : '/admin/staff';
      },
      providesTags: ['Staff'],
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          staff: readCollection<Staff>(root, ['staff', 'items', 'results']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
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

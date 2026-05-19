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

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  data: Role[];
  pagination: CursorPaginationMeta;
}

export const rolesApi = createApi({
  reducerPath: 'rolesApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Roles'],
  endpoints: (builder) => ({
    getRoles: builder.query<RolesResponse, {
      cursor?: string;
      limit?: number;
      search?: string;
    } & CursorPaginationParams>({
      query: (params) => {
        const queryParams = new URLSearchParams();
        appendCursorPagination(queryParams, params);
        if (params.search) queryParams.append('search', params.search);
        
        const queryString = queryParams.toString();
        return queryString ? `/admin/roles?${queryString}` : '/admin/roles';
      },
      providesTags: ['Roles'],
      transformResponse: (response: unknown, _meta, arg) => {
        const root = getResponseDataRoot(response);

        return {
          data: readCollection<Role>(root, ['data', 'roles', 'items', 'results']),
          pagination: normalizeCursorPaginationMeta(response, arg.limit),
        };
      },
    }),
    getRoleById: builder.query<{ data: Role }, string>({
      query: (id) => `/admin/roles/${id}`,
      providesTags: ['Roles'],
    }),
    createRole: builder.mutation<Role, Partial<Role>>({
      query: (body) => ({
        url: '/admin/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation<Role, { id: string; data: Partial<Role> }>({
      query: ({ id, data }) => ({
        url: `/admin/roles/${id}`,
        method: 'PUT',
        body: data,
      }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation<void, string>({
      query: (id) => ({
        url: `/admin/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = rolesApi;

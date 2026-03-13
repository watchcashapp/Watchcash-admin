import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithReauth } from './authApi';

export interface Role {
  id: string;
  name: string;
  code: string;
  description: string;
  permissions?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Permission {
  id: string;
  name: string;
  code: string;
  description: string;
  isDirect?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface RolesResponse {
  status: string;
  data: Role[];
}

export interface PermissionsResponse {
  status: string;
  data: {
    [category: string]: Permission[];
  };
}

export interface CreateRoleRequest {
  name: string;
  code: string;
  description: string;
  permissions?: string[];
}

export interface AssignPermissionRequest {
  roleId: string;
  permissionId: string;
}

export const rbacApi = createApi({
  reducerPath: 'rbacApi',
  baseQuery: baseQueryWithReauth,
  tagTypes: ['Roles', 'Permissions'],
  endpoints: (builder) => ({
    getRoles: builder.query<RolesResponse, void>({
      query: () => '/admin/rbac/roles',
      providesTags: ['Roles'],
    }),
    getRoleById: builder.query<{ status: string; data: Role }, string>({
      query: (id) => `/admin/rbac/roles/${id}`,
      providesTags: ['Roles'],
    }),
    getPermissions: builder.query<PermissionsResponse, void>({
      query: () => '/admin/rbac/permissions',
      providesTags: ['Permissions'],
    }),
    createRole: builder.mutation<any, CreateRoleRequest>({
      query: (body: CreateRoleRequest) => ({
        url: '/admin/rbac/roles',
        method: 'POST',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),
    updateRole: builder.mutation<any, { id: string } & Partial<CreateRoleRequest>>({
      query: ({ id, ...body }: { id: string } & Partial<CreateRoleRequest>) => ({
        url: `/admin/rbac/roles/${id}`,
        method: 'PUT',
        body,
      }),
      invalidatesTags: ['Roles'],
    }),
    deleteRole: builder.mutation<any, string>({
      query: (id: string) => ({
        url: `/admin/rbac/roles/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
    assignPermission: builder.mutation<any, AssignPermissionRequest>({
      query: ({ roleId, permissionId }: AssignPermissionRequest) => ({
        url: `/admin/rbac/roles/${roleId}/permissions/${permissionId}`,
        method: 'POST',
      }),
      invalidatesTags: ['Roles'],
    }),
    removePermission: builder.mutation<any, AssignPermissionRequest>({
      query: ({ roleId, permissionId }: AssignPermissionRequest) => ({
        url: `/admin/rbac/roles/${roleId}/permissions/${permissionId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Roles'],
    }),
  }),
});

export const {
  useGetRolesQuery,
  useGetRoleByIdQuery,
  useGetPermissionsQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  useAssignPermissionMutation,
  useRemovePermissionMutation,
} = rbacApi;

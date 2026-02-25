"use client";

import { use, useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Input, Textarea, GroupedPermissionsSelect, useToast } from '@/components/shared';
import { useGetRoleByIdQuery, useUpdateRoleMutation, useGetPermissionsQuery } from '@/store/api/rbacApi';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  });

  const { data: roleResponse, isLoading: loadingRole } = useGetRoleByIdQuery(resolvedParams.id);
  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();

  const role = roleResponse?.data;

  useEffect(() => {
    if (role) {
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description,
        permissions: role.permissions?.map((p: any) => p.id) || [],
      });
    }
  }, [role]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Role name is required');
      return;
    }
    if (!formData.description.trim()) {
      showError('Description is required');
      return;
    }

    try {
      await updateRole({ id: resolvedParams.id, ...formData }).unwrap();
      showSuccess('Role updated successfully!');
      router.push('/staff/roles');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to update role');
    }
  };

  if (loadingRole || loadingPermissions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (!role) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/staff/roles')}
          sx={{ mb: 3 }}
        >
          Back to Roles
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="error">
            Role not found
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push('/staff/roles')}
        sx={{ 
          mb: 1.5,
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08)',
          },
        }}
      >
        Back to Roles
      </Button>

      <Typography 
        variant="h4" 
        sx={{ 
          mb: 2,
          fontWeight: 700,
          background: 'linear-gradient(45deg, #667eea, #764ba2)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Edit Role
      </Typography>

      <Paper
        sx={{
          p: 4,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 4px 12px rgba(0, 0, 0, 0.3)' 
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Box display="flex" flexDirection="column" gap={3}>
          <Input
            label="Role Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="e.g., Content Manager"
          />

          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            disabled
            helperText="Code cannot be changed after creation"
          />

          <Textarea
            label="Description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            required
            placeholder="Describe the role and its responsibilities"
          />

          <GroupedPermissionsSelect
            label="Permissions"
            groupedPermissions={permissionsResponse?.data || {}}
            value={formData.permissions}
            onChange={(value) => setFormData({ ...formData, permissions: value })}
          />

          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
            <Button
              variant="outlined"
              onClick={() => router.push('/staff/roles')}
              disabled={isUpdating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={isUpdating}
              sx={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
                },
              }}
            >
              {isUpdating ? 'Updating...' : 'Update Role'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

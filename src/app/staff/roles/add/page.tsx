"use client";

import { useState } from 'react';
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
import { useCreateRoleMutation } from '@/store/api/rbacApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';

export default function AddRolePage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  });

  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();

  // Auto-generate code from name
  const generateCode = (name: string): string => {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      code: generateCode(newName),
    });
  };

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
      await createRole(formData).unwrap();
      showSuccess('Role created successfully!');
      router.push('/staff/roles');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to create role');
    }
  };

  if (loadingPermissions) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
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
        Add New Role
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
            onChange={handleNameChange}
            required
            placeholder="e.g., Content Manager"
          />

          <Input
            label="Code"
            value={formData.code}
            onChange={(e) => setFormData({ ...formData, code: e.target.value })}
            required
            disabled
            helperText="Auto-generated from name"
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
              disabled={isCreating}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              startIcon={<Save />}
              onClick={handleSubmit}
              disabled={isCreating}
              sx={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
                },
              }}
            >
              {isCreating ? 'Creating...' : 'Create Role'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

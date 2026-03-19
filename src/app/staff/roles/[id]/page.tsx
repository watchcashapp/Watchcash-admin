"use client";

import { use, useState, useEffect, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Input, Textarea, GroupedPermissionsSelect, useToast } from '@/components/shared';
import { useGetRoleByIdQuery, useUpdateRoleMutation, useGetPermissionsQuery } from '@/store/api/rbacApi';
import { usePermissions } from '@/hooks/usePermissions';

export default function EditRolePage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Refs for form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    permissions: [] as string[],
  });

  const [errors, setErrors] = useState<{
    name?: string;
    description?: string;
  }>({});

  const { data: roleResponse, isLoading: loadingRole } = useGetRoleByIdQuery(resolvedParams.id);
  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const { hasPermission, isInitialized } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('rbac:manage_roles')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

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

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, name: e.target.value });
    // Clear error when user starts typing
    if (errors.name) {
      setErrors(prev => ({ ...prev, name: undefined }));
    }
  };

  const handleDescriptionChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData({ ...formData, description: e.target.value });
    // Clear error when user starts typing
    if (errors.description) {
      setErrors(prev => ({ ...prev, description: undefined }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Role name is required';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      // Scroll to first error field
      if (validation.errors.name && nameRef.current) {
        setTimeout(() => {
          nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nameRef.current?.focus();
        }, 100);
      } else if (validation.errors.description && descriptionRef.current) {
        setTimeout(() => {
          descriptionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          descriptionRef.current?.focus();
        }, 100);
      }
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
    <Box sx={{ px: { xs: 2, sm: 3, md: 0 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push('/staff/roles')}
        sx={{
          mb: { xs: 2, sm: 3 },
          '&:hover': {
            backgroundColor: 'rgba(33, 51, 80, 0.08)',
          },
        }}
      >
        Back to Roles
      </Button>

      <Typography
        variant="h5"
        sx={{
          mb: 1.5,
          fontSize: '1.1rem',
          fontWeight: 700,
          background: 'linear-gradient(45deg, #213350, #6AB344)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
        }}
      >
        Edit Role
      </Typography>

      <Paper
        sx={{
          p: 1.5,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 1.5,
        }}
      >
        <Grid container spacing={1.5}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Input
              ref={nameRef}
              label="Role Name"
              value={formData.name}
              onChange={handleNameChange}
              error={!!errors.name}
              helperText={errors.name}
              required
              placeholder="e.g., Content Manager"
              slotProps={{
                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                inputLabel: { sx: { fontSize: '0.75rem' } }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Input
              label="Code"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled
              helperText="Code cannot be changed"
              slotProps={{
                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                inputLabel: { sx: { fontSize: '0.75rem' } }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Textarea
              ref={descriptionRef}
              label="Description"
              value={formData.description}
              onChange={handleDescriptionChange}
              error={!!errors.description}
              helperText={errors.description}
              rows={2}
              required
              fullWidth
              placeholder="Describe the role..."
              slotProps={{
                input: { sx: { fontSize: '0.75rem' } },
                inputLabel: { sx: { fontSize: '0.75rem' } }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <GroupedPermissionsSelect
              label="Permissions"
              groupedPermissions={permissionsResponse?.data || {}}
              value={formData.permissions}
              onChange={(value) => setFormData({ ...formData, permissions: value })}
            />
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box
              display="flex"
              gap={1}
              justifyContent="flex-end"
              mt={1}
              flexDirection={{ xs: 'column', sm: 'row' }}
            >
              <Button
                variant="outlined"
                onClick={() => router.push('/staff/roles')}
                disabled={isUpdating}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  height: '32px',
                  fontSize: '0.75rem',
                }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                startIcon={<Save sx={{ fontSize: '1rem !important' }} />}
                onClick={handleSubmit}
                disabled={isUpdating}
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  height: '32px',
                  fontSize: '0.75rem',
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
                  },
                }}
              >
                {isUpdating ? 'Updating...' : 'Update Role'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

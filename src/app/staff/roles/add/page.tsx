"use client";

import { useState, useRef } from 'react';
import {
  Box,
  Paper,
  Typography,
  CircularProgress,
  Grid,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Input, Textarea, GroupedPermissionsSelect, useToast, PermissionGuard, Button } from '@/components/shared';
import { useCreateRoleMutation } from '@/store/api/rbacApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';

export default function AddRolePage() {
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
    <PermissionGuard permission="staff:assign_roles">
      <Box sx={{ px: { xs: 2, sm: 3, md: 0 } }}>
        <Button
          variant="text"
          startIcon={<ArrowBack sx={{ fontSize: '1rem !important' }} />}
          onClick={() => router.push('/staff/roles')}
          sx={{ 
            mb: { xs: 2, sm: 3 }, 
            height: '28px',
            fontSize: '0.75rem',
            color: 'text.secondary',
            textTransform: 'uppercase',
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
            mb: { xs: 2, sm: 3 },
            fontSize: '0.9rem',
            fontWeight: 700,
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Add New Role
        </Typography>

        <Paper
          sx={{
            p: { xs: 2, sm: 3, md: 4 },
            bgcolor: 'background.paper',
            boxShadow: (theme) => theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: (theme) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
          }}
        >
          <Grid container spacing={{ xs: 2, sm: 3 }}>
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
              />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Input
                label="Code"
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled
                helperText="Auto-generated from name"
                slotProps={{
                  input: { sx: { height: '32px' } }
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
                rows={3}
                required
                fullWidth
                placeholder="Describe the role and its responsibilities"
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
                gap={2}
                justifyContent="flex-end"
                mt={2}
                flexDirection={{ xs: 'column', sm: 'row' }}
              >
                <Button
                  variant="outlined"
                  onClick={() => router.push('/staff/roles')}
                  disabled={isCreating}
                  sx={{ width: { xs: '100%', sm: 'auto' } }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  startIcon={<Save />}
                  onClick={handleSubmit}
                  disabled={isCreating}
                  loading={isCreating}
                  sx={{
                    width: { xs: '100%', sm: 'auto' },
                    background: 'linear-gradient(45deg, #213350, #6AB344)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                    },
                  }}
                >
                  Create Role
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </PermissionGuard>
  );
}

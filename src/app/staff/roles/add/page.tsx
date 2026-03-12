"use client";

import { useState, useRef, useEffect } from 'react';
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
import { useCreateRoleMutation } from '@/store/api/rbacApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';
import { usePermissions } from '@/hooks/usePermissions';

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
  const { hasPermission } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('rbac:manage_roles')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

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
    <Box sx={{ px: { xs: 2, sm: 3, md: 0 } }}>
      <Button
        startIcon={<ArrowBack />}
        onClick={() => router.push('/staff/roles')}
        sx={{
          mb: { xs: 2, sm: 3 },
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
          mb: { xs: 2, sm: 3 },
          fontSize: { xs: '1.5rem', sm: '2rem', md: '2.125rem' },
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
                sx={{
                  width: { xs: '100%', sm: 'auto' },
                  background: 'linear-gradient(45deg, #667eea, #764ba2)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
                  },
                }}
              >
                {isCreating ? 'Creating...' : 'Create Role'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

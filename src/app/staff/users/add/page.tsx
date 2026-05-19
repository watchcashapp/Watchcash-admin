"use client";

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  Grid,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Input, GroupedPermissionsSelect, useToast, PermissionGuard } from '@/components/shared';
import { useCreateUserMutation } from '@/store/api/usersApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';
import { useGetRolesQuery } from '@/store/api/rbacApi';
import { getFieldErrors } from '@/utils/form-errors';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function AddUserPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();

  // Refs for form fields
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const rolesRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    permissions: [] as string[],
    roles: [] as string[],
  });

  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
  }>({});

  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const { data: rolesResponse, isLoading: loadingRoles } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  // Pre-select default permissions once they are loaded
  useEffect(() => {
    if (permissionsResponse?.data) {
      const defaultCodes = ['dashboard:view', 'dashboard:view_total_users'];
      const defaultIds: string[] = [];

      Object.values(permissionsResponse.data).forEach((category: any) => {
        category.forEach((perm: any) => {
          if (defaultCodes.includes(perm.code)) {
            defaultIds.push(perm.id);
          }
        });
      });

      if (defaultIds.length > 0) {
        setFormData(prev => ({
          ...prev,
          permissions: Array.from(new Set([...prev.permissions, ...defaultIds]))
        }));
      }
    }
  }, [permissionsResponse]);

  const handleRoleToggle = useCallback((roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }));
  }, []);

  const handlePermissionsChange = useCallback((value: string[]) => {
    setFormData(prev => ({ ...prev, permissions: value }));
  }, []);

  const handleInputChange = (field: 'name' | 'email', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    setErrors(newErrors);
    return { isValid: Object.keys(newErrors).length === 0, errors: newErrors };
  };

  const handleSubmit = async () => {
    const validation = validateForm();

    if (!validation.isValid) {
      // Scroll to first error field using the validation result
      if (validation.errors.name && nameRef.current) {
        setTimeout(() => {
          nameRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          nameRef.current?.focus();
        }, 100);
      } else if (validation.errors.email && emailRef.current) {
        setTimeout(() => {
          emailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
          emailRef.current?.focus();
        }, 100);
      }
      return;
    }

    if (formData.roles.length === 0) {
      showError('Please select at least one role');
      if (rolesRef.current) {
        setTimeout(() => {
          rolesRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 100);
      }
      return;
    }

    try {
      await createUser({
        name: formData.name.trim(),
        email: formData.email.trim(),
        userType: 'STAFF',
        permissions: formData.permissions,
        roles: formData.roles,
      }).unwrap();
      showSuccess('User created successfully!');
      router.push('/staff/users');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to create user';

      // Handle validation errors from API
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors as any);

        // Scroll to first API error field
        setTimeout(() => {
          if (fieldErrors.name && nameRef.current) {
            nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameRef.current.focus();
          } else if (fieldErrors.email && emailRef.current) {
            emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            emailRef.current.focus();
          }
        }, 100);
      }

      showError(error);
    }
  };

  const rolesContent = useMemo(() => (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
        gap: 1,
      }}
    >
      {rolesResponse?.data?.map((role) => (
        <FormControlLabel
          key={role.id}
          control={
            <Checkbox
              checked={formData.roles.includes(role.id)}
              onChange={() => handleRoleToggle(role.id)}
              sx={{
                color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
                '&.Mui-checked': {
                  color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
                },
                py: 0.5,
              }}
              disabled={isCreating}
              />
          }
          label={role.name}
          sx={{
            m: 0,
            '& .MuiFormControlLabel-label': {
              fontSize: '0.9rem',
              overflowWrap: 'break-word',
              wordBreak: 'break-word',
              width: '100%',
            },
          }}
        />
      ))}
    </Box>
  ), [rolesResponse?.data, formData.roles, isCreating]);

  if (loadingPermissions || loadingRoles) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <PermissionGuard permission="staff:create">
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/staff/users')}
          sx={{
            mb: 1.5,
            '&:hover': {
              backgroundColor: 'rgba(33, 51, 80, 0.08)',
            },
          }}
        >
          Back to Staff Users
        </Button>

        <Typography
          variant="h5"
          sx={{
            mb: 2,
            fontWeight: 700,
            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
          }}
        >
          Add New User
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
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12, md: 6 }}>
              <Input
                ref={nameRef}
                label="Name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                error={!!errors.name}
                helperText={errors.name}
                required
                placeholder="Enter user name"
                disabled={isCreating}
                maxLength={50}
                showCount
                />
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
              <Input
                ref={emailRef}
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
                placeholder="user@example.com"
                disabled={isCreating}
                />
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                ref={rolesRef}
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Roles <span style={{ color: '#d32f2f' }}>*</span>
                </Typography>
                {rolesContent}
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  p: 2,
                  bgcolor: 'background.paper',
                  border: (theme) => theme.palette.mode === 'dark'
                    ? '1px solid rgba(255, 255, 255, 0.1)'
                    : '1px solid rgba(0, 0, 0, 0.08)',
                  borderRadius: 2,
                }}
              >
                <Typography variant="subtitle1" sx={{ mb: 1.5, fontWeight: 600 }}>
                  Permissions
                </Typography>
                <GroupedPermissionsSelect
                  groupedPermissions={permissionsResponse?.data || {}}
                  value={formData.permissions}
                  onChange={handlePermissionsChange}
                  disabled={isCreating}
                />
              </Box>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box display="flex" gap={2} justifyContent="flex-end" mt={1}>
                <Button
                  variant="outlined"
                  onClick={() => router.push('/staff/users')}
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
                    background: 'linear-gradient(45deg, #213350, #6AB344)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                    },
                  }}
                >
                  {isCreating ? 'Creating...' : 'Create User'}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </PermissionGuard>
  );
}

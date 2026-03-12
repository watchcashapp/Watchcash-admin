"use client";

import { useState, useEffect, useRef } from 'react';
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
import { useRouter, useParams } from 'next/navigation';
import { Input, GroupedPermissionsSelect, useToast } from '@/components/shared';
import { useGetUserByIdQuery, useUpdateUserMutation } from '@/store/api/usersApi';
import { useGetPermissionsQuery, useGetRolesQuery } from '@/store/api/rbacApi';
import { usePermissions } from '@/hooks/usePermissions';

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
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

  const { data: user, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(userId, {
    skip: !userId,
  });
  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const { data: rolesResponse, isLoading: loadingRoles } = useGetRolesQuery();
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();
  const { hasPermission } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('users:update')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        permissions: user.permissions?.map((p) => p.id) || [],
        roles: user.roles?.map((r) => r.id) || [],
      });
    }
  }, [user]);

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }));
  };

  const handleInputChange = (field: 'name' | 'email', value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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
      await updateUser({
        id: userId,
        data: {
          name: formData.name.trim(),
          email: formData.email.trim(),
          userType: 'STAFF',
          permissions: formData.permissions,
          roles: formData.roles,
        }
      }).unwrap();
      showSuccess('User updated successfully!');
      router.push('/staff/users');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to update user';

      // Handle validation errors from API
      if (error?.data?.details?.errors) {
        const apiErrors: typeof errors = {};
        error.data.details.errors.forEach((err: any) => {
          if (err.path && err.path[0]) {
            apiErrors[err.path[0] as keyof typeof errors] = err.message;
          }
        });
        setErrors(apiErrors);

        // Scroll to first API error field
        setTimeout(() => {
          if (apiErrors.name && nameRef.current) {
            nameRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            nameRef.current.focus();
          } else if (apiErrors.email && emailRef.current) {
            emailRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
            emailRef.current.focus();
          }
        }, 100);
      }

      showError(errorMessage);
    }
  };

  if (loadingUser || loadingPermissions || loadingRoles) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  if (userError) {
    return (
      <Box>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => router.push('/staff/users')}
          sx={{
            mb: 3,
            '&:hover': {
              backgroundColor: 'rgba(102, 126, 234, 0.08)',
            },
          }}
        >
          Back to Staff Users
        </Button>
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="error">
            Failed to load user details. Please try again.
          </Typography>
        </Paper>
      </Box>
    );
  }

  if (!user) {
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
        onClick={() => router.push('/staff/users')}
        sx={{
          mb: 1.5,
          '&:hover': {
            backgroundColor: 'rgba(102, 126, 234, 0.08)',
          },
        }}
      >
        Back to Staff Users
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
        Edit User
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
                          color: '#667eea',
                          '&.Mui-checked': {
                            color: '#667eea',
                          },
                          py: 0.5,
                        }}
                      />
                    }
                    label={role.name}
                    sx={{
                      m: 0,
                      '& .MuiFormControlLabel-label': {
                        fontSize: '0.9rem',
                      },
                    }}
                  />
                ))}
              </Box>
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
                onChange={(value) => setFormData({ ...formData, permissions: value })}
              />
            </Box>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Box display="flex" gap={2} justifyContent="flex-end" mt={1}>
              <Button
                variant="outlined"
                onClick={() => router.push('/staff/users')}
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
                {isUpdating ? 'Updating...' : 'Update User'}
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>
    </Box>
  );
}

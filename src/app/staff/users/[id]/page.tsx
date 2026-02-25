"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter, useParams } from 'next/navigation';
import { Input, GroupedPermissionsSelect, useToast } from '@/components/shared';
import { useGetUserByIdQuery, useUpdateUserMutation } from '@/store/api/usersApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';

export default function EditUserPage() {
  const router = useRouter();
  const params = useParams();
  const userId = params.id as string;
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    userType: 'ADMIN' as 'APP' | 'ADMIN',
    permissions: [] as string[],
  });

  const { data: user, isLoading: loadingUser, error: userError } = useGetUserByIdQuery(userId, {
    skip: !userId, // Skip query if userId is not available
  });
  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const [updateUser, { isLoading: isUpdating }] = useUpdateUserMutation();

  console.log('[EditUserPage] State:', {
    userId,
    loadingUser,
    hasUser: !!user,
    user,
    userError,
    formData,
  });

  useEffect(() => {
    if (user) {
      console.log('[EditUserPage] Setting form data from user:', user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '',
        userType: user.userType || 'ADMIN',
        permissions: user.permissions?.map((p) => p.id) || [],
      });
    }
  }, [user]);

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      showError('Name is required');
      return;
    }
    if (!formData.email.trim()) {
      showError('Email is required');
      return;
    }

    try {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        userType: formData.userType,
        permissions: formData.permissions,
      };
      
      // Only include password if it's been changed
      if (formData.password.trim()) {
        updateData.password = formData.password;
      }

      await updateUser({ id: userId, data: updateData }).unwrap();
      showSuccess('User updated successfully!');
      router.push('/staff/users');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to update user');
    }
  };

  if (loadingUser || loadingPermissions) {
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
        <Box display="flex" flexDirection="column" gap={3}>
          <Input
            label="Name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
            placeholder="Enter user name"
          />

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
            placeholder="user@example.com"
          />

          <Input
            label="Password"
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Leave blank to keep current password"
            helperText="Leave blank to keep current password"
          />

          <TextField
            select
            label="User Type"
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'APP' | 'ADMIN' })}
            required
            fullWidth
            sx={{
              '& .MuiOutlinedInput-root': {
                '&:hover fieldset': {
                  borderColor: '#667eea',
                },
                '&.Mui-focused fieldset': {
                  borderColor: '#667eea',
                },
              },
            }}
          >
            <MenuItem value="ADMIN">ADMIN</MenuItem>
            <MenuItem value="APP">APP</MenuItem>
          </TextField>

          <GroupedPermissionsSelect
            label="Permissions"
            groupedPermissions={permissionsResponse?.data || {}}
            value={formData.permissions}
            onChange={(value) => setFormData({ ...formData, permissions: value })}
          />

          <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
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
        </Box>
      </Paper>
    </Box>
  );
}

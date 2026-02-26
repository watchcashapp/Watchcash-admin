"use client";

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  CircularProgress,
  MenuItem,
  TextField,
  FormControl,
  FormLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import { ArrowBack, Save } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { Input, GroupedPermissionsSelect, useToast } from '@/components/shared';
import { useCreateUserMutation } from '@/store/api/usersApi';
import { useGetPermissionsQuery } from '@/store/api/rbacApi';
import { useGetRolesQuery } from '@/store/api/rbacApi';

export default function AddUserPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    userType: 'ADMIN' as 'APP' | 'ADMIN',
    permissions: [] as string[],
    roles: [] as string[],
  });

  const { data: permissionsResponse, isLoading: loadingPermissions } = useGetPermissionsQuery(undefined);
  const { data: rolesResponse, isLoading: loadingRoles } = useGetRolesQuery();
  const [createUser, { isLoading: isCreating }] = useCreateUserMutation();

  const handleRoleToggle = (roleId: string) => {
    setFormData(prev => ({
      ...prev,
      roles: prev.roles.includes(roleId)
        ? prev.roles.filter(id => id !== roleId)
        : [...prev.roles, roleId]
    }));
  };

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
      await createUser({
        name: formData.name,
        email: formData.email,
        userType: formData.userType,
        permissions: formData.permissions,
        roles: formData.roles,
      }).unwrap();
      showSuccess('User created successfully!');
      router.push('/staff/users');
    } catch (error: any) {
      showError(error?.data?.message || 'Failed to create user');
    }
  };

  if (loadingPermissions || loadingRoles) {
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
        <Box display="flex" flexDirection="column" gap={2.5}>
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

          <TextField
            select
            label="User Type"
            value={formData.userType}
            onChange={(e) => setFormData({ ...formData, userType: e.target.value as 'APP' | 'ADMIN' })}
            required
            fullWidth
            size="small"
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
              Roles
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
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
                },
              }}
            >
              {isCreating ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Edit, Save, Lock } from "@mui/icons-material";
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/store/api/authApi";
import { useToast, Input } from "@/components/shared";
import { getFieldErrors } from "@/utils/form-errors";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const { data: profileData, isLoading, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();
  const [changePassword, { isLoading: isChangingPassword }] = useChangePasswordMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

  // Password change state
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});

  useEffect(() => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
      });
    }
  }, [profileData]);

  const isProfileDirty = React.useMemo(() => {
    if (!profileData) return false;
    return formData.name.trim() !== (profileData.name || '').trim() || 
           formData.email.trim() !== (profileData.email || '').trim();
  }, [formData, profileData]);

  const isPasswordDirty = React.useMemo(() => {
    return !!(passwordData.currentPassword || passwordData.newPassword || passwordData.confirmPassword);
  }, [passwordData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = () => {
    const newErrors: typeof errors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Enter a valid email address";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      await updateProfile({
        name: formData.name.trim(),
        email: formData.email.trim(),
      }).unwrap();

      showSuccess('Profile updated successfully!');
      setIsEditing(false);
      setErrors({});
      refetch();
    } catch (error: any) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors);
      }
      showError(error);
    }
  };

  const handleCancel = () => {
    if (profileData) {
      setFormData({
        name: profileData.name || "",
        email: profileData.email || "",
      });
    }
    setErrors({});
    setIsEditing(false);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value,
    }));

    if (passwordErrors[name as keyof typeof passwordErrors]) {
      setPasswordErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validatePasswordForm = () => {
    const newErrors: typeof passwordErrors = {};

    if (!passwordData.currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }

    if (!passwordData.newPassword) {
      newErrors.newPassword = "New password is required";
    } else if (/\s/.test(passwordData.newPassword)) {
      newErrors.newPassword = "Password cannot contain spaces";
    } else if (passwordData.newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }

    if (!passwordData.confirmPassword) {
      newErrors.confirmPassword = "Please confirm your password";
    } else if (passwordData.newPassword !== passwordData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) {
      return;
    }

    try {
      await changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      }).unwrap();

      showSuccess('Password changed successfully! Please login with your new password.');

      // Clear password fields
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordErrors({});

      // Clear auth tokens including agency owner token
      if (typeof window !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'agency_owner_gs_authtoken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
      }

      // Redirect to login after a short delay
      setTimeout(() => {
        window.location.href = '/auth/login';
      }, 1500);
    } catch (error: any) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        // Map snake_case from API to camelCase in state if needed
        const mappedErrors: any = {};
        if (fieldErrors.current_password) mappedErrors.currentPassword = fieldErrors.current_password;
        if (fieldErrors.new_password) mappedErrors.newPassword = fieldErrors.new_password;
        Object.assign(mappedErrors, fieldErrors);
        setPasswordErrors(mappedErrors);
      }
      showError(error);
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress
          sx={{
            color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
          }}
        />
      </Box>
    );
  }

  if (error) {
    return (
      <Box>
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          Failed to load profile data. Please try again.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            mb: 2,
            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
          }}
        >
          Profile Settings
        </Typography>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, md: 4 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                backdropFilter: 'blur(20px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: 1.5,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 2 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    mx: 'auto',
                    mb: 1.5,
                    background: 'linear-gradient(45deg, #213350, #6AB344)',
                    boxShadow: '0 8px 24px rgba(33, 51, 80, 0.4)',
                    fontSize: '2rem',
                  }}
                >
                  {formData.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Typography 
                  variant="subtitle2" 
                  noWrap
                  sx={{ 
                    fontWeight: 600, 
                    mb: 0.5,
                    maxWidth: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {formData.name}
                </Typography>
                <Typography 
                  variant="caption" 
                  color="text.secondary" 
                  noWrap
                  sx={{ 
                    mb: 0.5, 
                    display: 'block',
                    maxWidth: '100%',
                    textOverflow: 'ellipsis',
                    overflow: 'hidden'
                  }}
                >
                  {formData.email}
                </Typography>
                {profileData?.userType && (
                  <Typography
                    variant="caption"
                    sx={{
                      display: 'inline-block',
                      px: 2,
                      py: 0.5,
                      borderRadius: 2,
                      background: 'linear-gradient(45deg, #213350, #6AB344)',
                      color: 'white',
                      fontWeight: 600,
                      mt: 1,
                    }}
                  >
                    {profileData.userType}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, md: 8 }}>
            <Card
              sx={{
                bgcolor: 'background.paper',
                backdropFilter: 'blur(20px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: 1.5,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  {!isEditing && (
                    <Button
                      variant="outlined"
                      onClick={() => setIsEditing(true)}
                      sx={{
                        height: '32px',
                        fontSize: '0.75rem',
                        minWidth: { xs: 'auto', sm: 100 },
                        px: { xs: 1.5, sm: 2 },
                        borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                        color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        '&:hover': {
                          borderColor: '#6AB344',
                          backgroundColor: 'rgba(33, 51, 80, 0.04)',
                        },
                      }}
                    >
                      <Edit sx={{ fontSize: '1rem' }} />
                      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                        EDIT PROFILE
                      </Box>
                    </Button>
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing || isUpdating || isChangingPassword}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      fullWidth
                      size="small"
                      maxLength={50}
                      showCount
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing || isUpdating || isChangingPassword}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                      fullWidth
                      type="email"
                      size="small"
                      slotProps={{
                        input: { sx: { fontSize: '0.75rem', height: '32px' } },
                        inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                      }}
                      sx={{
                        '& .MuiInputLabel-root': {
                          transform: 'translate(14px, -6px) scale(0.75)',
                          bgcolor: 'background.paper',
                          px: 0.5,
                        },
                        '& .MuiInputLabel-shrink': {
                          transform: 'translate(14px, -6px) scale(0.75)',
                        }
                      }}
                    />
                  </Grid>

                  {isEditing && (
                    <Grid size={{ xs: 12 }}>
                      <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                        <Button
                          variant="outlined"
                          onClick={handleCancel}
                          disabled={isUpdating}
                          sx={{
                            height: '32px',
                            fontSize: '0.75rem',
                            minWidth: { xs: 'auto', sm: 100 },
                            px: { xs: 1.5, sm: 2 },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isUpdating ? null : <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Save sx={{ fontSize: '1rem' }} /></Box>}
                          onClick={handleSave}
                          disabled={isUpdating || !isProfileDirty}
                          sx={{
                            height: '32px',
                            fontSize: '0.75rem',
                            minWidth: { xs: 'auto', sm: 100 },
                            px: { xs: 1.5, sm: 2 },
                            background: 'linear-gradient(45deg, #213350, #6AB344)',
                            boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                              boxShadow: '0 6px 16px rgba(33, 51, 80, 0.5)',
                            },
                            '&:disabled': {
                              background: 'rgba(33, 51, 80, 0.5)',
                            },
                          }}
                        >
                          {isUpdating ? (
                            <CircularProgress size={16} color="inherit" />
                          ) : (
                            <>
                              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Save Changes</Box>
                              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                                <Save sx={{ fontSize: '1rem' }} />
                                Save
                              </Box>
                            </>
                          )}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>

            {/* Change Password Card */}
            <Card
              sx={{
                mt: 3,
                bgcolor: 'background.paper',
                backdropFilter: 'blur(20px)',
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: (theme) => theme.palette.mode === 'dark'
                  ? '1px solid rgba(255, 255, 255, 0.1)'
                  : '1px solid rgba(0, 0, 0, 0.05)',
                borderRadius: 1.5,
              }}
            >
              <CardContent sx={{ p: 2 }}>
                <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                  <Lock sx={{ color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350', fontSize: '1.2rem' }} />
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    Change Password
                  </Typography>
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      disabled={isChangingPassword || isUpdating}
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      disabled={isChangingPassword || isUpdating}
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      disabled={isChangingPassword || isUpdating}
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword}
                      required
                      fullWidth
                      size="small"
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                      <Button
                        variant="contained"
                        startIcon={isChangingPassword ? null : <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Lock sx={{ fontSize: '1rem' }} /></Box>}
                        onClick={handleChangePassword}
                        disabled={isChangingPassword || isUpdating || !isPasswordDirty}
                        sx={{
                          height: '32px',
                          fontSize: '0.75rem',
                          minWidth: { xs: 'auto', sm: 120 },
                          px: { xs: 1.5, sm: 2 },
                          background: 'linear-gradient(45deg, #213350, #6AB344)',
                          boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                            boxShadow: '0 6px 16px rgba(33, 51, 80, 0.5)',
                          },
                          '&:disabled': {
                            background: 'rgba(33, 51, 80, 0.5)',
                          },
                        }}
                      >
                        {isChangingPassword ? (
                          <CircularProgress size={16} color="inherit" />
                        ) : (
                          <>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Change Password</Box>
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                              <Lock sx={{ fontSize: '1rem' }} />
                              Change
                            </Box>
                          </>
                        )}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    );
}

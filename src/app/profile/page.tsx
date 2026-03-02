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
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useGetProfileQuery, useUpdateProfileMutation, useChangePasswordMutation } from "@/store/api/authApi";
import { useToast, Input } from "@/components/shared";

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
      refetch();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Failed to update profile';
      showError(errorMessage);
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
      const errorMessage = error?.data?.message || error?.message || 'Failed to change password';
      showError(errorMessage);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress
            sx={{
              color: '#667eea',
            }}
          />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert
          severity="error"
          sx={{
            mb: 3,
            borderRadius: 2,
          }}
        >
          Failed to load profile data. Please try again.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 4,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
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
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ textAlign: 'center', py: 4 }}>
                <Avatar
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    boxShadow: '0 8px 24px rgba(102, 126, 234, 0.4)',
                    fontSize: '3rem',
                  }}
                >
                  {formData.name?.[0]?.toUpperCase() || 'U'}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  {formData.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
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
                      background: 'linear-gradient(45deg, #667eea, #764ba2)',
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
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    Personal Information
                  </Typography>
                  {!isEditing && (
                    <Button
                      variant="outlined"
                      startIcon={<Box sx={{ display: { xs: 'none', sm: 'block' } }}><Edit /></Box>}
                      onClick={() => setIsEditing(true)}
                      sx={{
                        minWidth: { xs: 'auto', sm: 120 },
                        px: { xs: 2, sm: 3 },
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a67d8',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        },
                      }}
                    >
                      <Box sx={{ display: { xs: 'none', sm: 'flex' }, alignItems: 'center', gap: 1 }}>
                        Edit Profile
                      </Box>
                      <Edit sx={{ display: { xs: 'block', sm: 'none' } }} />
                    </Button>
                  )}
                </Box>

                <Divider sx={{ mb: 3 }} />

                <Grid container spacing={3}>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Full Name"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.name}
                      helperText={errors.name}
                      required
                      fullWidth
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          transform: 'translate(20px, -8px) scale(0.8)',
                          fontWeight: 500,
                          bgcolor: 'background.paper',
                          padding: '0 4px',
                          borderRadius: '4px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                        },
                        '& .MuiFormLabel-asterisk': {
                          color: 'error.main',
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <TextField
                      label="Email Address"
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={!isEditing}
                      error={!!errors.email}
                      helperText={errors.email}
                      required
                      fullWidth
                      type="email"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          transform: 'translate(20px, -8px) scale(0.8)',
                          fontWeight: 500,
                          bgcolor: 'background.paper',
                          padding: '0 4px',
                          borderRadius: '4px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                        },
                        '& .MuiFormLabel-asterisk': {
                          color: 'error.main',
                        },
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
                            minWidth: { xs: 'auto', sm: 120 },
                            px: { xs: 2, sm: 3 },
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isUpdating ? null : <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Save /></Box>}
                          onClick={handleSave}
                          disabled={isUpdating}
                          sx={{
                            minWidth: { xs: 'auto', sm: 120 },
                            px: { xs: 2, sm: 3 },
                            background: 'linear-gradient(45deg, #667eea, #764ba2)',
                            boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                            '&:hover': {
                              background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                              boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                            },
                            '&:disabled': {
                              background: 'rgba(102, 126, 234, 0.5)',
                            },
                          }}
                        >
                          {isUpdating ? (
                            <CircularProgress size={20} color="inherit" />
                          ) : (
                            <>
                              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Save Changes</Box>
                              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                                <Save fontSize="small" />
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
                borderRadius: 3,
              }}
            >
              <CardContent sx={{ p: 4 }}>
                <Box display="flex" alignItems="center" gap={1.5} mb={3}>
                  <Lock sx={{ color: '#667eea' }} />
                  <Typography variant="h6" sx={{ fontWeight: 600 }}>
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
                      error={!!passwordErrors.currentPassword}
                      helperText={passwordErrors.currentPassword}
                      required
                      fullWidth
                      size="medium"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          transform: 'translate(20px, -8px) scale(0.8)',
                          fontWeight: 500,
                          bgcolor: 'background.paper',
                          padding: '0 4px',
                          borderRadius: '4px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                        },
                        '& .MuiFormLabel-asterisk': {
                          color: 'error.main',
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      error={!!passwordErrors.newPassword}
                      helperText={passwordErrors.newPassword}
                      required
                      fullWidth
                      size="medium"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          transform: 'translate(20px, -8px) scale(0.8)',
                          fontWeight: 500,
                          bgcolor: 'background.paper',
                          padding: '0 4px',
                          borderRadius: '4px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                        },
                        '& .MuiFormLabel-asterisk': {
                          color: 'error.main',
                        },
                      }}
                    />
                  </Grid>
                  <Grid size={{ xs: 12 }}>
                    <Input
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      error={!!passwordErrors.confirmPassword}
                      helperText={passwordErrors.confirmPassword}
                      required
                      fullWidth
                      size="medium"
                      sx={{
                        '& .MuiInputLabel-root': {
                          color: 'text.secondary',
                          fontSize: '0.875rem',
                          transform: 'translate(20px, -8px) scale(0.8)',
                          fontWeight: 500,
                          bgcolor: 'background.paper',
                          padding: '0 4px',
                          borderRadius: '4px',
                        },
                        '& .MuiInputBase-input': {
                          fontSize: '0.875rem',
                        },
                        '& .MuiFormLabel-asterisk': {
                          color: 'error.main',
                        },
                      }}
                    />
                  </Grid>

                  <Grid size={{ xs: 12 }}>
                    <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                      <Button
                        variant="contained"
                        startIcon={isChangingPassword ? null : <Box sx={{ display: { xs: 'none', sm: 'block' } }}><Lock /></Box>}
                        onClick={handleChangePassword}
                        disabled={isChangingPassword}
                        sx={{
                          minWidth: { xs: 'auto', sm: 150 },
                          px: { xs: 2, sm: 3 },
                          background: 'linear-gradient(45deg, #667eea, #764ba2)',
                          boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                            boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                          },
                          '&:disabled': {
                            background: 'rgba(102, 126, 234, 0.5)',
                          },
                        }}
                      >
                        {isChangingPassword ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <>
                            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Change Password</Box>
                            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                              <Lock fontSize="small" />
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
    </DashboardLayout>
  );
}

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
import { Edit, Save } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useGetProfileQuery, useUpdateProfileMutation } from "@/store/api/authApi";
import { useToast } from "@/components/shared";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ProfilePage() {
  const { showSuccess, showError } = useToast();
  const { data: profileData, isLoading, error, refetch } = useGetProfileQuery();
  const [updateProfile, { isLoading: isUpdating }] = useUpdateProfileMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
  });
  const [errors, setErrors] = useState<{ name?: string; email?: string }>({});

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
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                background: 'rgba(255, 255, 255, 0.98)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                border: '1px solid rgba(255, 255, 255, 0.2)',
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
                      startIcon={<Edit />}
                      onClick={() => setIsEditing(true)}
                      sx={{
                        borderColor: '#667eea',
                        color: '#667eea',
                        '&:hover': {
                          borderColor: '#5a67d8',
                          backgroundColor: 'rgba(102, 126, 234, 0.04)',
                        },
                      }}
                    >
                      Edit Profile
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
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                          backgroundColor: 'rgba(255, 255, 255, 0.9)',
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
                            minWidth: 120,
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isUpdating ? null : <Save />}
                          onClick={handleSave}
                          disabled={isUpdating}
                          sx={{
                            minWidth: 120,
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
                            'Save Changes'
                          )}
                        </Button>
                      </Box>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Box>
    </DashboardLayout>
  );
}

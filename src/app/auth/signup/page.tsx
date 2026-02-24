"use client";

import React, { useState, Suspense } from "react";
import { Box, Paper, Typography, Grid, Link, TextField, Button, CircularProgress } from "@mui/material";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared";
import { useRegisterMutation } from "@/store/api/authApi";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";
import { jwtDecode } from "jwt-decode";

interface DecodedToken {
  sub: string;
  email: string;
  profile: {
    id: string;
    name: string;
    email: string;
    userType: string;
  };
  iat: number;
  exp: number;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function SignupForm() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [register, { isLoading }] = useRegisterMutation();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};
    
    if (!name.trim()) nextErrors.name = "Name is required";
    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";
    if (password !== confirmPassword) nextErrors.confirmPassword = "Passwords do not match";
    
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const result = await register({ name, email, password }).unwrap();
      
      console.log('Signup response:', result);
      
      // Decode the access token to get user data
      const decodedToken = jwtDecode<DecodedToken>(result.data.accessToken);
      console.log('Decoded token in signup:', decodedToken);
      
      const userData = {
        id: decodedToken.profile.id,
        name: decodedToken.profile.name,
        email: decodedToken.profile.email,
        userType: decodedToken.profile.userType,
      };
      
      // Set both tokens in cookies (without secure flag for localhost)
      const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
      const cookieOptions = isLocalhost 
        ? 'path=/; samesite=strict'
        : 'path=/; secure; samesite=strict';
      
      document.cookie = `accessToken=${result.data.accessToken}; ${cookieOptions}; max-age=3600`;
      document.cookie = `refreshToken=${result.data.refreshToken}; ${cookieOptions}; max-age=604800`;
      
      // Store tokens and user data in Redux
      dispatch(setUser({ 
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: userData
      }));
      
      showSuccess('Account created successfully!');
      
      // Force a hard navigation to ensure middleware picks up the cookie
      window.location.href = '/dashboard';
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Registration failed. Please try again.';
      showError(errorMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: { xs: 2, sm: 3 },
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
      }}
    >
      {/* Background decoration */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'radial-gradient(circle at 20% 50%, rgba(120, 119, 198, 0.3) 0%, transparent 50%)',
          pointerEvents: 'none',
        }}
      />
      
      <Paper 
        elevation={12}
        sx={{ 
          width: "100%", 
          maxWidth: 420,
          p: { xs: 3, sm: 4 }, 
          borderRadius: 4,
          background: 'rgba(255, 255, 255, 0.98)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Typography 
          variant="h4" 
          component="h1" 
          gutterBottom 
          textAlign="center"
          sx={{ 
            fontSize: { xs: '1.75rem', sm: '2rem' },
            fontWeight: 700,
            color: 'primary.main',
            mb: 3,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Create Account
        </Typography>

        <Typography 
          variant="body1" 
          textAlign="center" 
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Join WatchCash to manage your finances
        </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  fullWidth
                  size="small"
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
                      fontSize: '0.75rem',
                    },
                    '& .MuiFormLabel-asterisk': {
                      color: 'error.main',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!errors.email}
                  helperText={errors.email}
                  required
                  fullWidth
                  size="small"
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
                      fontSize: '0.75rem',
                    },
                    '& .MuiFormLabel-asterisk': {
                      color: 'error.main',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                  fullWidth
                  size="small"
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
                      fontSize: '0.75rem',
                    },
                    '& .MuiFormLabel-asterisk': {
                      color: 'error.main',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                  fullWidth
                  size="small"
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
                      fontSize: '0.75rem',
                    },
                    '& .MuiFormLabel-asterisk': {
                      color: 'error.main',
                    },
                  }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  disabled={isLoading}
                  size="large"
                  sx={{
                    height: '48px',
                    fontSize: '1rem',
                    fontWeight: 600,
                    textTransform: 'none',
                    background: 'linear-gradient(45deg, #667eea, #764ba2)',
                    boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                    '&:hover': {
                      background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                      boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                      transform: 'translateY(-2px)',
                    },
                    '&:active': {
                      transform: 'translateY(0)',
                    },
                  }}
                >
                  {isLoading ? "Creating account..." : "Create Account"}
                </Button>
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Box 
                  sx={{ 
                    display: 'flex', 
                    justifyContent: 'center',
                    gap: 1
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    Already have an account?
                  </Typography>
                  <Link 
                    href="/auth/login" 
                    sx={{ 
                      fontSize: '0.875rem',
                      textDecoration: 'none',
                      '&:hover': { textDecoration: 'underline' }
                    }}
                  >
                    Sign in
                  </Link>
                </Box>
              </Grid>
            </Grid>
          </Box>
        </Paper>
      </Box>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    }>
      <SignupForm />
    </Suspense>
  );
}

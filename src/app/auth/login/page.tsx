"use client";

import React, { useState, Suspense } from "react";
import Image from "next/image";
import { Box, Paper, Typography, Grid, Link, CircularProgress } from "@mui/material";
import { Visibility, VisibilityOff } from "@mui/icons-material";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/shared/Toaster";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import { useLoginMutation } from "@/store/api/authApi";
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
    ownerId?: string; // For agency owners
  };
  iat: number;
  exp: number;
}

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function LoginForm() {
  const router = useRouter();
  const search = useSearchParams();
  const dispatch = useDispatch();
  const { showSuccess, showError } = useToast();
  const [login, { isLoading }] = useLoginMutation();

  const returnTo = search?.get("returnTo") || "/dashboard";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const nextErrors: typeof errors = {};

    if (!validateEmail(email)) nextErrors.email = "Enter a valid email";
    if (password.length < 6) nextErrors.password = "Password must be at least 6 characters";

    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const result = await login({ email, password }).unwrap();



      // Decode the access token to get user data
      const decodedToken = jwtDecode<DecodedToken>(result.data.accessToken);


      // For agency owners, use ownerId as the user ID
      const userId = decodedToken.profile.ownerId || decodedToken.profile.id;

      const userData = {
        id: userId,
        name: decodedToken.profile.name,
        email: decodedToken.profile.email,
        userType: decodedToken.profile.userType,
        permissions: result.data.permissions || [],
      };



      // Set both tokens in cookies
      const isSecure = window.location.protocol === 'https:';
      const cookieOptions = isSecure
        ? 'path=/; secure; samesite=lax'
        : 'path=/; samesite=lax';

      document.cookie = `accessToken=${result.data.accessToken}; ${cookieOptions}; max-age=3600`;
      document.cookie = `refreshToken=${result.data.refreshToken}; ${cookieOptions}; max-age=604800`;

      // If agency owner token exists, store it separately
      if (result.data.agency_owner_gs_authtoken) {

        document.cookie = `agency_owner_gs_authtoken=${result.data.agency_owner_gs_authtoken}; ${cookieOptions}; max-age=604800`;
      }

      // Store tokens and user data in Redux
      dispatch(setUser({
        accessToken: result.data.accessToken,
        refreshToken: result.data.refreshToken,
        user: userData,
        isFullProfile: true,
      }));



      showSuccess('Login successful!');

      // Force a hard navigation to ensure middleware picks up the cookie
      window.location.href = returnTo;
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Login failed. Please try again.';
      showError(errorMessage);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        height: '100vh',
        background: 'linear-gradient(135deg, #213350 0%, #6AB344 100%)',
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
          background: 'radial-gradient(circle at 20% 50%, rgba(33, 51, 80, 0.3) 0%, transparent 50%)',
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
          bgcolor: 'background.paper',
          backdropFilter: 'blur(20px)',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 20px 40px rgba(0, 0, 0, 0.6)'
            : '0 20px 40px rgba(0, 0, 0, 0.15)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(255, 255, 255, 0.2)',
          position: 'relative',
          zIndex: 1,
        }}
      >
        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
          <Image
            src="/assets/images/logo.svg"
            alt="WatchCash Logo"
            width={180}
            height={48}
            priority
            style={{
              height: '48px',
              width: 'auto',
            }}
          />
        </Box>

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
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Welcome Back
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Sign in to access your WatchCash dashboard
        </Typography>

        <Box component="form" onSubmit={handleSubmit} noValidate>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12 }}>
              <Input
                label="Email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                error={!!errors.email}
                helperText={errors.email}
                required
                fullWidth
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

            <Grid size={{ xs: 12 }}>
              <Input
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!errors.password}
                helperText={errors.password}
                required
                fullWidth
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
                  background: 'linear-gradient(45deg, #213350, #6AB344)',
                  boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                  '&:hover': {
                    background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                    boxShadow: '0 6px 16px rgba(33, 51, 80, 0.5)',
                    transform: 'translateY(-2px)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {isLoading ? "Signing in..." : "Sign in"}
              </Button>
            </Grid>

            <Grid size={{ xs: 12 }}>
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: 1
                }}
              >
                <Link
                  href="/auth/forgot-password"
                  sx={{
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Forgot password?
                </Link>
                {/* <Link
                  href="/auth/signup"
                  sx={{
                    fontSize: '0.875rem',
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' }
                  }}
                >
                  Create account
                </Link> */}
              </Box>
            </Grid>
          </Grid>
        </Box>


      </Paper>
    </Box>
  );
}


export default function LoginPage() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #213350 0%, #6AB344 100%)',
        }}
      >
        <CircularProgress sx={{ color: 'white' }} />
      </Box>
    }>
      <LoginForm />
    </Suspense>
  );
}

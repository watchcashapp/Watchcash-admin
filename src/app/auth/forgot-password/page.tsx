"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, Link } from "@mui/material";
import Image from "next/image";
import NextLink from "next/link";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared/Toaster";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import { useForgotPasswordMutation } from "@/store/api/authApi";
import { getFieldErrors } from "@/utils/form-errors";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [forgotPassword, { isLoading }] = useForgotPasswordMutation();

  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }

    try {
      await forgotPassword({ email }).unwrap();
      setSent(true);
      showSuccess('Password reset link sent successfully!');
    } catch (error: any) {
      const fieldErrors = getFieldErrors(error);
      if (fieldErrors.email) {
        setError(fieldErrors.email);
      }
      showError(error);
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
            mb: 3,
            background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
            WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
            backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
            color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
            textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          }}
        >
          Forgot Password
        </Typography>

        <Typography
          variant="body1"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 4 }}
        >
          Enter your email to receive a password reset link
        </Typography>

        {sent ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="body1" color="success.main" sx={{ mb: 2 }}>
              ✓ Password reset link sent!
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Check your email for instructions to reset your password.
            </Typography>
            <Button
              variant="outlined"
              onClick={() => router.push('/auth/login')}
              size="large"
              sx={{
                height: '48px',
                fontSize: '1rem',
                fontWeight: 600,
                textTransform: 'none',
                borderColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.23)' : '#213350',
                color: (theme) => theme.palette.mode === 'dark' ? '#90caf9' : '#213350',
                '&:hover': {
                  borderColor: '#6AB344',
                  backgroundColor: 'rgba(33, 51, 80, 0.04)',
                },
              }}
            >
              Back to Sign In
            </Button>
          </Box>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error}
                  helperText={error || undefined}
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
                  fullWidth
                  loading={isLoading}
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
                  }}
                >
                  Send Reset Link
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
                    Remember your password?
                  </Typography>
                  <Link
                    component={NextLink}
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
        )}
      </Paper>
    </Box>
  );
}

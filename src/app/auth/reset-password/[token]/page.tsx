"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, CircularProgress } from "@mui/material";
import Image from "next/image";
import { useParams, useRouter } from "next/navigation";
import { useToast } from "@/components/shared/Toaster";
import Input from "@/components/shared/Input";
import Button from "@/components/shared/Button";
import { useResetPasswordMutation } from "@/store/api/authApi";

export default function ResetPassword() {
  const params = useParams() as { token?: string };
  const token = params?.token;
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const [resetPassword, { isLoading }] = useResetPasswordMutation();

  const [mounted, setMounted] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const next: Record<string, string> = {};
    if (password.length < 6) next.password = "Password needs 6+ characters";
    if (password !== confirm) next.confirm = "Passwords do not match";
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!token) {
      showError('Invalid reset token');
      return;
    }

    try {
      await resetPassword({ token, newPassword: password }).unwrap();
      showSuccess('Password reset successfully!');
      router.push('/auth/login');
    } catch (error: any) {
      const errorMessage = error?.data?.message || (typeof error?.data === 'string' ? error.data : 'Failed to reset password. Please try again.');
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
          Set New Password
        </Typography>

        <Typography
          variant="body2"
          textAlign="center"
          color="text.secondary"
          sx={{ mb: 3 }}
        >
          Enter your new password below
        </Typography>

        {!mounted ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress size={24} />
          </Box>
        ) : !token ? (
          <Typography color="error" textAlign="center">
            Invalid or missing token.
          </Typography>
        ) : (
          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="New Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={!!errors.password}
                  helperText={errors.password}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  error={!!errors.confirm}
                  helperText={errors.confirm}
                  required
                  fullWidth
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
                  Save New Password
                </Button>
              </Grid>
            </Grid>
          </Box>
        )}
      </Paper>
    </Box>
  );
}

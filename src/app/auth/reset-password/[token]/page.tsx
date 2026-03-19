"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, TextField, Button, Container } from "@mui/material";
import { useParams, useRouter } from "next/navigation";
import { useToast, Input } from "@/components/shared";
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

  if (!mounted) return null;

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          py: 4,
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: "100%",
            p: { xs: 3, sm: 4 },
            borderRadius: 4,
            maxWidth: { xs: '100%', sm: 480 }
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
            <Box
              component="img"
              src="/assets/images/logo.svg"
              alt="WatchCash Logo"
              sx={{
                height: 48,
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
              fontWeight: 600,
              color: 'primary.main'
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

          {!token ? (
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
                    variant="contained"
                    fullWidth
                    disabled={isLoading}
                    size="large"
                    suppressHydrationWarning
                  >
                    {isLoading ? "Saving..." : "Save New Password"}
                  </Button>
                </Grid>
              </Grid>
            </Box>
          )}
        </Paper>
      </Box>
    </Container>
  );
}

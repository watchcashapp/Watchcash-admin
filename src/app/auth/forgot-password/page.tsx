"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, Link, TextField, Button } from "@mui/material";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/shared";
import { useForgotPasswordMutation } from "@/store/api/authApi";

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
      const errorMessage = error?.data?.message || (typeof error?.data === 'string' ? error.data : 'Failed to send reset link. Please try again.');
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
          Reset Password
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
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a67d8',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
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
                <TextField
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={!!error}
                  helperText={error || undefined}
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
                  {isLoading ? "Sending..." : "Send Reset Link"}
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

"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, Link, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/shared";
import { useToast } from "@/components/shared";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function ForgotPassword() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!validateEmail(email)) {
      setError("Enter a valid email");
      return;
    }
    
    setLoading(true);
    try {
      // TODO: replace with real password reset API call
      await new Promise((r) => setTimeout(r, 1000));
      setSent(true);
      showSuccess('Password reset link sent successfully!');
    } catch (error) {
      showError('Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

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
            Reset Password
          </Typography>

          <Typography 
            variant="body2" 
            textAlign="center" 
            color="text.secondary"
            sx={{ mb: 3 }}
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
                  />
                </Grid>

                <Grid size={{ xs: 12 }}>
                  <Button 
                    type="submit" 
                    variant="contained" 
                    fullWidth 
                    loading={loading}
                    size="large"
                  >
                    {loading ? "Sending..." : "Send Reset Link"}
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
    </Container>
  );
}

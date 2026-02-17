"use client";

import React, { useState } from "react";
import { Box, Paper, Typography, Grid, Link, Container } from "@mui/material";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/shared";
import { useToast } from "@/components/shared";
import { useRegisterMutation } from "@/store/api/authApi";
import { setUser } from "@/store/slices/authSlice";
import { useDispatch } from "react-redux";

function validateEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export default function SignupPage() {
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
      dispatch(setUser(result.user));
      showSuccess('Account created successfully!');
      router.push('/dashboard');
    } catch (error: any) {
      showError(error.data || 'Registration failed. Please try again.');
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
            Create Account
          </Typography>

          <Typography 
            variant="body2" 
            textAlign="center" 
            color="text.secondary"
            sx={{ mb: 3 }}
          >
            Join WatchCash to manage your finances
          </Typography>

          <Box component="form" onSubmit={handleSubmit} noValidate>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="Full Name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  fullWidth
                />
              </Grid>

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
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Input
                  label="Confirm Password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  error={!!errors.confirmPassword}
                  helperText={errors.confirmPassword}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Button 
                  type="submit" 
                  variant="contained" 
                  fullWidth 
                  loading={isLoading}
                  size="large"
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
    </Container>
  );
}

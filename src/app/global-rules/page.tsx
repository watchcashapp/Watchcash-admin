"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CircularProgress,
  Alert,
} from "@mui/material";
import { Save, Edit } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useToast } from "@/components/shared";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useGetGlobalRulesQuery,
  useUpdateGlobalRulesMutation,
  GlobalRules,
} from "@/store/api/globalRulesApi";

export default function GlobalRulesPage() {
  const { showSuccess, showError } = useToast();
  const { hasPermission } = usePermissions();
  const { data: globalRules, isLoading, error } = useGetGlobalRulesQuery();
  const [updateGlobalRules, { isLoading: isUpdating }] = useUpdateGlobalRulesMutation();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<GlobalRules>({
    defaultPointsPerMinute: 0,
    dailyHardCap: 0,
    dailySoftCap: 0,
    softCapMultiplier: 1,
    maxSessionDuration: 1,
    minSessionDuration: 1,
    maxDailySessions: 1,
    mediumRiskReductionPercent: 0,
    highRiskFirstReductionPercent: 0,
    highRiskSecondReductionPercent: 0,
    highRiskBlockMinutes: 0,
    veryHighBlockMinutes: 0,
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof GlobalRules, string>>>({});

  useEffect(() => {
    if (globalRules) {
      setFormData(globalRules);
    }
  }, [globalRules]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    const processedValue = value === '' ? '' : Number(value);

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    if (formErrors[name as keyof GlobalRules]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    e.target.select();
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof GlobalRules, string>> = {};

    if (formData.defaultPointsPerMinute < 0) {
      errors.defaultPointsPerMinute = "Must be 0 or greater";
    }
    if (formData.dailyHardCap < 0) {
      errors.dailyHardCap = "Must be 0 or greater";
    }
    if (formData.dailySoftCap < 0) {
      errors.dailySoftCap = "Must be 0 or greater";
    }
    if (formData.softCapMultiplier <= 0) {
      errors.softCapMultiplier = "Must be greater than 0";
    }
    if (formData.maxSessionDuration < 1) {
      errors.maxSessionDuration = "Must be at least 1";
    }
    if (formData.minSessionDuration < 1) {
      errors.minSessionDuration = "Must be at least 1";
    }
    if (formData.maxDailySessions < 1) {
      errors.maxDailySessions = "Must be at least 1";
    }
    if (formData.mediumRiskReductionPercent < 0 || formData.mediumRiskReductionPercent > 100) {
      errors.mediumRiskReductionPercent = "Must be between 0 and 100";
    }
    if (formData.highRiskFirstReductionPercent < 0 || formData.highRiskFirstReductionPercent > 100) {
      errors.highRiskFirstReductionPercent = "Must be between 0 and 100";
    }
    if (formData.highRiskSecondReductionPercent < 0 || formData.highRiskSecondReductionPercent > 100) {
      errors.highRiskSecondReductionPercent = "Must be between 0 and 100";
    }
    if (formData.highRiskBlockMinutes < 0) {
      errors.highRiskBlockMinutes = "Must be 0 or greater";
    }
    if (formData.veryHighBlockMinutes < 0) {
      errors.veryHighBlockMinutes = "Must be 0 or greater";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    try {
      await updateGlobalRules(formData).unwrap();
      showSuccess('Global rules updated successfully!');
      setIsEditing(false);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Update failed';
      showError(errorMessage);
    }
  };

  const handleCancel = () => {
    if (globalRules) {
      setFormData(globalRules);
    }
    setFormErrors({});
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress sx={{ color: '#667eea' }} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load global rules. Please try again.
        </Alert>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
          <Typography
            variant="h4"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Global Rules
          </Typography>
          {!isEditing && (
            <Button
              variant="outlined"
              startIcon={<Edit />}
              onClick={() => {
                if (hasPermission('global_rules:update')) {
                  setIsEditing(true);
                } else {
                  showError('You do not have permission to edit global rules');
                }
              }}
              sx={{
                borderColor: '#667eea',
                color: '#667eea',
                '&:hover': {
                  borderColor: '#5a67d8',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              Edit Rules
            </Button>
          )}
        </Box>

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
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 3 }}>
              Default Settings for All Apps
            </Typography>

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Default Points Per Minute"
                  name="defaultPointsPerMinute"
                  type="number"
                  value={formData.defaultPointsPerMinute}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.defaultPointsPerMinute}
                  helperText={formErrors.defaultPointsPerMinute}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Daily Hard Cap"
                  name="dailyHardCap"
                  type="number"
                  value={formData.dailyHardCap}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.dailyHardCap}
                  helperText={formErrors.dailyHardCap}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Daily Soft Cap"
                  name="dailySoftCap"
                  type="number"
                  value={formData.dailySoftCap}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.dailySoftCap}
                  helperText={formErrors.dailySoftCap}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Soft Cap Multiplier"
                  name="softCapMultiplier"
                  type="number"
                  value={formData.softCapMultiplier}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.softCapMultiplier}
                  helperText={formErrors.softCapMultiplier}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 0.1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Max Session Duration"
                  name="maxSessionDuration"
                  type="number"
                  value={formData.maxSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.maxSessionDuration}
                  helperText={formErrors.maxSessionDuration}
                  required
                  fullWidth
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Min Session Duration"
                  name="minSessionDuration"
                  type="number"
                  value={formData.minSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.minSessionDuration}
                  helperText={formErrors.minSessionDuration}
                  required
                  fullWidth
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Max Daily Sessions"
                  name="maxDailySessions"
                  type="number"
                  value={formData.maxDailySessions}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.maxDailySessions}
                  helperText={formErrors.maxDailySessions}
                  required
                  fullWidth
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mt: 2, mb: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Risk Management Settings
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="Medium Risk Reduction %"
                  name="mediumRiskReductionPercent"
                  type="number"
                  value={formData.mediumRiskReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.mediumRiskReductionPercent}
                  helperText={formErrors.mediumRiskReductionPercent}
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="High Risk 1st Reduction %"
                  name="highRiskFirstReductionPercent"
                  type="number"
                  value={formData.highRiskFirstReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.highRiskFirstReductionPercent}
                  helperText={formErrors.highRiskFirstReductionPercent}
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <TextField
                  label="High Risk 2nd Reduction %"
                  name="highRiskSecondReductionPercent"
                  type="number"
                  value={formData.highRiskSecondReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.highRiskSecondReductionPercent}
                  helperText={formErrors.highRiskSecondReductionPercent}
                  required
                  fullWidth
                  inputProps={{ min: 0, max: 100, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="High Risk Block Duration (mins)"
                  name="highRiskBlockMinutes"
                  type="number"
                  value={formData.highRiskBlockMinutes}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.highRiskBlockMinutes}
                  helperText={formErrors.highRiskBlockMinutes}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  label="Very High Risk Block Duration (mins)"
                  name="veryHighBlockMinutes"
                  type="number"
                  value={formData.veryHighBlockMinutes}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing}
                  error={!!formErrors.veryHighBlockMinutes}
                  helperText={formErrors.veryHighBlockMinutes}
                  required
                  fullWidth
                  inputProps={{ min: 0, step: 1 }}
                />
              </Grid>

              {isEditing && (
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={handleCancel}
                      disabled={isUpdating}
                      sx={{ minWidth: 120 }}
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
                      {isUpdating ? <CircularProgress size={20} color="inherit" /> : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Card,
  CardContent,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from "@mui/material";
import { Save, Edit } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { useToast, PermissionGuard, Button, Input } from "@/components/shared";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useGetGlobalRulesQuery,
  useUpdateGlobalRulesMutation,
  GlobalRules,
} from "@/store/api/globalRulesApi";

export default function GlobalRulesPage() {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { hasPermission, isInitialized } = usePermissions();
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

  const isChanged = React.useMemo(() => {
    if (!globalRules) return false;
    return JSON.stringify(formData) !== JSON.stringify(globalRules);
  }, [formData, globalRules]);

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

    // Check if each field is provided
    const expectedKeys: (keyof GlobalRules)[] = [
      'defaultPointsPerMinute', 'dailyHardCap', 'dailySoftCap', 'softCapMultiplier',
      'maxSessionDuration', 'minSessionDuration', 'maxDailySessions',
      'mediumRiskReductionPercent', 'highRiskFirstReductionPercent',
      'highRiskSecondReductionPercent', 'highRiskBlockMinutes', 'veryHighBlockMinutes'
    ];

    expectedKeys.forEach((key) => {
      const value = formData[key];
      if (value === undefined || value === null || value.toString() === '') {
        errors[key] = "All fields are required";
      }
    });

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
    if (formData.mediumRiskReductionPercent < 1 || formData.mediumRiskReductionPercent > 100) {
      errors.mediumRiskReductionPercent = "Must be between 1 and 100";
    }
    if (formData.highRiskFirstReductionPercent < 1 || formData.highRiskFirstReductionPercent > 100) {
      errors.highRiskFirstReductionPercent = "Must be between 1 and 100";
    }
    if (formData.highRiskSecondReductionPercent < 1 || formData.highRiskSecondReductionPercent > 100) {
      errors.highRiskSecondReductionPercent = "Must be between 1 and 100";
    }
    if (formData.highRiskBlockMinutes < 1) {
      errors.highRiskBlockMinutes = "Must be 1 or greater";
    }
    if (formData.veryHighBlockMinutes < 1) {
      errors.veryHighBlockMinutes = "Must be 1 or greater";
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

  return (
    <PermissionGuard permission="global_rules:view">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
            }}
          >
            Global Rules
          </Typography>
          {!isEditing && (
            <Button
              variant="contained"
              startIcon={<Edit sx={{ fontSize: '1rem !important' }} />}
              disabled={isUpdating}
              onClick={() => {
                if (hasPermission('global_rules:update')) {
                  setIsEditing(true);
                } else {
                  showError('You do not have permission to edit global rules');
                }
              }}
              sx={{
                height: '30px',
                minHeight: '30px',
                fontSize: '0.75rem',
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                boxShadow: '0 2px 8px rgba(33, 51, 80, 0.3)',
                px: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                  boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
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
            boxShadow: (theme: any) => theme.palette.mode === 'dark'
              ? '0 4px 12px rgba(0, 0, 0, 0.3)'
              : '0 4px 12px rgba(0, 0, 0, 0.05)',
            border: (theme: any) => theme.palette.mode === 'dark'
              ? '1px solid rgba(255, 255, 255, 0.1)'
              : '1px solid rgba(0, 0, 0, 0.08)',
            borderRadius: 1.5,
          }}
        >
          <CardContent sx={{ p: 1.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 1.5, fontSize: '0.85rem' }}>
              Default Settings for All Apps
            </Typography>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Default Points Per Minute"
                  name="defaultPointsPerMinute"
                  type="number"
                  value={formData.defaultPointsPerMinute}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.defaultPointsPerMinute}
                  helperText={formErrors.defaultPointsPerMinute}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Daily Hard Cap"
                  name="dailyHardCap"
                  type="number"
                  value={formData.dailyHardCap}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.dailyHardCap}
                  helperText={formErrors.dailyHardCap}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Daily Soft Cap"
                  name="dailySoftCap"
                  type="number"
                  value={formData.dailySoftCap}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.dailySoftCap}
                  helperText={formErrors.dailySoftCap}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Soft Cap Multiplier"
                  name="softCapMultiplier"
                  type="number"
                  value={formData.softCapMultiplier}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.softCapMultiplier}
                  helperText={formErrors.softCapMultiplier}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Max Session Duration(seconds)"
                  name="maxSessionDuration"
                  type="number"
                  value={formData.maxSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.maxSessionDuration}
                  helperText={formErrors.maxSessionDuration}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Min Session Duration(seconds)"
                  name="minSessionDuration"
                  type="number"
                  value={formData.minSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.minSessionDuration}
                  helperText={formErrors.minSessionDuration}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }}>
                <Input
                  label="Max Daily Sessions"
                  name="maxDailySessions"
                  type="number"
                  value={formData.maxDailySessions}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.maxDailySessions}
                  helperText={formErrors.maxDailySessions}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12 }} sx={{ mt: 1, mb: 0.5 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 600, color: 'text.secondary', display: 'flex', alignItems: 'center', gap: 1 }}>
                  Risk Management Settings
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Input
                  label="Medium Risk Reduction %"
                  name="mediumRiskReductionPercent"
                  type="number"
                  value={formData.mediumRiskReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.mediumRiskReductionPercent}
                  helperText={formErrors.mediumRiskReductionPercent}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Input
                  label="High Risk 1st Reduction %"
                  name="highRiskFirstReductionPercent"
                  type="number"
                  value={formData.highRiskFirstReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.highRiskFirstReductionPercent}
                  helperText={formErrors.highRiskFirstReductionPercent}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Input
                  label="High Risk 2nd Reduction %"
                  name="highRiskSecondReductionPercent"
                  type="number"
                  value={formData.highRiskSecondReductionPercent}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.highRiskSecondReductionPercent}
                  helperText={formErrors.highRiskSecondReductionPercent}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="High Risk Block Duration (mins)"
                  name="highRiskBlockMinutes"
                  type="number"
                  value={formData.highRiskBlockMinutes}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.highRiskBlockMinutes}
                  helperText={formErrors.highRiskBlockMinutes}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Very High Risk Block Duration (mins)"
                  name="veryHighBlockMinutes"
                  type="number"
                  value={formData.veryHighBlockMinutes}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  disabled={!isEditing || isUpdating}
                  error={!!formErrors.veryHighBlockMinutes}
                  helperText={formErrors.veryHighBlockMinutes}
                  required
                  fullWidth
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
                        height: '32px',
                        minHeight: '32px',
                        fontSize: '0.75rem',
                        minWidth: 100,
                        borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#213350',
                        color: (theme: any) => theme.palette.mode === 'dark' ? 'text.secondary' : '#213350',
                        '&:hover': {
                            borderColor: '#6AB344',
                            backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(106, 179, 68, 0.08)' : 'rgba(33, 51, 80, 0.04)',
                        },
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      variant="contained"
                      startIcon={isUpdating ? null : <Save sx={{ fontSize: '1rem' }} />}
                      onClick={handleSave}
                      disabled={isUpdating || !isChanged}
                      loading={isUpdating}
                      sx={{
                        height: '32px',
                        minHeight: '32px',
                        fontSize: '0.75rem',
                        minWidth: 120,
                        background: 'linear-gradient(45deg, #213350, #6AB344)',
                        boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
                        '&:hover': {
                          background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                          boxShadow: '0 6px 16px rgba(33, 51, 80, 0.5)',
                        },
                      }}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </CardContent>
        </Card>
      </Box>
    </PermissionGuard>
  );
}

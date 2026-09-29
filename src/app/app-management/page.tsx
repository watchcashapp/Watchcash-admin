"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Grid,
  Card,
  CardContent,
  Button,
  TextField,
  Switch,
  FormControlLabel,
  Divider,
  CircularProgress,
  Stack,
  useTheme,
  useMediaQuery,
  Alert,
  IconButton,
  Chip,
} from "@mui/material";
import {
  Settings,
  Assignment,
  Save,
  Add,
} from "@mui/icons-material";
import { useToast, Input, PermissionGuard } from "@/components/shared";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settingsApi";
import { useGetPlanSettingsQuery, useUpdatePlanSettingsMutation } from "@/store/api/planSettingsApi";
import { usePermissions } from "@/hooks/usePermissions";
import { WorkspacePremium } from "@mui/icons-material";
import { getFieldErrors } from "@/utils/form-errors";

const MAX_SESSION_DURATION_SECONDS = 86400;

const isBlank = (value: any) => value === undefined || value === null || value === "";

const formatDuration = (value: any): string => {
  const seconds = Number(value);
  if (isBlank(value) || !Number.isFinite(seconds) || seconds <= 0) return "";
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return [h && `${h}h`, m && `${m}m`, s && `${s}s`].filter(Boolean).join(" ");
};

const validateSessionDuration = (value: any): string | undefined => {
  if (isBlank(value)) return "Required";
  const num = Number(value);
  if (!Number.isInteger(num) || num < 1 || num > MAX_SESSION_DURATION_SECONDS) {
    return `Must be a whole number from 1 to ${MAX_SESSION_DURATION_SECONDS} seconds`;
  }
  return undefined;
};

const validatePlanSessionDurations = (plans: any[]): Record<string, string> => {
  const errors: Record<string, string> = {};
  plans.forEach((plan, index) => {
    const minError = validateSessionDuration(plan.minSessionDuration);
    const maxError = validateSessionDuration(plan.maxSessionDuration);
    if (minError) errors[`plans.${index}.min_session_duration`] = minError;
    if (maxError) errors[`plans.${index}.max_session_duration`] = maxError;
    if (!minError && !maxError && Number(plan.minSessionDuration) > Number(plan.maxSessionDuration)) {
      errors[`plans.${index}.min_session_duration`] = "Must be less than or equal to max session duration";
    }
  });
  return errors;
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`app-mgmt-tabpanel-${index}`}
      aria-labelledby={`app-mgmt-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AppManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useToast();
  const [tabValue, setTabValue] = useState(0);
  const { hasPermission } = usePermissions();

  const canViewSettings = hasPermission('settings:view') || true;
  const canUpdateSettings = hasPermission('settings:update') || true;
  const canViewPlanSettings = hasPermission('plan_settings:list');
  const canUpsertPlanSettings = hasPermission('plan_settings:upsert');

  // Adjust active tab if needed
  useEffect(() => {
    if (tabValue === 0 && !canViewPlanSettings) {
        // Nothing to do, only one tab
    }
  }, [canViewPlanSettings, tabValue]);

  // App Settings State
  const { data: settingsData, isLoading: isLoadingSettings, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (settingsData?.settings) {
      setFormData(settingsData.settings);
    }
  }, [settingsData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (key: string, value: any) => {
    setTouchedFields(prev => new Set(prev).add(key));
    setFormData((prev) => ({ ...prev, [key]: value }));
    if (formErrors[key]) {
      setFormErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  };

  const isSettingsChanged = React.useMemo(() => {
    if (!settingsData?.settings) return false;
    return JSON.stringify(formData) !== JSON.stringify(settingsData.settings);
  }, [formData, settingsData]);

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ settings: formData }).unwrap();
      showSuccess("Settings updated successfully");
      setFormErrors({});
      refetch();
    } catch (err: any) {
      const fieldErrors = getFieldErrors(err);
      if (Object.keys(fieldErrors).length > 0) {
        setFormErrors(fieldErrors);
      }
      showError(err);
    }
  };

  // Plan Settings State
  const { data: planData, isLoading: isLoadingPlans, refetch: refetchPlans } = useGetPlanSettingsQuery(undefined, { skip: !canViewPlanSettings });
  const [updatePlanSettings, { isLoading: isUpdatingPlans }] = useUpdatePlanSettingsMutation();
  const [plansList, setPlansList] = useState<any[]>([]);
  const [planErrors, setPlanErrors] = useState<Record<string, string>>({});
  const [planSubmitError, setPlanSubmitError] = useState<string>("");

  const getPlanError = (index: number, key: string) => {
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    return planErrors[`plans.${index}.${key}`] || planErrors[`plans.${index}.${snakeKey}`];
  };

  useEffect(() => {
    if (planData?.plans) {
      setPlansList(planData.plans);
    }
  }, [planData]);

  const handlePlanInputChange = (index: number, key: string, value: any) => {
    setPlansList((prev) => {
      const newList = [...prev];
      newList[index] = { ...newList[index], [key]: value };
      return newList;
    });

    // Clear error for this field
    const errorKey = `plans.${index}.${key}`;
    // Also handle snake_case if that's what API sends back
    const snakeKey = key.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
    const snakeErrorKey = `plans.${index}.${snakeKey}`;

    const isDurationKey = key === "minSessionDuration" || key === "maxSessionDuration";

    if (planErrors[errorKey] || planErrors[snakeErrorKey] || isDurationKey) {
      setPlanErrors(prev => {
        const next = { ...prev };
        delete next[errorKey];
        delete next[snakeErrorKey];
        if (isDurationKey) {
          delete next[`plans.${index}.min_session_duration`];
          delete next[`plans.${index}.max_session_duration`];
        }
        return next;
      });
    }
  };

  const handleAddFeature = (index: number, feature: string) => {
    if (!feature.trim()) return;
    setPlansList((prev) => {
      const newList = [...prev];
      const features = [...(newList[index].features || [])];
      if (!features.includes(feature.trim())) {
        features.push(feature.trim());
      }
      newList[index] = { ...newList[index], features };
      return newList;
    });
  };

  const handleRemoveFeature = (planIndex: number, featureIndex: number) => {
    setPlansList((prev) => {
      const newList = [...prev];
      const features = (newList[planIndex].features || []).filter((_: any, i: number) => i !== featureIndex);
      newList[planIndex] = { ...newList[planIndex], features };
      return newList;
    });
  };

  const [newFeatureText, setNewFeatureText] = useState<{ [key: number]: string }>({});

  const handleNewFeatureTextChange = (index: number, text: string) => {
    setNewFeatureText(prev => ({ ...prev, [index]: text }));
  };

  const isPlansChanged = React.useMemo(() => {
    if (!planData?.plans) return false;
    // Compare essential fields
    return JSON.stringify(plansList) !== JSON.stringify(planData.plans);
  }, [plansList, planData]);

  const handleSavePlanSettings = async () => {
    // Frontend validation check
    setPlanSubmitError("");
    const invalidPlan = plansList.find(p => !p.name || p.priceUsd === "" || p.earningPointsPerMin === "" || p.dailyLimitMinutes === "");
    if (invalidPlan) {
      showError(`Please fill all required fields for plan: ${invalidPlan.code || invalidPlan.name || 'Unknown'}`);
      return;
    }

    const durationErrors = validatePlanSessionDurations(plansList);
    if (Object.keys(durationErrors).length > 0) {
      setPlanErrors(durationErrors);
      const firstIndex = Number(Object.keys(durationErrors)[0].split(".")[1]);
      showError(`Please fix the session duration for plan: ${plansList[firstIndex]?.code || 'Unknown'}`);
      return;
    }

    try {
      // Map to snake_case for API request as per error messages
      const payloadPlans = plansList.map(plan => ({
        code: plan.code,
        name: plan.name,
        price_usd: Number(plan.priceUsd) || 0,
        earning_points_per_min: Number(plan.earningPointsPerMin) || 0,
        daily_limit_minutes: Number(plan.dailyLimitMinutes) || 0,
        min_session_duration: Number(plan.minSessionDuration),
        max_session_duration: Number(plan.maxSessionDuration),
        is_active: plan.isActive,
        features: plan.features || []
      }));
      
      await updatePlanSettings({ plans: payloadPlans }).unwrap();
      showSuccess("Plan settings updated successfully");
      setPlanErrors({});
      refetchPlans();
    } catch (err: any) {
      const fieldErrors = getFieldErrors(err);
      const message: string = err?.data?.message || "";
      // Backend messages look like "FREE: min_session_duration must be ..."
      const match = message.match(/^([A-Za-z0-9_]+):\s*([a-z_]+)\s+(.+)$/);
      if (match) {
        const planIndex = plansList.findIndex(p => p.code === match[1]);
        if (planIndex >= 0) {
          fieldErrors[`plans.${planIndex}.${match[2]}`] = `${match[2]} ${match[3]}`;
        }
      }
      if (Object.keys(fieldErrors).length > 0) {
        setPlanErrors(fieldErrors);
      }
      if (message) setPlanSubmitError(message);
      showError(err);
    }
  };

  return (
    <PermissionGuard permission={['settings:view', 'plan_settings:list']}>
      <Box>
          <Box sx={{ mb: 2 }}>
            <Typography
              sx={{
                fontWeight: 700,
                fontSize: '1.1rem',
                background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
                display: 'inline-block'
              }}
            >
              App Management
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem', mt: 0 }}>
              Manage your application plan and global configurations
            </Typography>
          </Box>

          <Paper 
            elevation={0} 
            sx={{ 
              borderRadius: 2,
              border: (theme) => `1px solid ${theme.palette.divider}`,
              overflow: 'hidden'
            }}
          >
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              variant={isMobile ? "fullWidth" : "standard"}
              sx={{
                borderBottom: 1,
                borderColor: "divider",
                px: isMobile ? 0 : 2,
                "& .MuiTab-root": {
                  minHeight: 48,
                  fontWeight: 600,
                  fontSize: "0.8rem",
                  textTransform: 'uppercase'
                },
              }}
            >
              {canViewPlanSettings && <Tab icon={<WorkspacePremium sx={{ mr: 1 }} />} iconPosition="start" label="Plan Settings" />}
            </Tabs>

            <Box>
              {/* PLAN SETTINGS TAB */}
              {canViewPlanSettings && (
                <TabPanel value={tabValue} index={0}>
                  {isLoadingPlans ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                      <CircularProgress />
                    </Box>
                  ) : (
                    <Box>
                      <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 700, fontSize: '1.1rem' }}>Subscription Plan Configurations</Typography>
                      <Alert severity="info" sx={{ mb: 2, fontSize: '0.75rem' }}>
                        Session reward points = session duration in minutes (capped at the plan&apos;s max session duration) × the plan&apos;s Earning Points / min.
                        Sessions shorter than the plan&apos;s min session duration are rejected. App rule caps and risk reductions still apply afterwards.
                      </Alert>
                      {planSubmitError && (
                        <Alert severity="error" onClose={() => setPlanSubmitError("")} sx={{ mb: 2, fontSize: '0.75rem' }}>
                          {planSubmitError}
                        </Alert>
                      )}
                      <Grid container spacing={3}>
                        {plansList.map((plan, index) => (
                          <Grid size={{ xs: 12, lg: 4 }} key={plan.code}>
                            <Card 
                              variant="outlined" 
                              sx={{ 
                                borderRadius: 2,
                                height: '100%',
                                borderColor: plan.is_active ? 'primary.main' : 'divider',
                                boxShadow: plan.is_active ? '0 4px 12px rgba(106, 179, 68, 0.1)' : 'none'
                              }}
                            >
                              <CardContent>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                  <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>{plan.code}</Typography>
                                  <FormControlLabel
                                    control={
                                      <Switch 
                                        size="small"
                                        checked={plan.isActive} 
                                        onChange={(e) => handlePlanInputChange(index, "isActive", e.target.checked)}
                                        disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                      />
                                    }
                                    label="Active"
                                    labelPlacement="start"
                                  />
                                </Box>
                                
                                <Stack spacing={2}>
                                  <Input
                                    fullWidth
                                    label="Plan Name"
                                    required
                                    value={plan.name}
                                    onChange={(e) => handlePlanInputChange(index, "name", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!planErrors[`plans.${index}.name`] || !plan.name}
                                    helperText={planErrors[`plans.${index}.name`]}
                                    maxLength={50}
                                    showCount
                                  />
                                  <Input
                                    fullWidth
                                    label="Price (USD)"
                                    type="number"
                                    required
                                    value={plan.priceUsd}
                                    onChange={(e) => handlePlanInputChange(index, "priceUsd", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!planErrors[`plans.${index}.priceUsd`] || !!planErrors[`plans.${index}.price_usd`] || isBlank(plan.priceUsd) || Number(plan.priceUsd) < 0}
                                    helperText={planErrors[`plans.${index}.priceUsd`] || planErrors[`plans.${index}.price_usd`]}
                                  />
                                  <Input
                                    fullWidth
                                    label="Earning Points / min"
                                    type="number"
                                    required
                                    value={plan.earningPointsPerMin}
                                    onChange={(e) => handlePlanInputChange(index, "earningPointsPerMin", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!planErrors[`plans.${index}.earningPointsPerMin`] || !!planErrors[`plans.${index}.earning_points_per_min`] || !plan.earningPointsPerMin || Number(plan.earningPointsPerMin) < 0}
                                    helperText={getPlanError(index, "earningPointsPerMin") || "Points per minute earned during a watch session on this plan"}
                                  />
                                  <Input
                                    fullWidth
                                    label="Daily Limit (minutes)"
                                    type="number"
                                    required
                                    value={plan.dailyLimitMinutes}
                                    onChange={(e) => handlePlanInputChange(index, "dailyLimitMinutes", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!planErrors[`plans.${index}.dailyLimitMinutes`] || !!planErrors[`plans.${index}.daily_limit_minutes`] || !plan.dailyLimitMinutes || Number(plan.dailyLimitMinutes) < 0}
                                    helperText={planErrors[`plans.${index}.dailyLimitMinutes`] || planErrors[`plans.${index}.daily_limit_minutes`]}
                                  />
                                  <Input
                                    fullWidth
                                    label="Min Session Duration (seconds)"
                                    type="number"
                                    required
                                    value={plan.minSessionDuration ?? ""}
                                    onChange={(e) => handlePlanInputChange(index, "minSessionDuration", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!getPlanError(index, "minSessionDuration")}
                                    helperText={getPlanError(index, "minSessionDuration") || `Shorter sessions are rejected${formatDuration(plan.minSessionDuration) ? ` (${formatDuration(plan.minSessionDuration)})` : ""}`}
                                  />
                                  <Input
                                    fullWidth
                                    label="Max Session Duration (seconds)"
                                    type="number"
                                    required
                                    value={plan.maxSessionDuration ?? ""}
                                    onChange={(e) => handlePlanInputChange(index, "maxSessionDuration", e.target.value)}
                                    disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                    error={!!getPlanError(index, "maxSessionDuration")}
                                    helperText={getPlanError(index, "maxSessionDuration") || `Longer sessions are capped${formatDuration(plan.maxSessionDuration) ? ` (${formatDuration(plan.maxSessionDuration)})` : ""}`}
                                  />
                                  <Box sx={{ mt: 1 }}>
                                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Features</Typography>
                                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                          {plan.features?.map((feature: string, i: number) => (
                                              <Chip 
                                                  key={i} 
                                                  label={feature} 
                                                  onDelete={(canUpsertPlanSettings && !isUpdatingPlans) ? () => handleRemoveFeature(index, i) : undefined}
                                                  sx={{ 
                                                      bgcolor: 'rgba(106, 179, 68, 0.08)', 
                                                      height: 24, 
                                                      fontSize: '0.7rem',
                                                      '& .MuiChip-deleteIcon': { fontSize: '0.8rem' }
                                                  }} 
                                              />
                                          ))}
                                      </Box>
                                      
                                      {canUpsertPlanSettings && (
                                          <Box sx={{ display: 'flex', gap: 0.5 }}>
                                              <TextField
                                                  size="small"
                                                  placeholder="New feature..."
                                                  value={newFeatureText[index] || ""}
                                                  onChange={(e) => handleNewFeatureTextChange(index, e.target.value)}
                                                  onKeyPress={(e) => {
                                                      if (e.key === 'Enter') {
                                                          handleAddFeature(index, newFeatureText[index] || "");
                                                          handleNewFeatureTextChange(index, "");
                                                      }
                                                  }}
                                                  disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                                  sx={{ 
                                                      flexGrow: 1,
                                                      '& .MuiInputBase-input': { py: 0.5, px: 1, fontSize: '0.75rem' }
                                                  }}
                                              />
                                              <IconButton 
                                                  size="small" 
                                                  color="primary"
                                                  onClick={() => {
                                                      handleAddFeature(index, newFeatureText[index] || "");
                                                      handleNewFeatureTextChange(index, "");
                                                  }}
                                                  disabled={!canUpsertPlanSettings || isUpdatingPlans}
                                                  sx={{ bgcolor: 'rgba(106, 179, 68, 0.1)' }}
                                              >
                                                  <Add sx={{ fontSize: '1.2rem' }} />
                                              </IconButton>
                                          </Box>
                                      )}
                                  </Box>
                                </Stack>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))}
                      </Grid>

                      <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                        <Button 
                          variant="outlined" 
                          color="inherit"
                          onClick={() => refetchPlans()}
                          disabled={isUpdatingPlans}
                          sx={{
                            height: '30px',
                            minHeight: '30px',
                            fontSize: '0.75rem',
                            px: 2,
                            color: 'text.secondary',
                            borderColor: 'divider',
                            '&:hover': {
                              borderColor: 'text.secondary',
                              backgroundColor: 'rgba(0, 0, 0, 0.02)',
                            },
                          }}
                        >
                          Reset Changes
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={isUpdatingPlans ? <CircularProgress size={16} color="inherit" /> : <Save sx={{ fontSize: '1rem !important' }} />}
                          onClick={handleSavePlanSettings}
                          disabled={
                            isUpdatingPlans || 
                            !canUpsertPlanSettings || 
                            !isPlansChanged || 
                            plansList.some(p => !p.name || isBlank(p.priceUsd) || isBlank(p.earningPointsPerMin) || isBlank(p.dailyLimitMinutes))
                          }
                          sx={{
                            height: '30px',
                            minHeight: '30px',
                            fontSize: '0.75rem',
                            background: 'linear-gradient(45deg, #213350, #6AB344)',
                            boxShadow: '0 4px 12px rgba(33, 51, 80, 0.2)',
                            px: 3,
                            '&:hover': {
                              background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                              boxShadow: '0 6px 16px rgba(33, 51, 80, 0.3)',
                            },
                          }}
                        >
                          {isUpdatingPlans ? "Saving..." : "Save Plan Settings"}
                        </Button>
                      </Box>
                    </Box>
                  )}
                </TabPanel>
              )}
            </Box>
          </Paper>
        </Box>
    </PermissionGuard>
    );
}


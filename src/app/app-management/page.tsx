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
import { useToast } from "@/components/shared";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settingsApi";
import { useGetPlanSettingsQuery, useUpdatePlanSettingsMutation } from "@/store/api/planSettingsApi";
import { usePermissions } from "@/hooks/usePermissions";
import { WorkspacePremium } from "@mui/icons-material";

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
    if (tabValue === 1 && !canViewPlanSettings) {
        setTabValue(0);
    }
  }, [canViewPlanSettings, tabValue]);

  // App Settings State
  const { data: settingsData, isLoading: isLoadingSettings, refetch } = useGetSettingsQuery();
  const [updateSettings, { isLoading: isUpdating }] = useUpdateSettingsMutation();
  const [formData, setFormData] = useState<Record<string, any>>({});

  useEffect(() => {
    if (settingsData?.settings) {
      setFormData(settingsData.settings);
    }
  }, [settingsData]);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleInputChange = (key: string, value: any) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveSettings = async () => {
    try {
      await updateSettings({ settings: formData }).unwrap();
      showSuccess("Settings updated successfully");
      refetch();
    } catch (err: any) {
      showError(err?.data?.message || "Failed to update settings");
    }
  };

  // Plan Settings State
  const { data: planData, isLoading: isLoadingPlans, refetch: refetchPlans } = useGetPlanSettingsQuery(undefined, { skip: !canViewPlanSettings });
  const [updatePlanSettings, { isLoading: isUpdatingPlans }] = useUpdatePlanSettingsMutation();
  const [plansList, setPlansList] = useState<any[]>([]);

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

  const handleSavePlanSettings = async () => {
    try {
      // Map to snake_case for API request as per error messages
      const payloadPlans = plansList.map(plan => ({
        code: plan.code,
        name: plan.name,
        price_usd: Number(plan.priceUsd) || 0,
        earning_points_per_min: Number(plan.earningPointsPerMin) || 0,
        daily_limit_minutes: Number(plan.dailyLimitMinutes) || 0,
        is_active: plan.isActive,
        features: plan.features || []
      }));
      
      await updatePlanSettings({ plans: payloadPlans }).unwrap();
      showSuccess("Plan settings updated successfully");
      refetchPlans();
    } catch (err: any) {
      showError(err?.data?.message || "Failed to update plan settings");
    }
  };

  return (
    <Box>
        <Box sx={{ mb: 2 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: "linear-gradient(45deg, #213350, #6AB344)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
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
            <Tab icon={<Settings sx={{ mr: 1 }} />} iconPosition="start" label="App Settings" />
            {canViewPlanSettings && <Tab icon={<WorkspacePremium sx={{ mr: 1 }} />} iconPosition="start" label="Plan Settings" />}
          </Tabs>

          <Box>
            {/* SETTINGS TAB */}
            <TabPanel value={tabValue} index={0}>
              {isLoadingSettings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, fontSize: '1.1rem' }}>Global Application Settings</Typography>
                    <Stack spacing={3}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>System Configuration</Typography>
                          <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                label="App Name"
                                size="small"
                                value={formData.appName || ""}
                                onChange={(e) => handleInputChange("appName", e.target.value)}
                              />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                              <TextField
                                fullWidth
                                label="Support Email"
                                size="small"
                                value={formData.supportEmail || ""}
                                onChange={(e) => handleInputChange("supportEmail", e.target.value)}
                              />
                            </Grid>
                            <Grid size={12}>
                              <TextField
                                fullWidth
                                multiline
                                rows={2}
                                label="System Announcement"
                                size="small"
                                placeholder="Display a global banner to all users..."
                                value={formData.announcement || ""}
                                onChange={(e) => handleInputChange("announcement", e.target.value)}
                              />
                            </Grid>
                          </Grid>
                        </CardContent>
                      </Card>

                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Feature Flags</Typography>
                          <Stack spacing={1}>
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={!!formData.maintenanceMode} 
                                  onChange={(e) => handleInputChange("maintenanceMode", e.target.checked)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Maintenance Mode</Typography>
                                  <Typography variant="caption" color="text.secondary">Disable user access for system maintenance</Typography>
                                </Box>
                              }
                            />
                            <Divider sx={{ my: 1 }} />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={!!formData.referralSystem} 
                                  onChange={(e) => handleInputChange("referralSystem", e.target.checked)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Enable Referrals</Typography>
                                  <Typography variant="caption" color="text.secondary">Allow users to invite friends and earn bonuses</Typography>
                                </Box>
                              }
                            />
                            <Divider sx={{ my: 1 }} />
                            <FormControlLabel
                              control={
                                <Switch 
                                  checked={!!formData.forceUpdate} 
                                  onChange={(e) => handleInputChange("forceUpdate", e.target.checked)}
                                />
                              }
                              label={
                                <Box>
                                  <Typography variant="body2" sx={{ fontWeight: 600 }}>Force App Update</Typography>
                                  <Typography variant="caption" color="text.secondary">Require all mobile users to update to latest version</Typography>
                                </Box>
                              }
                            />
                          </Stack>
                        </CardContent>
                      </Card>
                    </Stack>

                    <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                      <Button 
                        variant="outlined" 
                        color="inherit"
                        onClick={() => refetch()}
                        disabled={isUpdating}
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
                        startIcon={isUpdating ? <CircularProgress size={16} color="inherit" /> : <Save sx={{ fontSize: '1rem !important' }} />}
                        onClick={handleSaveSettings}
                        disabled={isUpdating}
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
                        {isUpdating ? "Saving..." : "Save Settings"}
                      </Button>
                    </Box>
                  </Grid>

                  <Grid size={{ xs: 12, lg: 4 }}>
                    <Alert severity="info" icon={<Assignment />} sx={{ borderRadius: 2, mb: 3 }}>
                      These settings apply globally across the entire application ecosystem. Changes take effect almost immediately.
                    </Alert>
                    <Box component="img" src="/assets/images/settings-illustration.svg" sx={{ width: '100%', opacity: 0.8, filter: 'grayscale(0.2)' }} />
                  </Grid>
                </Grid>
              )}
            </TabPanel>

            {/* PLAN SETTINGS TAB */}
            {canViewPlanSettings && (
              <TabPanel value={tabValue} index={1}>
                {isLoadingPlans ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                    <CircularProgress />
                  </Box>
                ) : (
                  <Box>
                    <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 700, fontSize: '1.1rem' }}>Subscription Plan Configurations</Typography>
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
                                      disabled={!canUpsertPlanSettings}
                                    />
                                  }
                                  label="Active"
                                  labelPlacement="start"
                                />
                              </Box>
                              
                              <Stack spacing={2}>
                                <TextField
                                  fullWidth
                                  label="Plan Name"
                                  size="small"
                                  value={plan.name}
                                  onChange={(e) => handlePlanInputChange(index, "name", e.target.value)}
                                  disabled={!canUpsertPlanSettings}
                                />
                                <TextField
                                  fullWidth
                                  label="Price (USD)"
                                  type="number"
                                  size="small"
                                  value={plan.priceUsd}
                                  onChange={(e) => handlePlanInputChange(index, "priceUsd", Number(e.target.value))}
                                  disabled={!canUpsertPlanSettings}
                                />
                                <TextField
                                  fullWidth
                                  label="Earning Points / min"
                                  type="number"
                                  size="small"
                                  value={plan.earningPointsPerMin}
                                  onChange={(e) => handlePlanInputChange(index, "earningPointsPerMin", Number(e.target.value))}
                                  disabled={!canUpsertPlanSettings}
                                />
                                <TextField
                                  fullWidth
                                  label="Daily Limit (minutes)"
                                  type="number"
                                  size="small"
                                  value={plan.dailyLimitMinutes}
                                  onChange={(e) => handlePlanInputChange(index, "dailyLimitMinutes", Number(e.target.value))}
                                  disabled={!canUpsertPlanSettings}
                                />
                                <Box sx={{ mt: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', display: 'block', mb: 0.5 }}>Features</Typography>
                                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mb: 1.5 }}>
                                        {plan.features?.map((feature: string, i: number) => (
                                            <Chip 
                                                key={i} 
                                                label={feature} 
                                                onDelete={canUpsertPlanSettings ? () => handleRemoveFeature(index, i) : undefined}
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
                        disabled={isUpdatingPlans || !canUpsertPlanSettings}
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
    );
}


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
} from "@mui/material";
import {
  Settings,
  Assignment,
  Save,
  RocketLaunch,
  CheckCircle,
  AccountBalanceWallet,
} from "@mui/icons-material";
import { useToast } from "@/components/shared";
import { useGetSettingsQuery, useUpdateSettingsMutation } from "@/store/api/settingsApi";

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
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

export default function AppManagementPage() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const { showSuccess, showError } = useToast();
  const [tabValue, setTabValue] = useState(0);

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
            <Tab icon={<RocketLaunch sx={{ mr: 1 }} />} iconPosition="start" label="Plan" />
            <Tab icon={<Settings sx={{ mr: 1 }} />} iconPosition="start" label="App Settings" />
          </Tabs>

          <Box>
            {/* PLAN TAB */}
            <TabPanel value={tabValue} index={0}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                  <Card 
                    elevation={0} 
                    sx={{ 
                      borderRadius: 3, 
                      background: "linear-gradient(135deg, #213350 0%, #1a2a44 100%)",
                      color: "white",
                      position: 'relative',
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        position: 'absolute', 
                        top: -20, 
                        right: -20, 
                        width: 150, 
                        height: 150, 
                        background: 'rgba(106, 179, 68, 0.1)', 
                        borderRadius: '50%',
                        zIndex: 0
                      }} 
                    />
                    <CardContent sx={{ position: 'relative', zIndex: 1, p: 4 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
                        <Box>
                          <Typography variant="overline" sx={{ opacity: 0.8, letterSpacing: 1.5, fontWeight: 700 }}>
                            CURRENT PLAN
                          </Typography>
                          <Typography sx={{ fontWeight: 800, mt: 0.5, fontSize: '1.5rem' }}>
                            Enterprise Pro
                          </Typography>
                        </Box>
                        <Chip 
                          label="ACTIVE" 
                          icon={<CheckCircle sx={{ color: '#6AB344 !important' }} />}
                          sx={{ 
                            bgcolor: 'rgba(106, 179, 68, 0.2)', 
                            color: '#6AB344', 
                            fontWeight: 700,
                            border: '1px solid rgba(106, 179, 68, 0.3)'
                          }} 
                        />
                      </Stack>
                      <Divider sx={{ borderColor: 'rgba(255,255,255,0.1)', mb: 3 }} />
                      <Grid container spacing={2}>
                        {[
                          { label: 'Users Cap', val: 'Unlimited' },
                          { label: 'API Access', val: 'Full Priority' },
                          { label: 'Support', val: '24/7 Dedicated' },
                          { label: 'Next Renewal', val: 'Oct 12, 2026' },
                        ].map((stat, i) => (
                          <Grid size={{ xs: 6, sm: 3 }} key={i}>
                            <Typography variant="caption" sx={{ opacity: 0.7, display: 'block', fontSize: '0.65rem' }}>{stat.label}</Typography>
                            <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.85rem' }}>{stat.val}</Typography>
                          </Grid>
                        ))}
                      </Grid>
                    </CardContent>
                  </Card>

                  <Box sx={{ mt: 3 }}>
                    <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 700, fontSize: '0.9rem' }}>Plan Features</Typography>
                    <Grid container spacing={2}>
                      {[
                        'Global Rewards Distribution',
                        'Advanced Fraud Prevention',
                        'Custom Branding & White-labeling',
                        'Real-time Analytics Dashboard',
                        'Multi-currency Support',
                        'Priority API Endpoints'
                      ].map((feature, i) => (
                        <Grid size={{ xs: 12, sm: 6 }} key={i}>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <CheckCircle sx={{ color: '#6AB344', fontSize: '1.2rem' }} />
                            <Typography variant="body2">{feature}</Typography>
                          </Stack>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                  <Card elevation={0} sx={{ borderRadius: 3, border: (theme) => `1px solid ${theme.palette.divider}`, bgcolor: 'rgba(106, 179, 68, 0.03)' }}>
                    <CardContent sx={{ p: 3 }}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>Payment Method</Typography>
                      <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, mb: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                        <AccountBalanceWallet color="primary" />
                        <Box>
                          <Typography variant="body2" sx={{ fontWeight: 600 }}>•••• •••• •••• 4242</Typography>
                          <Typography variant="caption" color="text.secondary">Expires 12/28</Typography>
                        </Box>
                      </Paper>
                      <Button variant="contained" fullWidth sx={{ borderRadius: 2, py: 1.2, fontWeight: 700 }}>
                        UPGRADE PLAN
                      </Button>
                      <Button variant="text" fullWidth color="inherit" sx={{ mt: 1, fontSize: '0.75rem' }}>
                        Manage Subscriptions
                      </Button>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </TabPanel>

            {/* SETTINGS TAB */}
            <TabPanel value={tabValue} index={1}>
              {isLoadingSettings ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <Grid container spacing={4}>
                  <Grid size={{ xs: 12, lg: 8 }}>
                    <Typography variant="h6" sx={{ mb: 3, fontWeight: 700 }}>Global Application Settings</Typography>
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
                      >
                        Reset Changes
                      </Button>
                      <Button
                        variant="contained"
                        startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <Save />}
                        onClick={handleSaveSettings}
                        disabled={isUpdating}
                        sx={{ px: 4, borderRadius: 2 }}
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
          </Box>
        </Paper>
      </Box>
    );
}

// Helper Chip component for internal use
function Chip({ label, icon, sx }: { label: string; icon?: React.ReactNode; sx?: any }) {
  return (
    <Box 
      sx={{ 
        px: 1.5, 
        py: 0.5, 
        borderRadius: '12px', 
        fontSize: '0.75rem', 
        display: 'flex', 
        alignItems: 'center',
        gap: 0.5,
        ...sx 
      }}
    >
      {icon}
      {label}
    </Box>
  );
}

"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  Grid,
  Divider,
  Switch,
  Card,
  CardContent,
  Skeleton,
  Alert,
  CircularProgress,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Chip,
} from '@mui/material';
import {
  Save,
  Settings,
  Dns,
  Edit,
  Add,
  Delete,
  Code,
} from '@mui/icons-material';
import { useToast } from '@/components/shared';
import {
  useGetAdSettingsQuery,
  useUpdateAdSettingsMutation,
  useGetAdProvidersQuery,
  useSaveAdProviderMutation,
  useUpdateProviderStatusMutation,
  AdSettings,
  AdProvider
} from '@/store/api/adsApi';

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
      id={`ads-tabpanel-${index}`}
      aria-labelledby={`ads-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box
          sx={{
            p: 2,
            height: 'calc(100vh - 250px)',
            overflowY: 'auto',
            '&::-webkit-scrollbar': {
              width: '6px',
            },
            '&::-webkit-scrollbar-track': {
              backgroundColor: 'transparent',
            },
            '&::-webkit-scrollbar-thumb': {
              backgroundColor: 'rgba(33, 51, 80, 0.15)',
              borderRadius: '10px',
              '&:hover': {
                backgroundColor: 'rgba(33, 51, 80, 0.25)',
              },
            },
          }}
        >
          {children}
        </Box>
      )}
    </div>
  );
}

export default function AdsManagementPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { showSuccess, showError } = useToast();

  // Ad Settings State
  const [isEditingSettings, setIsEditingSettings] = useState(false);
  const { data: adSettings, isLoading: isLoadingSettings } = useGetAdSettingsQuery();
  const [updateAdSettings, { isLoading: isUpdatingSettings }] = useUpdateAdSettingsMutation();
  const [settingsForm, setSettingsForm] = useState<AdSettings>({
    points_per_ad: 1,
    max_ads_per_day: 1,
    max_points_per_day: 1,
    cooldown_seconds: 1
  });

  // Providers State
  const { data: providers, isLoading: isLoadingProviders } = useGetAdProvidersQuery();
  const [saveProvider, { isLoading: isSavingProvider }] = useSaveAdProviderMutation();
  const [updateStatus, { isLoading: isUpdatingStatus }] = useUpdateProviderStatusMutation();
  const [openProviderDialog, setOpenProviderDialog] = useState(false);
  const [editingProvider, setEditingProvider] = useState<AdProvider | null>(null);
  const [providerForm, setProviderForm] = useState<AdProvider>({
    provider_code: '',
    provider_name: '',
    is_enabled: true,
    config: {}
  });

  useEffect(() => {
    if (adSettings) {
      setSettingsForm(adSettings);
    }
  }, [adSettings]);

  const handleSettingsSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        points_per_ad: Number(settingsForm.points_per_ad),
        max_ads_per_day: Number(settingsForm.max_ads_per_day),
        max_points_per_day: Number(settingsForm.max_points_per_day),
        cooldown_seconds: Number(settingsForm.cooldown_seconds),
      };
      await updateAdSettings(payload).unwrap();
      showSuccess('Ad settings updated successfully');
      setIsEditingSettings(false);
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to update ad settings');
    }
  };

  const handleProviderToggle = async (code: string, currentStatus: boolean) => {
    try {
      await updateStatus({ provider_code: code, is_enabled: !currentStatus }).unwrap();
      showSuccess('Provider status updated');
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to update status');
    }
  };

  const handleOpenDialog = (provider?: AdProvider) => {
    if (provider) {
      setEditingProvider(provider);
      setProviderForm({
        ...provider,
        config: typeof provider.config === 'string' ? JSON.parse(provider.config) : provider.config
      });
    } else {
      setEditingProvider(null);
      setProviderForm({
        provider_code: '',
        provider_name: '',
        is_enabled: true,
        config: {}
      });
    }
    setOpenProviderDialog(true);
  };

  const generateCode = (name: string) => {
    return name.trim().toUpperCase().replace(/[^A-Z0-9]/g, '_');
  };

  const handleNameChange = (name: string) => {
    setProviderForm(prev => {
      const updates: any = { provider_name: name };
      // Only auto-generate code if we're creating a new provider
      if (!editingProvider) {
        updates.provider_code = generateCode(name);
      }
      return { ...prev, ...updates };
    });
  };

  const handleSaveProvider = async () => {
    try {
      let finalConfig = providerForm.config;
      if (typeof finalConfig === 'string') {
        try {
          finalConfig = JSON.parse(finalConfig);
        } catch (e) {
          showError('Invalid JSON in config');
          return;
        }
      }

      await saveProvider({ ...providerForm, config: finalConfig }).unwrap();
      showSuccess(editingProvider ? 'Provider updated' : 'Provider added');
      setOpenProviderDialog(false);
    } catch (err: any) {
      showError(err?.data?.message || 'Failed to save provider');
    }
  };

  if (isLoadingSettings || isLoadingProviders) {
    return (
      <Box>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.2rem',
            mb: 2,
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ads Management
        </Typography>
        <Skeleton variant="rectangular" height={500} sx={{ borderRadius: 2 }} />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.2rem',
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          Ads Management
        </Typography>

        {activeTab === 0 && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              fontWeight: 600,
              fontSize: '0.75rem',
            }}
          >
            ADD PROVIDER
          </Button>
        )}

        {activeTab === 1 && !isEditingSettings && (
          <Button
            variant="contained"
            size="small"
            startIcon={<Edit sx={{ fontSize: '1rem !important' }} />}
            onClick={() => setIsEditingSettings(true)}
            sx={{
              height: '30px',
              fontSize: '0.75rem',
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              boxShadow: '0 2px 8px rgba(33, 51, 80, 0.3)',
              px: 2,
            }}
          >
            Edit
          </Button>
        )}
      </Box>

      <Paper
        elevation={0}
        sx={{
          width: '100%',
          borderRadius: 2,
          overflow: 'hidden',
          bgcolor: 'background.paper',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(e, v) => setActiveTab(v)}
          sx={{
            borderBottom: 1,
            borderColor: 'divider',
            px: 2,
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              minHeight: 48,
            }
          }}
        >
          <Tab icon={<Dns sx={{ fontSize: '1.1rem !important' }} />} iconPosition="start" label="Ad Providers" />
          <Tab icon={<Settings sx={{ fontSize: '1.1rem !important' }} />} iconPosition="start" label="Ad Settings" />
        </Tabs>

        {/* --- SERVICE TAB (CRUD) --- */}
        <TabPanel value={activeTab} index={0}>
          <Grid container spacing={2}>
            {providers && providers.map((provider) => (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={provider.provider_code}>
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: 2,
                    borderColor: provider.is_enabled ? 'primary.main' : 'divider',
                    boxShadow: provider.is_enabled ? '0 0 0 1px inset' : 'none',
                  }}
                >
                  <CardContent sx={{ p: 2 }}>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start">
                      <Box>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            {provider.provider_name}
                          </Typography>
                          <Chip
                            label={provider.provider_code}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.65rem', height: 20 }}
                          />
                        </Box>
                        <Typography variant="caption" color="text.secondary">
                          Status: {provider.is_enabled ? 'Active' : 'Disabled'}
                        </Typography>
                      </Box>
                      <Switch
                        size="small"
                        checked={provider.is_enabled}
                        onChange={() => handleProviderToggle(provider.provider_code, provider.is_enabled)}
                        disabled={isUpdatingStatus}
                      />
                    </Box>
                    <Box display="flex" justifyContent="flex-end" mt={2} gap={1}>
                      <IconButton
                        size="small"
                        onClick={() => handleOpenDialog(provider)}
                        sx={{ color: 'primary.main', bgcolor: 'rgba(33, 51, 80, 0.05)' }}
                      >
                        <Edit fontSize="small" />
                      </IconButton>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        </TabPanel>

        {/* --- AD SETTINGS TAB --- */}
        <TabPanel value={activeTab} index={1}>
          <form onSubmit={handleSettingsSubmit}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 3, fontSize: '0.9rem' }}>
              Global Ad Reward Parameters
            </Typography>
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Points Per Ad"
                  type="number"
                  value={settingsForm.points_per_ad}
                  onChange={(e) => setSettingsForm({ ...settingsForm, points_per_ad: Number(e.target.value) || 0 })}
                  disabled={!isEditingSettings}
                  size="small"
                  slotProps={{
                    input: { sx: { fontSize: '0.8rem', height: '36px' } },
                    inputLabel: { sx: { fontSize: '0.8rem' }, shrink: true }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                      bgcolor: 'background.paper',
                      px: 0.5,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Cooldown Seconds"
                  type="number"
                  value={settingsForm.cooldown_seconds}
                  onChange={(e) => setSettingsForm({ ...settingsForm, cooldown_seconds: Number(e.target.value) || 0 })}
                  disabled={!isEditingSettings}
                  size="small"
                  slotProps={{
                    input: { sx: { fontSize: '0.8rem', height: '36px' } },
                    inputLabel: { sx: { fontSize: '0.8rem' }, shrink: true }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                      bgcolor: 'background.paper',
                      px: 0.5,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Max Ads Per Day"
                  type="number"
                  value={settingsForm.max_ads_per_day}
                  onChange={(e) => setSettingsForm({ ...settingsForm, max_ads_per_day: Number(e.target.value) || 0 })}
                  disabled={!isEditingSettings}
                  size="small"
                  slotProps={{
                    input: { sx: { fontSize: '0.8rem', height: '36px' } },
                    inputLabel: { sx: { fontSize: '0.8rem' }, shrink: true }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                      bgcolor: 'background.paper',
                      px: 0.5,
                    }
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  label="Max Points Per Day"
                  type="number"
                  value={settingsForm.max_points_per_day}
                  onChange={(e) => setSettingsForm({ ...settingsForm, max_points_per_day: Number(e.target.value) || 0 })}
                  disabled={!isEditingSettings}
                  size="small"
                  slotProps={{
                    input: { sx: { fontSize: '0.8rem', height: '36px' } },
                    inputLabel: { sx: { fontSize: '0.8rem' }, shrink: true }
                  }}
                  sx={{
                    '& .MuiInputLabel-root': {
                      transform: 'translate(14px, -6px) scale(0.75)',
                      bgcolor: 'background.paper',
                      px: 0.5,
                    }
                  }}
                />
              </Grid>

              {isEditingSettings && (
                <Grid size={{ xs: 12 }}>
                  <Box display="flex" gap={2} justifyContent="flex-end" mt={2}>
                    <Button
                      variant="outlined"
                      onClick={() => { setSettingsForm(adSettings!); setIsEditingSettings(false); }}
                      disabled={isUpdatingSettings}
                      sx={{ height: 32, fontSize: '0.75rem' }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="contained"
                      startIcon={<Save fontSize="small" />}
                      disabled={isUpdatingSettings}
                      sx={{
                        height: 32,
                        fontSize: '0.75rem',
                        background: 'linear-gradient(45deg, #213350, #6AB344)',
                      }}
                    >
                      {isUpdatingSettings ? 'Saving...' : 'Save Changes'}
                    </Button>
                  </Box>
                </Grid>
              )}
            </Grid>
          </form>
        </TabPanel>
      </Paper>

      {/* --- PROVIDER DIALOG --- */}
      <Dialog
        open={openProviderDialog}
        onClose={() => setOpenProviderDialog(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: 2 } }}
      >
        <DialogTitle sx={{ fontWeight: 700, fontSize: '1.1rem' }}>
          {editingProvider ? 'Edit Ad Provider' : 'Add New Ad Provider'}
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Provider Name"
                value={providerForm.provider_name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g., Google AdMob"
                size="small"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                fullWidth
                label="Provider Code"
                disabled={!!editingProvider}
                value={providerForm.provider_code}
                onChange={(e) => setProviderForm({ ...providerForm, provider_code: e.target.value.toUpperCase() })}
                placeholder="e.g., ADMOB"
                size="small"
                helperText={!editingProvider ? "Auto-generated from name" : ""}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 1, color: 'text.secondary' }}>
                <Code sx={{ fontSize: '1rem' }} /> Configuration (JSON)
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={4}
                value={typeof providerForm.config === 'object' ? JSON.stringify(providerForm.config, null, 2) : providerForm.config}
                onChange={(e) => setProviderForm({ ...providerForm, config: e.target.value })}
                placeholder='{ "app_id": "...", "unit_id": "..." }'
                slotProps={{ input: { sx: { fontFamily: 'monospace', fontSize: '0.8rem' } } }}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={() => setOpenProviderDialog(false)} size="small" sx={{ color: 'text.secondary', fontWeight: 600 }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveProvider}
            disabled={isSavingProvider}
            size="small"
            sx={{
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              fontWeight: 600,
              px: 3
            }}
          >
            {isSavingProvider ? 'Saving...' : 'Save Provider'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

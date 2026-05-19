"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  MenuItem,
  CircularProgress,
  Divider,
  Alert,
  Card,
  CardContent,
  Tab,
  Tabs,
  Switch,
  Grid,
} from '@mui/material';
import {
  Send,
  People,
  Public,
  NotificationsActive,
  Settings,
  DeleteOutline,
} from '@mui/icons-material';
import { useToast, Input, PermissionGuard } from '@/components/shared';
import UserSelectDropdown from '@/components/features/UserSelectDropdown';
import {
  useSendGlobalNotificationMutation,
  useSendSelectedNotificationMutation,
  useUpdateNotificationCategoriesMutation,
  useGetNotificationCategoriesQuery,
} from '@/store/api/notificationsApi';
import { getFieldErrors } from '@/utils/form-errors';

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
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export default function SendNotificationPage() {
  const [activeTab, setActiveTab] = useState(0);
  const { showSuccess, showError } = useToast();

  const [sendGlobal, { isLoading: isSendingGlobal }] = useSendGlobalNotificationMutation();
  const [sendSelected, { isLoading: isSendingSelected }] = useSendSelectedNotificationMutation();
  const { data: categoriesData, isLoading: isLoadingCategories } = useGetNotificationCategoriesQuery();

  const [recipientType, setRecipientType] = useState<'global' | 'selected'>('global');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const [formData, setFormData] = useState({
    category: 'SYSTEM',
    title: '',
    message: '',
    section: '',
    action: '',
    entityType: '',
    entityId: '',
    entityPublicId: '',
  });

  const categories = useMemo(() => {
    if (!categoriesData?.toggles) {
      return [
        { value: 'SYSTEM', label: 'System' },
        { value: 'POINTS_REWARDS', label: 'Points & Rewards' },
        { value: 'ACCOUNT_SECURITY', label: 'Account Security' },
        { value: 'ENGAGEMENT_RETENTION', label: 'Engagement & Retention' },
      ];
    }
    return Object.keys(categoriesData.toggles).map(key => ({
      value: key,
      label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' ')
    }));
  }, [categoriesData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => {
        const next = { ...prev };
        delete next[name];
        return next;
      });
    }
  };

  const handleSelectUser = useCallback((id: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  }, []);

  const handleSelectAllUsers = useCallback((ids: string[]) => {
    setSelectedUserIds(ids);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});

    if (recipientType === 'selected' && selectedUserIds.length === 0) {
      showError('Please select at least one user');
      return;
    }

    try {
      if (recipientType === 'global') {
        await sendGlobal(formData).unwrap();
      } else {
        await sendSelected({
          ...formData,
          userIds: selectedUserIds,
        }).unwrap();
      }

      showSuccess('Notification sent successfully!');
      // Reset form
      setFormData({
        category: 'SYSTEM',
        title: '',
        message: '',
        section: '',
        action: '',
        entityType: '',
        entityId: '',
        entityPublicId: '',
      });
      setSelectedUserIds([]);
    } catch (err: any) {
      const errors = getFieldErrors(err);
      if (Object.keys(errors).length > 0) {
        setFormErrors(errors);
      }
      showError(err);
    }
  };

  return (
    <PermissionGuard permission="admin:full_access">
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <Box sx={{ mb: 4 }}>
          <Typography
            sx={{
              fontWeight: 700,
              fontSize: '1.5rem',
              mb: 1,
              background: (theme) =>
                theme.palette.mode === 'dark'
                  ? 'none'
                  : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) =>
                theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) =>
                theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) =>
                theme.palette.mode === 'dark' ? 'white' : 'inherit',
            }}
          >
            Notifications Management
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Compose and send notifications to your users or manage notification settings.
          </Typography>
        </Box>

        <Box sx={{ width: '100%', mb: 3 }}>
          <Tabs
            value={activeTab}
            onChange={(_, v) => setActiveTab(v)}
            sx={{
              borderBottom: 1,
              borderColor: 'divider',
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.9rem',
                minHeight: 48,
              },
            }}
          >
            <Tab
              icon={<Send sx={{ fontSize: '1.1rem !important' }} />}
              iconPosition="start"
              label="Send Notification"
            />
            <Tab
              icon={<Settings sx={{ fontSize: '1.1rem !important' }} />}
              iconPosition="start"
              label="Notification Settings"
            />
          </Tabs>

          <TabPanel value={activeTab} index={0}>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 7 }}>
                  <Paper
                    sx={{
                      p: 3,
                      borderRadius: 2,
                      border: '1px solid',
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 3 }}>
                      Notification Content
                    </Typography>

                    <Grid container spacing={2.5}>
                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Input
                          select
                          fullWidth
                          label="Category"
                          name="category"
                          value={formData.category}
                          onChange={handleInputChange}
                          error={!!formErrors.category}
                          helperText={formErrors.category}
                          required
                          disabled={isLoadingCategories}
                        >
                          {isLoadingCategories ? (
                            <MenuItem value="SYSTEM">Loading...</MenuItem>
                          ) : (
                            categories.map((cat) => (
                              <MenuItem key={cat.value} value={cat.value}>
                                {cat.label}
                              </MenuItem>
                            ))
                          )}
                        </Input>
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Input
                          fullWidth
                          label="Title"
                          name="title"
                          placeholder="Notification heading"
                          value={formData.title}
                          onChange={handleInputChange}
                          error={!!formErrors.title}
                          helperText={formErrors.title}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Input
                          fullWidth
                          multiline
                          rows={4}
                          label="Message"
                          name="message"
                          placeholder="The main content of the notification"
                          value={formData.message}
                          onChange={handleInputChange}
                          error={!!formErrors.message}
                          helperText={formErrors.message}
                          required
                        />
                      </Grid>

                      <Grid size={{ xs: 12 }}>
                        <Divider sx={{ my: 1 }}>
                          <Typography variant="caption" color="text.disabled" sx={{ fontWeight: 600 }}>
                            OPTIONAL PARAMETERS
                          </Typography>
                        </Divider>
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Input
                          fullWidth
                          label="Section"
                          name="section"
                          placeholder="e.g., WALLET"
                          value={formData.section}
                          onChange={handleInputChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 6 }}>
                        <Input
                          fullWidth
                          label="Action"
                          name="action"
                          placeholder="e.g., OPEN_MODAL"
                          value={formData.action}
                          onChange={handleInputChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Input
                          fullWidth
                          label="Entity Type"
                          name="entityType"
                          placeholder="e.g., TRANSACTION"
                          value={formData.entityType}
                          onChange={handleInputChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Input
                          fullWidth
                          label="Entity ID"
                          name="entityId"
                          placeholder="Internal ID"
                          value={formData.entityId}
                          onChange={handleInputChange}
                        />
                      </Grid>

                      <Grid size={{ xs: 12, sm: 4 }}>
                        <Input
                          fullWidth
                          label="Public ID"
                          name="entityPublicId"
                          placeholder="User-facing ID"
                          value={formData.entityPublicId}
                          onChange={handleInputChange}
                        />
                      </Grid>
                    </Grid>
                  </Paper>
                </Grid>

                <Grid size={{ xs: 12, md: 5 }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                      }}
                    >
                      <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2 }}>
                        Recipients
                      </Typography>

                      <FormControl component="fieldset">
                        <RadioGroup
                          value={recipientType}
                          onChange={(e) =>
                            setRecipientType(e.target.value as 'global' | 'selected')
                          }
                        >
                          <FormControlLabel
                            value="global"
                            control={<Radio size="small" />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <Public sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Global (All Users)
                                </Typography>
                              </Box>
                            }
                          />
                          <FormControlLabel
                            value="selected"
                            control={<Radio size="small" />}
                            label={
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <People sx={{ fontSize: '1rem', color: 'primary.main' }} />
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  Selected Users
                                </Typography>
                              </Box>
                            }
                          />
                        </RadioGroup>
                      </FormControl>

                      {recipientType === 'selected' && (
                        <Box sx={{ mt: 2 }}>
                          <UserSelectDropdown
                            selectedUserIds={selectedUserIds}
                            onSelectUser={handleSelectUser}
                            onSelectAll={handleSelectAllUsers}
                            onClearSelection={() => setSelectedUserIds([])}
                          />
                        </Box>
                      )}
                    </Paper>

                    <Paper
                      sx={{
                        p: 3,
                        borderRadius: 2,
                        border: '1px solid',
                        borderColor: 'divider',
                        bgcolor: 'rgba(106, 179, 68, 0.03)',
                      }}
                    >
                      <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1 }}>
                        Ready to send?
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                        Once sent, this notification will be delivered immediately to {recipientType === 'global' ? 'all active users' : `${selectedUserIds.length} users`}.
                      </Typography>

                      <Button
                        type="submit"
                        fullWidth
                        variant="contained"
                        startIcon={isSendingGlobal || isSendingSelected ? <CircularProgress size={20} color="inherit" /> : <Send />}
                        disabled={isSendingGlobal || isSendingSelected || !formData.title || !formData.message}
                        sx={{
                          height: 48,
                          borderRadius: 1.5,
                          fontWeight: 700,
                          background: 'linear-gradient(45deg, #213350, #6AB344)',
                          boxShadow: '0 4px 12px rgba(33, 51, 80, 0.3)',
                          '&:hover': {
                            background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                            boxShadow: '0 6px 16px rgba(33, 51, 80, 0.4)',
                          },
                        }}
                      >
                        {isSendingGlobal || isSendingSelected ? 'Sending...' : 'Send Notification'}
                      </Button>
                    </Paper>
                  </Box>
                </Grid>

              </Grid>
            </form>
          </TabPanel>

          <TabPanel value={activeTab} index={1}>
            <NotificationSettingsTab />
          </TabPanel>
        </Box>
      </Box>
    </PermissionGuard>
  );
}

function NotificationSettingsTab() {
  const { showSuccess, showError } = useToast();
  const { data: categoriesData, isLoading: isLoadingGet } = useGetNotificationCategoriesQuery();
  const [updateCategories, { isLoading: isUpdating }] = useUpdateNotificationCategoriesMutation();

  const [toggles, setToggles] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (categoriesData?.toggles) {
      setToggles(categoriesData.toggles);
    }
  }, [categoriesData]);

  const handleToggle = (key: string) => {
    setToggles((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    try {
      await updateCategories({ toggles }).unwrap();
      showSuccess('Notification categories updated');
    } catch (err: any) {
      showError(err);
    }
  };

  if (isLoadingGet && Object.keys(toggles).length === 0) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress size={30} />
      </Box>
    );
  }

  const categoryList = Object.keys(toggles).map(key => ({
    key,
    label: key.split('_').map(word => word.charAt(0) + word.slice(1).toLowerCase()).join(' '),
    desc: `Manage delivery for ${key.toLowerCase()} notifications.`
  }));

  return (
    <Grid container spacing={3}>
      <Grid size={{ xs: 12, md: 6 }}>
        <Paper
          sx={{
            p: 3,
            borderRadius: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                Global Category Toggles
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Enable or disable delivery for entire notification categories.
              </Typography>
            </Box>
            <Settings sx={{ color: 'primary.main' }} />
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {categoryList.map((cat) => (
              <Box
                key={cat.key}
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  p: 2,
                  borderRadius: 1.5,
                  bgcolor: 'rgba(0,0,0,0.02)',
                  border: '1px solid transparent',
                  '&:hover': {
                    borderColor: 'divider',
                    bgcolor: 'rgba(0,0,0,0.04)',
                  },
                }}
              >
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {cat.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {cat.desc}
                  </Typography>
                </Box>
                <Switch
                  checked={toggles[cat.key]}
                  onChange={() => handleToggle(cat.key)}
                  color="primary"
                />
              </Box>
            ))}
          </Box>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={isUpdating}
              startIcon={isUpdating ? <CircularProgress size={20} color="inherit" /> : <NotificationsActive />}
              sx={{
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                fontWeight: 600,
                px: 4,
              }}
            >
              {isUpdating ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Paper>
      </Grid>
    </Grid>
  );
}

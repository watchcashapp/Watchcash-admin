"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Paper,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Chip,
  Switch,
  FormControlLabel,
  IconButton,
  InputAdornment,
  Tooltip,
} from "@mui/material";
import { Add, NavigateBefore, NavigateNext, Search, Upload, Image as ImageIcon } from "@mui/icons-material";
import { useToast, ConfirmDialog, MultiSelect, PermissionGuard, Button, Input, DataTable } from "@/components/shared";
import { Column } from "@/components/shared/DataTable";
import {
  useGetAppRulesQuery,
  useGetAppRuleByIdQuery,
  useCreateAppRuleMutation,
  useUpdateAppRuleMutation,
  useDeleteAppRuleMutation,
  useToggleAppRuleStatusMutation,
  AppRule,
  CreateAppRuleRequest,
} from "@/store/api/appRulesApi";


interface AppRuleFormData extends CreateAppRuleRequest { }

const initialFormData: AppRuleFormData = {
  appName: "",
  icon: "", 
  pointsPerMinute: 1,
  dailyHardCap: 1,
  dailySoftCap: 1,
  softCapMultiplier: 1,
  maxSessionDuration: 1,
  minSessionDuration: 1,
  maxDailySessions: 1,
  enabled: true,
  permissions: [],
};

export default function AppRulesPage() {
  const router = useRouter();
  const { showSuccess, showError, showToast } = useToast();
  const getRowId = useCallback((row: any) => row.id, []);
  const today = new Date().toISOString().split('T')[0];
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [localSearch, setLocalSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const hasFilters = fromDate || toDate || searchQuery;
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(localSearch);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync local search with global search
  useEffect(() => {
    if (debouncedSearchQuery === '') {
      setLocalSearch('');
    }
  }, [debouncedSearchQuery]);

  // Data fetching
  const { data: appRules = [], isLoading, error } = useGetAppRulesQuery({
    from: fromDate,
    to: toDate,
    search: debouncedSearchQuery,
  });
  const [createAppRule, { isLoading: isCreating }] = useCreateAppRuleMutation();
  const [updateAppRule, { isLoading: isUpdating }] = useUpdateAppRuleMutation();
  const [deleteAppRule] = useDeleteAppRuleMutation();
  const [toggleStatus] = useToggleAppRuleStatusMutation();

  const totalPages = useMemo(() => Math.ceil((appRules?.length || 0) / itemsPerPage), [appRules?.length]);
  const paginatedRules = useMemo(() => appRules?.slice((page - 1) * itemsPerPage, page * itemsPerPage) || [], [appRules, page]);

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AppRule | null>(null);
  const [formData, setFormData] = useState<AppRuleFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof AppRuleFormData, string>>>({});
  const [iconPreview, setIconPreview] = useState<string>(""); // For icon preview
  const [iconBinary, setIconBinary] = useState<File | null>(null); // Store binary file

  // Use the detail API to fetch the rule when editing
  const { data: ruleDetail, isFetching: isFetchingDetail } = useGetAppRuleByIdQuery(
    editingRule?.id || '',
    { skip: !editingRule?.id }
  );

  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    ruleToDelete: null as AppRule | null,
  });

  const columns: Column<AppRule>[] = useMemo(() => [
    { 
      id: 'appName', 
      label: 'App Name', 
      minWidth: 180,
      format: (value: string) => (
        <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'pointsPerMinute',
      label: 'Points/Min',
      align: 'center',
      minWidth: 110,
      format: (value: number) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'primary.main' }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'dailyHardCap',
      label: 'Hard Cap',
      align: 'center',
      minWidth: 110,
      format: (value: number) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'dailySoftCap',
      label: 'Soft Cap',
      align: 'center',
      minWidth: 110,
      format: (value: number) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'maxDailySessions',
      label: 'Max Sessions',
      align: 'center',
      minWidth: 130,
      format: (value: number) => (
        <Typography variant="body2" sx={{ fontWeight: 500, color: 'text.secondary' }}>
          {value}
        </Typography>
      )
    },
    {
      id: 'enabled',
      label: 'Status',
      align: 'center',
      minWidth: 110,
      format: (value: boolean) => (
        <Chip
          label={value ? 'Enabled' : 'Disabled'}
          size="small"
          sx={{
            background: value 
              ? 'linear-gradient(45deg, #10b981, #059669)' 
              : 'linear-gradient(45deg, #6b7280, #4b5563)',
            color: 'white',
            fontWeight: 600,
            fontSize: '0.7rem',
            height: 28,
            borderRadius: 14,
            boxShadow: value ? '0 2px 8px rgba(16, 185, 129, 0.3)' : '0 2px 8px rgba(107, 114, 128, 0.3)',
          }}
        />
      ),
    },
  ], []);

  const isDirty = useMemo(() => {
    if (!editingRule) return !!formData.appName.trim(); // For create, active if appName is entered
    if (!ruleDetail) return false;
    return (
      formData.appName.trim() !== ruleDetail.appName.trim() ||
      formData.icon !== (ruleDetail.icon || "") || // Icon field comparison
      formData.pointsPerMinute !== ruleDetail.pointsPerMinute ||
      formData.dailyHardCap !== ruleDetail.dailyHardCap ||
      formData.dailySoftCap !== ruleDetail.dailySoftCap ||
      formData.softCapMultiplier !== ruleDetail.softCapMultiplier ||
      formData.maxSessionDuration !== ruleDetail.maxSessionDuration ||
      formData.minSessionDuration !== ruleDetail.minSessionDuration ||
      formData.maxDailySessions !== ruleDetail.maxDailySessions ||
      formData.enabled !== ruleDetail.enabled
    );
  }, [formData, editingRule, ruleDetail]);

  const handleOpenDialog = useCallback((rule?: AppRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        appName: rule.appName,
        icon: rule.icon || "",
        pointsPerMinute: rule.pointsPerMinute,
        dailyHardCap: rule.dailyHardCap,
        dailySoftCap: rule.dailySoftCap,
        softCapMultiplier: rule.softCapMultiplier,
        maxSessionDuration: rule.maxSessionDuration,
        minSessionDuration: rule.minSessionDuration,
        maxDailySessions: rule.maxDailySessions,
        enabled: rule.enabled,
        permissions: rule.permissions || [],
      });
      setIconPreview((rule as any).iconUrl || rule.icon || "");
    } else {
      setEditingRule(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingRule(null);
    setFormData(initialFormData);
    setFormErrors({});
    setIconPreview("");
    setIconBinary(null);
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    let processedValue: any;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      processedValue = value === '' ? '' : Number(value);
    } else {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    setFormErrors(prev => {
      if (!prev[name as keyof AppRuleFormData]) return prev;
      const newErrors = { ...prev };
      delete newErrors[name as keyof AppRuleFormData];
      return newErrors;
    });
  }, []);

  const handleIconUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Store the binary file for payload
      setIconBinary(file);
      
      // Update form data with filename for display
      setFormData(prev => ({
        ...prev,
        icon: file.name,
      }));
      
      // Create preview for image files
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setIconPreview(reader.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setIconPreview("");
      }
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing on number field
    e.target.select();
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof AppRuleFormData, string>> = {};

    if (!formData.appName.trim()) {
      errors.appName = "App name is required";
    }
    if (formData.pointsPerMinute < 0) {
      errors.pointsPerMinute = "Must be 0 or greater";
    }
    if (formData.dailyHardCap < 0) {
      errors.dailyHardCap = "Must be 0 or greater";
    }
    if (formData.dailySoftCap < 0) {
      errors.dailySoftCap = "Must be 0 or greater";
    }
    if (formData.softCapMultiplier < 0) {
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

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      // Create FormData to send binary icon
      const formDataToSend = new FormData();
      
      // Add all form fields as strings
      formDataToSend.append('appName', formData.appName);
      formDataToSend.append('pointsPerMinute', formData.pointsPerMinute.toString());
      formDataToSend.append('dailyHardCap', formData.dailyHardCap.toString());
      formDataToSend.append('dailySoftCap', formData.dailySoftCap.toString());
      formDataToSend.append('softCapMultiplier', formData.softCapMultiplier.toString());
      formDataToSend.append('maxSessionDuration', formData.maxSessionDuration.toString());
      formDataToSend.append('minSessionDuration', formData.minSessionDuration.toString());
      formDataToSend.append('maxDailySessions', formData.maxDailySessions.toString());
      formDataToSend.append('enabled', formData.enabled.toString());
      formDataToSend.append('permissions', JSON.stringify(formData.permissions || []));
      
      // Add icon as binary file if selected
      if (iconBinary) {
        formDataToSend.append('icon', iconBinary);
      } else if (formData.icon) {
        // If no binary file but have icon path, send as string
        formDataToSend.append('icon', formData.icon);
      }

      if (editingRule) {
        await updateAppRule({ 
          id: editingRule.id,
          data: formDataToSend 
        }).unwrap();
        showToast('App rule updated successfully', 'success');
      } else {
        await createAppRule(formDataToSend).unwrap();
        showToast('App rule created successfully', 'success');
      }

      // Ensure dialog closes even if there are any issues after success
      try {
        handleCloseDialog();
      } catch (closeError) {
        console.error('Error closing dialog:', closeError);
        // Force close if there's an issue
        setOpenDialog(false);
        setEditingRule(null);
      }
    } catch (error: any) {
      console.error('Error saving app rule:', error);
      showToast(error.data?.message || 'Failed to save app rule', 'error');
    }
  };

  const handleDelete = useCallback((rule: AppRule) => {
    setConfirmDialog({
      open: true,
      ruleToDelete: rule,
    });
  }, []);

  const handleConfirmDelete = async () => {
    if (!confirmDialog.ruleToDelete) return;

    try {
      await deleteAppRule(confirmDialog.ruleToDelete.id).unwrap();
      showSuccess('App rule deleted successfully!');
      setConfirmDialog({ open: false, ruleToDelete: null });
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Delete failed';
      showError(errorMessage);
    }
  };

  const handleCancelDelete = () => {
    setConfirmDialog({ open: false, ruleToDelete: null });
  };

  const handleToggle = useCallback(async (rule: AppRule) => {
    try {
      await toggleStatus({ id: rule.id, enabled: !rule.enabled }).unwrap();
      showSuccess(`App rule ${rule.enabled ? 'disabled' : 'enabled'} successfully!`);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Toggle failed';
      showError(errorMessage);
    }
  }, [toggleStatus, showSuccess, showError]);

  return (
    <PermissionGuard permission="app_rules:list">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
          <Typography
            variant="h5"
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
            App Rules
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '1rem !important' }} />}
            disabled={isCreating || isUpdating}
            onClick={() => {
              setEditingRule(null);
              setOpenDialog(true);
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
            Add New Rule
          </Button>
        </Box>

        <Paper
          sx={{
            p: 1.5,
            mb: 2,
            bgcolor: 'background.paper',
            borderRadius: 1.5,
          }}
        >
          <Grid container spacing={1.5} alignItems="center">
            <Grid size={{ xs: 12, sm: 12, md: 5 }}>
              <Input
                fullWidth
                label="Search"
                placeholder="Search by Rule Name"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                slotProps={{
                  input: {
                    sx: { fontSize: '0.75rem', height: '32px' },
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                      </InputAdornment>
                    ),
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Tooltip title="Future dates are not allowed" arrow>
                <Box>
                  <Input
                    fullWidth
                    type="date"
                    label="From"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    slotProps={{
                      input: { 
                        sx: { fontSize: '0.75rem', height: '32px' },
                      },
                      htmlInput: {
                        max: today
                      }
                    }}
                    disabled={isUpdating}
                    />
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <Tooltip title="Future dates are not allowed" arrow>
                <Box>
                  <Input
                    fullWidth
                    type="date"
                    label="To"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                    slotProps={{
                      input: { 
                        sx: { fontSize: '0.75rem', height: '32px' },
                      },
                      htmlInput: {
                        max: today
                      }
                    }}
                    disabled={isUpdating}
                    />
                </Box>
              </Tooltip>
            </Grid>
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setLocalSearch('');
                  setDebouncedSearchQuery('');
                  setPage(1);
                }}
                disabled={!fromDate && !toDate && !localSearch}
                sx={{
                  height: '32px',
                  minHeight: '32px',
                  borderColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(255, 255, 255, 0.3)' : '#213350',
                  color: (theme: any) => theme.palette.mode === 'dark' ? 'text.secondary' : '#213350',
                  fontSize: '0.7rem',
                  '&:hover': {
                    borderColor: '#6AB344',
                    backgroundColor: (theme: any) => theme.palette.mode === 'dark' ? 'rgba(106, 179, 68, 0.08)' : 'rgba(33, 51, 80, 0.04)',
                  },
                }}
              >
                Clear
              </Button>
            </Grid>
          </Grid>
        </Paper>

        <DataTable
          columns={columns}
          data={paginatedRules}
          isLoading={isLoading}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onToggle={handleToggle}
          getRowId={getRowId}
        />

        {/* Pagination */}
        {!isLoading && appRules && appRules.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedRules.length} of {appRules.length} results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton size="small" onClick={() => setPage(page - 1)} disabled={page <= 1}>
                <NavigateBefore />
              </IconButton>
              <Typography variant="body2">{page} / {totalPages || 1}</Typography>
              <IconButton size="small" onClick={() => setPage(page + 1)} disabled={page >= (totalPages || 1)}>
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>
        )}

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
          <DialogTitle>{editingRule ? 'Edit App Rule' : 'Create New App Rule'}</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="App Name"
                  name="appName"
                  value={formData.appName}
                  onChange={handleInputChange}
                  error={!!formErrors.appName}
                  helperText={formErrors.appName}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
                  maxLength={50}
                  showCount
                />
              </Grid>
              
              
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Points Per Minute"
                  name="pointsPerMinute"
                  type="number"
                  value={formData.pointsPerMinute}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  error={!!formErrors.pointsPerMinute}
                  helperText={formErrors.pointsPerMinute}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
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
                  error={!!formErrors.dailyHardCap}
                  helperText={formErrors.dailyHardCap}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
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
                  error={!!formErrors.dailySoftCap}
                  helperText={formErrors.dailySoftCap}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
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
                  error={!!formErrors.softCapMultiplier}
                  helperText={formErrors.softCapMultiplier}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Max Session Duration"
                  name="maxSessionDuration"
                  type="number"
                  value={formData.maxSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  error={!!formErrors.maxSessionDuration}
                  helperText={formErrors.maxSessionDuration}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Input
                  label="Min Session Duration"
                  name="minSessionDuration"
                  type="number"
                  value={formData.minSessionDuration}
                  onChange={handleInputChange}
                  onFocus={handleNumberFocus}
                  error={!!formErrors.minSessionDuration}
                  helperText={formErrors.minSessionDuration}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
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
                  error={!!formErrors.maxDailySessions}
                  helperText={formErrors.maxDailySessions}
                  required
                  fullWidth
                  disabled={isCreating || isUpdating || isFetchingDetail}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
                  App Icon
                </Typography>
                <Box sx={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: 1.5,
                  p: 1.5,
                  border: '2px dashed',
                  borderColor: 'divider',
                  borderRadius: 2,
                  bgcolor: 'action.hover',
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    borderColor: 'primary.main',
                    bgcolor: 'action.selected'
                  }
                }}>
                  {iconPreview ? (
                    <>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          overflow: 'hidden',
                          border: '2px solid',
                          borderColor: 'primary.main',
                          boxShadow: '0 4px 12px rgba(0,0,0,0.12)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.paper',
                          flexShrink: 0
                        }}
                      >
                        <img
                          src={iconPreview}
                          alt="Icon preview"
                          style={{ 
                            width: '100%', 
                            height: '100%', 
                            objectFit: 'cover'
                          }}
                        />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {formData.icon}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                          <Button
                            component="label"
                            variant="outlined"
                            size="small"
                            sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                            disabled={isCreating || isUpdating || isFetchingDetail}
                          >
                            <Upload sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                            Change
                            <input
                              type="file"
                              hidden
                              accept="image/*"
                              onChange={handleIconUpload}
                            />
                          </Button>
                          <Button
                            variant="outlined"
                            size="small"
                            color="error"
                            sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                            onClick={() => {
                              setFormData(prev => ({ ...prev, icon: "" }));
                              setIconPreview("");
                              setIconBinary(null); // Clear binary file
                            }}
                            disabled={isCreating || isUpdating || isFetchingDetail}
                          >
                            Remove
                          </Button>
                        </Box>
                      </Box>
                    </>
                  ) : (
                    <>
                      <Box
                        sx={{
                          width: 48,
                          height: 48,
                          borderRadius: 2,
                          border: '2px dashed',
                          borderColor: 'text.disabled',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'background.paper',
                          flexShrink: 0
                        }}
                      >
                        <ImageIcon sx={{ fontSize: 24, color: 'text.disabled' }} />
                      </Box>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block', fontSize: '0.75rem' }}>
                          Upload icon
                        </Typography>
                        <Button
                          component="label"
                          variant="outlined"
                          size="small"
                          sx={{ fontSize: '0.7rem', py: 0.5, px: 1 }}
                          disabled={isCreating || isUpdating || isFetchingDetail}
                        >
                          <Upload sx={{ fontSize: '0.8rem', mr: 0.5 }} />
                          Upload
                          <input
                            type="file"
                            hidden
                            accept="image/*"
                            onChange={handleIconUpload}
                          />
                        </Button>
                      </Box>
                    </>
                  )}
                </Box>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={<Switch checked={formData.enabled} onChange={handleInputChange} name="enabled" disabled={isCreating || isUpdating || isFetchingDetail} />}
                  label="Enabled"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseDialog} disabled={isCreating || isUpdating}>Cancel</Button>
            <Button 
                onClick={handleSubmit} 
                variant="contained" 
                loading={isCreating || isUpdating} 
                disabled={isCreating || isUpdating || isFetchingDetail || !isDirty}
            >
              {editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={confirmDialog.open}
          title="Delete App Rule"
          message={`Are you sure you want to delete "${confirmDialog.ruleToDelete?.appName}"? This action cannot be undone.`}
          confirmText="Delete"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          severity="error"
        />
      </Box>
    </PermissionGuard>
  );
}

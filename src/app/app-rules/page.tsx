"use client";

import React, { useState, useEffect, useMemo } from "react";
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
  Alert,
  IconButton,
  InputAdornment,
} from "@mui/material";
import { Add, NavigateBefore, NavigateNext, Search } from "@mui/icons-material";
import DataTable, { Column } from "@/components/shared/DataTable";
import { useToast, ConfirmDialog, MultiSelect, PermissionGuard, Button, Input } from "@/components/shared";
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
import { useGetPermissionsQuery } from "@/store/api/rbacApi";

interface FormData extends CreateAppRuleRequest { }

const initialFormData: FormData = {
  appName: "",
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
  const { showSuccess, showError } = useToast();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const hasFilters = fromDate || toDate;
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchQuery(searchQuery);
      setPage(1); // Reset page on search
    }, 500);
    return () => clearTimeout(handler);
  }, [searchQuery]);

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
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Use the detail API to fetch the rule when editing
  const { data: ruleDetail, isFetching: isFetchingDetail } = useGetAppRuleByIdQuery(
    editingRule?.id || '',
    { skip: !editingRule?.id }
  );

  // Update formData when ruleDetail is fetched
  useEffect(() => {
    if (editingRule && ruleDetail) {
      setFormData({
        appName: ruleDetail.appName,
        pointsPerMinute: ruleDetail.pointsPerMinute,
        dailyHardCap: ruleDetail.dailyHardCap,
        dailySoftCap: ruleDetail.dailySoftCap,
        softCapMultiplier: ruleDetail.softCapMultiplier,
        maxSessionDuration: ruleDetail.maxSessionDuration,
        minSessionDuration: ruleDetail.minSessionDuration,
        maxDailySessions: ruleDetail.maxDailySessions,
        enabled: ruleDetail.enabled,
        permissions: ruleDetail.permissions || [],
      });
    }
  }, [editingRule, ruleDetail]);

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    ruleToDelete: null as AppRule | null,
  });

  const columns: Column<AppRule>[] = useMemo(() => [
    { id: 'appName', label: 'App Name', minWidth: 150 },
    {
      id: 'pointsPerMinute',
      label: 'Points/Min',
      align: 'center',
      minWidth: 100,
    },
    {
      id: 'dailyHardCap',
      label: 'Hard Cap',
      align: 'center',
      minWidth: 100,
    },
    {
      id: 'dailySoftCap',
      label: 'Soft Cap',
      align: 'center',
      minWidth: 100,
    },
    {
      id: 'maxDailySessions',
      label: 'Max Sessions',
      align: 'center',
      minWidth: 120,
    },
    {
      id: 'enabled',
      label: 'Status',
      align: 'center',
      minWidth: 100,
      format: (value: boolean) => (
        <Chip
          label={value ? 'Enabled' : 'Disabled'}
          size="small"
          sx={{
            background: value ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #6b7280, #4b5563)',
            color: 'white',
            fontWeight: 600,
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

  const handleOpenDialog = (rule?: AppRule) => {
    if (rule) {
      setEditingRule(rule);
      // Pre-fill from the list data first while the detail is fetching
      setFormData({
        appName: rule.appName,
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
    } else {
      setEditingRule(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRule(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;

    let processedValue: any;

    if (type === 'checkbox') {
      processedValue = checked;
    } else if (type === 'number') {
      // Convert to number and handle empty string
      processedValue = value === '' ? '' : Number(value);
    } else {
      processedValue = value;
    }

    setFormData(prev => ({
      ...prev,
      [name]: processedValue,
    }));

    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleNumberFocus = (e: React.FocusEvent<HTMLInputElement>) => {
    // Select all text when focusing on number field
    e.target.select();
  };

  const validateForm = (): boolean => {
    const errors: Partial<Record<keyof FormData, string>> = {};

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

    // Sanitize data - ensure all numeric fields are indeed numbers
    const sanitizedData = {
      ...formData,
      pointsPerMinute: Number(formData.pointsPerMinute),
      dailyHardCap: Number(formData.dailyHardCap),
      dailySoftCap: Number(formData.dailySoftCap),
      softCapMultiplier: Number(formData.softCapMultiplier),
      maxSessionDuration: Number(formData.maxSessionDuration),
      minSessionDuration: Number(formData.minSessionDuration),
      maxDailySessions: Number(formData.maxDailySessions),
    };

    try {
      if (editingRule) {
        await updateAppRule({ id: editingRule.id, data: sanitizedData }).unwrap();
        showSuccess('App rule updated successfully!');
      } else {
        await createAppRule(sanitizedData).unwrap();
        showSuccess('App rule created successfully!');
      }
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Operation failed';
      showError(errorMessage);
    }
  };

  const handleDelete = async (rule: AppRule) => {
    setConfirmDialog({
      open: true,
      ruleToDelete: rule,
    });
  };

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

  const handleToggle = async (rule: AppRule) => {
    try {
      await toggleStatus({ id: rule.id, enabled: !rule.enabled }).unwrap();
      showSuccess(`App rule ${rule.enabled ? 'disabled' : 'enabled'} successfully!`);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Toggle failed';
      showError(errorMessage);
    }
  };

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
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="From"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                slotProps={{
                  input: { sx: { fontSize: '0.75rem', height: '32px' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                disabled={isUpdating}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                fullWidth
                size="small"
                type="date"
                label="To"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                slotProps={{
                  input: { sx: { fontSize: '0.75rem', height: '32px' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                disabled={isUpdating}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 12, md: 5 }}>
              <Input
                fullWidth
                label="Search"
                placeholder="Search by Rule Name"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
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
            <Grid size={{ xs: 12, md: 1 }}>
              <Button
                fullWidth
                variant="outlined"
                onClick={() => {
                  setFromDate('');
                  setToDate('');
                  setSearchQuery('');
                  setPage(1);
                }}
                disabled={!fromDate && !toDate && !searchQuery}
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
          getRowId={(row: any) => row.id}
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

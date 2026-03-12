"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  Button,
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
} from "@mui/material";
import { Add, NavigateBefore, NavigateNext } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable, { Column } from "@/components/shared/DataTable";
import { useToast, ConfirmDialog, MultiSelect } from "@/components/shared";
import { usePermissions } from "@/hooks/usePermissions";
import {
  useGetAppRulesQuery,
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
  pointsPerMinute: 0,
  dailyHardCap: 0,
  dailySoftCap: 0,
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
  const { hasPermission } = usePermissions();
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const hasFilters = fromDate || toDate;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('app_rules:list')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

  const { data: appRules = [], isLoading, error } = useGetAppRulesQuery({
    from: fromDate,
    to: toDate,
  });
  const [createAppRule, { isLoading: isCreating }] = useCreateAppRuleMutation();
  const [updateAppRule, { isLoading: isUpdating }] = useUpdateAppRuleMutation();
  const [deleteAppRule] = useDeleteAppRuleMutation();
  const [toggleStatus] = useToggleAppRuleStatusMutation();

  const totalPages = Math.ceil((appRules?.length || 0) / itemsPerPage);
  const paginatedRules = appRules?.slice((page - 1) * itemsPerPage, page * itemsPerPage) || [];

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AppRule | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

  // Confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState({
    open: false,
    ruleToDelete: null as AppRule | null,
  });

  const columns: Column<AppRule>[] = [
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
  ];

  const handleOpenDialog = (rule?: AppRule) => {
    if (rule) {
      if (!hasPermission('app_rules:update')) {
        showError('You do not have permission to update app rules');
        return;
      }
      setEditingRule(rule);
      // ...
    } else {
      if (!hasPermission('app_rules:create')) {
        showError('You do not have permission to create app rules');
        return;
      }
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

    try {
      if (editingRule) {
        await updateAppRule({ id: editingRule.id, data: formData }).unwrap();
        showSuccess('App rule updated successfully!');
      } else {
        await createAppRule(formData).unwrap();
        showSuccess('App rule created successfully!');
      }
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Operation failed';
      showError(errorMessage);
    }
  };

  const handleDelete = async (rule: AppRule) => {
    if (!hasPermission('app_rules:delete')) {
      showError('You do not have permission to delete app rules');
      return;
    }
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
    if (!hasPermission('app_rules:toggle_status')) {
      showError('You do not have permission to toggle rule status');
      return;
    }
    try {
      await toggleStatus({ id: rule.id, enabled: !rule.enabled }).unwrap();
      showSuccess(`App rule ${rule.enabled ? 'disabled' : 'enabled'} successfully!`);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Toggle failed';
      showError(errorMessage);
    }
  };

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
            App Rules Management
          </Typography>
          {hasPermission('app_rules:create') && (
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '1rem' }} />}
              onClick={() => handleOpenDialog()}
              sx={{
                minWidth: { xs: 'auto', sm: 140 },
                px: { xs: 2, sm: 3 },
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                  boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
                },
              }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Add New Rule</Box>
              <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
                <Add fontSize="small" />
                Add
              </Box>
            </Button>
          )}
        </Box>

        {/* Date Range Filters */}
        <Box
          sx={{
            mb: 3,
            p: { xs: 1.5, sm: 2 },
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
          <Grid container spacing={2} alignItems="center">
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="From Date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                fullWidth
                size="small"
                label="To Date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
                sx={{
                  '& .MuiOutlinedInput-root': {
                    '&:hover fieldset': {
                      borderColor: '#667eea',
                    },
                    '&.Mui-focused fieldset': {
                      borderColor: '#667eea',
                    },
                  },
                }}
              />
            </Grid>
            {hasFilters && (
              <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => {
                    setFromDate('');
                    setToDate('');
                    setPage(1);
                  }}
                  sx={{
                    height: '40px',
                    borderColor: '#667eea',
                    color: '#667eea',
                    '&:hover': {
                      borderColor: '#5a67d8',
                      backgroundColor: 'rgba(102, 126, 234, 0.04)',
                    },
                    fontSize: { xs: '0.75rem', sm: '0.875rem' },
                    minWidth: { xs: 'auto', md: '100px' },
                  }}
                >
                  Clear
                </Button>
              </Grid>
            )}
          </Grid>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Failed to load app rules. Please try again.
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={paginatedRules}
          isLoading={isLoading}
          onEdit={hasPermission('app_rules:update') ? handleOpenDialog : undefined}
          onDelete={hasPermission('app_rules:delete') ? handleDelete : undefined}
          onToggle={hasPermission('app_rules:toggle_status') ? handleToggle : undefined}
          getRowId={(row) => row.id}
          emptyMessage="No app rules found. Create your first rule!"
        />

        {/* Pagination */}
        {!isLoading && appRules && appRules.length > 0 && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Showing {paginatedRules.length} of {appRules.length} results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                sx={{ color: page <= 1 ? 'text.disabled' : 'text.secondary' }}
              >
                <NavigateBefore />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary' }}>
                {page} / {totalPages || 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setPage(page + 1)}
                disabled={page >= (totalPages || 1)}
                sx={{ color: page >= (totalPages || 1) ? 'text.disabled' : 'text.secondary' }}
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>
        )}

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                bgcolor: 'background.paper',
                backdropFilter: 'blur(20px)',
              }
            }
          }}
        >
          <DialogTitle sx={{ fontWeight: 600, fontSize: '1.5rem' }}>
            {editingRule ? 'Edit App Rule' : 'Create New App Rule'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="App Name"
                  name="appName"
                  value={formData.appName}
                  onChange={handleInputChange}
                  error={!!formErrors.appName}
                  helperText={formErrors.appName}
                  required
                  fullWidth
                />
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
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
                  error={!!formErrors.maxDailySessions}
                  helperText={formErrors.maxDailySessions}
                  required
                  fullWidth
                  inputProps={{ min: 1, step: 1 }}
                />
              </Grid>


              <Grid size={{ xs: 12 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.enabled}
                      onChange={handleInputChange}
                      name="enabled"
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#667eea',
                        },
                        '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': {
                          backgroundColor: '#667eea',
                        },
                      }}
                    />
                  }
                  label="Enabled"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions sx={{ p: 3, pt: 0 }}>
            <Button onClick={handleCloseDialog} disabled={isCreating || isUpdating}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              variant="contained"
              disabled={isCreating || isUpdating}
              sx={{
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                },
              }}
            >
              {isCreating || isUpdating ? 'Saving...' : editingRule ? 'Update' : 'Create'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Confirmation Dialog */}
        <ConfirmDialog
          open={confirmDialog.open}
          title="Delete App Rule"
          message={`Are you sure you want to delete "${confirmDialog.ruleToDelete?.appName}"? This action cannot be undone.`}
          confirmText="Delete"
          cancelText="Cancel"
          onConfirm={handleConfirmDelete}
          onCancel={handleCancelDelete}
          severity="error"
        />
      </Box>
    </DashboardLayout>
  );
}

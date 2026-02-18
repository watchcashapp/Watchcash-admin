"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { Add } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable, { Column } from "@/components/shared/DataTable";
import { useToast } from "@/components/shared";
import {
  useGetAppRulesQuery,
  useCreateAppRuleMutation,
  useUpdateAppRuleMutation,
  useDeleteAppRuleMutation,
  useToggleAppRuleStatusMutation,
  AppRule,
  CreateAppRuleRequest,
} from "@/store/api/appRulesApi";

interface FormData extends CreateAppRuleRequest {}

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
};

export default function AppRulesPage() {
  const { showSuccess, showError } = useToast();
  const { data: appRules = [], isLoading, error } = useGetAppRulesQuery();
  const [createAppRule, { isLoading: isCreating }] = useCreateAppRuleMutation();
  const [updateAppRule, { isLoading: isUpdating }] = useUpdateAppRuleMutation();
  const [deleteAppRule] = useDeleteAppRuleMutation();
  const [toggleStatus] = useToggleAppRuleStatusMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRule, setEditingRule] = useState<AppRule | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});

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
      setEditingRule(rule);
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
    if (!confirm(`Are you sure you want to delete "${rule.appName}"?`)) return;

    try {
      await deleteAppRule(rule.id).unwrap();
      showSuccess('App rule deleted successfully!');
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || 'Delete failed';
      showError(errorMessage);
    }
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
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                boxShadow: '0 6px 16px rgba(102, 126, 234, 0.5)',
              },
            }}
          >
            Add New Rule
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Failed to load app rules. Please try again.
          </Alert>
        )}

        <DataTable
          columns={columns}
          data={appRules}
          isLoading={isLoading}
          onEdit={handleOpenDialog}
          onDelete={handleDelete}
          onToggle={handleToggle}
          getRowId={(row) => row.id}
          emptyMessage="No app rules found. Create your first rule!"
        />

        <Dialog 
          open={openDialog} 
          onClose={handleCloseDialog} 
          maxWidth="md" 
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              background: 'rgba(255, 255, 255, 0.98)',
              backdropFilter: 'blur(20px)',
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
      </Box>
    </DashboardLayout>
  );
}

"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
  CircularProgress,
  Alert,
  TextField,
  Paper,
  InputAdornment,
} from "@mui/material";
import { Add, Search } from "@mui/icons-material";
import { DataTable, useToast, ConfirmDialog, Input, PermissionGuard } from "@/components/shared";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  Role,
} from "@/store/api/rbacApi";
import { usePermissions } from "@/hooks/usePermissions";
import { getFieldErrors } from "@/utils/form-errors";

export default function RbacRulesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const getRowId = useCallback((row: any) => row.id, []);
  
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('search') || "");
  const [localSearch, setLocalSearch] = useState(searchParams.get('search') || "");
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || "");

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(localSearch);
    }, 500);

    return () => clearTimeout(handler);
  }, [localSearch]);

  // Sync state with URL
  useEffect(() => {
    const params = new URLSearchParams(searchParams.toString());
    
    let changed = false;
    const urlSearch = searchParams.get('search') || "";

    if (debouncedSearch !== urlSearch) {
      if (debouncedSearch) params.set('search', debouncedSearch); else params.delete('search');
      changed = true;
    }

    if (changed) {
      const queryString = params.toString();
      router.replace(queryString ? `${pathname}?${queryString}` : pathname, { scroll: false });
    }
  }, [debouncedSearch, pathname, router, searchParams]);

  const { data: rolesData, isLoading, error } = useGetRolesQuery({ search: debouncedSearch }, {
    refetchOnMountOrArgChange: false,
  });
  
  const [createRole, { isLoading: isCreating }] = useCreateRoleMutation();
  const [updateRole, { isLoading: isUpdating }] = useUpdateRoleMutation();
  const [deleteRole] = useDeleteRoleMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; role: Role | null }>({
    open: false,
    role: null,
  });

  const [formData, setFormData] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleOpenDialog = useCallback((role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        code: role.code,
        description: role.description,
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: "",
        code: "",
        description: "",
      });
    }
    setErrors({});
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setErrors({});
  }, []);

  const generateCode = (name: string): string => {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '')
      .replace(/\s+/g, '_');
  };

  const handleNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    const newCode = editingRole ? formData.code : generateCode(newName);
    
    setFormData(prev => ({
      ...prev,
      name: newName,
      code: newCode,
    }));

    // Clear errors as user types
    setErrors(prev => {
      if (!prev.name && !prev.code) return prev;
      const newErrs = { ...prev };
      if (newName.trim()) delete newErrs.name;
      if (newCode.trim()) delete newErrs.code;
      return newErrs;
    });
  }, [editingRole, formData.code]);

  const isChanged = useMemo(() => {
    if (!editingRole) return true; // Always allow create
    return (
      formData.name !== editingRole.name ||
      formData.description !== editingRole.description
    );
  }, [formData, editingRole]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.code.trim()) newErrors.code = "Code is required";
    if (!formData.description.trim()) newErrors.description = "Description is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    try {
      if (editingRole) {
        await updateRole({ id: editingRole.id, ...formData }).unwrap();
        showSuccess("Role updated successfully!");
      } else {
        await createRole(formData).unwrap();
        showSuccess("Role created successfully!");
      }
      handleCloseDialog();
    } catch (error: any) {
      const fieldErrors = getFieldErrors(error);
      if (Object.keys(fieldErrors).length > 0) {
        setErrors(fieldErrors as any);
      }
      showError(error);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.role) return;
    try {
      await deleteRole(deleteConfirm.role.id).unwrap();
      showSuccess("Role deleted successfully!");
      setDeleteConfirm({ open: false, role: null });
    } catch (error: any) {
      showError(error);
    }
  };

  const columns = useMemo(() => [
    { id: "name", label: "Name", minWidth: 150 },
    { id: "code", label: "Code", minWidth: 120 },
    { id: "description", label: "Description", minWidth: 200 },
    {
      id: "createdAt",
      label: "Created At",
      minWidth: 150,
      format: (value: string) => value ? new Date(value).toLocaleDateString() : 'N/A',
    },
  ], []);

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
        <CircularProgress sx={{ color: (theme: any) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main' }} />
      </Box>
    );
  }

  return (
    <PermissionGuard permission="rbac:manage_roles">
      <Box>
        {error && (
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Failed to load RBAC roles. The backend endpoint might not be available yet.
          </Alert>
        )}
        
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
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
            RBAC Rules
          </Typography>
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '1rem !important' }} />}
            onClick={() => handleOpenDialog()}
            sx={{
              height: '32px',
              fontSize: '0.75rem',
              background: "linear-gradient(45deg, #213350, #6AB344)",
              boxShadow: "0 4px 12px rgba(33, 51, 80, 0.4)",
              "&:hover": {
                background: "linear-gradient(45deg, #1a2940, #6AB344)",
                boxShadow: "0 6px 16px rgba(33, 51, 80, 0.5)",
              },
            }}
          >
            Add Role
          </Button>
        </Box>

        <Paper sx={{
          p: 1.5,
          mb: 2,
          borderRadius: 2,
          boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
          border: '1px solid',
          borderColor: 'divider',
        }}>
          <Input
            label="Search Roles"
            placeholder="Search by Name or Code"
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
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Paper>

        <DataTable
          columns={columns}
          data={rolesData?.data || []}
          getRowId={getRowId}
          onEdit={handleOpenDialog}
        />

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="sm"
          fullWidth
          slotProps={{
            paper: {
              sx: {
                borderRadius: 3,
                bgcolor: 'background.paper',
                boxShadow: (theme: any) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }
            }
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #213350, #6AB344)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {editingRole ? "Edit Role" : "Add New Role"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <Input
                  disabled={isCreating || isUpdating}
                  label="Name"
                  value={formData.name}
                  onChange={handleNameChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  fullWidth
                  maxLength={50}
                  showCount
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="Code"
                  value={formData.code}
                  error={!!errors.code}
                  helperText={
                    errors.code ||
                    (editingRole
                      ? "Code cannot be changed after creation"
                      : "Auto-generated from name")
                  }
                  required
                  fullWidth
                  disabled
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Input
                  disabled={isCreating || isUpdating}
                  label="Description"
                  value={formData.description}
                  onChange={(e) => {
                    const val = e.target.value;
                    setFormData({ ...formData, description: val });
                    if (errors.description && val.trim()) {
                      setErrors(prev => {
                        const { description, ...rest } = prev;
                        return rest;
                      });
                    }
                  }}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  fullWidth
                  multiline
                  rows={3}
                  maxLength={500}
                  showCount
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
              disabled={isCreating || isUpdating || !isChanged}
              sx={{
                background: "linear-gradient(45deg, #213350, #6AB344)",
                "&:hover": {
                  background: "linear-gradient(45deg, #1a2940, #6AB344)",
                },
              }}
            >
              {isCreating || isUpdating ? (
                <CircularProgress size={20} color="inherit" />
              ) : editingRole ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        <ConfirmDialog
          open={deleteConfirm.open}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${deleteConfirm.role?.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ open: false, role: null })}
        />
      </Box>
    </PermissionGuard>
  );
}

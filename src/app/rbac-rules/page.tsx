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
  Grid,
  CircularProgress,
  Alert,
  TextField,
} from "@mui/material";
import { Add } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { DataTable, useToast, ConfirmDialog } from "@/components/shared";
import {
  useGetRolesQuery,
  useCreateRoleMutation,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
  Role,
} from "@/store/api/rbacApi";
import { usePermissions } from "@/hooks/usePermissions";

export default function RbacRulesPage() {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('rbac:manage_roles')) {
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router]);

  const { showSuccess, showError } = useToast();
  const { data: rolesData, isLoading, error } = useGetRolesQuery(undefined, {
    // Don't retry on error to avoid blocking the page
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

  const handleOpenDialog = (role?: Role) => {
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
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingRole(null);
    setFormData({
      name: "",
      code: "",
      description: "",
    });
    setErrors({});
  };

  // Auto-generate code from name
  const generateCode = (name: string): string => {
    return name
      .trim()
      .toUpperCase()
      .replace(/[^A-Z0-9\s]/g, '') // Remove special characters
      .replace(/\s+/g, '_'); // Replace spaces with underscores
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setFormData({
      ...formData,
      name: newName,
      // Only auto-generate code when creating new role
      code: editingRole ? formData.code : generateCode(newName),
    });
  };

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    }
    if (!formData.code.trim()) {
      newErrors.code = "Code is required";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingRole) {
        await updateRole({
          id: editingRole.id,
          ...formData,
        }).unwrap();
        showSuccess("Role updated successfully!");
      } else {
        await createRole(formData).unwrap();
        showSuccess("Role created successfully!");
      }
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Operation failed";
      showError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm.role) return;

    try {
      await deleteRole(deleteConfirm.role.id).unwrap();
      showSuccess("Role deleted successfully!");
      setDeleteConfirm({ open: false, role: null });
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Failed to delete role";
      showError(errorMessage);
    }
  };

  const columns = [
    { id: "name", label: "Name", minWidth: 150 },
    { id: "code", label: "Code", minWidth: 120 },
    { id: "description", label: "Description", minWidth: 200 },
    {
      id: "createdAt",
      label: "Created At",
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout>
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="60vh">
          <CircularProgress sx={{ color: "#667eea" }} />
        </Box>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <Box>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              mb: 1,
            }}
          >
            RBAC Rules
          </Typography>
          <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
            Failed to load RBAC roles. The backend endpoint might not be available yet.
            <br />
            Error: {JSON.stringify(error)}
          </Alert>
          <Alert severity="info" sx={{ borderRadius: 2 }}>
            This page requires the following backend endpoint:
            <br />
            <code>GET /admin/rbac/roles</code>
          </Alert>
        </Box>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
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
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a67d8, #764ba2)",
                boxShadow: "0 6px 16px rgba(102, 126, 234, 0.5)",
              },
            }}
          >
            Add Role
          </Button>
        </Box>

        <DataTable
          columns={columns}
          data={rolesData?.data || []}
          getRowId={(row) => row.id}
          onEdit={(row) => handleOpenDialog(row)}
        />

        {/* Create/Edit Dialog */}
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
                boxShadow: (theme) => theme.palette.mode === 'dark'
                  ? '0 8px 32px rgba(0, 0, 0, 0.6)'
                  : '0 8px 32px rgba(0, 0, 0, 0.1)',
              }
            }
          }}
        >
          <DialogTitle
            sx={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              color: "white",
              fontWeight: 600,
            }}
          >
            {editingRole ? "Edit Role" : "Add New Role"}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2}>
              <Grid size={{ xs: 12 }} sx={{ mt: 2 }}>
                <TextField
                  label="Name"
                  value={formData.name}
                  onChange={handleNameChange}
                  error={!!errors.name}
                  helperText={errors.name}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
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
                  InputProps={{
                    readOnly: true,
                  }}
                  sx={{
                    '& .MuiInputBase-input.Mui-disabled': {
                      WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
                      color: 'rgba(0, 0, 0, 0.6)',
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  error={!!errors.description}
                  helperText={errors.description}
                  required
                  fullWidth
                  multiline
                  rows={3}
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
                background: "linear-gradient(45deg, #667eea, #764ba2)",
                "&:hover": {
                  background: "linear-gradient(45deg, #5a67d8, #764ba2)",
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

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={deleteConfirm.open}
          title="Delete Role"
          message={`Are you sure you want to delete the role "${deleteConfirm.role?.name}"? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm({ open: false, role: null })}
        />
      </Box>
    </DashboardLayout>
  );
}

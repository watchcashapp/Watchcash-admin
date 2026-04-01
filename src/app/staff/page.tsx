"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  CircularProgress,
  Alert,
  Chip,
  Paper,
} from "@mui/material";
import { Add, Edit, Delete, ToggleOn, ToggleOff } from "@mui/icons-material";
import { DataTable, ConfirmDialog, useToast, Input, PermissionGuard, TablePagination } from "@/components/shared";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffStatusMutation,
  Staff,
} from "@/store/api/staffApi";
import { usePermissions } from "@/hooks/usePermissions";
import { useCursorPagination } from '@/hooks/useCursorPagination';

interface StaffFormData {
  name: string;
  email: string;
  role: string;
  password: string;
}

const initialFormData: StaffFormData = {
  name: "",
  email: "",
  role: "",
  password: "",
};

export default function StaffPage() {
  const router = useRouter();
  const { hasPermission, isInitialized } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);
  const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();


  const { data, isLoading, error } = useGetStaffQuery({
    cursor,
    limit,
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "active",
  });

  useEffect(() => {
    reset();
  }, [search, roleFilter, statusFilter, reset]);

  const [createStaff, { isLoading: isCreating }] = useCreateStaffMutation();
  const [updateStaff, { isLoading: isUpdating }] = useUpdateStaffMutation();
  const [deleteStaff] = useDeleteStaffMutation();
  const [toggleStatus] = useToggleStaffStatusMutation();

  const [openDialog, setOpenDialog] = useState(false);
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [formData, setFormData] = useState<StaffFormData>(initialFormData);
  const [formErrors, setFormErrors] = useState<Partial<StaffFormData>>({});
  const [deleteConfirm, setDeleteConfirm] = useState<Staff | null>(null);

  const handleOpenDialog = (staff?: Staff) => {
    if (staff) {
      setEditingStaff(staff);
      setFormData({
        name: staff.name,
        email: staff.email,
        role: staff.role,
        password: "",
      });
    } else {
      setEditingStaff(null);
      setFormData(initialFormData);
    }
    setFormErrors({});
    setOpenDialog(true);
  };

  const isChanged = useMemo(() => {
    if (!editingStaff) return true; // Always allow create
    return (
      formData.name !== editingStaff.name ||
      formData.email !== editingStaff.email ||
      formData.role !== editingStaff.role
    );
  }, [formData, editingStaff]);

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setEditingStaff(null);
    setFormData(initialFormData);
    setFormErrors({});
  };

  const validateForm = () => {
    const errors: Partial<StaffFormData> = {};

    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }

    if (!formData.email.trim()) {
      errors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Invalid email format";
    }

    if (!formData.role.trim()) {
      errors.role = "Role is required";
    }

    if (!editingStaff && !formData.password) {
      errors.password = "Password is required";
    } else if (!editingStaff && formData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      if (editingStaff) {
        await updateStaff({
          id: editingStaff.id,
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
        }).unwrap();
        showSuccess("Staff updated successfully!");
      } else {
        await createStaff({
          name: formData.name.trim(),
          email: formData.email.trim(),
          role: formData.role.trim(),
          password: formData.password,
        }).unwrap();
        showSuccess("Staff created successfully!");
      }
      handleCloseDialog();
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Operation failed";
      showError(errorMessage);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    try {
      await deleteStaff(deleteConfirm.id).unwrap();
      showSuccess("Staff deleted successfully!");
      setDeleteConfirm(null);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Delete failed";
      showError(errorMessage);
    }
  };

  const handleToggleStatus = async (staff: Staff) => {
    try {
      await toggleStatus({
        id: staff.id,
        enabled: !staff.isActive,
      }).unwrap();
      showSuccess(`Staff ${!staff.isActive ? "activated" : "deactivated"} successfully!`);
    } catch (error: any) {
      const errorMessage = error?.data?.message || error?.message || "Status update failed";
      showError(errorMessage);
    }
  };

  const columns = [
    { id: "name", label: "Name", minWidth: 150 },
    { id: "email", label: "Email", minWidth: 200 },
    { id: "role", label: "Role", minWidth: 120 },
    {
      id: "isActive",
      label: "Status",
      minWidth: 100,
      format: (value: boolean) => (
        <Chip
          label={value ? "Active" : "Inactive"}
          size="small"
          sx={{
            backgroundColor: value ? "rgba(76, 175, 80, 0.1)" : "rgba(244, 67, 54, 0.1)",
            color: value ? "#4caf50" : "#f44336",
            fontWeight: 600,
            fontSize: "0.75rem",
          }}
        />
      ),
    },
    {
      id: "createdAt",
      label: "Created At",
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleDateString(),
    },
  ];

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
        Failed to load staff data. Please try again.
      </Alert>
    );
  }

  return (
    <PermissionGuard permission="staff:list">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
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
            Staff Management
          </Typography>
          {hasPermission('staff:create') && (
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
              Add Staff
            </Button>
          )}
        </Box>

        {/* Filters */}
        <Paper
          sx={{
            mb: 2,
            p: 1.5,
            bgcolor: "background.paper",
            boxShadow: (theme: any) => theme.palette.mode === 'dark'
              ? "0 4px 12px rgba(0, 0, 0, 0.3)"
              : "0 4px 12px rgba(0, 0, 0, 0.05)",
            border: (theme: any) => theme.palette.mode === 'dark'
              ? "1px solid rgba(255, 255, 255, 0.1)"
              : "1px solid rgba(0, 0, 0, 0.08)",
            borderRadius: 1.5,
          }}
        >
          <Grid container spacing={1.5}>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Search"
                placeholder="Search by name or email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  input: { sx: { fontSize: '0.75rem', height: '32px' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                    bgcolor: 'background.paper',
                    px: 0.5,
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  }
                }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Role"
                select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  select: { sx: { fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                    bgcolor: 'background.paper',
                    px: 0.5,
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                  '& .MuiSelect-select': {
                    py: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Roles</MenuItem>
                <MenuItem value="ADMIN" sx={{ fontSize: '0.75rem' }}>Admin</MenuItem>
                <MenuItem value="MANAGER" sx={{ fontSize: '0.75rem' }}>Manager</MenuItem>
                <MenuItem value="STAFF" sx={{ fontSize: '0.75rem' }}>Staff</MenuItem>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12, sm: 6, md: 4 }}>
              <TextField
                label="Status"
                select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                fullWidth
                size="small"
                slotProps={{
                  select: { sx: { fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center' } },
                  inputLabel: { sx: { fontSize: '0.75rem' }, shrink: true }
                }}
                sx={{
                  '& .MuiInputLabel-root': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                    bgcolor: 'background.paper',
                    px: 0.5,
                  },
                  '& .MuiInputLabel-shrink': {
                    transform: 'translate(14px, -6px) scale(0.75)',
                  },
                  '& .MuiSelect-select': {
                    py: 0,
                    display: 'flex',
                    alignItems: 'center',
                  }
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
                <MenuItem value="active" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
                <MenuItem value="inactive" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>
        </Paper>

        {/* Data Table */}
        {isLoading ? (
          <Box display="flex" justifyContent="center" py={8}>
            <CircularProgress sx={{ color: (theme) => theme.palette.mode === 'dark' ? 'secondary.main' : 'primary.main' }} />
          </Box>
        ) : (
          <>
            <DataTable
              columns={columns}
              data={data?.staff || []}
              getRowId={(row: any) => row.id}
              onEdit={hasPermission('staff:update') ? (staff: any) => handleOpenDialog(staff as Staff) : undefined}
              onDelete={hasPermission('staff:delete') ? (staff: any) => setDeleteConfirm(staff as Staff) : undefined}
              onToggle={hasPermission('staff:toggle_status') ? (staff: any) => handleToggleStatus(staff as Staff) : undefined}
              emptyMessage="No staff found. Try adjusting your filters."
            />

            <TablePagination
              pageNumber={pageNumber}
              limit={limit}
              onLimitChange={(newLimit: number) => {
                setLimit(newLimit);
                reset();
              }}
              canGoBack={canGoBack}
              hasMore={!!data?.pagination?.hasMore && !!data?.pagination?.nextCursor}
              onNext={() => goNext(data?.pagination?.nextCursor)}
              onPrevious={goPrevious}
              totalResults={data?.pagination?.total}
              resultsOnPage={data?.staff?.length || 0}
            />
          </>
        )}

        {/* Add/Edit Dialog */}
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
                backdropFilter: 'blur(20px)',
              }
            }
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 600,
              background: (theme) => theme.palette.mode === 'dark' ? 'none' : 'linear-gradient(45deg, #213350, #6AB344)',
              WebkitBackgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              WebkitTextFillColor: (theme) => theme.palette.mode === 'dark' ? 'white' : 'transparent',
              backgroundClip: (theme) => theme.palette.mode === 'dark' ? 'unset' : 'text',
              color: (theme) => theme.palette.mode === 'dark' ? 'white' : 'inherit',
            }}
          >
            {editingStaff ? "Edit Staff" : "Add New Staff"}
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            <Grid container spacing={2.5}>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="Full Name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  error={!!formErrors.name}
                  helperText={formErrors.name}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <Input
                  label="Email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  error={!!formErrors.email}
                  helperText={formErrors.email}
                  required
                  fullWidth
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Role"
                  select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  error={!!formErrors.role}
                  helperText={formErrors.role}
                  required
                  fullWidth
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: "0.875rem",
                    },
                  }}
                >
                  <MenuItem value="ADMIN">Admin</MenuItem>
                  <MenuItem value="MANAGER">Manager</MenuItem>
                  <MenuItem value="STAFF">Staff</MenuItem>
                </TextField>
              </Grid>
              {!editingStaff && (
                <Grid size={{ xs: 12 }}>
                  <Input
                    label="Password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    error={!!formErrors.password}
                    helperText={formErrors.password}
                    required
                    fullWidth
                  />
                </Grid>
              )}
            </Grid>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
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
              ) : editingStaff ? (
                "Update"
              ) : (
                "Create"
              )}
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation */}
        <ConfirmDialog
          open={!!deleteConfirm}
          title="Delete Staff"
          message={`Are you sure you want to delete ${deleteConfirm?.name}? This action cannot be undone.`}
          onConfirm={handleDelete}
          onCancel={() => setDeleteConfirm(null)}
        />
      </Box>
    </PermissionGuard>
  );
}

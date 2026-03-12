"use client";

import React, { useState, useEffect } from "react";
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
} from "@mui/material";
import { Add, Edit, Delete, ToggleOn, ToggleOff } from "@mui/icons-material";
import { DataTable, ConfirmDialog, useToast } from "@/components/shared";
import {
  useGetStaffQuery,
  useCreateStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffStatusMutation,
  Staff,
} from "@/store/api/staffApi";
import { usePermissions } from "@/hooks/usePermissions";

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
  const { hasPermission } = usePermissions();
  const { showSuccess, showError } = useToast();
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && !hasPermission('staff:list')) {
      showError("You don't have permission to view staff");
      router.push('/dashboard');
    }
  }, [isMounted, hasPermission, router, showError]);

  const { data, isLoading, error } = useGetStaffQuery({
    page,
    limit,
    search: search || undefined,
    role: roleFilter || undefined,
    isActive: statusFilter === "" ? undefined : statusFilter === "active",
  });

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
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            background: "linear-gradient(45deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Staff Management
        </Typography>
        {hasPermission('staff:create') && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={() => handleOpenDialog()}
            sx={{
              background: "linear-gradient(45deg, #667eea, #764ba2)",
              boxShadow: "0 4px 12px rgba(102, 126, 234, 0.4)",
              "&:hover": {
                background: "linear-gradient(45deg, #5a67d8, #764ba2)",
                boxShadow: "0 6px 16px rgba(102, 126, 234, 0.5)",
              },
            }}
          >
            Add Staff
          </Button>
        )}
      </Box>

      {/* Filters */}
      <Box
        sx={{
          mb: 3,
          p: 2.5,
          bgcolor: "background.paper",
          backdropFilter: "blur(20px)",
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? "0 8px 32px rgba(0, 0, 0, 0.6)"
            : "0 8px 32px rgba(0, 0, 0, 0.1)",
          border: (theme) => theme.palette.mode === 'dark'
            ? "1px solid rgba(255, 255, 255, 0.1)"
            : "1px solid rgba(0, 0, 0, 0.05)",
          borderRadius: 3,
        }}
      >
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <TextField
              label="Search"
              placeholder="Search by name or email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              fullWidth
              size="small"
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "0.875rem",
                },
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
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "0.875rem",
                },
              }}
            >
              <MenuItem value="">All Roles</MenuItem>
              <MenuItem value="ADMIN">Admin</MenuItem>
              <MenuItem value="MANAGER">Manager</MenuItem>
              <MenuItem value="STAFF">Staff</MenuItem>
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
              sx={{
                "& .MuiInputBase-input": {
                  fontSize: "0.875rem",
                },
              }}
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="active">Active</MenuItem>
              <MenuItem value="inactive">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Data Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" py={8}>
          <CircularProgress sx={{ color: "#667eea" }} />
        </Box>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={data?.data.staff || []}
            getRowId={(row) => row.id}
            onEdit={hasPermission('staff:update') ? (staff) => handleOpenDialog(staff as Staff) : undefined}
            onDelete={hasPermission('staff:delete') ? (staff) => setDeleteConfirm(staff as Staff) : undefined}
            onToggle={hasPermission('staff:toggle_status') ? (staff) => handleToggleStatus(staff as Staff) : undefined}
            emptyMessage="No staff found. Try adjusting your filters."
          />

          {/* Pagination Controls */}
          {data && data.data.total > limit && (
            <Box
              sx={{
                mt: 3,
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 2,
              }}
            >
              <Button
                onClick={() => setPage(page - 1)}
                disabled={page === 1}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "#667eea",
                  color: "#667eea",
                  "&:hover": {
                    borderColor: "#5a67d8",
                    backgroundColor: "rgba(102, 126, 234, 0.04)",
                  },
                }}
              >
                Previous
              </Button>
              <Typography variant="body2" color="text.secondary">
                Page {page} of {Math.ceil(data.data.total / limit)}
              </Typography>
              <Button
                onClick={() => setPage(page + 1)}
                disabled={page >= Math.ceil(data.data.total / limit)}
                variant="outlined"
                size="small"
                sx={{
                  borderColor: "#667eea",
                  color: "#667eea",
                  "&:hover": {
                    borderColor: "#5a67d8",
                    backgroundColor: "rgba(102, 126, 234, 0.04)",
                  },
                }}
              >
                Next
              </Button>
            </Box>
          )}
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
            background: "linear-gradient(45deg, #667eea, #764ba2)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {editingStaff ? "Edit Staff" : "Add New Staff"}
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2.5}>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                error={!!formErrors.name}
                helperText={formErrors.name}
                required
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: "0.875rem",
                  },
                }}
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                label="Email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                error={!!formErrors.email}
                helperText={formErrors.email}
                required
                fullWidth
                sx={{
                  "& .MuiInputBase-input": {
                    fontSize: "0.875rem",
                  },
                }}
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
                <TextField
                  label="Password"
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  error={!!formErrors.password}
                  helperText={formErrors.password}
                  required
                  fullWidth
                  sx={{
                    "& .MuiInputBase-input": {
                      fontSize: "0.875rem",
                    },
                  }}
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
  );
}

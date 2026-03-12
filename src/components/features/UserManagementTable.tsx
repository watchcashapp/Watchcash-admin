"use client";

import React, { useState, useEffect } from "react";
import {
  Box,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Chip,
  InputAdornment,
  Alert,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  Paper,
} from "@mui/material";
import { Search, Add, NavigateBefore, NavigateNext, FileDownload } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { config } from "@/config/env";
import DataTable, { Column } from "@/components/shared/DataTable";
import { ConfirmDialog, useToast } from "@/components/shared";
import { useGetUsersQuery, useDeleteUserMutation, User } from "@/store/api/usersApi";
import { useRefreshTokenMutation } from "@/store/api/authApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { usePermissions } from "@/hooks/usePermissions";

interface UserManagementTableProps {
  title?: string;
  showAddButton?: boolean;
  addRoute?: string;
  editRoute?: string;
  viewRoute?: string;
  defaultUserType?: string;
  hideUserTypeFilter?: boolean;
}

export default function UserManagementTable({
  title = "User Management",
  showAddButton = false,
  addRoute = "/staff/users/add",
  editRoute = "/staff/users",
  viewRoute = "/staff/users/view",
  defaultUserType = "",
  hideUserTypeFilter = false,
}: UserManagementTableProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [page, setPage] = useState(1);
  const [limit] = useState(6);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [userType, setUserType] = useState<string>(defaultUserType);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const hasFilters = search || isActive !== "" || userType !== defaultUserType || fromDate || toDate;
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  // Refresh token mutation
  const [refreshToken] = useRefreshTokenMutation();

  // Trigger refresh token on component mount
  useEffect(() => {
    const refreshTokenOnMount = async () => {
      try {
        await refreshToken().unwrap();

      } catch (error: any) {

        showError('Failed to refresh authentication token');
      }
    };

    refreshTokenOnMount();
  }, [refreshToken, showError]);

  // Build query params
  const effectiveUserType = hideUserTypeFilter ? defaultUserType : userType;
  const queryParams = React.useMemo(() => {
    const params: any = { page, limit };
    if (search) params.search = search;
    if (isActive !== "") params.isActive = isActive === "true";
    if (effectiveUserType) params.userType = effectiveUserType;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    return params;
  }, [page, limit, search, isActive, effectiveUserType, fromDate, toDate]);

  const { data, isLoading, error, isFetching } = useGetUsersQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [search, isActive, userType, fromDate, toDate]);

  const handleView = (user: User) => {
    if (!hasPermission('users:view')) {
      showError('You do not have permission to view user details');
      return;
    }

    // Secondary check: Staff cannot view other staff if that's still a requirement
    if (currentUser?.userType === 'STAFF' && user.userType === 'STAFF' && !hasPermission('admin:full_access')) {
      showError('Staff users cannot view other staff members');
      return;
    }

    router.push(`${viewRoute}/${user.id}`);
  };

  const handleEdit = (user: User) => {
    if (!hasPermission('users:update')) {
      showError('You do not have permission to edit users');
      return;
    }
    router.push(`${editRoute}/${user.id}`);
  };

  const handleDelete = async () => {
    if (!hasPermission('users:delete')) {
      showError('You do not have permission to delete users');
      return;
    }
    if (!deleteConfirm.user) return;
    try {
      await deleteUser(deleteConfirm.user.id).unwrap();
      showSuccess('User deleted successfully!');
      setDeleteConfirm({ open: false, user: null });
    } catch (error: any) {
      showError(error?.data?.message || 'Delete failed');
    }
  };

  const columns: Column<User>[] = [
    {
      id: 'name',
      label: 'Name',
      minWidth: 150,
    },
    {
      id: 'email',
      label: 'Email',
      minWidth: 200,
    },
    {
      id: 'userType',
      label: 'User Type',
      align: 'center',
      minWidth: 120,
      format: (value: string) => (
        <Chip
          label={value}
          size="small"
          sx={{
            background: value === 'ADMIN'
              ? 'linear-gradient(45deg, #667eea, #764ba2)'
              : 'linear-gradient(45deg, #10b981, #059669)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'isActive',
      label: 'Status',
      align: 'center',
      minWidth: 100,
      format: (value: boolean) => (
        <Chip
          label={value ? 'Active' : 'Inactive'}
          size="small"
          sx={{
            background: value
              ? 'linear-gradient(45deg, #10b981, #059669)'
              : 'linear-gradient(45deg, #6b7280, #4b5563)',
            color: 'white',
            fontWeight: 600,
          }}
        />
      ),
    },
    {
      id: 'createdAt',
      label: 'Created At',
      align: 'center',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      }),
    },
  ];

  const handleClearFilters = () => {
    setSearch("");
    setIsActive("");
    setUserType(defaultUserType);
    setFromDate("");
    setToDate("");
    setPage(1); // Reset to first page when filters are cleared
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (isActive !== "") queryParams.append("isActive", isActive);
      if (effectiveUserType) queryParams.append("userType", effectiveUserType);
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);

      const accessToken = document.cookie.replace(/(?:(?:^|.*;\s*)accessToken\s*=\s*([^;]*).*$)|^.*$/, "$1");
      const url = `${config.apiUrl}/admin/users/export?${queryParams.toString()}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'ngrok-skip-browser-warning': 'true'
        }
      });

      if (!response.ok) throw new Error('Export failed');

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = `users_export_${new Date().getTime()}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(downloadUrl);
      showSuccess('Export started successfully');
    } catch (err) {
      showError('Failed to export users');
    }
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          {title}
        </Typography>
        <Box display="flex" gap={1}>
          {hasPermission('users:export') && (
            <Button
              variant="contained"
              size="small"
              startIcon={<FileDownload sx={{ fontSize: '1rem !important' }} />}
              onClick={handleExportCSV}
              sx={{
                height: '30px',
                fontSize: '0.75rem',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
                boxShadow: '0 2px 8px rgba(102, 126, 234, 0.3)',
                px: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #5a67d8, #764ba2)',
                  boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                },
              }}
            >
              EXPORT
            </Button>
          )}
          {hasPermission('users:create') && showAddButton && (
            <Button
              variant="contained"
              size="small"
              startIcon={<Add sx={{ fontSize: '1rem !important' }} />}
              onClick={() => router.push(addRoute)}
              sx={{
                height: '32px',
                fontSize: '0.75rem',
                background: 'linear-gradient(45deg, #667eea, #764ba2)',
              }}
            >
              ADD USER
            </Button>
          )}
        </Box>
      </Box>

      {/* Filters */}
      <Paper
        sx={{
          p: 1.5,
          mb: 2,
          bgcolor: 'background.paper',
          boxShadow: (theme: any) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme: any) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
          borderRadius: 1.5,
        }}
      >
        <Grid container spacing={1.5} alignItems="center">
          <Grid size={{ xs: 12, sm: 6, md: 2.5 }}>
            <TextField
              fullWidth
              size="small"
              label="Search"
              placeholder="Name or Email"
              value={search}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  sx: { fontSize: '0.75rem', height: '32px' },
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ fontSize: '1rem', color: 'primary.main' }} />
                    </InputAdornment>
                  ),
                },
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

          {!hideUserTypeFilter && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="User Type"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
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
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
                <MenuItem value="APP" sx={{ fontSize: '0.75rem' }}>APP</MenuItem>
                <MenuItem value="ADMIN" sx={{ fontSize: '0.75rem' }}>ADMIN</MenuItem>
                <MenuItem value="STAFF" sx={{ fontSize: '0.75rem' }}>STAFF</MenuItem>
              </TextField>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
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
              <MenuItem value="true" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
              <MenuItem value="false" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
            </TextField>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
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

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <TextField
              fullWidth
              size="small"
              label="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
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

          <Grid size={{ xs: 12, sm: 6, md: 1 }}>
            <Button
              fullWidth
              variant="outlined"
              onClick={handleClearFilters}
              disabled={!hasFilters}
              sx={{
                height: '32px',
                borderColor: '#667eea',
                color: '#667eea',
                fontSize: '0.7rem',
                '&:hover': {
                  borderColor: '#5a67d8',
                  backgroundColor: 'rgba(102, 126, 234, 0.04)',
                },
              }}
            >
              Clear
            </Button>
          </Grid>
        </Grid>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8rem' }}>
          Failed to load users. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={data?.users || []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyMessage="No users found. Try adjusting your filters."
        onView={hasPermission('users:view') ? handleView : undefined}
        onEdit={showAddButton && hasPermission('users:update') ? handleEdit : undefined}
        onDelete={showAddButton && hasPermission('users:delete') ? (row) => setDeleteConfirm({ open: true, user: row }) : undefined}
        renderPagination={() => data ? (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 1.5 }}>
            <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
              Showing {data.users?.length || 0} of {(data as any).pagination?.total || (data as any).total || 0} results
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <IconButton
                size="small"
                onClick={() => setPage(page - 1)}
                disabled={page <= 1}
                sx={{ color: page <= 1 ? 'text.disabled' : 'text.secondary' }}
              >
                <NavigateBefore fontSize="small" />
              </IconButton>
              <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center', color: 'text.secondary', fontSize: '0.75rem' }}>
                {page} / {(data as any).pagination?.totalPages || (data as any).totalPages || Math.ceil(((data as any).pagination?.total || (data as any).total || data.users?.length || 0) / limit) || 1}
              </Typography>
              <IconButton
                size="small"
                onClick={() => setPage(page + 1)}
                disabled={page >= ((data as any).pagination?.totalPages || (data as any).totalPages || Math.ceil(((data as any).pagination?.total || (data as any).total || data.users?.length || 0) / limit) || 1)}
                sx={{ color: page >= ((data as any).pagination?.totalPages || (data as any).totalPages || Math.ceil(((data as any).pagination?.total || (data as any).total || data.users?.length || 0) / limit) || 1) ? 'text.disabled' : 'text.secondary' }}
              >
                <NavigateNext fontSize="small" />
              </IconButton>
            </Box>
          </Box>
        ) : null}
      />

      {/* Delete Confirmation */}
      <ConfirmDialog
        open={deleteConfirm.open}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteConfirm.user?.name}? This action cannot be undone.`}
        confirmText="Delete"
        severity="error"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteConfirm({ open: false, user: null })}
      />
    </Box>
  );
}

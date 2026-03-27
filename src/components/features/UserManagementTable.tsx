"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { 
  Box, 
  Typography, 
  MenuItem, 
  Grid, 
  Chip, 
  InputAdornment, 
  Alert, 
  IconButton, 
  Paper,
  LinearProgress,
} from "@mui/material";
import { Search, Add, NavigateBefore, NavigateNext, FileDownload } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import { config } from "@/config/env";
import DataTable, { Column } from "@/components/shared/DataTable";
import { ConfirmDialog, useToast, Button, Input, TablePagination } from "@/components/shared";
import { useGetUsersQuery, useDeleteUserMutation, User } from "@/store/api/usersApi";
import BanUserDialog from "@/components/features/BanUserDialog";
import { useSelector } from "react-redux";
import { RootState } from "@/store";
import { usePermissions } from "@/hooks/usePermissions";
import { useCursorPagination } from '@/hooks/useCursorPagination';
import { PermissionGuard } from '@/components/shared/PermissionGuard';
import { getTokenFromCookie } from "@/utils/auth";

interface UserManagementTableProps {
  title?: string;
  showAddButton?: boolean;
  addRoute?: string;
  editRoute?: string;
  viewRoute?: string;
  defaultUserType?: string;
  hideUserTypeFilter?: boolean;
  showBanButton?: boolean;
  showEditAction?: boolean;
  showDeleteAction?: boolean;
}

export default function UserManagementTable({
  title = "User Management",
  showAddButton = false,
  addRoute = "/staff/users/add",
  editRoute = "/staff/users",
  viewRoute = "/staff/users/view",
  defaultUserType = "",
  hideUserTypeFilter = false,
  showBanButton = true,
  showEditAction = true,
  showDeleteAction = true,
}: UserManagementTableProps) {
  const router = useRouter();
  const { showSuccess, showError } = useToast();
  const { user: currentUser } = useSelector((state: RootState) => state.auth);
  const { hasPermission } = usePermissions();
  const [limit, setLimit] = useState(6);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [userType, setUserType] = useState<string>(defaultUserType);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();
  
  const hasFilters = useMemo(() => 
    !!(search || isActive !== "" || userType !== defaultUserType || fromDate || toDate),
    [search, isActive, userType, defaultUserType, fromDate, toDate]
  );

  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [banConfirm, setBanConfirm] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });
  const [isRedirecting, setIsRedirecting] = useState(false);

  // Build query params
  const effectiveUserType = hideUserTypeFilter ? defaultUserType : userType;
  const queryParams = useMemo(() => {
    const params: any = { cursor, limit };
    if (search) params.search = search;
    if (isActive !== "") params.isActive = isActive === "true";
    if (effectiveUserType) params.userType = effectiveUserType;
    if (fromDate) params.from = fromDate;
    if (toDate) params.to = toDate;
    return params;
  }, [cursor, limit, search, isActive, effectiveUserType, fromDate, toDate]);

  const { data, isLoading, error, isFetching } = useGetUsersQuery(queryParams, {
    refetchOnMountOrArgChange: true,
  });
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  // Reset page when filters change
  useEffect(() => {
    reset();
  }, [search, isActive, userType, fromDate, toDate, reset]);

  const handleView = useCallback((user: User) => {
    if (!hasPermission('users:view')) {
      showError('You do not have permission to view user details');
      return;
    }

    if (currentUser?.userType === 'STAFF' && user.userType === 'STAFF' && !hasPermission('admin:full_access')) {
      showError('Staff users cannot view other staff members');
      return;
    }

    setIsRedirecting(true);
    router.push(`${viewRoute}/${user.id}`);
  }, [hasPermission, currentUser, showError, router, viewRoute]);

  // Prefetch user detail pages for faster redirection
  useEffect(() => {
    if (data?.users && hasPermission('users:view')) {
      data.users.forEach((user: User) => {
        router.prefetch(`${viewRoute}/${user.id}`);
      });
    }
  }, [data?.users, router, viewRoute, hasPermission]);

  const handleEdit = useCallback((user: User) => {
    if (!hasPermission('users:update')) {
      showError('You do not have permission to edit users');
      return;
    }
    setIsRedirecting(true);
    router.push(`${editRoute}/${user.id}`);
  }, [hasPermission, showError, router, editRoute]);

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

  const columns: Column<User>[] = useMemo(() => [
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
              ? 'linear-gradient(45deg, #213350, #6AB344)'
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
  ], []);

  const handleClearFilters = () => {
    setSearch("");
    setIsActive("");
    setUserType(defaultUserType);
    setFromDate("");
    setToDate("");
    reset();
  };

  const handleExportCSV = async () => {
    try {
      const queryParams = new URLSearchParams();
      if (search) queryParams.append("search", search);
      if (isActive !== "") queryParams.append("isActive", isActive);
      if (effectiveUserType) queryParams.append("userType", effectiveUserType);
      if (fromDate) queryParams.append("from", fromDate);
      if (toDate) queryParams.append("to", toDate);

      const accessToken = getTokenFromCookie("accessToken");
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

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Typography
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #213350, #6AB344)',
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
            <Input
              label="Search"
              placeholder="Name or Email"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
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

          {!hideUserTypeFilter && (
            <Grid size={{ xs: 12, sm: 6, md: 2 }}>
              <Input
                select
                label="User Type"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                slotProps={{
                  select: { sx: { fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center' } },
                }}
              >
                <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Types</MenuItem>
                <MenuItem value="APP" sx={{ fontSize: '0.75rem' }}>APP</MenuItem>
                <MenuItem value="ADMIN" sx={{ fontSize: '0.75rem' }}>ADMIN</MenuItem>
                <MenuItem value="STAFF" sx={{ fontSize: '0.75rem' }}>STAFF</MenuItem>
              </Input>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: 1.5 }}>
            <Input
              select
              label="Status"
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
              slotProps={{
                select: { sx: { fontSize: '0.75rem', height: '32px', display: 'flex', alignItems: 'center' } },
              }}
            >
              <MenuItem value="" sx={{ fontSize: '0.75rem' }}>All Status</MenuItem>
              <MenuItem value="true" sx={{ fontSize: '0.75rem' }}>Active</MenuItem>
              <MenuItem value="false" sx={{ fontSize: '0.75rem' }}>Inactive</MenuItem>
            </Input>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Input
              label="From"
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              slotProps={{
                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                inputLabel: { shrink: true }
              }}
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 2 }}>
            <Input
              label="To"
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              slotProps={{
                input: { sx: { fontSize: '0.75rem', height: '32px' } },
                inputLabel: { shrink: true }
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

      {isRedirecting && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress sx={{ height: 2, borderRadius: 1 }} />
          <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block', textAlign: 'center' }}>
            Redirecting to user details...
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2, borderRadius: 1.5, fontSize: '0.8rem' }}>
          Failed to load users. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={data?.users || []}
        isLoading={isLoading}
        onView={hasPermission('users:view') ? (row: User) => handleView(row) : undefined}
        onEdit={showEditAction && hasPermission('users:update') ? (row: User) => handleEdit(row) : undefined}
        onDelete={showDeleteAction && hasPermission('users:delete') ? (row: User) => setDeleteConfirm({ open: true, user: row }) : undefined}
        onBan={showBanButton && hasPermission('users:ban') ? (row: User) => setBanConfirm({ open: true, user: row }) : undefined}
        getRowId={(row: User) => row.id}
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
        resultsOnPage={data?.users?.length || 0}
        isLoading={isLoading || isFetching}
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

      {/* Ban User Dialog */}
      <BanUserDialog
        open={banConfirm.open}
        user={banConfirm.user}
        onCancel={() => setBanConfirm({ open: false, user: null })}
        onSuccess={() => setBanConfirm({ open: false, user: null })}
      />
    </Box>
  );
}

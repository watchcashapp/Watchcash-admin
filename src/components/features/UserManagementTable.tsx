"use client";

import React, { useState } from "react";
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
} from "@mui/material";
import { Search, Add } from "@mui/icons-material";
import { useRouter } from "next/navigation";
import DataTable, { Column } from "@/components/shared/DataTable";
import { ConfirmDialog, useToast } from "@/components/shared";
import { useGetUsersQuery, useDeleteUserMutation, User } from "@/store/api/usersApi";
import { useSelector } from "react-redux";
import { RootState } from "@/store";

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
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [userType, setUserType] = useState<string>(defaultUserType);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; user: User | null }>({
    open: false,
    user: null,
  });

  // Build query params
  const queryParams: any = { page, limit };
  if (search) queryParams.search = search;
  if (isActive !== "") queryParams.isActive = isActive === "true";
  // Use userType state if not hidden, otherwise use defaultUserType if provided
  const effectiveUserType = hideUserTypeFilter ? defaultUserType : userType;
  if (effectiveUserType) queryParams.userType = effectiveUserType;

  const { data, isLoading, error, isFetching } = useGetUsersQuery(queryParams);
  const [deleteUser, { isLoading: isDeleting }] = useDeleteUserMutation();

  const handleView = (user: User) => {
    console.log('View button clicked for user:', user);
    
    // Check if view should be allowed based on user roles
    if (currentUser?.userType === 'STAFF' && user.userType === 'STAFF') {
      console.log('Staff user cannot view other staff users');
      return;
    }
    
    if (currentUser?.userType !== 'ADMIN' && currentUser?.userType !== 'STAFF') {
      console.log('Current user does not have permission to view');
      return;
    }
    
    console.log('Redirecting to:', `${viewRoute}/${user.id}`);
    router.push(`${viewRoute}/${user.id}`);
  };

  const handleEdit = (user: User) => {
    router.push(`${editRoute}/${user.id}`);
  };

  const handleDelete = async () => {
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

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    setPage(1);
  };

  return (
    <Box sx={{ width: '100%', overflow: 'hidden' }}>
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
          {title}
        </Typography>
        {showAddButton && (
          <Button
            variant="contained"
            startIcon={<Box sx={{ display: { xs: 'none', sm: 'block' } }}><Add /></Box>}
            onClick={() => router.push(addRoute)}
            sx={{
              minWidth: { xs: 'auto', sm: 120 },
              px: { xs: 2, sm: 3 },
              background: 'linear-gradient(45deg, #667eea, #764ba2)',
              '&:hover': {
                background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
              },
            }}
          >
            <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Add User</Box>
            <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
              <Add fontSize="small" />
              Add
            </Box>
          </Button>
        )}
      </Box>

      {/* Filters */}
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
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, sm: 6, md: hideUserTypeFilter ? 6 : 6 }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by name or email..."
              value={search}
              onChange={handleSearchChange}
              slotProps={{
                input: {
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667eea', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
                }
              }}
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

          {!hideUserTypeFilter && (
            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
              <TextField
                select
                fullWidth
                size="small"
                label="User Type"
                value={userType}
                onChange={(e) => {
                  setUserType(e.target.value);
                  setPage(1);
                }}
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
              >
                <MenuItem value="">All Types</MenuItem>
                <MenuItem value="APP">APP</MenuItem>
                <MenuItem value="ADMIN">ADMIN</MenuItem>
              </TextField>
            </Grid>
          )}

          <Grid size={{ xs: 12, sm: 6, md: hideUserTypeFilter ? 6 : 3 }}>
            <TextField
              select
              fullWidth
              size="small"
              label="Status"
              value={isActive}
              onChange={(e) => {
                setIsActive(e.target.value);
                setPage(1);
              }}
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
            >
              <MenuItem value="">All Status</MenuItem>
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </TextField>
          </Grid>
        </Grid>
      </Box>

      {/* Pagination Info */}
      {data && data.pagination && (
        <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            Showing {data.users.length} of {data.pagination.total} users
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Page {data.pagination.page} of {data.pagination.totalPages}
          </Typography>
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
          Failed to load users. Please try again.
        </Alert>
      )}

      <DataTable
        columns={columns}
        data={data?.users || []}
        isLoading={isLoading}
        getRowId={(row) => row.id}
        emptyMessage="No users found. Try adjusting your filters."
        onView={handleView}
        onEdit={showAddButton ? handleEdit : undefined}
        onDelete={showAddButton ? (row) => setDeleteConfirm({ open: true, user: row }) : undefined}
      />

      {/* Pagination Controls */}
      {data && data.pagination && data.pagination.totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center', gap: 2 }}>
          <button
            onClick={() => setPage(page - 1)}
            disabled={page === 1}
            style={{
              padding: '8px 16px',
              background: page === 1 ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
              color: page === 1 ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: page === 1 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            Previous
          </button>
          <span style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
            Page {page} of {data.pagination.totalPages}
          </span>
          <button
            onClick={() => setPage(page + 1)}
            disabled={page === data.pagination.totalPages}
            style={{
              padding: '8px 16px',
              background: page === data.pagination.totalPages ? '#e5e7eb' : 'linear-gradient(45deg, #667eea, #764ba2)',
              color: page === data.pagination.totalPages ? '#9ca3af' : 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: page === data.pagination.totalPages ? 'not-allowed' : 'pointer',
              fontWeight: 600,
            }}
          >
            Next
          </button>
        </Box>
      )}

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

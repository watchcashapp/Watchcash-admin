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
} from "@mui/material";
import { Search } from "@mui/icons-material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import DataTable, { Column } from "@/components/shared/DataTable";
import { useGetUsersQuery, User } from "@/store/api/usersApi";

export default function UsersPage() {
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);
  const [search, setSearch] = useState("");
  const [isActive, setIsActive] = useState<string>("");
  const [userType, setUserType] = useState<string>("");

  // Build query params
  const queryParams: any = { page, limit };
  if (search) queryParams.search = search;
  if (isActive !== "") queryParams.isActive = isActive === "true";
  if (userType) queryParams.userType = userType;

  const { data, isLoading, error } = useGetUsersQuery(queryParams);

  // Debug logging
  React.useEffect(() => {
    if (data) {
      console.log('Users API Response:', data);
    }
    if (error) {
      console.error('Users API Error:', error);
    }
  }, [data, error]);

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
    setPage(1); // Reset to first page on search
  };

  return (
    <DashboardLayout>
      <Box>
        <Typography
          variant="h4"
          gutterBottom
          sx={{
            fontWeight: 700,
            mb: 4,
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          User Management
        </Typography>

        {/* Filters */}
        <Box
          sx={{
            mb: 3,
            p: 2,
            background: 'rgba(255, 255, 255, 0.98)',
            backdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.2)',
            borderRadius: 3,
          }}
        >
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6, md: 6 }}>
              <TextField
                fullWidth
                size="small"
                placeholder="Search by name or email..."
                value={search}
                onChange={handleSearchChange}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Search sx={{ color: '#667eea', fontSize: '1.25rem' }} />
                    </InputAdornment>
                  ),
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

            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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
      </Box>
    </DashboardLayout>
  );
}

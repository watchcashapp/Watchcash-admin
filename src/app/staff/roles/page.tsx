"use client";

import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add, NavigateBefore, NavigateNext } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/shared';
import {
  useGetRolesQuery,
  Role,
} from '@/store/api/rbacApi';

export default function RolesPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  const { data: rolesData, isLoading } = useGetRolesQuery(undefined);

  const columns = [
    { id: 'name', label: 'Role Name', minWidth: 200 },
    { id: 'code', label: 'Code', minWidth: 150 },
    {
      id: 'description',
      label: 'Description',
      minWidth: 300,
      format: (value: string) => {
        if (!value) return 'N/A';
        return value.length > 30 ? `${value.substring(0, 30)}...` : value;
      },
    },
    {
      id: 'permissions',
      label: 'Permissions',
      minWidth: 120,
      format: (value: string[]) => `${value?.length || 0} permissions`,
    },
    {
      id: 'createdAt',
      label: 'Created At',
      minWidth: 150,
      format: (value: string) => {
        if (!value) return 'N/A';
        return new Date(value).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
        });
      },
    },
  ];

  // Filter roles based on search
  const filteredRoles = rolesData?.data?.filter((role: Role) =>
    role.name.toLowerCase().includes(search.toLowerCase()) ||
    role.code.toLowerCase().includes(search.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice((page - 1) * itemsPerPage, page * itemsPerPage);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
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
          Roles Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<Box sx={{ display: { xs: 'none', sm: 'block' } }}><Add /></Box>}
          onClick={() => router.push('/staff/roles/add')}
          sx={{
            minWidth: { xs: 'auto', sm: 120 },
            px: { xs: 2, sm: 3 },
            background: 'linear-gradient(45deg, #667eea, #764ba2)',
            '&:hover': {
              background: 'linear-gradient(45deg, #5a67d8, #6a3f92)',
            },
          }}
        >
          <Box sx={{ display: { xs: 'none', sm: 'block' } }}>Add Role</Box>
          <Box sx={{ display: { xs: 'flex', sm: 'none' }, alignItems: 'center', gap: 0.5 }}>
            <Add fontSize="small" />
            Add
          </Box>
        </Button>
      </Box>

      {/* Search Filter */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          bgcolor: 'background.paper',
          boxShadow: (theme) => theme.palette.mode === 'dark'
            ? '0 4px 12px rgba(0, 0, 0, 0.3)'
            : '0 4px 12px rgba(0, 0, 0, 0.05)',
          border: (theme) => theme.palette.mode === 'dark'
            ? '1px solid rgba(255, 255, 255, 0.1)'
            : '1px solid rgba(0, 0, 0, 0.08)',
        }}
      >
        <TextField
          label="Search"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          size="small"
          sx={{ minWidth: 300 }}
          placeholder="Search by role name or code"
        />
      </Paper>

      {/* Roles Table */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
          <CircularProgress />
        </Box>
      ) : (
        <>
          <DataTable
            columns={columns}
            data={paginatedRoles}
            getRowId={(row) => row.id}
            onEdit={(row) => router.push(`/staff/roles/${row.id}`)}
          />

          {/* Pagination */}
          {filteredRoles.length > 0 && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Showing {paginatedRoles.length} of {filteredRoles.length} results
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton
                  size="small"
                  onClick={() => setPage(page - 1)}
                  disabled={page <= 1}
                  sx={{
                    bgcolor: page <= 1 ? 'action.disabled' : 'primary.main',
                    color: page <= 1 ? 'text.disabled' : 'white',
                    '&:hover': {
                      bgcolor: page <= 1 ? 'action.disabled' : 'primary.dark',
                    },
                  }}
                >
                  <NavigateBefore />
                </IconButton>
                <Typography variant="body2" sx={{ mx: 1, minWidth: '60px', textAlign: 'center' }}>
                  {page} / {totalPages || 1}
                </Typography>
                <IconButton
                  size="small"
                  onClick={() => setPage(page + 1)}
                  disabled={page >= (totalPages || 1)}
                  sx={{
                    bgcolor: page >= (totalPages || 1) ? 'action.disabled' : 'primary.main',
                    color: page >= (totalPages || 1) ? 'text.disabled' : 'white',
                    '&:hover': {
                      bgcolor: page >= (totalPages || 1) ? 'action.disabled' : 'primary.dark',
                    },
                  }}
                >
                  <NavigateNext />
                </IconButton>
              </Box>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}

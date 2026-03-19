"use client";

import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
} from '@mui/material';
import { Add, NavigateBefore, NavigateNext, Search } from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { DataTable } from '@/components/shared';
import {
  useGetRolesQuery,
  Role,
} from '@/store/api/rbacApi';
import { usePermissions } from '@/hooks/usePermissions';

export default function RolesPage() {
  const { hasPermission, isInitialized } = usePermissions();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isMounted && isInitialized && !hasPermission('rbac:manage_roles')) {
      router.push('/dashboard');
    }
  }, [isMounted, isInitialized, hasPermission, router]);

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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            fontSize: '1.1rem',
            background: 'linear-gradient(45deg, #213350, #6AB344)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          User Roles
        </Typography>
        {hasPermission('roles:create') && (
          <Button
            variant="contained"
            startIcon={<Add sx={{ fontSize: '1rem !important' }} />}
            onClick={() => router.push('/staff/roles/add')}
            sx={{
              height: '30px',
              fontSize: '0.75rem',
              background: 'linear-gradient(45deg, #213350, #6AB344)',
              boxShadow: '0 2px 8px rgba(33, 51, 80, 0.3)',
              '&:hover': {
                background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.4)',
              },
            }}
          >
            ADD ROLE
          </Button>
        )}
      </Box>

      <Paper sx={{
        p: 1.5,
        mb: 2,
        borderRadius: 2,
        boxShadow: '0 2px 10px rgba(0,0,0,0.05)',
        border: '1px solid',
        borderColor: 'divider',
      }}>
        <TextField
          placeholder="Search roles..."
          variant="outlined"
          size="small"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          slotProps={{
            input: {
              sx: { fontSize: '0.75rem', height: '32px' },
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ fontSize: '1rem', color: 'text.secondary' }} />
                </InputAdornment>
              ),
            },
            inputLabel: {
              sx: { fontSize: '0.75rem' },
              shrink: true
            }
          }}
          sx={{
            width: { xs: '100%', sm: 300 },
            '& .MuiInputLabel-root': {
              transform: 'translate(14px, -6px) scale(0.75)',
              bgcolor: 'background.paper',
              px: 0.5,
            },
            '& .MuiInputLabel-shrink': {
              transform: 'translate(14px, -6px) scale(0.75)',
            },
          }}
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
            onEdit={hasPermission('rbac:update') ? (row) => router.push(`/staff/roles/${row.id}`) : undefined}
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

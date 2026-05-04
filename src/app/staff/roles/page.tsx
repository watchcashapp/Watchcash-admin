"use client";

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Add, NavigateBefore, NavigateNext, Search } from '@mui/icons-material';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { DataTable, PermissionGuard, Button, Input } from '@/components/shared';
import { useGetRolesQuery, Role } from '@/store/api/rbacApi';

export default function RolesPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const [search, setSearch] = useState(searchParams.get('search') || '');
  const [debouncedSearch, setDebouncedSearch] = useState(searchParams.get('search') || '');
  const [page, setPage] = useState(1);
  const itemsPerPage = 6;

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(search);
    }, 500);

    return () => clearTimeout(handler);
  }, [search]);
  
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
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;
      // Use window.history.replaceState to update URL without losing focus
      window.history.replaceState({ ...window.history.state, as: newUrl, url: newUrl }, '', newUrl);
    }
  }, [debouncedSearch, pathname, router, searchParams]);

  const { data: rolesData, isLoading } = useGetRolesQuery({ search: debouncedSearch });

  const columns = useMemo(() => [
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
  ], []);

  // Filter roles based on search
  // Filter roles based on search (as fallback if server-side is exact match)
  const filteredRoles = useMemo(() => rolesData?.data || [], [rolesData]);

  const totalPages = useMemo(() => Math.ceil(filteredRoles.length / itemsPerPage), [filteredRoles.length]);
  const paginatedRoles = useMemo(() => filteredRoles.slice((page - 1) * itemsPerPage, page * itemsPerPage), [filteredRoles, page]);

  return (
    <PermissionGuard permission="staff:assign_roles">
      <Box>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
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
            User Roles
          </Typography>
          <PermissionGuard permission="roles:create" simple>
            <Button
              variant="contained"
              startIcon={<Add sx={{ fontSize: '1rem !important' }} />}
              onClick={() => router.push('/staff/roles/add')}
              sx={{
                height: '30px',
                minHeight: '30px',
                fontSize: '0.75rem',
                background: 'linear-gradient(45deg, #213350, #6AB344)',
                boxShadow: '0 4px 12px rgba(33, 51, 80, 0.2)',
                px: 2,
                '&:hover': {
                  background: 'linear-gradient(45deg, #1a2940, #6AB344)',
                  boxShadow: '0 6px 16px rgba(33, 51, 80, 0.3)',
                },
              }}
            >
              ADD ROLE
            </Button>
          </PermissionGuard>
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
            placeholder="Search roles..."
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
            }}
            sx={{ width: { xs: '100%', sm: 300 } }}
          />
        </Paper>

        <DataTable
          columns={columns}
          data={paginatedRoles}
          isLoading={isLoading}
          getRowId={(row: Role) => row.id}
          onEdit={(row: Role) => {
            router.push(`/staff/roles/${row.id}`);
          }}
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
              >
                <NavigateNext />
              </IconButton>
            </Box>
          </Box>
        )}
      </Box>
    </PermissionGuard>
  );
}

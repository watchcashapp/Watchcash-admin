"use client";

import React, { useMemo } from "react";
import { Box, Typography, CircularProgress, Chip, IconButton } from "@mui/material";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { DataTable, Column } from "@/components/shared";
import { useGetUserLoginHistoryQuery, LoginHistory } from "@/store/api/usersApi";
import { useCursorPagination } from "@/hooks/useCursorPagination";

interface UserLoginsTabProps {
  userId: string;
}

export default function UserLoginsTab({ userId }: UserLoginsTabProps) {
  const { cursor, pageNumber, canGoBack, goNext, goPrevious } = useCursorPagination();

  const { data, isLoading } = useGetUserLoginHistoryQuery({
    userId,
    cursor,
    limit: 6,
  });

  const columns = useMemo<Column<LoginHistory>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString(),
    },
    { id: 'ip', label: 'IP Address', minWidth: 120 },
    {
      id: 'isAdmin',
      label: 'Admin',
      align: 'center',
      minWidth: 100,
      format: (value: boolean) => (
        <Chip label={value ? 'Admin' : 'App User'} size="small" sx={{ background: value ? 'linear-gradient(45deg, #213350, #6AB344)' : 'linear-gradient(45deg, #10b981, #059669)', color: 'white' }} />
      ),
    },
    {
      id: 'userAgent',
      label: 'User Agent',
      minWidth: 250,
      format: (value: string) => (
        <Typography variant="caption" sx={{ display: 'block', maxWidth: 250, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={value}>
          {value}
        </Typography>
      )
    }
  ], []);

  if (isLoading && !data) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  return (
    <Box>
      {data?.items.length ? (
        <>
          <DataTable columns={columns} data={data.items} getRowId={(row: any) => row.id} />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">Showing {data.items.length} results</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton size="small" onClick={goPrevious} disabled={!canGoBack}><NavigateBefore /></IconButton>
                <Typography variant="caption">Page {pageNumber}</Typography>
                <IconButton size="small" onClick={() => goNext(data.pagination.nextCursor)} disabled={!data.pagination.hasMore}><NavigateNext /></IconButton>
            </Box>
          </Box>
        </>
      ) : (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <Typography color="text.secondary">No login history found</Typography>
        </Box>
      )}
    </Box>
  );
}

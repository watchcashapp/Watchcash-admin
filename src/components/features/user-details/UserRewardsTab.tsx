"use client";

import React, { useMemo } from "react";
import { Box, Typography, CircularProgress, Chip, IconButton } from "@mui/material";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { DataTable, Column } from "@/components/shared";
import { useGetUserRedeemHistoryQuery } from "@/store/api/usersApi";
import { useCursorPagination } from "@/hooks/useCursorPagination";
import { useRouter } from "next/navigation";

interface UserRewardsTabProps {
  userId: string;
}

function getStatusBadgeColor(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'PROCESSED':
      return 'linear-gradient(45deg, #10b981, #059669)';
    case 'PENDING':
      return 'linear-gradient(45deg, #f59e0b, #d97706)';
    case 'REJECTED':
    case 'FAILED':
      return 'linear-gradient(45deg, #ef4444, #dc2626)';
    default:
      return 'linear-gradient(45deg, #9ca3af, #4b5563)';
  }
}

export default function UserRewardsTab({ userId }: UserRewardsTabProps) {
  const router = useRouter();
  const { cursor, pageNumber, canGoBack, goNext, goPrevious } = useCursorPagination();

  const { data, isLoading } = useGetUserRedeemHistoryQuery({
    userId,
    cursor,
    limit: 10,
  });

  const columns = useMemo<Column<any>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString(),
    },
    { id: 'rewardType', label: 'Reward Type', minWidth: 150 },
    {
      id: 'points',
      label: 'Points',
      align: 'right',
      minWidth: 100,
      format: (value: number) => (
        <Typography sx={{ fontWeight: 600, color: '#ef4444' }}>-{value}</Typography>
      ),
    },
    {
      id: 'status',
      label: 'Status',
      align: 'center',
      minWidth: 120,
      format: (value: string) => (
        <Chip label={value} size="small" sx={{ background: getStatusBadgeColor(value), color: 'white' }} />
      ),
    },
  ], []);

  if (isLoading && !data) return (
    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
      <CircularProgress size={32} />
    </Box>
  );

  return (
    <Box>
      {data?.items.length ? (
        <>
          <DataTable columns={columns} data={data.items} getRowId={(row: any) => row.id} onView={(row: any) => router.push(`/reward-redemptions/${row.id}`)} />
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
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
          <Typography color="text.secondary">No redemption history found</Typography>
        </Box>
      )}
    </Box>
  );
}

"use client";

import React, { useMemo } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Chip, IconButton } from "@mui/material";
import { NavigateBefore, NavigateNext } from "@mui/icons-material";
import { DataTable, Column } from "@/components/shared";
import { useGetUserWalletQuery, WalletTransaction } from "@/store/api/usersApi";
import { useCursorPagination } from "@/hooks/useCursorPagination";

interface UserWalletTabProps {
  userId: string;
}

export default function UserWalletTab({ userId }: UserWalletTabProps) {
  const { cursor, pageNumber, canGoBack, goNext, goPrevious, reset } = useCursorPagination();

  const { data, isLoading } = useGetUserWalletQuery({
    userId,
    cursor,
    limit: 6,
  });

  const columns = useMemo<Column<WalletTransaction>[]>(() => [
    {
      id: 'createdAt',
      label: 'Date',
      minWidth: 150,
      format: (value: string) => new Date(value).toLocaleString(),
    },
    {
      id: 'transactionType',
      label: 'Type',
      align: 'center',
      minWidth: 100,
      format: (value: string) => (
        <Chip 
          label={value} 
          size="small" 
          sx={{ 
            background: value === 'CREDIT' ? 'linear-gradient(45deg, #10b981, #059669)' : 'linear-gradient(45deg, #ef4444, #dc2626)',
            color: 'white'
          }} 
        />
      ),
    },
    {
      id: 'amount',
      label: 'Amount',
      align: 'right',
      minWidth: 100,
      format: (value: number, row: WalletTransaction) => (
        <Typography sx={{ fontWeight: 600, color: row.transactionType === 'CREDIT' ? '#10b981' : '#ef4444' }}>
          {row.transactionType === 'CREDIT' ? '+' : '-'}{Math.abs(value)}
        </Typography>
      ),
    },
    { id: 'reasonCode', label: 'Reason', minWidth: 150 },
    { id: 'note', label: 'Note', minWidth: 200, format: (v: string) => v || 'N/A' },
  ], []);

  if (isLoading && !data) return <CircularProgress />;

  return (
    <Box>
      {data && (
        <Card sx={{ mb: 3, border: '1px solid rgba(0,0,0,0.08)' }}>
          <CardContent>
            <Typography variant="caption" color="text.secondary">Current Balance</Typography>
            <Typography variant="h5" sx={{ fontWeight: 700, color: 'primary.main' }}>
              {data.walletBalance.toLocaleString()} Points
            </Typography>
          </CardContent>
        </Card>
      )}
      {data?.transactions.length ? (
        <>
          <DataTable columns={columns} data={data.transactions} getRowId={(row: any) => row.id} />
          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="caption" color="text.secondary">Showing {data.transactions.length} results</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                <IconButton size="small" onClick={goPrevious} disabled={!canGoBack}><NavigateBefore /></IconButton>
                <Typography variant="caption">Page {pageNumber}</Typography>
                <IconButton size="small" onClick={() => goNext(data.pagination.nextCursor)} disabled={!data.pagination.hasMore}><NavigateNext /></IconButton>
            </Box>
          </Box>
        </>
      ) : <Typography color="text.secondary">No transactions found</Typography>}
    </Box>
  );
}

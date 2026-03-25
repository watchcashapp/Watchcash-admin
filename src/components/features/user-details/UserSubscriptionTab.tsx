"use client";

import React, { useMemo } from "react";
import { Box, Typography, Card, CardContent, CircularProgress, Grid, Chip } from "@mui/material";
import { DataTable, Column } from "@/components/shared";
import { useGetUserSubscriptionQuery, SubscriptionLog } from "@/store/api/usersApi";

interface UserSubscriptionTabProps {
  userId: string;
}

export default function UserSubscriptionTab({ userId }: UserSubscriptionTabProps) {
  const { data: subscriptionData, isLoading } = useGetUserSubscriptionQuery({
    userId,
    logsLimit: 6,
    planLimit: 6,
  });

  const subscriptionLogColumns = useMemo<Column<SubscriptionLog>[]>(() => [
    { id: 'createdAt', label: 'Date', minWidth: 150, format: (v: string) => new Date(v).toLocaleString() },
    { id: 'amount', label: 'Amount', minWidth: 100, format: (v: string, row: any) => `${v} ${row.currency}` },
    { id: 'status', label: 'Status', minWidth: 150, format: (v: string) => <Chip label={v} size="small" sx={{ fontSize: '0.65rem' }} /> },
  ], []);

  if (isLoading && !subscriptionData) return <CircularProgress />;

  return (
    <Box>
      {subscriptionData?.subscription ? (
        <Grid container spacing={2}>
          <Grid size={{ xs: 12 }}>
            <Card sx={{ border: '1px solid rgba(0,0,0,0.08)' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Active Plan</Typography>
                <Typography variant="body1">Plan: {subscriptionData.subscription.plan}</Typography>
                <Typography variant="body2" color="text.secondary">Status: {subscriptionData.subscription.status}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ mt: 2, mb: 1, fontWeight: 700 }}>Transaction Logs</Typography>
            <DataTable 
              columns={subscriptionLogColumns} 
              data={subscriptionData.logs?.items || []} 
              getRowId={(row: SubscriptionLog) => row.id} 
              emptyMessage="No subscription logs found"
            />
          </Grid>
        </Grid>
      ) : <Typography color="text.secondary">No active subscription found</Typography>}
    </Box>
  );
}

"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";

export default function BillingCancelPage() {
  const router = useRouter();

  return (
    <Box
        sx={{
          minHeight: "80vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          bgcolor: "background.default",
          p: 2,
        }}
      >
        <Card sx={{ maxWidth: 480, width: "100%", textAlign: "center" }}>
          <CardContent sx={{ p: 4 }}>
            <Typography variant="h5" component="h1" gutterBottom color="error.main">
              Payment cancelled
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              The billing flow was cancelled. No charges were made.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              onClick={() => router.push("/dashboard")}
            >
              Back to dashboard
            </Button>
          </CardContent>
        </Card>
    </Box>
  );
}

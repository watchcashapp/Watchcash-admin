"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { useRouter } from "next/navigation";

export default function BillingSuccessPage() {
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
            <Typography variant="h5" component="h1" gutterBottom color="success.main">
              Payment successful
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Thank you. Your billing payment was processed successfully.
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


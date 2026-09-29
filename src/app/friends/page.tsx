"use client";

import { Box, Card, CardContent, Typography, Button } from "@mui/material";
import { useRouter } from "next/navigation";

/** Simple landing page used by the accept-invitation success CTA. */
export default function FriendsListPage() {
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
          <Typography variant="h5" component="h1" gutterBottom>
            Friends
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Your friends list will appear here.
          </Typography>
          <Button variant="contained" onClick={() => router.push("/dashboard")}>
            Back to dashboard
          </Button>
        </CardContent>
      </Card>
    </Box>
  );
}

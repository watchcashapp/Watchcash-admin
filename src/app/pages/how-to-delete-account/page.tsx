"use client";

import React, { useState } from "react";
import {
  Box,
  Container,
  Typography,
  Tabs,
  Tab,
  Paper,
  Link,
  IconButton,
  Tooltip,
} from "@mui/material";
import AndroidIcon from "@mui/icons-material/Android";
import AppleIcon from "@mui/icons-material/Apple";
import ContentCopyIcon from "@mui/icons-material/ContentCopy";
import PublicFooter from "@/components/shared/PublicFooter";

type Platform = "android" | "ios";

const STEPS: Record<Platform, string[]> = {
  android: [
    "Open the WatchCash app on your Android device.",
    "Tap Profile at the bottom of the screen.",
    "Tap Settings (gear icon).",
    "Scroll down and tap Delete account.",
    "Review the warning, then tap Delete my account to confirm.",
  ],
  ios: [
    "Open the WatchCash app on your iPhone or iPad.",
    "Tap Profile at the bottom of the screen.",
    "Tap Settings (gear icon).",
    "Scroll down and tap Delete account.",
    "Review the warning, then tap Delete my account to confirm.",
  ],
};

const AFTER_DELETE = [
  "Permanently remove your WatchCash account and login access.",
  "Delete your points balance, session history, and reward redemption records.",
  "Cancel any pending redemptions that have not yet been processed.",
];

export default function HowToDeleteAccountPage() {
  const [platform, setPlatform] = useState<Platform>("android");
  const [copied, setCopied] = useState(false);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
      }}
    >
      <Container maxWidth="md" sx={{ flex: 1, py: { xs: 3, md: 5 }, px: { xs: 2, md: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            gap: 2,
            mb: 3,
          }}
        >
          <Typography
            component="h1"
            sx={{
              fontWeight: 700,
              fontSize: { xs: "1.75rem", md: "2.125rem" },
              lineHeight: 1.2,
              color: "text.primary",
            }}
          >
            How to delete your account
          </Typography>
          <Tooltip title={copied ? "Copied!" : "Copy page link"}>
            <IconButton
              onClick={handleCopyLink}
              aria-label="Copy page link"
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 2,
                flexShrink: 0,
              }}
            >
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Tabs
          value={platform}
          onChange={(_, value: Platform) => setPlatform(value)}
          sx={{
            mb: 3,
            minHeight: 48,
            "& .MuiTabs-indicator": {
              height: 3,
              borderRadius: "3px 3px 0 0",
              bgcolor: "#6AB344",
            },
          }}
        >
          <Tab
            value="android"
            icon={<AndroidIcon />}
            iconPosition="start"
            label="Android"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
          />
          <Tab
            value="ios"
            icon={<AppleIcon />}
            iconPosition="start"
            label="iOS"
            sx={{ textTransform: "none", fontWeight: 600, minHeight: 48 }}
          />
        </Tabs>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            mb: 3,
            borderRadius: 2,
            bgcolor: (theme) =>
              theme.palette.mode === "dark" ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
            border: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography variant="body1" sx={{ lineHeight: 1.7 }}>
            <Box component="span" sx={{ fontWeight: 700 }}>
              Note:
            </Box>{" "}
            Deleting your account is permanent. This action cannot be undone, and your data
            cannot be recovered even if you reinstall the app.
          </Typography>
        </Paper>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 2, lineHeight: 1.75 }}>
          Before you delete your account, make sure you can still sign in with the email or phone
          number linked to your WatchCash profile. If you use WatchCash on multiple devices, sign
          out on those devices or remove them from{" "}
          <Link href="/pages/privacy-policy" underline="hover" color="primary">
            linked devices
          </Link>{" "}
          in the app settings when possible.
        </Typography>

        <Typography variant="body1" color="text.secondary" sx={{ mb: 4, lineHeight: 1.75 }}>
          After deletion, your session history, points, and reward data cannot be restored. We
          recommend redeeming or withdrawing any available balance before continuing.
        </Typography>

        <Typography
          component="h2"
          sx={{ fontWeight: 700, fontSize: "1.125rem", mb: 2 }}
        >
          To delete your account
        </Typography>

        <Box
          component="ol"
          sx={{
            pl: 3,
            mb: 4,
            "& li": {
              mb: 1.5,
              lineHeight: 1.75,
              color: "text.secondary",
            },
          }}
        >
          {STEPS[platform].map((step, index) => (
            <li key={`${platform}-${index}`}>
              <Typography component="span" variant="body1" color="text.secondary">
                {step}
              </Typography>
            </li>
          ))}
        </Box>

        <Typography
          component="h2"
          sx={{ fontWeight: 700, fontSize: "1.125rem", mb: 2 }}
        >
          Deleting your account will:
        </Typography>

        <Box
          component="ul"
          sx={{
            pl: 3,
            mb: 2,
            "& li": {
              mb: 1.25,
              lineHeight: 1.75,
              color: "text.secondary",
            },
          }}
        >
          {AFTER_DELETE.map((item) => (
            <li key={item}>
              <Typography component="span" variant="body1" color="text.secondary">
                {item}
              </Typography>
            </li>
          ))}
        </Box>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 3 }}>
          Need help? Contact support at{" "}
          <Link href="mailto:support@watchncash.com" underline="hover" color="primary">
            support@watchncash.com
          </Link>
          . See also our{" "}
          <Link href="/pages/privacy-policy" underline="hover" color="primary">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link href="/pages/terms-and-conditions" underline="hover" color="primary">
            Terms &amp; Conditions
          </Link>
          .
        </Typography>
      </Container>

      <PublicFooter />
    </Box>
  );
}

"use client";

import React, { useState, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from "@mui/material";
import { Block } from "@mui/icons-material";
import { Input, Textarea, useToast } from "@/components/shared";
import { BanReasonCode, useBanUserMutation, User } from "@/store/api/usersApi";

/** Human-readable labels for ban reason codes */
const BAN_REASON_LABELS: Record<BanReasonCode, string> = {
  [BanReasonCode.ACCOUNT_DELETED]: "Account Deleted",
  [BanReasonCode.USER_BANNED]: "User Banned",
  [BanReasonCode.KYC_VERIFICATION_FAILED]: "KYC Verification Failed",
  [BanReasonCode.IDENTITY_MISMATCH]: "Identity Mismatch",
  [BanReasonCode.FRAUD_SUSPICION]: "Fraud Suspicion",
  [BanReasonCode.CHARGEBACK_DISPUTE]: "Chargeback Dispute",
  [BanReasonCode.PAYMENT_FRAUD]: "Payment Fraud",
  [BanReasonCode.PAYMENT_ABUSE]: "Payment Abuse",
  [BanReasonCode.MULTI_ACCOUNTING]: "Multi Accounting",
  [BanReasonCode.BOT_ACTIVITY]: "Bot Activity",
  [BanReasonCode.TERMS_VIOLATION]: "Terms Violation",
  [BanReasonCode.ILLEGAL_ACTIVITY]: "Illegal Activity",
  [BanReasonCode.SCAM_REPORT]: "Scam Report",
  [BanReasonCode.CHEATING_OR_EXPLOITING]: "Cheating or Exploiting",
  [BanReasonCode.REWARD_MANIPULATION]: "Reward Manipulation",
  [BanReasonCode.WALLET_ABUSE]: "Wallet Abuse",
  [BanReasonCode.LEDGER_DISPUTE]: "Ledger Dispute",
  [BanReasonCode.DOUBLE_SPEND_SUSPECTED]: "Double Spend Suspected",
  [BanReasonCode.RISK_SCORE_HIGH]: "Risk Score High",
  [BanReasonCode.REPEATED_POLICY_VIOLATIONS]: "Repeated Policy Violations",
  [BanReasonCode.SPAM_OR_ABUSE]: "Spam or Abuse",
  [BanReasonCode.HARASSMENT]: "Harassment",
  [BanReasonCode.CONTENT_VIOLATION]: "Content Violation",
  [BanReasonCode.ACCOUNT_TAKEOVER]: "Account Takeover",
  [BanReasonCode.UNAUTHORIZED_ACCESS]: "Unauthorized Access",
  [BanReasonCode.REFERRAL_ABUSE]: "Referral Abuse",
  [BanReasonCode.DEVICE_TAMPERING]: "Device Tampering",
  [BanReasonCode.SYSTEM_ERROR_MITIGATION]: "System Error Mitigation",
};

/** Pre-computed menu items to avoid re-creating on every render */
const REASON_CODE_OPTIONS = Object.values(BanReasonCode);

interface BanUserDialogProps {
  open: boolean;
  user: User | null;
  onCancel: () => void;
  onSuccess: () => void;
}

function BanUserDialog({ open, user, onCancel, onSuccess }: BanUserDialogProps) {
  const { showSuccess, showError } = useToast();
  const [banUser, { isLoading }] = useBanUserMutation();

  const [reasonCode, setReasonCode] = useState<BanReasonCode | "">("");
  const [durationSeconds, setDurationSeconds] = useState("86400");
  const [note, setNote] = useState("");

  const resetForm = useCallback(() => {
    setReasonCode("");
    setDurationSeconds("86400");
    setNote("");
  }, []);

  const handleCancel = useCallback(() => {
    resetForm();
    onCancel();
  }, [resetForm, onCancel]);

  const isValid = useMemo(
    () => reasonCode !== "" && Number(durationSeconds) > 0 && note.trim() !== "",
    [reasonCode, durationSeconds, note]
  );

  const handleBan = useCallback(async () => {
    if (!user || !reasonCode) return;

    try {
      await banUser({
        id: user.id,
        data: {
          reasonCode: reasonCode as BanReasonCode,
          durationSeconds: Number(durationSeconds),
          note,
        },
      }).unwrap();
      showSuccess(`${user.name} has been banned successfully`);
      resetForm();
      onSuccess();
    } catch (err: any) {
      showError(err?.data?.message || "Failed to ban user");
    }
  }, [user, reasonCode, durationSeconds, note, banUser, showSuccess, showError, resetForm, onSuccess]);

  return (
    <Dialog
      open={open}
      onClose={isLoading ? undefined : handleCancel}
      maxWidth="sm"
      fullWidth
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            bgcolor: "background.paper",
            backdropFilter: "blur(20px)",
            boxShadow: (theme) =>
              theme.palette.mode === "dark"
                ? "0 8px 32px rgba(0, 0, 0, 0.6)"
                : "0 8px 32px rgba(0, 0, 0, 0.1)",
            border: (theme) =>
              theme.palette.mode === "dark"
                ? "1px solid rgba(255, 255, 255, 0.1)"
                : "1px solid rgba(0, 0, 0, 0.05)",
          },
        },
      }}
    >
      <DialogTitle sx={{ pb: 1 }}>
        <Box display="flex" alignItems="center" gap={1.5}>
          <Block sx={{ color: "#ef4444", fontSize: "2rem" }} />
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 600 }}>
              Ban User
            </Typography>
            {user && (
              <Typography variant="body2" color="text.secondary" sx={{ fontSize: "0.8rem" }}>
                {user.name} ({user.email})
              </Typography>
            )}
          </Box>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: "8px !important" }}>
        {/* Reason Code Dropdown */}
        <FormControl fullWidth size="small">
          <InputLabel sx={{ fontSize: "0.85rem" }}>Reason Code *</InputLabel>
          <Select
            value={reasonCode}
            label="Reason Code *"
            onChange={(e) => setReasonCode(e.target.value as BanReasonCode)}
            sx={{
              fontSize: "0.8rem",
              height: "42px",
              '& .MuiSelect-select': { display: 'flex', alignItems: 'center' },
            }}
            MenuProps={{
              PaperProps: { sx: { maxHeight: 200 } },
            }}
          >
            <MenuItem value="" disabled sx={{ fontSize: "0.75rem", py: 0.3 }}>
              Select a reason
            </MenuItem>
            {REASON_CODE_OPTIONS.map((code) => (
              <MenuItem key={code} value={code} sx={{ fontSize: "0.75rem", py: 0.3 }}>
                {BAN_REASON_LABELS[code]}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Duration */}
        <Input
          label="Duration (seconds) *"
          type="number"
          value={durationSeconds}
          onChange={(e) => setDurationSeconds(e.target.value)}
          helperText="Default: 86400 (24 hours)"
          slotProps={{
            input: { sx: { fontSize: "0.8rem", height: "38px" } },
          }}
        />

        {/* Note */}
        <Textarea
          label="Note *"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Please provide a detailed reason for banning this user..."
          sx={{ fontSize: "0.8rem" }}
        />
      </DialogContent>

      <DialogActions sx={{ p: 3, pt: 1 }}>
        <Button
          onClick={handleCancel}
          disabled={isLoading}
          sx={{
            minWidth: 100,
            color: "text.secondary",
            "&:hover": { backgroundColor: "rgba(0, 0, 0, 0.04)" },
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleBan}
          disabled={isLoading || !isValid}
          variant="contained"
          sx={{
            minWidth: 100,
            background: "linear-gradient(45deg, #ef4444, #dc2626)",
            boxShadow: "0 4px 12px rgba(239, 68, 68, 0.4)",
            "&:hover": {
              background: "linear-gradient(45deg, #dc2626, #b91c1c)",
              boxShadow: "0 6px 16px rgba(239, 68, 68, 0.5)",
            },
            "&:disabled": {
              background: "rgba(239, 68, 68, 0.3)",
              color: "rgba(255,255,255,0.5)",
            },
          }}
        >
          {isLoading ? "Banning..." : "Ban User"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default React.memo(BanUserDialog);

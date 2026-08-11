"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  CircularProgress,
} from "@mui/material";
import { useRouter, useSearchParams } from "next/navigation";
import { useAcceptFriendInvitationMutation } from "@/store/api/friendsApi";

type AcceptViewState =
  | "loading"
  | "missing_token"
  | "success"
  | "already_friends"
  | "expired"
  | "not_pending"
  | "not_found"
  | "error";

function getApiErrorCode(error: unknown): string | undefined {
  if (!error || typeof error !== "object") return undefined;
  const err = error as {
    status?: number | string;
    data?: {
      code?: string;
      errorCode?: string;
      error?: string | { code?: string };
      message?: string;
      details?: { code?: string };
    };
  };

  const data = err.data;
  if (!data) return undefined;

  if (typeof data.code === "string") return data.code;
  if (typeof data.errorCode === "string") return data.errorCode;
  if (typeof data.error === "string") return data.error;
  if (data.error && typeof data.error === "object" && typeof data.error.code === "string") {
    return data.error.code;
  }
  if (data.details && typeof data.details.code === "string") return data.details.code;
  return undefined;
}

function getHttpStatus(error: unknown): number | undefined {
  if (!error || typeof error !== "object") return undefined;
  const status = (error as { status?: number | string }).status;
  return typeof status === "number" ? status : undefined;
}

function FriendsAcceptContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = (searchParams.get("token") || "").trim();

  const [acceptInvitation] = useAcceptFriendInvitationMutation();

  const [viewState, setViewState] = useState<AcceptViewState>(
    token ? "loading" : "missing_token"
  );
  const [inviterName, setInviterName] = useState("your friend");
  const [errorMessage, setErrorMessage] = useState("Something went wrong. Please try again.");
  const didSubmit = useRef(false);

  useEffect(() => {
    if (!token) {
      setViewState("missing_token");
      return;
    }

    if (didSubmit.current) return;
    didSubmit.current = true;

    const run = async () => {
      setViewState("loading");
      try {
        const result = await acceptInvitation({ token }).unwrap();
        const name = result?.invitation?.inviter?.name?.trim();
        if (name) setInviterName(name);
        setViewState("success");
      } catch (error: unknown) {
        const httpStatus = getHttpStatus(error);
        const code = (getApiErrorCode(error) || "").toUpperCase();

        if (httpStatus === 404 || code === "INVITATION_NOT_FOUND") {
          setViewState("not_found");
          return;
        }

        if (httpStatus === 409 || code === "ALREADY_FRIENDS") {
          setViewState("already_friends");
          return;
        }

        if (code === "INVITATION_EXPIRED") {
          setViewState("expired");
          return;
        }

        if (code === "INVITATION_NOT_PENDING") {
          setViewState("not_pending");
          return;
        }

        const dataMessage =
          error &&
          typeof error === "object" &&
          "data" in error &&
          (error as { data?: { message?: string } }).data?.message;

        setErrorMessage(
          typeof dataMessage === "string" && dataMessage.trim()
            ? dataMessage
            : "Something went wrong while accepting this invitation."
        );
        setViewState("error");
      }
    };

    void run();
  }, [token, acceptInvitation]);

  const titleByState: Record<AcceptViewState, string> = {
    loading: "Accepting invitation…",
    missing_token: "Invalid invitation",
    success: "You're friends!",
    already_friends: "Already friends",
    expired: "Invitation expired",
    not_pending: "Invitation unavailable",
    not_found: "Invitation not found",
    error: "Could not accept invitation",
  };

  const bodyByState: Record<AcceptViewState, string> = {
    loading: "Please wait while we confirm your invitation.",
    missing_token: "Invalid or missing invitation link.",
    success: `You are now friends with ${inviterName}!`,
    already_friends: "You're already friends!",
    expired: "This invitation has expired. Ask your friend to send a new one.",
    not_pending: "This invitation has already been used or cancelled.",
    not_found: "Invitation not found. The link may be invalid.",
    error: errorMessage,
  };

  const showFriendsCta = viewState === "success" || viewState === "already_friends";

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
          {viewState === "loading" ? (
            <Box display="flex" flexDirection="column" alignItems="center" gap={2}>
              <CircularProgress size={40} />
              <Typography variant="h6" component="h1">
                {titleByState.loading}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {bodyByState.loading}
              </Typography>
            </Box>
          ) : (
            <>
              <Typography
                variant="h5"
                component="h1"
                gutterBottom
                color={
                  viewState === "success" || viewState === "already_friends"
                    ? "success.main"
                    : "error.main"
                }
              >
                {titleByState[viewState]}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                {bodyByState[viewState]}
              </Typography>
              {showFriendsCta ? (
                <Button variant="contained" color="primary" onClick={() => router.push("/friends")}>
                  View friends
                </Button>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>
    </Box>
  );
}

export default function FriendsAcceptPage() {
  return (
    <Suspense
      fallback={
        <Box
          sx={{
            minHeight: "80vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <CircularProgress />
        </Box>
      }
    >
      <FriendsAcceptContent />
    </Suspense>
  );
}

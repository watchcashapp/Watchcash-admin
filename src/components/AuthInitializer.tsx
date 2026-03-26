"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setAuthLoading, setInitialized, setAuthenticatedWithTokens } from '@/store/slices/authSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getTokenFromCookie, decodeAccessToken } from '@/utils/auth';
import { useGetProfileQuery } from '@/store/api/authApi';

interface AuthInitializerProps {
  initialAuth?: {
    accessToken?: string;
    refreshToken?: string;
  };
}

export default function AuthInitializer({ initialAuth }: AuthInitializerProps) {
  const dispatch = useDispatch();
  const accessToken = initialAuth?.accessToken || getTokenFromCookie('accessToken');
  const refreshToken = initialAuth?.refreshToken || getTokenFromCookie('refreshToken');

  const hasTokens = !!(accessToken && refreshToken);
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    if (hasTokens && !isAuthenticated) {
      const basicUser = decodeAccessToken(accessToken!);
      dispatch(setAuthenticatedWithTokens({
        accessToken: accessToken!,
        refreshToken: refreshToken!,
      }));
      if (basicUser) {
        dispatch(setUser({
          accessToken: accessToken!,
          refreshToken: refreshToken!,
          user: basicUser as any,
        }));
      }
      // Note: We no longer setInitialized(true) here. 
      // It will be set when the full profile query completes or fails.
    } else if (!hasTokens) {
      dispatch(setInitialized(true));
    }
  }, [hasTokens, isAuthenticated, dispatch, accessToken, refreshToken]);

  // Fetch current user from API if tokens exist
  const { data: currentUser, isSuccess, isLoading, isError } = useGetProfileQuery(undefined, {
    skip: !hasTokens,
  });

  useEffect(() => {
    dispatch(setAuthLoading(isLoading));
  }, [isLoading, dispatch]);

  useEffect(() => {
    if (isError) {
      dispatch(setInitialized(true));
    }
  }, [isError, dispatch]);

  useEffect(() => {
    // Only update the full user object once the profile fetch succeeds
    if (hasTokens && currentUser && isSuccess) {
      dispatch(setUser({
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        user: currentUser,
        isFullProfile: true,
      }));
      dispatch(setInitialized(true));
    }
  }, [dispatch, hasTokens, accessToken, refreshToken, currentUser, isSuccess]);

  return null;
}

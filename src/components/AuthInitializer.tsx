"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setAuthLoading, setInitialized } from '@/store/slices/authSlice';
import { getTokenFromCookie } from '@/utils/auth';
import { useGetProfileQuery } from '@/store/api/authApi';

export default function AuthInitializer() {
  const dispatch = useDispatch();
  const accessToken = getTokenFromCookie('accessToken');
  const refreshToken = getTokenFromCookie('refreshToken');

  const hasTokens = !!(accessToken && refreshToken);

  // Initialize immediately if no tokens exist
  useEffect(() => {
    if (!hasTokens) {
      dispatch(setInitialized(true));
    }
  }, [hasTokens, dispatch]);

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
    // Only set user if we have both tokens AND user data from API
    if (hasTokens && currentUser && isSuccess) {
      dispatch(setUser({
        accessToken: accessToken!,
        refreshToken: refreshToken!,
        user: currentUser,
      }));
    }
  }, [dispatch, hasTokens, accessToken, refreshToken, currentUser, isSuccess]);

  return null;
}

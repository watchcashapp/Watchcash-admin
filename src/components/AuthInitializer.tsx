"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser, setAuthLoading, setInitialized, setAuthenticatedWithTokens, clearAuth } from '@/store/slices/authSlice';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { getTokenFromCookie, decodeAccessToken } from '@/utils/auth';
import { isPublicGuestRoute } from '@/utils/publicRoutes';
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

  const hasTokens = !!refreshToken;
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  useEffect(() => {
    const accessToken = getTokenFromCookie('accessToken');
    const refreshToken = getTokenFromCookie('refreshToken');

    if (hasTokens && !isAuthenticated) {
      if (accessToken) {
        const basicUser = decodeAccessToken(accessToken);
        dispatch(setAuthenticatedWithTokens({
          accessToken: accessToken,
          refreshToken: refreshToken!,
        }));
        if (basicUser) {
          dispatch(setUser({
            accessToken: accessToken,
            refreshToken: refreshToken!,
            user: basicUser as any,
          }));
          dispatch(setInitialized(true));
        }
      } else if (refreshToken) {
        // We have refreshToken but no accessToken, likely expired.
        // Set isAuthenticated=true to prevent redirection while we wait for profile (which will trigger reauth)
        dispatch(setAuthenticatedWithTokens({
          accessToken: null,
          refreshToken: refreshToken,
        }));
        // Note: we don't set initialized=true here yet, or if we do, 
        // we must ensure we handle the failure case.
        dispatch(setInitialized(true));
      }
    } else if (!hasTokens) {
      dispatch(setInitialized(true));
    }
  }, [hasTokens, isAuthenticated, dispatch]);

  // Safety fallback to ensure the app initializes even if profile fetch hangs
  useEffect(() => {
    const timer = setTimeout(() => {
      dispatch(setInitialized(true));
    }, 8000); // Increased safety fallback to 8s to allow for refresh logic
    return () => clearTimeout(timer);
  }, [dispatch]);

  // Fetch current user from API if tokens exist
  const { data: currentUser, isSuccess, isLoading, isError } = useGetProfileQuery(undefined, {
    skip: !hasTokens,
  });

  useEffect(() => {
    dispatch(setAuthLoading(isLoading));
  }, [isLoading, dispatch]);

  useEffect(() => {
    if (isError) {
      // If profile fetch fails (meaning refresh also failed or wasn't possible),
      // we must clear auth to trigger a redirect.
      dispatch(setInitialized(true));
      dispatch(clearAuth());
      // Also clear cookies manually just in case
      if (typeof window !== 'undefined') {
        document.cookie = 'accessToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        document.cookie = 'refreshToken=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT';
        
        const isPublicPage = isPublicGuestRoute(window.location.pathname);
                             
        if (!isPublicPage) {
          window.location.replace('/auth/login');
        }
      }
    }
  }, [isError, dispatch]);

  useEffect(() => {
    // Only update the full user object once the profile fetch succeeds
    if (hasTokens && currentUser && isSuccess) {
      // Get the LATEST tokens from cookies after a potential refresh
      const latestAccessToken = getTokenFromCookie('accessToken');
      const latestRefreshToken = getTokenFromCookie('refreshToken');
      
      dispatch(setUser({
        accessToken: latestAccessToken,
        refreshToken: latestRefreshToken,
        user: currentUser,
        isFullProfile: true,
      }));
      dispatch(setInitialized(true));
    }
  }, [dispatch, hasTokens, currentUser, isSuccess]);

  return null;
}

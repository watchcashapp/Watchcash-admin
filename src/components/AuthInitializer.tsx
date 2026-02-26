"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';
import { getTokenFromCookie, getUserFromToken } from '@/utils/auth';
import { useGetProfileQuery } from '@/store/api/authApi';

export default function AuthInitializer() {
  const dispatch = useDispatch();
  const accessToken = getTokenFromCookie('accessToken');
  const refreshToken = getTokenFromCookie('refreshToken');
  
  // Fetch current user from API if tokens exist
  const { data: currentUser } = useGetProfileQuery(undefined, {
    skip: !accessToken || !refreshToken,
  });

  useEffect(() => {
    console.log('AuthInitializer - accessToken:', accessToken ? 'exists' : 'missing');
    console.log('AuthInitializer - refreshToken:', refreshToken ? 'exists' : 'missing');
    
    if (accessToken && refreshToken) {
      // If we have user data from API, use that
      if (currentUser) {
        console.log('AuthInitializer - using user from API:', currentUser);
        dispatch(setUser({
          accessToken,
          refreshToken,
          user: currentUser,
        }));
      } else {
        // Fallback: decode token to get user data
        const user = getUserFromToken();
        console.log('AuthInitializer - using user from token:', user);
        
        if (user) {
          dispatch(setUser({
            accessToken,
            refreshToken,
            user,
          }));
        }
      }
    }
  }, [dispatch, accessToken, refreshToken, currentUser]);

  return null;
}

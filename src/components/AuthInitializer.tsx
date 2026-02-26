"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';
import { getTokenFromCookie } from '@/utils/auth';
import { useGetProfileQuery } from '@/store/api/authApi';

export default function AuthInitializer() {
  const dispatch = useDispatch();
  const accessToken = getTokenFromCookie('accessToken');
  const refreshToken = getTokenFromCookie('refreshToken');
  
  // Fetch current user from API if tokens exist
  const { data: currentUser, isSuccess } = useGetProfileQuery(undefined, {
    skip: !accessToken || !refreshToken,
  });

  useEffect(() => {
    console.log('AuthInitializer - accessToken:', accessToken ? 'exists' : 'missing');
    console.log('AuthInitializer - refreshToken:', refreshToken ? 'exists' : 'missing');
    console.log('AuthInitializer - API user data:', currentUser);
    console.log('AuthInitializer - API success:', isSuccess);
    
    // Only set user if we have both tokens AND user data from API
    if (accessToken && refreshToken && currentUser && isSuccess) {
      console.log('AuthInitializer - setting user in Redux:', currentUser);
      dispatch(setUser({
        accessToken,
        refreshToken,
        user: currentUser,
      }));
    }
  }, [dispatch, accessToken, refreshToken, currentUser, isSuccess]);

  return null;
}

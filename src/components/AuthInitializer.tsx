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


    // Only set user if we have both tokens AND user data from API
    if (accessToken && refreshToken && currentUser && isSuccess) {

      dispatch(setUser({
        accessToken,
        refreshToken,
        user: currentUser,
      }));
    }
  }, [dispatch, accessToken, refreshToken, currentUser, isSuccess]);

  return null;
}

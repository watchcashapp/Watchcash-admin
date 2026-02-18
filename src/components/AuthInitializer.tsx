"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';
import { getTokenFromCookie, getUserFromToken } from '@/utils/auth';

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    // Check if user is already logged in by checking cookies
    const accessToken = getTokenFromCookie('accessToken');
    const refreshToken = getTokenFromCookie('refreshToken');
    
    if (accessToken && refreshToken) {
      // Decode token to get user data
      const user = getUserFromToken();
      
      if (user) {
        dispatch(setUser({
          accessToken,
          refreshToken,
          user,
        }));
      }
    }
  }, [dispatch]);

  return null;
}

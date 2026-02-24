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
    
    console.log('AuthInitializer - accessToken:', accessToken ? 'exists' : 'missing');
    console.log('AuthInitializer - refreshToken:', refreshToken ? 'exists' : 'missing');
    
    if (accessToken && refreshToken) {
      // Decode token to get user data
      const user = getUserFromToken();
      
      console.log('AuthInitializer - decoded user:', user);
      
      if (user) {
        dispatch(setUser({
          accessToken,
          refreshToken,
          user,
        }));
        console.log('AuthInitializer - user set in Redux');
      }
    }
  }, [dispatch]);

  return null;
}

"use client";

import { useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { setUser } from '@/store/slices/authSlice';

export default function AuthInitializer() {
  const dispatch = useDispatch();

  useEffect(() => {
    const token = document.cookie.replace(/(?:(?:^|.*;\s*)token\s*=\s*([^;]*).*$)|^.*$/, '$1');
    
    if (token) {
      // In a real app, you'd decode the token or fetch user data
      dispatch(setUser({
        id: '1',
        email: 'user@example.com',
        name: 'John Doe',
      }));
    }
  }, [dispatch]);

  return null;
}

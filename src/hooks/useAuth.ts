"use client";

import { useAppSelector } from '@/store/hooks';

export const useAuth = () => {
  const { isAuthenticated, user, isInitialized, isLoading } = useAppSelector((state) => state.auth);

  return {
    isAuthenticated,
    user,
    isInitialized,
    isLoading,
  };
};

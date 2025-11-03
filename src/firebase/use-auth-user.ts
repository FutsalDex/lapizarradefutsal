
'use client';
import { useContext } from 'react';
import { FirebaseContext } from './provider';
import { User } from 'firebase/auth';

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  setUser: (user: User | null) => void;
}

/**
 * Hook specifically for accessing the authenticated user's state.
 * This provides the User object, loading status, and any auth errors.
 * @returns {UserHookResult} Object with user, isUserLoading.
 */
export const useUser = (): UserHookResult => {
  const context = useContext(FirebaseContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a FirebaseProvider.');
  }
  return { 
      user: context.user, 
      isUserLoading: context.isUserLoading, 
      setUser: context.setUser as (user: User | null) => void
    };
};


'use client';
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './provider';

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  setUser: (user: User | null) => void;
}

/**
 * Hook specifically for accessing and managing the authenticated user's state.
 * This provides the User object, loading status, and subscribes to auth state changes.
 * @returns {UserHookResult} Object with user, isUserLoading, and a setUser function.
 */
export const useUser = (): UserHookResult => {
  const auth = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [isUserLoading, setIsUserLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setIsUserLoading(false);
    }, (error) => {
      console.error("useUser: onAuthStateChanged error:", error);
      setUser(null);
      setIsUserLoading(false);
    });
    
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [auth]);

  return { 
      user, 
      isUserLoading, 
      setUser: (newUser) => setUser(newUser) // Provide a way to manually update user state if needed
  };
};


'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/config';
import { useUser } from '@/firebase/use-auth-user'; // Import useUser

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * A higher-level provider that initializes Firebase services and
 * then uses the FirebaseProvider to make them available to the app.
 * It also implicitly triggers the `useUser` hook which handles auth state.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    return initializeFirebase();
  }, []); 

  return (
    <FirebaseProvider
      {...firebaseServices}
    >
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}

/**
 * A component that uses the useUser hook to ensure auth state is being monitored.
 * It doesn't render anything itself but triggers the auth subscription.
 */
function AuthGate({ children }: { children: ReactNode }) {
  useUser(); // This hook now contains the onAuthStateChanged logic.
  return <>{children}</>;
}

'use client';

import React, { useEffect, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getFirebase, auth, firestore, storage } from '@/firebase/config';
import { useUser } from '@/firebase/use-auth-user';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  // Inicializar Firebase SOLO en cliente
  useEffect(() => {
    getFirebase();
  }, []);

  return (
    <FirebaseProvider
      auth={auth}
      firestore={firestore}
      storage={storage}
    >
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  useUser();
  return <>{children}</>;
}

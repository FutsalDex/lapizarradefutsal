'use client';

import React, { useMemo, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { getFirebase, auth, firestore, storage } from '@/firebase/config';
import { useUser } from '@/firebase/use-auth-user';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

/**
 * Provider de alto nivel que asegura la inicialización de Firebase
 * en el cliente y expone los servicios a la app.
 */
export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const firebaseServices = useMemo(() => {
    // Inicializa Firebase una sola vez en cliente
    getFirebase();

    return {
      auth,
      firestore,
      storage,
    };
  }, []);

  return (
    <FirebaseProvider {...firebaseServices}>
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}

/**
 * Componente que activa la suscripción al estado de autenticación.
 * No renderiza UI; solo asegura que useUser se ejecute.
 */
function AuthGate({ children }: { children: ReactNode }) {
  useUser();
  return <>{children}</>;
}

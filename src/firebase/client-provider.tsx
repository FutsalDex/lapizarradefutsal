'use client';

import React, { useEffect, useState, type ReactNode } from 'react';
import { FirebaseProvider } from '@/firebase/provider';
import { initializeFirebase } from '@/firebase/config';
import { useUser } from '@/firebase/use-auth-user';
import { FirebaseApp } from 'firebase/app';
import { Auth } from 'firebase/auth';
import { Firestore } from 'firebase/firestore';
import { FirebaseStorage } from 'firebase/storage';

interface FirebaseClientProviderProps {
  children: ReactNode;
}

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
}

export function FirebaseClientProvider({ children }: FirebaseClientProviderProps) {
  const [firebaseServices, setFirebaseServices] = useState<FirebaseServices | null>(null);

  useEffect(() => {
    // Initialize Firebase and set the services in state
    const services = initializeFirebase();
    setFirebaseServices(services);
  }, []);

  if (!firebaseServices) {
    // You can render a loading spinner here if needed
    return <div>Cargando...</div>;
  }

  return (
    <FirebaseProvider
      firebaseApp={firebaseServices.firebaseApp}
      auth={firebaseServices.auth}
      firestore={firebaseServices.firestore}
      storage={firebaseServices.storage}
    >
      <AuthGate>{children}</AuthGate>
    </FirebaseProvider>
  );
}

function AuthGate({ children }: { children: ReactNode }) {
  // This hook now safely uses the context provided by FirebaseProvider
  useUser(); 
  return <>{children}</>;
}

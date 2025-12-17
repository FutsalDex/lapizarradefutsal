
<<<<<<< HEAD
import { initializeApp, getApps, getApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

export const firebaseConfig = {
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID || "",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
};

interface FirebaseServices {
    firebaseApp: FirebaseApp;
    auth: Auth;
    firestore: Firestore;
    storage: FirebaseStorage;
}

function getFirebaseApp(): FirebaseApp {
  return getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
}

export function initializeFirebase(): FirebaseServices {
    const firebaseApp = getFirebaseApp();
    const auth = getAuth(firebaseApp);
    const firestore = getFirestore(firebaseApp);
    const storage = getStorage(firebaseApp);

    return { firebaseApp, auth, firestore, storage };
}
=======
// src/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Configuración del proyecto "lapizarra-95eqd"
const firebaseConfig = {
  apiKey: "AIzaSyA2XHO-VnkYuAwx3-cQ8xrWb3gzdzvTSow",
  authDomain: "lapizarra-95eqd.firebaseapp.com",
  projectId: "lapizarra-95eqd",
  storageBucket: "lapizarra-95eqd.appspot.com",
  messagingSenderId: "303306895935",
  appId: "1:303306895935:web:463b38b92cc31842ccfe8a"
};

// Inicializa Firebase solo una vez
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exporta los servicios que usará tu app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

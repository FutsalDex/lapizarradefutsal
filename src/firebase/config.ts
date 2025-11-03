// src/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Configuración de tu proyecto Firebase
export const firebaseConfig = {
  projectId: "lapizarra-95eqd",
  appId: "1:303306895935:web:463b38b92cc31842ccfe8a",
  apiKey: "AIzaSyA2XHO-VnkYuAwx3-cQ8xrWb3gzdzvTSow",
  authDomain: "lapizarra-95eqd.firebaseapp.com",
  storageBucket: "lapizarra-95eqd.appspot.com",
  measurementId: "",
  messagingSenderId: "303306895935",
};

// Inicializa Firebase (solo una vez)
const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();

// Exporta las instancias de autenticación y Firestore
export const auth = getAuth(app);
export const firestore = getFirestore(app);
export const storage = getStorage(app);

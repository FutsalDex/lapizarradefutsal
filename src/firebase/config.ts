// src/firebase/config.ts
import { initializeApp, getApps, getApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// 🔹 Configuración del proyecto "lapizarra-95eqd"
const firebaseConfig = {
  apiKey: "TU_API_KEY",
  authDomain: "lapizarra-95eqd.firebaseapp.com",
  projectId: "lapizarra-95eqd",
  storageBucket: "lapizarra-95eqd.appspot.com",
  messagingSenderId: "TU_MESSAGING_SENDER_ID",
  appId: "TU_APP_ID",
};

// Inicializa Firebase solo una vez
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

// Exporta los servicios que usará tu app
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export default app;

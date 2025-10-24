// src/lib/firebase.ts
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyA2XHO-VnkYuAwx3-cQ8xrWb3gzdzvTSow",
    authDomain: "lapizarra-95eqd.firebaseapp.com",
    projectId: "lapizarra-95eqd",
    storageBucket: "lapizarra-95eqd.firebasestorage.app",
    messagingSenderId: "303306895935",
    appId: "1:303306895935:web:463b38b92cc31842ccfe8a"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Exporta la base de datos Firestore
export const db = getFirestore(app);

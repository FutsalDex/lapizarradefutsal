// src/firebase/firestore/use-user-matches.ts
"use client";

import { useMemo } from "react";
import { collection, query, where, Query } from "firebase/firestore";
import { useFirestore, useAuth } from "@/firebase/provider"; // ajusta según tus exports
import { useCollection } from "./use-collection";

/**
 * Devuelve los partidos cuyo campo userId coincide con el uid del usuario autenticado.
 * Si no hay usuario logueado devuelve null para evitar listar la colección global.
 */
export function useUserMatches() {
  const firestore = useFirestore();
  const auth = useAuth();
  const uid = auth.currentUser?.uid ?? null;

  const q = useMemo(() => {
    if (!uid) return null;
    return query(collection(firestore, "matches"), where("userId", "==", uid)) as Query;
  }, [firestore, uid]);

  return useCollection(q);
}

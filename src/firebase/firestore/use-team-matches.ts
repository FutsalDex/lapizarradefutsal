// src/firebase/firestore/use-team-matches.ts
"use client";

import { useMemo } from "react";
import { collection, query, where, Query } from "firebase/firestore";
import { useFirestore } from "@/firebase/provider"; // ajusta la ruta si tu hook/provider está en otro sitio
import { useCollection } from "./use-collection"; // tu hook existente

/**
 * Devuelve los partidos de un equipo (realtime).
 * Si teamId es null/undefined, devuelve null (no hace query).
 */
export function useTeamMatches(teamId: string | null | undefined) {
  const firestore = useFirestore();

  const q = useMemo(() => {
    if (!teamId) return null;
    return query(collection(firestore, "matches"), where("teamId", "==", teamId)) as Query;
  }, [firestore, teamId]);

  return useCollection(q);
}

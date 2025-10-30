import {
  doc,
  updateDoc,
  getDocs,
  query,
  collection,
  where,
  serverTimestamp,
  arrayUnion,
} from "firebase/firestore";
import { firestore } from "@/firebase";

/**
 * Acepta una invitación y añade al usuario como miembro del equipo.
 */
export async function acceptInvitation(user, teamId) {
  if (!user || !user.uid) throw new Error("Usuario no autenticado.");
  if (!teamId) throw new Error("teamId requerido.");

  // Paso 1: Buscar la invitación existente
  const invitationsRef = collection(firestore, "invitations");
  const q = query(
    invitationsRef,
    where("teamId", "==", teamId),
    where("invitedUserEmail", "==", user.email)
  );
  const snapshot = await getDocs(q);

  if (snapshot.empty) {
    throw new Error("Invitación no encontrada o ya usada.");
  }

  const invitationDoc = snapshot.docs[0];
  const invitationId = invitationDoc.id;

  // Paso 2: Actualizar el estado de la invitación a 'accepted'
  await updateDoc(doc(firestore, "invitations", invitationId), {
    status: "accepted",
    acceptedAt: serverTimestamp(),
  });

  // Paso 3: Agregar el UID del usuario al array memberIds del equipo
  const teamRef = doc(firestore, "teams", teamId);
  await updateDoc(teamRef, {
    memberIds: arrayUnion(user.uid),
    updatedAt: serverTimestamp(),
  });

  console.log(`✅ ${user.email} ahora es miembro del equipo ${teamId}`);
}

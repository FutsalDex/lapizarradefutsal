cat > src/app/firebase/firestore/teams.ts << 'EOF'
import { 
  collection, 
  getDocs, 
  doc, 
  setDoc,
  deleteDoc, 
  getDoc,
  Timestamp 
} from 'firebase/firestore';
import { db } from '../config';

export interface Player {
  userId: string;
  name: string;
  position: string;
  number: number;
  addedAt?: Timestamp;
}

export interface Team {
  id: string;
  name: string;
  club: string;
  competition: string;
  ownerId: string;
  createdAt?: Timestamp;
}

export async function getTeamInfo(teamId: string): Promise<Team | null> {
  try {
    const teamRef = doc(db, 'teams', teamId);
    const teamSnap = await getDoc(teamRef);
    
    if (!teamSnap.exists()) {
      return null;
    }
    
    return {
      id: teamSnap.id,
      ...teamSnap.data()
    } as Team;
  } catch (error) {
    console.error('Error al obtener equipo:', error);
    throw error;
  }
}

export async function isTeamOwner(teamId: string, userId: string): Promise<boolean> {
  try {
    const team = await getTeamInfo(teamId);
    return team?.ownerId === userId;
  } catch (error) {
    return false;
  }
}

export async function getTeamPlayers(teamId: string): Promise<Player[]> {
  try {
    const playersRef = collection(db, 'teams', teamId, 'players');
    const snapshot = await getDocs(playersRef);
    
    return snapshot.docs.map(doc => ({
      userId: doc.id,
      ...doc.data()
    })) as Player[];
  } catch (error) {
    console.error('Error al obtener jugadores:', error);
    throw error;
  }
}

export async function addPlayerToTeam(
  teamId: string, 
  playerData: Player
): Promise<void> {
  try {
    const playerRef = doc(db, 'teams', teamId, 'players', playerData.userId);
    
    await setDoc(playerRef, {
      name: playerData.name,
      position: playerData.position,
      number: playerData.number,
      userId: playerData.userId,
      addedAt: Timestamp.now()
    });
  } catch (error) {
    console.error('Error al agregar jugador:', error);
    throw error;
  }
}

export async function deletePlayerFromTeam(
  teamId: string, 
  playerId: string
): Promise<void> {
  try {
    const playerRef = doc(db, 'teams', teamId, 'players', playerId);
    await deleteDoc(playerRef);
  } catch (error) {
    console.error('Error al eliminar jugador:', error);
    throw error;
  }
}

export async function updatePlayer(
  teamId: string,
  playerId: string,
  updates: Partial<Player>
): Promise<void> {
  try {
    const playerRef = doc(db, 'teams', teamId, 'players', playerId);
    await setDoc(playerRef, updates, { merge: true });
  } catch (error) {
    console.error('Error al actualizar jugador:', error);
    throw error;
  }
}
EOF
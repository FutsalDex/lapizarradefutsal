
import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string; // Firestore document ID
  'Número': number;
  'Ejercicio': string; // Title
  'Descripción de la tarea': string;
  'Categoría': string;
  'Fase': string;
  'Edad': string[];
  'Duración (min)': number;
  'Número de jugadores': number;
  'Objetivos': string;
  'Consejos para el entrenador': string;
  'Variantes': string;
  'Imagen': string; // imageUrl
  'Visible': boolean;
  'Espacio y materiales necesarios': string;
  userId: string;
  createdAt: any; // Firestore Timestamp
  imageHint?: string; // Optional, can be derived or fixed
  tacticsUrl?: string; // Optional, maybe same as Imagen for now
  intensity?: 'Baja' | 'Media' | 'Alta';
};

// Simulación de un estado de favoritos compartido (en una app real sería un context o una store)
export let favoriteExerciseIdsStore = new Set(['1', '6']);

export const exercises: Exercise[] = [
  // This mock data is now deprecated and will be replaced by Firestore data.
  // Kept for reference or as fallback if needed during development.
];

export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: any[]; // Using any for now as exercise structure changed.
    objectives?: string;
    club?: string;
    team?: string;
    facility?: string;
    // New fields from DB schema
    microcycle?: string;
    sessionNumber?: number;
    initialExercises?: any[];
    mainExercises?: any[];
    finalExercises?: any[];
}

export const sessions: Session[] = [
    {
        id: '1',
        name: 'Sesión 1',
        date: '2025-11-01',
        exercises: exercises, // Populated for detail page
        objectives: 'Mejorar la finalización y el juego bajo presión.',
        club: 'FS Ràpid Santa Coloma',
        team: 'Juvenil B',
        facility: 'Polideportivo Municipal',
    },
    {
        id: '2',
        name: 'Sesión 2',
        date: '2025-11-03',
        exercises: [],
        objectives: 'Fomentar la posesión y la táctica a balón parado.',
        club: 'FS Ràpid Santa Coloma',
        team: 'Juvenil B',
        facility: 'Polideportivo Municipal',
    },
    {
        id: '3',
        name: 'Sesión 3',
        date: '2025-11-05',
        exercises: [],
        objectives: 'Trabajo de resistencia y defensa en inferioridad.',
        club: 'FS Ràpid Santa Coloma',
        team: 'Juvenil B',
        facility: 'Polideportivo Municipal',
    }
]

export type Match = {
    id: string;
    localTeam: string;
    visitorTeam: string;
    date: string;
    competition: string;
    localScore: number;
    visitorScore: number;
    status: 'scheduled' | 'finished' | 'live';
    // Mapped from opponent, score, result for card display
    opponent: string;
    score: string;
    result: 'Victoria' | 'Derrota' | 'Empate';
    playersCalled?: string;
};


export const matches: Match[] = [
    {
        id: '6',
        localTeam: 'Juvenil B',
        visitorTeam: 'MARISTES ADEMAR CLUB ESPORTIU A',
        date: '2025-10-04',
        competition: 'Liga',
        localScore: 8,
        visitorScore: 1,
        status: 'finished',
        // Derived for card view
        opponent: 'Juvenil B vs MARISTES ADEMAR CLUB ESPORTIU A',
        score: '8 - 1',
        result: 'Victoria',
        playersCalled: '12 Jug.'
    },
    {
        id: '1',
        localTeam: 'Juvenil B',
        visitorTeam: 'FSC Horta C',
        date: '2025-09-07',
        competition: 'Amistoso',
        localScore: 6,
        visitorScore: 1,
        status: 'finished',
        opponent: 'Juvenil B vs FSC Horta C',
        score: '6 - 1',
        result: 'Victoria',
    },
    {
        id: '2',
        localTeam: 'FS Prat Advantis',
        visitorTeam: 'Juvenil B',
        date: '2025-09-14',
        competition: 'Amistoso',
        localScore: 1,
        visitorScore: 2,
        status: 'finished',
        opponent: 'FS Prat Advantis vs Juvenil B',
        score: '1 - 2',
        result: 'Victoria',
    },
    {
        id: '3',
        localTeam: 'Masnou',
        visitorTeam: 'Juvenil B',
        date: '2025-09-21',
        competition: 'Amistoso',
        localScore: 1,
        visitorScore: 11,
        status: 'finished',
        opponent: 'Masnou vs Juvenil B',
        score: '1 - 11',
        result: 'Victoria',
    },
    {
        id: '4',
        localTeam: 'Juvenil B',
        visitorTeam: 'FS Parets',
        date: '2025-09-27',
        competition: 'Amistoso',
        localScore: 3,
        visitorScore: 2,
        status: 'finished',
        opponent: 'Juvenil B vs FS Parets',
        score: '3 - 2',
        result: 'Victoria',
    },
    {
        id: '5',
        localTeam: 'Juvenil B',
        visitorTeam: 'Cerdanyola',
        date: '2025-09-28',
        competition: 'Amistoso',
        localScore: 0,
        visitorScore: 5,
        status: 'finished',
        opponent: 'Juvenil B vs Cerdanyola',
        score: '0 - 5',
        result: 'Derrota',
    }
]

// Sort matches by date descending
matches.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

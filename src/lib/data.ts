
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
  {
    id: '1',
    'Número': 1,
    'Ejercicio': 'Rondo 4 vs 1',
    'Descripción de la tarea': 'Cuatro jugadores en un círculo pasan el balón mientras uno en el centro intenta interceptarlo. Mejora la presión y el pase rápido.',
    'Categoría': 'Pase y control',
    'Fase': 'Calentamiento',
    'Edad': ['Alevín', 'Infantil'],
    'Duración (min)': 10,
    'Número de jugadores': 5,
    'Objetivos': 'Mejorar la velocidad del pase y la toma de decisiones bajo presión. Fomentar el movimiento sin balón de los jugadores de apoyo.',
    'Consejos para el entrenador': 'El jugador del centro debe ser agresivo. Los jugadores de fuera deben jugar a 1 o 2 toques máximo.',
    'Variantes': 'Limitar los toques. Añadir un segundo defensor para crear un 4 vs 2.',
    'Imagen': exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    'Visible': true,
    'Espacio y materiales necesarios': '10x10m, 1 balón',
    userId: 'mock',
    createdAt: new Date(),
    imageHint: 'futsal drill',
    tacticsUrl: 'https://picsum.photos/seed/tactic1/600/400',
    intensity: 'Media',
  },
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
}

export const sessions: Session[] = [
    {
        id: '1',
        name: 'Sesión 1',
        date: '2025-11-01',
        exercises: [exercises[0]],
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
    opponent: string;
    date: string;
    result: 'Victoria' | 'Derrota' | 'Empate';
    score: string;
    competition: string;
    playersCalled?: string;
    stats?: {
        goals: number;
        assists: number;
        shots: number;
        possession: number;
    }
}

export const matches: Match[] = [
    {
        id: '1',
        opponent: 'Juvenil B vs FSC Horta C',
        date: '2025-09-07',
        result: 'Victoria',
        score: '6 - 1',
        competition: 'Amistoso',
    },
    {
        id: '2',
        opponent: 'FS Prat Advantis vs Juvenil B',
        date: '2025-09-14',
        result: 'Derrota',
        score: '1 - 2',
        competition: 'Amistoso',
    },
    {
        id: '3',
        opponent: 'Masnou vs Juvenil B',
        date: '2025-09-21',
        result: 'Victoria',
        score: '1 - 11',
        competition: 'Amistoso',
    },
    {
        id: '4',
        opponent: 'Juvenil B vs FS Parets',
        date: '2025-09-27',
        result: 'Victoria',
        score: '3 - 2',
        competition: 'Amistoso',
    },
    {
        id: '5',
        opponent: 'Juvenil B vs Cerdanyola',
        date: '2025-09-28',
        result: 'Derrota',
        score: '0 - 5',
        competition: 'Amistoso',
    },
    {
        id: '6',
        opponent: 'Juvenil B vs MARISTES ADEMAR CLUB ESPORTIU A',
        date: '2025-10-04',
        result: 'Victoria',
        score: '8 - 1',
        competition: 'Liga',
        playersCalled: '12 Jug.'
    }
]

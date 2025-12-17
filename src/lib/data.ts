
import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
<<<<<<< HEAD
  id: string;
  number: string;
  name: string; // This will be mapped from 'Ejercicio'
  description: string; // Mapped from 'Descripción de la tarea'
  category: string; // Mapped from 'Categoría'
  fase: string; // Mapped from 'Fase'
  edad: string[]; // Mapped from 'Edad'
  objectives: string; // Mapped from 'Objetivos'
  duration: string; // Mapped from 'Duración (min)'
  numberOfPlayers: string; // Mapped from 'Número de jugadores'
  variations: string; // Mapped from 'Variantes'
  consejos: string; // Mapped from 'Consejos para el entrenador'
  image: string; // Mapped from 'Imagen'
  aiHint?: string;
  visible: boolean;
  userId?: string;
  createdAt?: any;
  'Espacio y materiales necesarios'?: string;
};

export function mapExercise(doc: any): Exercise {
    const data = doc.data ? doc.data() : doc; // Handle both doc snapshot and plain objects
    return {
        id: doc.id,
        number: data['Número'] || '',
        name: data['Ejercicio'] || 'Ejercicio sin nombre',
        description: data['Descripción de la tarea'] || '',
        category: data['Categoría'] || 'Sin categoría',
        fase: data['Fase'] || 'Fase no especificada',
        edad: data['Edad'] || [],
        objectives: data['Objetivos'] || '',
        duration: data['Duración (min)'] || '0',
        numberOfPlayers: data['Número de jugadores'] || '',
        variations: data['Variantes'] || '',
        consejos: data['Consejos para el entrenador'] || '',
        image: data['Imagen'] || '',
        aiHint: data['aiHint'] || '',
        visible: data['Visible'] !== false,
        'Espacio y materiales necesarios': data['Espacio y materiales necesarios'] || '',
        ...data
    };
}
=======
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
        exercises: [], // Populated for detail page
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

export const matches: any[] = [];
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

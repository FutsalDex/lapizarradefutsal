
import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  name: string;
  description: string;
  category: string;
  fase?: string; // Not in user schema
  edad: { [key: string]: boolean };
  objectives: string;
  duration: string;
  numberOfPlayers: string;
  variations: string;
  consejos: string;
  image: string;
  aiHint?: string;
  visible: boolean;
  userId?: string;
  createdAt?: any;
};

export const exercises: Exercise[] = [
  // This is mock data and might not be fully representative of Firestore.
  // The Exercise type definition is the source of truth for fields.
  {
    id: '1',
    name: 'Rondo 4 vs 1',
    description: 'Cuatro jugadores en un círculo pasan el balón mientras uno en el centro intenta interceptarlo. Mejora la presión y el pase rápido.',
    category: 'Técnica',
    fase: 'Fase Principal',
    edad: { infantil: true, cadete: true, juvenil: true, senior: true },
    objectives: 'Mejorar el pase y la presión.',
    duration: "10",
    numberOfPlayers: '5',
    consejos: 'Pases rápidos y movimiento constante.',
    variations: 'Añadir un segundo defensor.',
    image: exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    aiHint: exerciseImages[0]?.imageHint || 'futsal drill',
    visible: true,
  },
  {
    id: '2',
    name: 'Finalización 2 vs 1',
    description: 'Dos atacantes contra un defensor, buscando la mejor opción para finalizar en portería. Fomenta la toma de decisiones.',
    category: 'Táctica',
    fase: 'Fase Principal',
    edad: { cadete: true, juvenil: true, senior: true },
    objectives: 'Mejorar la toma de decisiones en ataque.',
    duration: "15",
    numberOfPlayers: '3 + Portero',
    consejos: 'Atraer al defensor antes de pasar.',
    variations: 'Limitar el número de toques.',
    image: exerciseImages[1]?.imageUrl || 'https://picsum.photos/seed/ex2/600/400',
    aiHint: exerciseImages[1]?.imageHint || 'futsal attack',
    visible: true,
  },
  // Add other mock exercises if needed
];


export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: Partial<Exercise>[]; // Can be partial if just storing references
}

export const sessions: Session[] = [
    {
        id: '1',
        name: 'Sesión de Técnica y Posesión',
        date: '2024-08-01',
        exercises: [{id: '1', name: 'Rondo 4 vs 1'}],
    },
    {
        id: '2',
        name: 'Entrenamiento Físico y Transiciones',
        date: '2024-08-03',
        exercises: [{id: '2', name: 'Finalización 2 vs 1'}],
    },
    {
        id: '3',
        name: 'Preparación de Partido',
        date: '2024-08-05',
        exercises: [{id: '2', name: 'Finalización 2 vs 1'}],
    }
]

export type Match = {
    id: string;
    opponent: string;
    date: string;
    result: 'Victoria' | 'Derrota' | 'Empate';
    score: string;
    stats: {
        goals: number;
        assists: number;
        shots: number;
        possession: number;
    }
}

export const matches: Match[] = [
    {
        id: '1',
        opponent: 'Titanes del Futsal',
        date: '2024-07-28',
        result: 'Victoria',
        score: '5 - 3',
        stats: {
            goals: 5,
            assists: 4,
            shots: 15,
            possession: 65,
        }
    },
    {
        id: '2',
        opponent: 'Inter Sala',
        date: '2024-07-21',
        result: 'Derrota',
        score: '2 - 4',
        stats: {
            goals: 2,
            assists: 1,
            shots: 8,
            possession: 45,
        }
    },
    {
        id: '3',
        opponent: 'Furia Roja FS',
        date: '2024-07-14',
        result: 'Empate',
        score: '2 - 2',
        stats: {
            goals: 2,
            assists: 2,
            shots: 12,
            possession: 55,
        }
    }
]

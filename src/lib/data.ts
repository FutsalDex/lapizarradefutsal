
import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
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
};

export function mapExercise(doc: any): Exercise {
    const data = doc;
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
        ...data
    };
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

export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: Partial<Exercise>[]; // Can be partial if just storing references
}


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

import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  name: string;
  title: string;
  description: string;
  category: 'Técnica' | 'Táctica' | 'Físico' | 'Porteros';
  intensity: 'Baja' | 'Media' | 'Alta';
  diagramUrl: string;
  imageUrl: string;
  imageHint: string;
};

export const exercises: Exercise[] = [
  {
    id: '1',
    name: 'Rondo 4 vs 1',
    title: 'Rondo 4 vs 1',
    description: 'Cuatro jugadores en un círculo pasan el balón mientras uno en el centro intenta interceptarlo. Mejora la presión y el pase rápido.',
    category: 'Técnica',
    intensity: 'Media',
    diagramUrl: exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    imageUrl: exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    imageHint: exerciseImages[0]?.imageHint || 'futsal drill'
  },
  {
    id: '2',
    name: 'Finalización 2 vs 1',
    title: 'Finalización 2 vs 1',
    description: 'Dos atacantes contra un defensor, buscando la mejor opción para finalizar en portería. Fomenta la toma de decisiones.',
    category: 'Táctica',
    intensity: 'Alta',
    diagramUrl: exerciseImages[1]?.imageUrl || 'https://picsum.photos/seed/ex2/600/400',
    imageUrl: exerciseImages[1]?.imageUrl || 'https://picsum.photos/seed/ex2/600/400',
    imageHint: exerciseImages[1]?.imageHint || 'futsal attack'
  },
  {
    id: '3',
    name: 'Circuito de Agilidad',
    title: 'Circuito de Agilidad',
    description: 'Recorrido con conos, escaleras y vallas para mejorar la coordinación, velocidad y cambios de dirección.',
    category: 'Físico',
    intensity: 'Alta',
    diagramUrl: exerciseImages[2]?.imageUrl || 'https://picsum.photos/seed/ex3/600/400',
    imageUrl: exerciseImages[2]?.imageUrl || 'https://picsum.photos/seed/ex3/600/400',
    imageHint: exerciseImages[2]?.imageHint || 'agility ladder'
  },
  {
    id: '4',
    name: 'Juego de Posesión 3 vs 3',
    title: 'Juego de Posesión 3 vs 3',
    description: 'Partido en espacio reducido con el objetivo de mantener la posesión del balón el mayor tiempo posible.',
    category: 'Táctica',
    intensity: 'Media',
    diagramUrl: exerciseImages[3]?.imageUrl || 'https://picsum.photos/seed/ex4/600/400',
    imageUrl: exerciseImages[3]?.imageUrl || 'https://picsum.photos/seed/ex4/600/400',
    imageHint: exerciseImages[3]?.imageHint || 'futsal game'
  },
  {
    id: '5',
    name: 'Tiros a Puerta con Oposición',
    title: 'Tiros a Puerta con Oposición',
    description: 'Ejercicios de finalización con un defensor activo para simular condiciones de partido real.',
    category: 'Técnica',
    intensity: 'Media',
    diagramUrl: exerciseImages[4]?.imageUrl || 'https://picsum.photos/seed/ex5/600/400',
    imageUrl: exerciseImages[4]?.imageUrl || 'https://picsum.photos/seed/ex5/600/400',
    imageHint: exerciseImages[4]?.imageHint || 'futsal shot'
  },
  {
    id: '6',
    name: 'Salida de Presión',
    title: 'Salida de Presión',
    description: 'El equipo defensor practica cómo superar una presión alta del rival desde su propia área.',
    category: 'Táctica',
    intensity: 'Alta',
    diagramUrl: exerciseImages[5]?.imageUrl || 'https://picsum.photos/seed/ex6/600/400',
    imageUrl: exerciseImages[5]?.imageUrl || 'https://picsum.photos/seed/ex6/600/400',
    imageHint: exerciseImages[5]?.imageHint || 'futsal tactics'
  },
];

export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: Exercise[];
}

export const sessions: Session[] = [
    {
        id: '1',
        name: 'Sesión de Técnica y Posesión',
        date: '2024-08-01',
        exercises: [exercises[0], exercises[3], exercises[4]],
    },
    {
        id: '2',
        name: 'Entrenamiento Físico y Transiciones',
        date: '2024-08-03',
        exercises: [exercises[2], exercises[1], exercises[5]],
    },
    {
        id: '3',
        name: 'Preparación de Partido',
        date: '2024-08-05',
        exercises: [exercises[5], exercises[1]],
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

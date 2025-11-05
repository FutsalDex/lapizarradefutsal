import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: 'Técnica' | 'Táctica' | 'Físico' | 'Porteros';
  fase: string;
  edad: string;
  duration: string;
  imageUrl: string;
  imageHint: string;
};

export const exercises: Exercise[] = [
  {
    id: '1',
    title: 'Rondo 4 vs 1',
    description: 'Cuatro jugadores en un círculo pasan el balón mientras uno en el centro intenta interceptarlo. Mejora la presión y el pase rápido.',
    category: 'Técnica',
    fase: 'Calentamiento',
    edad: 'Alevín, Infantil',
    duration: '10 min',
    imageUrl: exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    imageHint: exerciseImages[0]?.imageHint || 'futsal drill'
  },
  {
    id: '2',
    title: 'Finalización 2 vs 1',
    description: 'Dos atacantes contra un defensor, buscando la mejor opción para finalizar en portería. Fomenta la toma de decisiones.',
    category: 'Táctica',
    fase: 'Principal',
    edad: 'Cadete, Juvenil, Senior',
    duration: '15 min',
    imageUrl: exerciseImages[1]?.imageUrl || 'https://picsum.photos/seed/ex2/600/400',
    imageHint: exerciseImages[1]?.imageHint || 'futsal attack'
  },
  {
    id: '3',
    title: 'Circuito de Agilidad',
    description: 'Recorrido con conos, escaleras y vallas para mejorar la coordinación, velocidad y cambios de dirección.',
    category: 'Físico',
    fase: 'Preparación Física',
    edad: 'Todas',
    duration: '20 min',
    imageUrl: exerciseImages[2]?.imageUrl || 'https://picsum.photos/seed/ex3/600/400',
    imageHint: exerciseImages[2]?.imageHint || 'agility ladder'
  },
  {
    id: '4',
    title: 'Juego de Posesión 3 vs 3',
    description: 'Partido en espacio reducido con el objetivo de mantener la posesión del balón el mayor tiempo posible.',
    category: 'Táctica',
    fase: 'Principal',
    edad: 'Infantil, Cadete',
    duration: '15 min',
    imageUrl: exerciseImages[3]?.imageUrl || 'https://picsum.photos/seed/ex4/600/400',
    imageHint: exerciseImages[3]?.imageHint || 'futsal game'
  },
  {
    id: '5',
    title: 'Tiros a Puerta con Oposición',
    description: 'Ejercicios de finalización con un defensor activo para simular condiciones de partido real.',
    category: 'Técnica',
    fase: 'Principal',
    edad: 'Benjamín, Alevín',
    duration: '15 min',
    imageUrl: exerciseImages[4]?.imageUrl || 'https://picsum.photos/seed/ex5/600/400',
    imageHint: exerciseImages[4]?.imageHint || 'futsal shot'
  },
  {
    id: '6',
    title: 'Salida de Presión',
    description: 'El equipo defensor practica cómo superar una presión alta del rival desde su propia área.',
    category: 'Táctica',
    fase: 'Principal',
    edad: 'Juvenil, Senior',
    duration: '20 min',
    imageUrl: exerciseImages[5]?.imageUrl || 'https://picsum.photos/seed/ex6/600/400',
    imageHint: exerciseImages[5]?.imageHint || 'futsal tactics'
  },
  {
    id: '7',
    title: 'Conducción de Balón',
    description: 'Ejercicios para mejorar el control del balón mientras se corre a diferentes velocidades.',
    category: 'Técnica',
    fase: 'Calentamiento',
    edad: 'Pre-Benjamín, Benjamín',
    duration: '10 min',
    imageUrl: 'https://picsum.photos/seed/ex7/600/400',
    imageHint: 'futsal dribbling'
  },
  {
    id: '8',
    title: 'Defensa en Inferioridad',
    description: 'Un defensor se enfrenta a dos atacantes, practicando el posicionamiento y la temporización.',
    category: 'Táctica',
    fase: 'Principal',
    edad: 'Cadete, Juvenil',
    duration: '15 min',
    imageUrl: 'https://picsum.photos/seed/ex8/600/400',
    imageHint: 'futsal defense'
  },
  {
    id: '9',
    title: 'Resistencia Intermitente',
    description: 'Carreras de alta intensidad seguidas de periodos cortos de recuperación para simular el ritmo de un partido.',
    category: 'Físico',
    fase: 'Preparación Física',
    edad: 'Juvenil, Senior',
    duration: '20 min',
    imageUrl: 'https://picsum.photos/seed/ex9/600/400',
    imageHint: 'futsal running'
  },
  {
    id: '10',
    title: 'Entrenamiento de Portero: Reflejos',
    description: 'Tiros cercanos y rápidos para mejorar los reflejos y la velocidad de reacción del portero.',
    category: 'Porteros',
    fase: 'Específico',
    edad: 'Todas',
    duration: '15 min',
    imageUrl: 'https://picsum.photos/seed/ex10/600/400',
    imageHint: 'goalkeeper training'
  },
  {
    id: '11',
    title: 'Estrategia de Córner',
    description: 'Práctica de jugadas ensayadas tanto ofensivas como defensivas en los saques de esquina.',
    category: 'Táctica',
    fase: 'Vuelta a la Calma',
    edad: 'Cadete, Juvenil, Senior',
    duration: '10 min',
    imageUrl: 'https://picsum.photos/seed/ex11/600/400',
    imageHint: 'futsal strategy'
  },
  {
    id: '12',
    title: 'Control y Pase a Primer Toque',
    description: 'Los jugadores se organizan en parejas y deben controlar y pasar el balón con un solo toque.',
    category: 'Técnica',
    fase: 'Calentamiento',
    edad: 'Infantil, Cadete',
    duration: '10 min',
    imageUrl: 'https://picsum.photos/seed/ex12/600/400',
    imageHint: 'futsal passing'
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

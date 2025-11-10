
import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  title: string;
  description: string;
  category: string;
  fase: string;
  edad: string;
  duration: string;
  players: string;
  objectives: string;
  tips: string;
  variants: string;
  imageUrl: string;
  imageHint: string;
  tacticsUrl: string;
  intensity?: 'Baja' | 'Media' | 'Alta';
};

// Simulación de un estado de favoritos compartido (en una app real sería un context o una store)
export let favoriteExerciseIdsStore = new Set(['1', '6']);

export const exercises: Exercise[] = [
  {
    id: '1',
    title: 'Rondo 4 vs 1',
    description: 'Cuatro jugadores en un círculo pasan el balón mientras uno en el centro intenta interceptarlo. Mejora la presión y el pase rápido.',
    category: 'Pase y control',
    fase: 'Calentamiento',
    edad: 'Alevín, Infantil',
    duration: '10 min',
    players: '5',
    objectives: 'Mejorar la velocidad del pase y la toma de decisiones bajo presión. Fomentar el movimiento sin balón de los jugadores de apoyo.',
    tips: 'El jugador del centro debe ser agresivo. Los jugadores de fuera deben jugar a 1 o 2 toques máximo.',
    variants: 'Limitar los toques. Añadir un segundo defensor para crear un 4 vs 2.',
    imageUrl: exerciseImages[0]?.imageUrl || 'https://picsum.photos/seed/ex1/600/400',
    imageHint: exerciseImages[0]?.imageHint || 'futsal drill',
    tacticsUrl: 'https://picsum.photos/seed/tactic1/600/400',
    intensity: 'Media',
  },
  {
    id: '2',
    title: 'Finalización 2 vs 1',
    description: 'Dos atacantes contra un defensor, buscando la mejor opción para finalizar en portería. Fomenta la toma de decisiones.',
    category: 'Finalización',
    fase: 'Principal',
    edad: 'Cadete, Juvenil, Senior',
    duration: '15 min',
    players: '3+',
    objectives: 'Mejorar la superioridad numérica en ataque. Trabajar la finalización y el último pase.',
    tips: 'El defensor debe intentar temporizar y no lanzarse al suelo. Los atacantes deben comunicarse y ser rápidos en la ejecución.',
    variants: 'Convertir en 2 vs 2 tras la finalización. Limitar el tiempo para finalizar la jugada.',
    imageUrl: exerciseImages[1]?.imageUrl || 'https://picsum.photos/seed/ex2/600/400',
    imageHint: exerciseImages[1]?.imageHint || 'futsal attack',
    tacticsUrl: 'https://picsum.photos/seed/tactic2/600/400',
     intensity: 'Alta',
  },
  {
    id: '3',
    title: 'Circuito de Agilidad',
    description: 'Recorrido con conos, escaleras y vallas para mejorar la coordinación, velocidad y cambios de dirección.',
    category: 'Coordinación, agilidad y velocidad',
    fase: 'Preparación Física',
    edad: 'Benjamín, Alevín, Infantil, Cadete, Juvenil, Senior',
    duration: '20 min',
    players: 'Individual',
    objectives: 'Mejorar la agilidad, coordinación y velocidad de pies.',
    tips: 'Mantener el centro de gravedad bajo. Realizar los movimientos a la máxima velocidad posible manteniendo la calidad.',
    variants: 'Añadir conducción de balón al circuito.',
    imageUrl: exerciseImages[2]?.imageUrl || 'https://picsum.photos/seed/ex3/600/400',
    imageHint: exerciseImages[2]?.imageHint || 'agility ladder',
    tacticsUrl: 'https://picsum.photos/seed/tactic3/600/400',
    intensity: 'Alta',
  },
  {
    id: '4',
    title: 'Juego de Posesión 3 vs 3',
    description: 'Partido en espacio reducido con el objetivo de mantener la posesión del balón el mayor tiempo posible.',
    category: 'Posesión y circulación del balón',
    fase: 'Principal',
    edad: 'Infantil, Cadete',
    duration: '15 min',
    players: '6',
    objectives: 'Mejorar la conservación del balón y el juego en espacios reducidos. Fomentar la movilidad y los apoyos.',
    tips: 'Usar todo el espacio. Comunicación constante entre compañeros.',
    variants: 'Añadir comodines ofensivos. Limitar el número de toques.',
    imageUrl: exerciseImages[3]?.imageUrl || 'https://picsum.photos/seed/ex4/600/400',
    imageHint: exerciseImages[3]?.imageHint || 'futsal game',
    tacticsUrl: 'https://picsum.photos/seed/tactic4/600/400',
    intensity: 'Media',
  },
  {
    id: '5',
    title: 'Tiros a Puerta con Oposición',
    description: 'Ejercicios de finalización con un defensor activo para simular condiciones de partido real.',
    category: 'Finalización',
    fase: 'Principal',
    edad: 'Benjamín, Alevín',
    duration: '15 min',
    players: '2+',
    objectives: 'Mejorar la precisión y potencia del disparo en situaciones de presión.',
    tips: 'Levantar la cabeza antes de tirar para ver al portero. Buscar los ángulos.',
    variants: 'Añadir un segundo defensor. Finalizar a un solo toque.',
    imageUrl: exerciseImages[4]?.imageUrl || 'https://picsum.photos/seed/ex5/600/400',
    imageHint: exerciseImages[4]?.imageHint || 'futsal shot',
    tacticsUrl: 'https://picsum.photos/seed/tactic5/600/400',
    intensity: 'Media',
  },
  {
    id: '6',
    title: 'Salida de Presión',
    description: 'El equipo defensor practica cómo superar una presión alta del rival desde su propia área.',
    category: 'Toma de decisiones y visión de juego',
    fase: 'Principal',
    edad: 'Juvenil, Senior',
    duration: '20 min',
    players: '8+',
    objectives: 'Trabajar los mecanismos para superar la primera línea de presión rival y iniciar el ataque de forma controlada.',
    tips: 'Movilidad del portero y los cierres. Buscar al hombre libre. Pases tensos y precisos.',
    variants: 'Variar el número de jugadores que presionan (2, 3). Establecer un tiempo límite para sacar el balón.',
    imageUrl: exerciseImages[5]?.imageUrl || 'https://picsum.photos/seed/ex6/600/400',
    imageHint: exerciseImages[5]?.imageHint || 'futsal tactics',
    tacticsUrl: 'https://picsum.photos/seed/tactic6/600/400',
    intensity: 'Alta',
  },
  {
    id: '7',
    title: 'Conducción de Balón',
    description: 'Ejercicios para mejorar el control del balón mientras se corre a diferentes velocidades.',
    category: 'Conducción y regate',
    fase: 'Calentamiento',
    edad: 'Benjamín',
    duration: '10 min',
    players: 'Individual',
    objectives: 'Mejorar el dominio del balón en carrera. Coordinación óculo-pédica.',
    tips: 'Mantener el balón cerca del pie. Alternar diferentes superficies de contacto (interior, exterior).',
    variants: 'Realizar el recorrido con cambios de dirección y ritmo.',
    imageUrl: 'https://picsum.photos/seed/ex7/600/400',
    imageHint: 'futsal dribbling',
    tacticsUrl: 'https://picsum.photos/seed/tactic7/600/400',
    intensity: 'Baja',
  },
  {
    id: '8',
    title: 'Defensa en Inferioridad',
    description: 'Un defensor se enfrenta a dos atacantes, practicando el posicionamiento y la temporización.',
    category: 'Defensa (individual, colectiva y táctica)',
    fase: 'Principal',
    edad: 'Cadete, Juvenil',
    duration: '15 min',
    players: '3+',
    objectives: 'Mejorar la capacidad de temporización defensiva y la toma de decisiones en inferioridad.',
    tips: 'Cerrar la línea de pase entre los atacantes. Orientar al poseedor del balón hacia la banda.',
    variants: 'Iniciar la jugada desde diferentes puntos. Convertir a 2 vs 2 si el defensor roba.',
    imageUrl: 'https://picsum.photos/seed/ex8/600/400',
    imageHint: 'futsal defense',
    tacticsUrl: 'https://picsum.photos/seed/tactic8/600/400',
    intensity: 'Media',
  },
  {
    id: '9',
    title: 'Resistencia Intermitente',
    description: 'Carreras de alta intensidad seguidas de periodos cortos de recuperación para simular el ritmo de un partido.',
    category: 'Coordinación, agilidad y velocidad',
    fase: 'Preparación Física',
    edad: 'Juvenil, Senior',
    duration: '20 min',
    players: 'Individual',
    objectives: 'Mejorar la capacidad de repetir esfuerzos de alta intensidad. Adaptación al ritmo de competición.',
    tips: 'Mantener una técnica de carrera eficiente. Controlar la frecuencia cardíaca en las recuperaciones.',
    variants: 'Incluir cambios de dirección en las carreras. Realizar el ejercicio con balón.',
    imageUrl: 'https://picsum.photos/seed/ex9/600/400',
    imageHint: 'futsal running',
    tacticsUrl: 'https://picsum.photos/seed/tactic9/600/400',
    intensity: 'Alta',
  },
  {
    id: '10',
    title: 'Entrenamiento de Portero: Reflejos',
    description: 'Tiros cercanos y rápidos para mejorar los reflejos y la velocidad de reacción del portero.',
    category: 'Portero y trabajo específico',
    fase: 'Específico',
    edad: 'Alevín, Infantil, Cadete, Juvenil, Senior',
    duration: '15 min',
    players: '2+',
    objectives: 'Mejorar la velocidad de reacción y los reflejos ante disparos a corta distancia.',
    tips: 'Mantener una posición de base activa. Usar todas las partes del cuerpo para parar.',
    variants: 'Tiros con desvío. Tiros a ras de suelo y a media altura.',
    imageUrl: 'https://picsum.photos/seed/ex10/600/400',
    imageHint: 'goalkeeper training',
    tacticsUrl: 'https://picsum.photos/seed/tactic10/600/400',
    intensity: 'Media',
  },
  {
    id: '11',
    title: 'Estrategia de Córner',
    description: 'Práctica de jugadas ensayadas tanto ofensivas como defensivas en los saques de esquina.',
    category: 'Balón parado y remates',
    fase: 'Vuelta a la Calma',
    edad: 'Cadete, Juvenil, Senior',
    duration: '10 min',
    players: 'Equipo completo',
    objectives: 'Mecanizar los movimientos en las jugadas de estrategia a balón parado.',
    tips: 'Coordinación y timing en los bloqueos y desmarques. Saque preciso y tenso.',
    variants: 'Practicar diferentes jugadas de córner. Simular defensa con inferioridad.',
    imageUrl: 'https://picsum.photos/seed/ex11/600/400',
    imageHint: 'futsal strategy',
    tacticsUrl: 'https://picsum.photos/seed/tactic11/600/400',
    intensity: 'Baja',
  },
  {
    id: '12',
    title: 'Control y Pase a Primer Toque',
    description: 'Los jugadores se organizan en parejas y deben controlar y pasar el balón con un solo toque.',
    category: 'Pase y control',
    fase: 'Calentamiento',
    edad: 'Infantil, Cadete',
    duration: '10 min',
    players: '2+',
    objectives: 'Mejorar la calidad técnica del control y el pase. Aumentar la velocidad de circulación del balón.',
    tips: 'Orientar el cuerpo hacia donde se quiere pasar. Atacar el balón al recibir.',
    variants: 'Añadir un tercer jugador que presiona. Realizarlo en movimiento.',
    imageUrl: 'https://picsum.photos/seed/ex12/600/400',
    imageHint: 'futsal passing',
    tacticsUrl: 'https://picsum.photos/seed/tactic12/600/400',
    intensity: 'Baja',
  },
];

export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: Exercise[];
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
        exercises: [exercises[0], exercises[1], exercises[4], exercises[10]],
        objectives: 'Mejorar la finalización y el juego bajo presión.',
        club: 'FS Ràpid Santa Coloma',
        team: 'Juvenil B',
        facility: 'Polideportivo Municipal',
    },
    {
        id: '2',
        name: 'Sesión 2',
        date: '2025-11-03',
        exercises: [exercises[6], exercises[3], exercises[11]],
        objectives: 'Fomentar la posesión y la táctica a balón parado.',
        club: 'FS Ràpid Santa Coloma',
        team: 'Juvenil B',
        facility: 'Polideportivo Municipal',
    },
    {
        id: '3',
        name: 'Sesión 3',
        date: '2025-11-05',
        exercises: [exercises[2], exercises[7], exercises[8], exercises[5]],
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

// src/lib/data.ts
import placeholderImages from './placeholderImages.json'; // Asumiendo que existe; ajusta si no

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  number: string;
  name: string;
  description: string;
  image: string;
  category: string;
  // Agrega campos de tu app, ej: para futsal
  duration: number;
  intensity: 'low' | 'medium' | 'high';
};

// Ejemplo de datos (ajusta con tu base)
export const sampleExercises: Exercise[] = exerciseImages.map(img => ({
  id: img.id,
  number: img.id.split('-')[1],
  name: `Ejercicio ${img.id}`,
  description: 'Descripción de ejercicio para futsal',
  image: img.src,
  category: 'Táctica',
  duration: 5,
  intensity: 'medium',
}));

// Otros exports si tenías, ej: teams, matches
export const sampleTeams = []; // Llena con datos de Firestore si necesitas

export { exerciseImages };
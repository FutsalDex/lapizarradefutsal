
// src/lib/data.ts
import placeholderImages from "./placeholder-images.json";

export type Exercise = {
  id: string;
  number: string;
  name: string;
  description: string;
  image: string;
  category: string;
  duration: string;
  fase: string;
  edad: string[];
  numberOfPlayers: string;
  objectives: string;
  variations?: string;
  consejos?: string;
  visible: boolean;
  aiHint?: string;
  'Espacio y materiales necesarios'?: string;
};

/**
 * Mapper usado por múltiples páginas
 * (requerido por la app, faltaba el export)
 */
export function mapExercise(docData: { id: string; [key: string]: any }): Exercise {
  const edad = docData['Edad'] || [];
  return {
    id: docData.id,
    number: docData['Número'] || '',
    name: docData['Ejercicio'] || '',
    description: docData['Descripción de la tarea'] || '',
    image: docData['Imagen'] || '',
    category: docData['Categoría'] || '',
    duration: docData['Duración (min)'] || '0',
    fase: docData['Fase'] || '',
    edad: Array.isArray(edad) ? edad : typeof edad === 'string' ? edad.split(',').map(e => e.trim()) : [],
    numberOfPlayers: docData['Número de jugadores'] || '',
    objectives: docData['Objetivos'] || '',
    variations: docData['Variantes'],
    consejos: docData['Consejos para el entrenador'],
    visible: docData['Visible'] !== false, // default to true if undefined
    aiHint: docData['aiHint'],
    'Espacio y materiales necesarios': docData['Espacio y materiales necesarios'],
  };
}


export const exerciseImages = placeholderImages.placeholderImages.filter(
  (p: { id: string }) => p.id.startsWith("exercise-")
);

export const sampleExercises: Exercise[] = [];

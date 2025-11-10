
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

// src/lib/data.ts
import placeholderImages from "./placeholder-images.json";

const exerciseImages = placeholderImages.placeholderImages.filter(
  (p: { id: string }) => p.id.startsWith("exercise-")
);

export type Exercise = {
  id: string;
  number: string;
  name: string;
  description: string;
  image: string;
  category: string;
  duration: number;
  intensity: "low" | "medium" | "high";
};

export const sampleExercises: Exercise[] = exerciseImages.map(
  (img: { id: string; src: string }) => ({
    id: img.id,
    number: img.id.split("-")[1],
    name: `Ejercicio ${img.id}`,
    description: "Descripción de ejercicio para futsal",
    image: img.src,
    category: "Táctica",
    duration: 5,
    intensity: "medium",
  })
);

export const sampleTeams: unknown[] = [];

export { exerciseImages };

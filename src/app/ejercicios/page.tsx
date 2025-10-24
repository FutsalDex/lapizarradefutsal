"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [intensityFilter, setIntensityFilter] = useState('Todas');

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || exercise.category === categoryFilter;
    const matchesIntensity = intensityFilter === 'Todas' || exercise.intensity === intensityFilter;
    return matchesSearch && matchesCategory && matchesIntensity;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Ver Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">Encuentra la inspiración para tu próximo entrenamiento.</p>
      </div>
      
      <div className="flex flex-col md:flex-row gap-4 mb-8 p-4 bg-card rounded-lg border">
        <Input 
          placeholder="Buscar ejercicio..." 
          className="flex-grow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex gap-4">
          <Select onValueChange={setCategoryFilter} defaultValue="Todos">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Categoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todos">Todas las Categorías</SelectItem>
              <SelectItem value="Técnica">Técnica</SelectItem>
              <SelectItem value="Táctica">Táctica</SelectItem>
              <SelectItem value="Físico">Físico</SelectItem>
              <SelectItem value="Porteros">Porteros</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setIntensityFilter} defaultValue="Todas">
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Intensidad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas las Intensidades</SelectItem>
              <SelectItem value="Baja">Baja</SelectItem>
              <SelectItem value="Media">Media</SelectItem>
              <SelectItem value="Alta">Alta</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredExercises.map((exercise) => (
          <Card key={exercise.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
            <CardHeader className="p-0">
              <div className="relative h-48 w-full">
                <Image
                  src={exercise.imageUrl}
                  alt={exercise.title}
                  fill
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  className="object-cover"
                  data-ai-hint={exercise.imageHint}
                />
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <CardTitle className="font-headline text-xl">{exercise.title}</CardTitle>
                <Badge variant={exercise.intensity === 'Alta' ? 'destructive' : exercise.intensity === 'Media' ? 'secondary' : 'default'}>
                  {exercise.intensity}
                </Badge>
              </div>
              <p className="text-muted-foreground text-sm mb-4">{exercise.description}</p>
              <div className="mt-auto pt-4">
                 <Badge variant="outline">{exercise.category}</Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      {filteredExercises.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <p>No se encontraron ejercicios con los filtros seleccionados.</p>
        </div>
      )}
    </div>
  );
}

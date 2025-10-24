"use client";

import { useState, useMemo } from 'react';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { collection, query } from 'firebase/firestore';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { Exercise } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Heart, Search, Filter, Eye, Loader2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [ageFilter, setAgeFilter] = useState('Todas');
  
  const firestore = useFirestore();

  const exercisesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exercises');
  }, [firestore]);

  const { data: exercises, isLoading } = useCollection<Exercise>(exercisesCollection);

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(exercise => {
      if (!exercise.title) return false;
      const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || exercise.category === categoryFilter;
      // Note: Phase and Age filters are not in the data model yet, so they are placeholders
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchTerm, categoryFilter]);
  

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Biblioteca de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">Explora nuestra colección de ejercicios de futsal. Filtra por nombre, fase, categoría o edad.</p>
      </div>
      
      <div className="flex flex-col lg:flex-row gap-4 mb-6 p-4 bg-card rounded-lg border items-center">
        <div className="relative w-full lg:flex-grow">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input 
            placeholder="Buscar ejercicio por nombre..." 
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full lg:w-auto">
          <Select onValueChange={setPhaseFilter} defaultValue="Todas">
            <SelectTrigger>
              <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Fase" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas las Fases</SelectItem>
              <SelectItem value="Principal">Principal</SelectItem>
            </SelectContent>
          </Select>
          <Select onValueChange={setCategoryFilter} defaultValue="Todas">
            <SelectTrigger>
               <Filter className="mr-2 h-4 w-4" />
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
          <Select onValueChange={setAgeFilter} defaultValue="Todas">
            <SelectTrigger>
               <Filter className="mr-2 h-4 w-4" />
              <SelectValue placeholder="Edad" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Todas">Todas las Edades</SelectItem>
              <SelectItem value="Infantil">Infantil (12-13)</SelectItem>
              <SelectItem value="Cadete">Cadete (14-15)</SelectItem>
              <SelectItem value="Juvenil">Juvenil (16-18)</SelectItem>
              <SelectItem value="Senior">Senior (+18)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {isLoading && (
        <>
          <p className="text-sm text-muted-foreground mb-6">Cargando ejercicios...</p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm">
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-4 flex-grow">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 flex justify-between items-center">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

      {!isLoading && exercises && (
        <>
          <p className="text-sm text-muted-foreground mb-6">Mostrando {filteredExercises.length} de {exercises.length} ejercicios.</p>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredExercises.map((exercise) => (
              <Card key={exercise.id} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="relative h-56 w-full">
                  <Image
                    src={exercise.diagramUrl || 'https://picsum.photos/seed/placeholder/600/400'}
                    alt={exercise.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                    data-ai-hint={exercise.imageHint}
                  />
                </div>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-bold text-lg leading-tight truncate font-headline">{exercise.title}</h3>
                </CardContent>
                 <CardFooter className="p-4 bg-muted/30 flex justify-between items-center">
                  <Button variant="outline" size="sm">
                    <Eye className="mr-2 h-4 w-4" />
                    Ver Ficha
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Heart className="h-5 w-5 text-muted-foreground group-hover:text-red-500 group-hover:fill-current" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
           {filteredExercises.length === 0 && (
            <div className="text-center py-16 text-muted-foreground col-span-full">
                <p>No se encontraron ejercicios con los filtros seleccionados.</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

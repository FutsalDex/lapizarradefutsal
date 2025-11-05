"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search } from 'lucide-react';

const ITEMS_PER_PAGE = 12;

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [faseFilter, setFaseFilter] = useState('Todos');
  const [edadFilter, setEdadFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);

  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || exercise.category === categoryFilter;
    const matchesFase = faseFilter === 'Todos' || exercise.fase === faseFilter;
    const matchesEdad = edadFilter === 'Todos' || exercise.edad === edadFilter;
    return matchesSearch && matchesCategory && matchesFase && matchesEdad;
  });

  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Biblioteca de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">Encuentra la inspiración para tu próximo entrenamiento.</p>
      </div>
      
      <div className="mb-8 p-4 bg-card rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar ejercicio por nombre..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select onValueChange={value => { setFaseFilter(value); setCurrentPage(1); }} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Fases</SelectItem>
                  <SelectItem value="Inicio">Inicio</SelectItem>
                  <SelectItem value="Desarrollo">Desarrollo</SelectItem>
                  <SelectItem value="Final">Final</SelectItem>
                </SelectContent>
            </Select>
            <Select onValueChange={value => { setCategoryFilter(value); setCurrentPage(1); }} defaultValue="Todos">
              <SelectTrigger>
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
            <Select onValueChange={value => { setEdadFilter(value); setCurrentPage(1); }} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Edades</SelectItem>
                  <SelectItem value="Iniciación">Iniciación</SelectItem>
                  <SelectItem value="Formación">Formación</SelectItem>
                  <SelectItem value="Rendimiento">Rendimiento</SelectItem>
                </SelectContent>
            </Select>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Mostrando {paginatedExercises.length} de {filteredExercises.length} ejercicios. Página {currentPage} de {totalPages}.
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paginatedExercises.map((exercise) => (
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
              <div className="mt-auto pt-4 flex gap-2">
                 <Badge variant="outline">{exercise.category}</Badge>
                 <Badge variant="outline">{exercise.fase}</Badge>
                 <Badge variant="outline">{exercise.edad}</Badge>
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
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}
    </div>
  );
}

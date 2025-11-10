
"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Eye, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

const ITEMS_PER_PAGE = 12;

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [faseFilter, setFaseFilter] = useState('Todos');
  const [edadFilter, setEdadFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  
  const allCategories = [
    "Finalización", "Técnica individual y combinada", "Pase y control",
    "Transiciones (ofensivas y defensivas)", "Coordinación, agilidad y velocidad",
    "Defensa (individual, colectiva y táctica)", "Conducción y regate",
    "Toma de decisiones y visión de juego", "Posesión y circulación del balón",
    "Superioridades e inferioridades numéricas", "Portero y trabajo específico",
    "Balón parado y remates", "Contraataques y ataque rápido", "Desmarques y movilidad",
    "Juego reducido y condicionado", "Calentamiento y activación"
  ];
  
  const allEdades = [
      "Benjamín (8-9 años)", "Alevín (10-11 años)", "Infantil (12-13 años)",
      "Cadete (14-15 años)", "Juvenil (16-18 años)", "Senior (+18 años)"
  ];


  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          exercise.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todos' || exercise.category === categoryFilter;
    
    let matchesFase = true;
    if (faseFilter !== 'Todos') {
        if (faseFilter === 'Fase Inicial') {
            matchesFase = exercise.fase === 'Calentamiento' || exercise.fase === 'Preparación Física' || exercise.fase === 'Calentamiento y activación';
        } else if (faseFilter === 'Fase Principal') {
            matchesFase = exercise.fase === 'Principal' || exercise.fase === 'Específico';
        } else if (faseFilter === 'Fase Final') {
            matchesFase = exercise.fase === 'Vuelta a la Calma';
        } else {
            matchesFase = exercise.fase === faseFilter;
        }
    }
    
    const matchesEdadRaw = edadFilter === 'Todos' || exercise.edad.split(', ').some(e => edadFilter.includes(e));
    const matchesEdad = edadFilter === 'Todos' || allEdades.some(e => e.startsWith(edadFilter) && exercise.edad.includes(e.split(" ")[0]));
    
    // A simplified check for age filter
    let simpleAgeMatch = true;
    if (edadFilter !== 'Todos') {
        const ageTerm = edadFilter.split(" ")[0];
        simpleAgeMatch = exercise.edad.includes(ageTerm);
    }
    
    return matchesSearch && matchesCategory && matchesFase && simpleAgeMatch;
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
  
  const allFases = ["Fase Inicial", "Fase Principal", "Fase Final"];

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
                  {allFases.map(fase => <SelectItem key={fase} value={fase}>{fase}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={value => { setCategoryFilter(value); setCurrentPage(1); }} defaultValue="Todos">
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas las Categorías</SelectItem>
                {allCategories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={value => { setEdadFilter(value); setCurrentPage(1); }} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Edades</SelectItem>
                  {allEdades.map(edad => <SelectItem key={edad} value={edad}>{edad}</SelectItem>)}
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
                 <Badge variant="secondary" className="absolute top-2 right-2">{exercise.category}</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-6 flex-grow flex flex-col">
              <CardTitle className="font-headline text-xl truncate mb-2" title={exercise.title}>{exercise.title}</CardTitle>
              
              <div className="space-y-1 text-sm text-muted-foreground mb-4">
                <p><span className="font-semibold text-foreground">Fase:</span> {exercise.fase}</p>
                <p><span className="font-semibold text-foreground">Edad:</span> {exercise.edad}</p>
                <p><span className="font-semibold text-foreground">Duración:</span> {exercise.duration}</p>
                 <p className="line-clamp-2"><span className="font-semibold text-foreground">Descripción:</span> {exercise.description}</p>
              </div>

              <div className="mt-auto pt-4 flex justify-between items-center">
                 <Button variant="outline" size="sm" asChild>
                    <Link href={`/ejercicios/${exercise.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Ficha
                    </Link>
                 </Button>
                 <Heart className="w-6 h-6 text-destructive/50 hover:text-destructive hover:fill-destructive transition-colors cursor-pointer" />
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


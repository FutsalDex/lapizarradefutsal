"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { PlusCircle, Calendar as CalendarIcon, Clock, Search } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { exercises, Exercise } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type SessionPhase = 'warmup' | 'main' | 'cooldown';

const phaseLimits = {
  warmup: 2,
  main: 4,
  cooldown: 2,
};

export default function CrearSesionPage() {
  const [date, setDate] = useState<Date>();
  const [selectedExercises, setSelectedExercises] = useState<Record<SessionPhase, Exercise[]>>({
    warmup: [],
    main: [],
    cooldown: [],
  });

  const addExercise = (phase: SessionPhase, exercise: Exercise) => {
    setSelectedExercises(prev => {
      if (prev[phase].length < phaseLimits[phase]) {
        return {
          ...prev,
          [phase]: [...prev[phase], exercise]
        };
      }
      return prev;
    });
  };
  
    const allCategories = [...new Set(exercises.map(e => e.category))];
    const allEdades = [...new Set(exercises.flatMap(e => e.edad.split(', ')))];
    const uniqueEdades = [...new Set(allEdades)].filter(Boolean);

  const ExercisePicker = ({ phase }: { phase: SessionPhase }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todos');
    const [edadFilter, setEdadFilter] = useState('Todos');

    const filteredExercises = exercises.filter(exercise => {
      const matchesSearch = exercise.title.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todos' || exercise.category === categoryFilter;
      const matchesEdad = edadFilter === 'Todos' || exercise.edad.includes(edadFilter);
      return matchesSearch && matchesCategory && matchesEdad;
    });

    return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-muted-foreground hover:bg-muted transition-colors">
          <PlusCircle className="h-8 w-8 mb-2" />
          <span>Añadir Tarea</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Ejercicio</DialogTitle>
          <CardDescription>Busca y selecciona un ejercicio de tu biblioteca.</CardDescription>
        </DialogHeader>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar por nombre..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select onValueChange={setCategoryFilter} defaultValue="Todos">
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas las Categorías</SelectItem>
                 {allCategories.map(category => <SelectItem key={category} value={category}>{category}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={setEdadFilter} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Edades</SelectItem>
                  {uniqueEdades.map(edad => <SelectItem key={edad} value={edad}>{edad}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-4">
            {filteredExercises.map(exercise => (
              <DialogClose key={exercise.id} asChild>
                <Card 
                  className="cursor-pointer hover:shadow-lg overflow-hidden flex flex-col"
                  onClick={() => addExercise(phase, exercise)}
                >
                  <CardContent className="p-0 flex flex-col flex-grow">
                    <div className="relative aspect-video w-full bg-primary/80">
                      <Image src={exercise.tacticsUrl} alt={exercise.title} layout="fill" objectFit="contain" className="p-2" />
                    </div>
                    <div className="p-2 text-center border-t bg-card">
                        <p className="text-xs font-semibold truncate">{exercise.title}</p>
                    </div>
                  </CardContent>
                </Card>
              </DialogClose>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
    );
  };
  
  const PhaseSection = ({ phase, title, subtitle }: { phase: SessionPhase; title: string; subtitle: string }) => {
    const exercisesForPhase = selectedExercises[phase];
    const limit = phaseLimits[phase];

    return (
        <Card>
            <CardHeader>
            <CardTitle>{title} <span className="text-muted-foreground font-normal">({exercisesForPhase.length}/{limit})</span></CardTitle>
            <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                {exercisesForPhase.map(ex => (
                    <div key={ex.id} className="border rounded-lg p-2 flex items-center gap-3">
                         <Image src={ex.imageUrl} alt={ex.title} width={64} height={48} className="rounded-md object-cover h-12 w-16" />
                         <span className="text-sm font-medium truncate">{ex.title}</span>
                    </div>
                ))}
            </div>
             {exercisesForPhase.length < limit && <ExercisePicker phase={phase} />}
            </CardContent>
        </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <div className="text-center">
            <h1 className="text-4xl font-bold font-headline">Crear Sesión de Entrenamiento</h1>
            <p className="text-lg text-muted-foreground mt-2">Planifica tu próximo entrenamiento paso a paso.</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalles de la Sesión</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="session-name">Nombre</Label>
                <Input id="session-name" placeholder="Ej: Sesión 01" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="facility">Instalación</Label>
                <Input id="facility" placeholder="Ej: Polideportivo Municipal" />
              </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="space-y-2">
                  <Label>Fecha</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant={"outline"}
                        className={cn(
                          "w-full justify-start text-left font-normal",
                          !date && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={date}
                        onSelect={setDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="time">Hora</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="time" type="time" className="pl-10" />
                  </div>
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="main-objectives">Objetivos Principales</Label>
              <Textarea id="main-objectives" placeholder="Define los objetivos clave para este entrenamiento..." />
            </div>
          </CardContent>
        </Card>
        
        <PhaseSection phase="warmup" title="Fase Inicial (Calentamiento)" subtitle="Ejercicios para preparar al equipo." />
        <PhaseSection phase="main" title="Fase Principal" subtitle="El núcleo del entrenamiento, enfocado en los objetivos." />
        <PhaseSection phase="cooldown" title="Fase Final (Vuelta a la Calma)" subtitle="Ejercicios de baja intensidad para la recuperación." />


        <Card>
            <CardHeader>
                <CardTitle>Finalizar y Guardar</CardTitle>
                <CardDescription>Una vez que hayas añadido todos los ejercicios, puedes previsualizar la ficha de la sesión y guardarla.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button className="w-full" size="lg">Ver ficha y Guardar Sesión</Button>
            </CardContent>
        </Card>

      </div>
    </div>
  );
}

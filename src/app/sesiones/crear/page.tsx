"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, PlusCircle, Calendar as CalendarIcon, Clock } from 'lucide-react';
import Link from 'next/link';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Image from 'next/image';
import { exercises, Exercise } from '@/lib/data';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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

  const ExercisePicker = ({ phase }: { phase: SessionPhase }) => (
    <Dialog>
      <DialogTrigger asChild>
        <button className="w-full border-2 border-dashed rounded-lg flex flex-col items-center justify-center p-8 text-muted-foreground hover:bg-muted transition-colors">
          <PlusCircle className="h-8 w-8 mb-2" />
          <span>Añadir Tarea</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Seleccionar Ejercicio</DialogTitle>
        </DialogHeader>
        <ScrollArea className="h-[60vh]">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
            {exercises.map(exercise => (
              <DialogClose key={exercise.id} asChild>
                <Card 
                  className="cursor-pointer hover:shadow-lg"
                  onClick={() => addExercise(phase, exercise)}
                >
                  <CardContent className="p-2">
                    <div className="relative h-24 w-full mb-2">
                      <Image src={exercise.imageUrl} alt={exercise.title} layout="fill" objectFit="cover" className="rounded-md" />
                    </div>
                    <p className="text-sm font-semibold truncate">{exercise.title}</p>
                  </CardContent>
                </Card>
              </DialogClose>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
  
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
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/sesiones">
            <ArrowLeft className="mr-2" />
            Volver a Sesiones
          </Link>
        </Button>
      </div>

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

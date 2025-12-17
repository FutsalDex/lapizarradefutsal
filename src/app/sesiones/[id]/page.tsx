
"use client";

import { useParams } from 'next/navigation';
import { sessions } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Download, Users, Clock, Target } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const PhaseSection = ({ title, exercises }: { title: string; exercises: any[] }) => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold font-headline text-primary">{title}</h2>
    {exercises.map((exercise, index) => (
      <Card key={index} className="overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-3">
          <div className="md:col-span-1 relative min-h-[200px] bg-primary/80">
            <Image
              src={exercise['Imagen']}
              alt={`Táctica para ${exercise['Ejercicio']}`}
              fill
              className="object-contain p-4"
            />
          </div>
          <div className="md:col-span-2">
            <CardHeader>
              <CardTitle>{exercise['Ejercicio']}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">{exercise['Descripción de la tarea']}</p>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span><span className="font-semibold">Duración:</span> {exercise['Duración (min)']} min</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span><span className="font-semibold">Jugadores:</span> {exercise['Número de jugadores']}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-2">
                    <Target className="w-4 h-4 text-primary" />
                    <h4 className="font-semibold">Objetivos del Ejercicio</h4>
                </div>
                <p className="text-sm text-muted-foreground">{exercise['Objetivos']}</p>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    ))}
  </div>
);


export default function SesionDetallePage() {
  const params = useParams();
  const session = sessions.find(s => s.id === params.id);

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Sesión no encontrada</h1>
        <Link href="/sesiones">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mis Sesiones
          </Button>
        </Link>
      </div>
    );
  }

  const warmupExercises = session.initialExercises || [];
  const mainExercises = session.mainExercises || [];
  const cooldownExercises = session.finalExercises || [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-4xl font-bold font-headline">Sesión de Entrenamiento</h1>
          <p className="text-lg text-muted-foreground mt-1">{session.name}</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/sesiones">
                    <ArrowLeft className="mr-2" />
                    Volver
                </Link>
            </Button>
             <Button>
                <Download className="mr-2" />
                Descargar PDF
            </Button>
        </div>
      </div>
      
      <div className="max-w-4xl mx-auto space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Detalles de la Sesión</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <p className="font-semibold">Club</p>
                        <p className="text-muted-foreground">{session.club}</p>
                    </div>
                     <div>
                        <p className="font-semibold">Equipo</p>
                        <p className="text-muted-foreground">{session.team}</p>
                    </div>
                    <div>
                        <p className="font-semibold">Fecha</p>
                        <p className="text-muted-foreground">{new Date(session.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    </div>
                     <div>
                        <p className="font-semibold">Instalación</p>
                        <p className="text-muted-foreground">{session.facility}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
        
        <Card>
             <CardHeader>
                <CardTitle>Objetivos de la Sesión</CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground">{session.objectives}</p>
            </CardContent>
        </Card>

        <div className="space-y-8">
            {warmupExercises.length > 0 && <PhaseSection title="Fase Inicial (Calentamiento)" exercises={warmupExercises} />}
            {mainExercises.length > 0 && <PhaseSection title="Fase Principal" exercises={mainExercises} />}
            {cooldownExercises.length > 0 && <PhaseSection title="Fase Final (Vuelta a la Calma)" exercises={cooldownExercises} />}
        </div>

      </div>
    </div>
  );
}

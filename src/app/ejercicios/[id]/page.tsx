
"use client";

import { useParams } from 'next/navigation';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Clock, ClipboardList, Target, Info, Lightbulb, GitBranch } from 'lucide-react';
import Link from 'next/link';

export default function EjercicioDetallePage() {
  const params = useParams();
  const exercise = exercises.find(ex => ex.id === params.id); // This will need to be replaced with a Firestore fetch.

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Ejercicio no encontrado</h1>
        <Link href="/ejercicios">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Biblioteca
          </Button>
        </Link>
      </div>
    );
  }
  
  const tags = [exercise['Categoría'], ...exercise['Edad']];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline">
          <Link href="/ejercicios">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Biblioteca
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
           <Card className="overflow-hidden sticky top-24">
             <CardContent className="p-0">
                <div className="relative aspect-video">
                  <Image 
                    src={exercise['Imagen']}
                    alt={`Táctica para ${exercise['Ejercicio']}`}
                    fill
                    className="object-cover"
                  />
                </div>
             </CardContent>
           </Card>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <div>
                <h1 className="font-headline text-3xl md:text-4xl font-bold text-foreground">
                {exercise['Ejercicio']}
                </h1>
                <div className="flex flex-wrap gap-2 mt-4">
                {tags.map(tag => (
                    <Badge key={tag} variant="secondary">{tag}</Badge>
                ))}
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                        <ClipboardList className="w-5 h-5 text-primary" />
                        Descripción
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{exercise['Descripción de la tarea']}</p>
                </CardContent>
            </Card>

             <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                        <Target className="w-5 h-5 text-primary" />
                        Objetivos
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{exercise['Objetivos']}</p>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-headline">
                            <Info className="w-5 h-5 text-primary" />
                            Detalles
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <div className="flex items-center gap-3">
                            <Users className="w-5 h-5 text-muted-foreground" />
                            <span><span className="font-semibold">Jugadores:</span> {exercise['Número de jugadores']}</span>
                        </div>
                         <div className="flex items-center gap-3">
                            <Clock className="w-5 h-5 text-muted-foreground" />
                            <span><span className="font-semibold">Duración:</span> {exercise['Duración (min)']} min</span>
                        </div>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-xl font-headline">
                           <Lightbulb className="w-5 h-5 text-primary" />
                            Consejos
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground">{exercise['Consejos para el entrenador']}</p>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                        <GitBranch className="w-5 h-5 text-primary" />
                        Variantes
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">{exercise['Variantes']}</p>
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}

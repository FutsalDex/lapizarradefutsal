
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Clock, ClipboardList, Target, Info, Lightbulb, GitBranch } from 'lucide-react';
import Link from 'next/link';
import { useDocument } from 'react-firebase-hooks/firestore';
import { doc } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Exercise } from '@/lib/data';
import { Skeleton } from '@/components/ui/skeleton';

export default function EjercicioDetallePage() {
  const params = useParams();
  const exerciseId = params.id as string;

  const [snapshot, loading, error] = useDocument(doc(db, 'exercises', exerciseId));

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Skeleton className="h-10 w-64" />
            </div>
             <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-1">
                    <Card className="overflow-hidden sticky top-24">
                        <Skeleton className="aspect-video w-full" />
                    </Card>
                </div>
                <div className="lg:col-span-2 space-y-6">
                    <Skeleton className="h-10 w-3/4" />
                    <div className="flex flex-wrap gap-2 mt-4">
                        <Skeleton className="h-6 w-24" />
                        <Skeleton className="h-6 w-20" />
                    </div>
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-4/6" />
                        </CardContent>
                    </Card>
                </div>
             </div>
        </div>
    );
  }

  if (error || !snapshot || !snapshot.exists()) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Ejercicio no encontrado</h1>
        <p className="text-muted-foreground mt-2">
            {error ? `Error: ${error.message}` : 'El ejercicio que buscas no existe o ha sido eliminado.'}
        </p>
        <Link href="/ejercicios">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a la Biblioteca
          </Button>
        </Link>
      </div>
    );
  }

  const exercise = { id: snapshot.id, ...snapshot.data() } as Exercise;
  const tags = [exercise['Categoría'], ...(exercise['Edad'] || [])].filter(Boolean);

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


<<<<<<< HEAD
'use client';

import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Exercise, mapExercise } from '@/lib/data';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Target, ClipboardList, Recycle, Brain, Info, ArrowLeft, Layers, Users2, Shapes } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { FutsalCourt } from '@/components/futsal-court';

export default function ExerciseDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();

  const exerciseRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'exercises', id);
  }, [firestore, id]);

  const { data: rawExercise, isLoading } = useDoc<any>(exerciseRef);
  
  const exercise = rawExercise ? mapExercise(rawExercise) : null;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1 space-y-4">
            <Skeleton className="aspect-[4/3] w-full rounded-lg" />
            <Skeleton className="h-24 w-full rounded-lg" />
          </div>
          <div className="md:col-span-2 space-y-6">
            <Skeleton className="h-10 w-3/4" />
            <Skeleton className="h-24 w-full" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!exercise) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Ejercicio no encontrado</h2>
        <p className="text-muted-foreground">No pudimos encontrar el ejercicio que estás buscando.</p>
         <Button asChild variant="link" className="mt-4">
            <Link href="/ejercicios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Biblioteca
            </Link>
        </Button>
      </div>
    );
  }
  
  const edadArray = Array.isArray(exercise.edad) ? exercise.edad : [];
  const materials = exercise['Espacio y materiales necesarios'] || 'No especificados';

  return (
    <div className="container mx-auto px-4 py-8">
       <Button asChild variant="outline" className="mb-8">
            <Link href="/ejercicios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Biblioteca
            </Link>
        </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        <div className="lg:col-span-1 space-y-6">
            <Card className="overflow-hidden">
                 <div className="relative aspect-[4/3] w-full bg-muted">
                    {exercise.image ? (
                       <Image
                            src={exercise.image}
                            alt={`Imagen de ${exercise.name}`}
                            fill
                            className="object-contain p-2"
                        />
                    ) : (
                       <FutsalCourt className="w-full h-full p-1" />
                    )}
                </div>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Detalles del Ejercicio</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                     <div className='flex items-start'><Layers className="mr-3 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0"/> <div><strong>Categoría:</strong><span className='ml-2 text-muted-foreground'>{exercise.category}</span></div></div>
                     <div className='flex items-start'><Users2 className="mr-3 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0"/> <div><strong>Edades:</strong><span className='ml-2 text-muted-foreground capitalize'>{edadArray.join(', ')}</span></div></div>
                     <div className='flex items-start'><Shapes className="mr-3 h-4 w-4 mt-0.5 text-muted-foreground flex-shrink-0"/> <div><strong>Materiales:</strong><span className='ml-2 text-muted-foreground'>{materials}</span></div></div>
                     <div className='flex items-center'><Users className="mr-3 h-4 w-4 text-muted-foreground"/> <div><strong>Jugadores:</strong><span className='ml-2 text-muted-foreground'>{exercise.numberOfPlayers}</span></div></div>
                     <div className='flex items-center'><Clock className="mr-3 h-4 w-4 text-muted-foreground"/> <div><strong>Duración:</strong><span className='ml-2 text-muted-foreground'>{exercise.duration} min</span></div></div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <h1 className="font-headline text-3xl font-bold text-primary mb-2">{exercise.name}</h1>
             <div className="flex flex-wrap gap-2 mb-6">
                {exercise.fase && <Badge variant="secondary">{exercise.fase}</Badge>}
                {edadArray.map(age => <Badge key={age} variant="outline" className="capitalize">{age}</Badge>)}
            </div>
          
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center text-lg'><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Descripción</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{exercise.description}</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center text-lg'><Target className="mr-2 h-5 w-5 text-primary"/>Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground">{exercise.objectives}</p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center text-lg'><Brain className="mr-2 h-5 w-5 text-primary"/>Consejos</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground">{exercise.consejos || 'No se especifican consejos.'}</p>
                        </CardContent>
                    </Card>

                     {exercise.variations && (
                        <Card>
                            <CardHeader>
                                <CardTitle className='flex items-center text-lg'><Recycle className="mr-2 h-5 w-5 text-primary"/>Variantes</CardTitle>
                            </Header>
                            <CardContent>
                                <p className="text-sm text-muted-foreground">{exercise.variations}</p>
                            </CardContent>
                        </Card>
                    )}
                </div>

            </div>
=======
"use client";

import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Users, Clock, ClipboardList, Target, Info, Lightbulb, GitBranch, Layers, Package, Tag, Workflow } from 'lucide-react';
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
                <div className="lg:col-span-1 space-y-6">
                    <Card className="overflow-hidden sticky top-24">
                        <Skeleton className="aspect-video w-full" />
                    </Card>
                    <Card>
                        <CardHeader>
                             <Skeleton className="h-6 w-1/3" />
                        </CardHeader>
                        <CardContent className="space-y-2">
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-5/6" />
                             <Skeleton className="h-4 w-full" />
                             <Skeleton className="h-4 w-4/6" />
                        </CardContent>
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
        <div className="lg:col-span-1 space-y-6">
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
           <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl font-headline">
                        <Info className="w-5 h-5 text-primary" />
                        Detalles
                    </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                    <div className="flex items-start gap-3">
                        <Users className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div><span className="font-semibold">Jugadores:</span> {exercise['Número de jugadores']}</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Clock className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div><span className="font-semibold">Duración:</span> {exercise['Duración (min)']} min</div>
                    </div>
                    <div className="flex items-start gap-3">
                        <Layers className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div><span className="font-semibold">Edad:</span> {Array.isArray(exercise['Edad']) ? exercise['Edad'].join(', ') : 'No especificada'}</div>
                    </div>
                     <div className="flex items-start gap-3">
                        <Package className="w-5 h-5 mt-1 text-muted-foreground" />
                        <div><span className="font-semibold">Materiales:</span> {exercise['Espacio y materiales necesarios']}</div>
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
                    <Badge variant="secondary" className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4"/>
                        {exercise['Categoría']}
                    </Badge>
                     <Badge variant="outline" className="flex items-center gap-1.5">
                        <Workflow className="w-4 h-4"/>
                        Fase: {exercise['Fase']}
                    </Badge>
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
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
        </div>
      </div>
    </div>
  );
}

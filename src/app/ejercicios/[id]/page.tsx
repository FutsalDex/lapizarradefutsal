
'use client';

import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Exercise } from '@/lib/data';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Clock, Target, ClipboardList, Recycle, Brain, Info } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function ExerciseDetailPage() {
  const params = useParams();
  const { id } = params;
  const firestore = useFirestore();

  const exerciseRef = useMemoFirebase(() => {
    if (!firestore || typeof id !== 'string') return null;
    return doc(firestore, 'exercises', id);
  }, [firestore, id]);

  const { data: exercise, isLoading } = useDoc<Exercise>(exerciseRef);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-1">
            <Skeleton className="aspect-square w-full rounded-lg" />
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

  return (
    <div className="container mx-auto px-4 py-8">
       <Button asChild variant="outline" className="mb-8">
            <Link href="/ejercicios">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la Biblioteca
            </Link>
        </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
            <Card>
                <CardContent className="p-0">
                    <div className="relative aspect-[4/3] w-full bg-black/5 rounded-t-lg">
                        <Image
                            src={exercise.imageUrl || 'https://picsum.photos/seed/placeholder/800/600'}
                            alt={`Imagen de ${exercise.name}`}
                            fill
                            className="object-contain p-2"
                        />
                    </div>
                </CardContent>
            </Card>
        </div>

        <div className="lg:col-span-2">
            <h1 className="font-headline text-3xl font-bold text-primary mb-2">{exercise.name}</h1>
             <div className="flex flex-wrap gap-2 mb-6">
                <Badge variant="secondary">{exercise.fase}</Badge>
                <Badge variant="secondary">{exercise.category}</Badge>
                {exercise.edad?.map(age => <Badge key={age} variant="outline">{age}</Badge>)}
            </div>
          
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'><ClipboardList className="mr-2 h-5 w-5 text-primary"/>Descripción</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-justify">{exercise.description}</p>
                    </CardContent>
                </Card>

                 <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'><Target className="mr-2 h-5 w-5 text-primary"/>Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-justify">{exercise.objectives}</p>
                    </CardContent>
                </Card>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center'><Info className="mr-2 h-5 w-5 text-primary"/>Detalles</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <p className='flex items-center text-sm'><Users className="mr-2 h-4 w-4 text-muted-foreground"/> <strong>Jugadores:</strong><span className='ml-2 text-muted-foreground'>{exercise.numberOfPlayers}</span></p>
                             <p className='flex items-center text-sm'><Clock className="mr-2 h-4 w-4 text-muted-foreground"/> <strong>Duración:</strong><span className='ml-2 text-muted-foreground'>{exercise.duration} min</span></p>
                             <p className='flex items-center text-sm'><Recycle className="mr-2 h-4 w-4 text-muted-foreground"/> <strong>Material:</strong><span className='ml-2 text-muted-foreground'>{exercise.spaceAndMaterials}</span></p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardHeader>
                            <CardTitle className='flex items-center'><Brain className="mr-2 h-5 w-5 text-primary"/>Consejos</CardTitle>
                        </CardHeader>
                        <CardContent>
                             <p className="text-sm text-muted-foreground text-justify">{exercise.consejos}</p>
                        </CardContent>
                    </Card>
                </div>

                 <Card>
                    <CardHeader>
                        <CardTitle className='flex items-center'><Recycle className="mr-2 h-5 w-5 text-primary"/>Variantes</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground text-justify">{exercise.variations}</p>
                    </CardContent>
                </Card>
            </div>
        </div>
      </div>
    </div>
  );
}

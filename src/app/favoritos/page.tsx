"use client";

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Eye, Heart } from 'lucide-react';
import Link from 'next/link';

// Simula una lista de IDs de ejercicios favoritos
const favoriteExerciseIds = ['1', '6'];

export default function FavoritosPage() {
  const favoriteExercises = exercises.filter(ex => favoriteExerciseIds.includes(ex.id));

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Mis Ejercicios Favoritos</h1>
        <p className="text-lg text-muted-foreground mt-2">Aquí encontrarás los ejercicios que has guardado para un acceso rápido.</p>
      </div>

      {favoriteExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {favoriteExercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-0">
                <div className="relative aspect-video w-full bg-primary/80">
                  <Image
                    src={exercise.tacticsUrl}
                    alt={`Táctica para ${exercise.title}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 50vw"
                    className="object-contain p-4"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow flex flex-col">
                <CardTitle className="font-headline text-xl truncate" title={exercise.title}>{exercise.title}</CardTitle>
                <div className="mt-auto pt-4 flex justify-between items-center">
                   <Button variant="outline" size="sm" asChild>
                      <Link href={`/ejercicios/${exercise.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Ficha
                      </Link>
                   </Button>
                   <Heart className="w-6 h-6 text-destructive fill-destructive cursor-pointer" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
         <div className="text-center py-16 text-muted-foreground">
            <p>Aún no has guardado ningún ejercicio como favorito.</p>
            <Button asChild className="mt-4">
                <Link href="/ejercicios">Explorar ejercicios</Link>
            </Button>
        </div>
      )}
    </div>
  );
}

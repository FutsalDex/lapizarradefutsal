
"use client";

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { exercises, Exercise } from '@/lib/data';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Eye, Heart } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

// Simulación de un estado de favoritos compartido (en una app real sería un context o una store)
let favoriteExerciseIdsStore = new Set(['1', '6']);

export default function FavoritosPage() {
  const [favoriteIds, setFavoriteIds] = useState(favoriteExerciseIdsStore);
  const { toast } = useToast();

  useEffect(() => {
    // Sincronizar con el store simulado al montar el componente
    setFavoriteIds(favoriteExerciseIdsStore);
  }, []);

  const handleFavoriteToggle = (exerciseId: string) => {
    const newFavoriteIds = new Set(favoriteIds);
    if (newFavoriteIds.has(exerciseId)) {
      newFavoriteIds.delete(exerciseId);
      toast({
        description: "Ejercicio eliminado de favoritos.",
      });
    } else {
      newFavoriteIds.add(exerciseId);
       toast({
        description: "Ejercicio añadido a favoritos.",
      });
    }
    setFavoriteIds(newFavoriteIds);
    // Actualizar el store simulado
    favoriteExerciseIdsStore = newFavoriteIds;
  };

  const favoriteExercises = exercises.filter(ex => favoriteIds.has(ex.id));

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
                   <Button variant="ghost" size="icon" onClick={() => handleFavoriteToggle(exercise.id)}>
                        <Heart className={cn("w-6 h-6 text-destructive/50 transition-colors", {
                            "fill-destructive text-destructive": favoriteIds.has(exercise.id)
                        })} />
                    </Button>
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


'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Heart, Search, Eye } from 'lucide-react';
import Link from 'next/link';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { collection, doc, deleteDoc } from 'firebase/firestore';
import { Exercise } from '@/lib/data';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import Image from 'next/image';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

export default function FavoritosPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  const favoritesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/favorites`);
  }, [firestore, user]);
  
  const exercisesCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exercises');
  }, [firestore]);

  const { data: favorites, isLoading: isLoadingFavorites } = useCollection(favoritesCollectionRef);
  const { data: allExercises, isLoading: isLoadingExercises } = useCollection<Exercise>(exercisesCollectionRef);

  const favoriteExercises = useMemo(() => {
    if (!favorites || !allExercises) return [];
    const favoriteIds = new Set(favorites.map(fav => fav.id));
    return allExercises.filter(exercise => favoriteIds.has(exercise.id));
  }, [favorites, allExercises]);

  const handleRemoveFavorite = async (exerciseId: string) => {
    if (!user || !firestore) return;
    const favoriteRef = doc(firestore, `users/${user.uid}/favorites`, exerciseId);
    await deleteDoc(favoriteRef);
  };
  
  const isLoading = isLoadingFavorites || isLoadingExercises;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Mis Ejercicios Favoritos</h1>
        <p className="text-lg text-muted-foreground mt-2">Aquí encontrarás los ejercicios que has guardado para un acceso rápido.</p>
      </div>

      {isLoading && (
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => (
              <Card key={i} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm">
                <Skeleton className="h-56 w-full" />
                <CardContent className="p-4 flex-grow">
                  <Skeleton className="h-6 w-3/4 mb-2" />
                </CardContent>
                <CardFooter className="p-4 bg-muted/30 flex justify-between items-center">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
      )}

      {!isLoading && !user && (
         <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <Heart className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Inicia sesión para ver tus favoritos</h2>
          <p className="mb-6">Crea una cuenta o inicia sesión para guardar tus ejercicios preferidos.</p>
          <Button asChild>
            <Link href="/acceso">
              <Eye className="mr-2 h-4 w-4" />
              Acceder
            </Link>
          </Button>
        </div>
      )}

      {!isLoading && user && favoriteExercises.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <Heart className="mx-auto h-12 w-12 mb-4" />
          <h2 className="text-xl font-semibold mb-2">Aún no tienes favoritos</h2>
          <p className="mb-6">Explora la biblioteca y pulsa en el corazón para guardar los que más te gusten.</p>
          <Button asChild>
            <Link href="/ejercicios">
              <Search className="mr-2 h-4 w-4" />
              Explorar Ejercicios
            </Link>
          </Button>
        </div>
      ) : null}

      {!isLoading && user && favoriteExercises.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
           {favoriteExercises.map((exercise) => (
              <Card key={exercise.id} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300">
                <div className="relative h-56 w-full">
                  <Image
                    src={exercise.Imagen || 'https://picsum.photos/seed/placeholder/600/400'}
                    alt={exercise.Ejercicio}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain p-2"
                    data-ai-hint={exercise.aiHint}
                  />
                </div>
                <CardContent className="p-4 flex-grow">
                  <h3 className="font-bold text-lg leading-tight truncate font-headline">{exercise.Ejercicio}</h3>
                </CardContent>
                 <CardFooter className="p-4 bg-muted/30 flex justify-between items-center">
                  <Button asChild variant="outline" size="sm">
                    <Link href={`/ejercicios/${exercise.id}`}>
                      <Eye className="mr-2 h-4 w-4" />
                      Ver Ficha
                    </Link>
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleRemoveFavorite(exercise.id)}>
                    <Heart className="h-5 w-5 text-red-500 fill-current" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
        </div>
      ) : null}
    </div>
  );
}

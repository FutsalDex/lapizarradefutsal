
import { Button } from '@/components/ui/button';
import { Heart, Search } from 'lucide-react';
import Link from 'next/link';

export default function FavoritosPage() {
  // TODO: Implement logic to fetch and display favorite exercises
  const favoriteExercises: any[] = [];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Mis Ejercicios Favoritos</h1>
        <p className="text-lg text-muted-foreground mt-2">Aquí encontrarás los ejercicios que has guardado para un acceso rápido.</p>
      </div>

      {favoriteExercises.length === 0 ? (
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
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* TODO: Map over favoriteExercises and display them */}
        </div>
      )}
    </div>
  );
}

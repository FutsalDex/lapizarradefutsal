import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Edit, Users, Star, ArrowRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';

export default function Home() {
  const heroImage = placeholderImages.placeholderImages.find(p => p.id === 'hero');

  return (
    <div className="flex flex-col bg-background text-foreground">
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white">
        <div className="relative z-10 p-4">
          <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight drop-shadow-lg">
            La Pizarra del Entrenador
          </h1>
          <p className="mt-4 text-lg md:text-xl max-w-2xl mx-auto drop-shadow-md">
            Tu compañero definitivo para el entrenamiento de fútbol sala.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
              <Link href="/ejercicios">
                Explorar Ejercicios
              </Link>
            </Button>
            <Button asChild size="lg" variant="secondary">
              <Link href="/premium">
                Hazte Premium <Star className="ml-2" />
              </Link>
            </Button>
          </div>
        </div>
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="absolute inset-0 bg-black/50" />
      </section>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
            <h2 className="font-headline text-4xl font-bold">Todo lo que necesitas en un solo lugar</h2>
            <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
              Desde la planificación de sesiones hasta el análisis de partidos, LaPizarra te ofrece las herramientas para llevar a tu equipo al siguiente nivel.
            </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
          <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <BookOpen className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">Biblioteca de Ejercicios</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Accede a cientos de ejercicios de técnica, táctica y preparación física, con videos y descripciones detalladas para una ejecución perfecta.
              </p>
            </CardContent>
          </Card>

          <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Edit className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">Creador de Sesiones</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Diseña y guarda tus propias sesiones de entrenamiento arrastrando ejercicios de la biblioteca. Planifica tu semana o toda la temporada con facilidad.
              </p>
            </CardContent>
          </Card>
          
          <Card className="flex flex-col">
            <CardHeader>
                <div className="flex items-center gap-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                        <Users className="h-6 w-6 text-primary" />
                    </div>
                    <CardTitle className="font-headline text-2xl text-primary">Gestión de Equipo</CardTitle>
                </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-muted-foreground">
                Lleva un registro del rendimiento de tus jugadores, asiste a los partidos y analiza las estadísticas para tomar decisiones informadas.
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-16 text-center">
             <Card className="border-accent border-2 max-w-4xl mx-auto p-8">
                <CardHeader className="p-0 mb-4">
                  <CardTitle className="font-headline text-3xl text-accent flex items-center justify-center gap-2">
                    <Star/> Desbloquea Todo el Potencial
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                    Suscríbete al plan Premium para acceder al catálogo completo de ejercicios, herramientas avanzadas de análisis con IA y mucho más.
                  </p>
                  <Button asChild size="lg" className="bg-accent hover:bg-accent/90 text-accent-foreground">
                    <Link href="/premium">
                      Ver Planes <ArrowRight className="ml-2" />
                    </Link>
                  </Button>
                </CardContent>
              </Card>
        </div>

      </main>
    </div>
  );
}

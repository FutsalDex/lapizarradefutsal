import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, User } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-16">
      <div className="text-center mb-12">
        <h1 className="font-headline text-5xl md:text-6xl font-bold tracking-tight">
           LaPizarra
        </h1>
        <p className="mt-4 text-lg max-w-2xl mx-auto text-muted-foreground font-light">
          Tu compañero definitivo para el entrenamiento de fútbol sala. Descubre cientos de ejercicios, diseña sesiones de entrenamientos, gestiona tu equipo y analiza su rendimiento.
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        
        <Card className="border-primary border-2 flex flex-col bg-card shadow-lg">
          <CardHeader>
            <CardTitle className="font-headline text-2xl text-primary">¡Potencia Tu Entrenamiento!</CardTitle>
          </CardHeader>
          <CardContent className="flex-grow">
            <p className="text-muted-foreground">
              Suscríbete a uno de los planes para acceder al catálogo completo de ejercicios y desbloquear las herramientas avanzadas de gestión de equipos.
            </p>
          </CardContent>
          <CardFooter>
            <Button asChild size="lg">
              <Link href="#">
                Ver Planes <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>

        <Card className="bg-card flex flex-col">
          <CardHeader>
            <div className='flex items-center gap-3'>
              <User className="w-5 h-5 text-muted-foreground" />
              <CardTitle className="font-headline text-2xl font-semibold">Acceso de Usuario</CardTitle>
            </div>
            <CardDescription className="text-base">Regístrate para una prueba de 30 días</CardDescription>
          </CardHeader>
          <CardContent className="flex-grow">
             <h3 className="font-semibold mb-3">Con tu cuenta gratuita, podrás:</h3>
             <ul className="space-y-2 text-muted-foreground list-disc pl-5">
              <li>Explorar el catálogo completo de ejercicios.</li>
              <li>Guardar tus ejercicios favoritos.</li>
              <li>Crear y gestionar sesiones de entrenamiento.</li>
              <li>Analizar las estadísticas de los partidos de tu equipo.</li>
             </ul>
          </CardContent>
           <CardFooter>
            <Button asChild variant="outline" className="w-full">
              <Link href="/acceso">
                Regístrate o Inicia Sesión <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
        
      </div>

    </main>
  );
}

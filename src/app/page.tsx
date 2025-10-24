import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, Edit, Users, Heart, LayoutDashboard, Lock, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-4rem)] bg-background text-foreground px-4 py-8 md:py-12">
      <main className="text-center max-w-4xl mx-auto">
        <h1 className="font-headline text-5xl md:text-7xl font-bold tracking-tight">
          LaPizarra
        </h1>
        <p className="mt-4 text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
          Tu compañero definitivo para el entrenamiento de fútbol sala. Descubre cientos
          de ejercicios, diseña sesiones de entrenamientos, gestiona tu equipo y analiza su
          rendimiento.
        </p>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          <Card className="border-primary border-2">
            <CardHeader>
              <CardTitle className="font-headline text-2xl text-primary">¡Potencia Tu Entrenamiento!</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-6">
                Suscríbete a uno de los planes para acceder al catálogo completo de ejercicios y desbloquear las herramientas avanzadas de gestión de equipos.
              </p>
              <Button asChild size="lg" className="w-full bg-primary hover:bg-primary/90 text-primary-foreground">
                <Link href="#">
                  Ver Planes <ArrowRight className="ml-2" />
                </Link>
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="font-headline text-2xl flex items-center">
                <Lock className="mr-2 h-6 w-6 text-muted-foreground" />
                Acceso de Invitado
              </CardTitle>
              <p className="text-sm text-muted-foreground pt-1">¿Quieres probar antes de suscribirte?</p>
            </CardHeader>
            <CardContent>
              <p className="mb-4">Como invitado, puedes:</p>
              <ul className="space-y-3 text-muted-foreground">
                <li className="flex items-start">
                  <ArrowRight className="h-4 w-4 mr-2 mt-1 text-primary shrink-0" />
                  <span>Explorar una selección de <span className="font-semibold text-foreground">15 ejercicios</span> de nuestra biblioteca.</span>
                </li>
                <li className="flex items-start">
                   <ArrowRight className="h-4 w-4 mr-2 mt-1 text-primary shrink-0" />
                  <span>Navegar y visualizar todas las herramientas que te ofrecemos.</span>
                </li>
                <li className="flex items-start">
                   <ArrowRight className="h-4 w-4 mr-2 mt-1 text-primary shrink-0" />
                  <span>Y si te registras disfrutarás de 30 días de todos los ejercicios y herramientas, antes de decidir tu suscripción.</span>
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

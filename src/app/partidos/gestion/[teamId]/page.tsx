
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart2, CalendarCheck, Shield, Users, ArrowLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  club?: string;
  season?: string;
}

const dashboardItems = [
    {
        title: 'Mi Plantilla',
        description: 'Visualiza y gestiona los miembros de tu equipo.',
        icon: <Users className="w-6 h-6 text-primary" />,
        href: 'plantilla',
    },
    {
        title: 'Mis Partidos',
        description: 'Registra y revisa los resultados de los partidos.',
        icon: <Shield className="w-6 h-6 text-primary" />,
        href: 'partidos',
    },
    {
        title: 'Control de Asistencia',
        description: 'Lleva un registro de la asistencia a los entrenamientos.',
        icon: <CalendarCheck className="w-6 h-6 text-primary" />,
        href: 'asistencia',
    },
    {
        title: 'Mis Estadísticas',
        description: 'Analiza el rendimiento general de tu equipo.',
        icon: <BarChart2 className="w-6 h-6 text-primary" />,
        href: 'estadisticas',
    }
];


export default function TeamDashboardPage() {
  const params = useParams();
  const { teamId } = params;
  const firestore = useFirestore();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || typeof teamId !== 'string') return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  
  if (isLoadingTeam && !team) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-80 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
                <Skeleton className="h-48" />
            </div>
        </div>
    );
  }

  if (!team && !isLoadingTeam) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Equipo no encontrado</h2>
        <p className="text-muted-foreground">No pudimos encontrar el equipo que estás buscando.</p>
        <Button asChild variant="link" className="mt-4">
            <Link href="/partidos/gestion">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a la gestión de equipos
            </Link>
        </Button>
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="mb-8">
         <Button asChild variant="outline" className="mb-4">
          <Link href="/partidos/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">{team?.name}</h1>
        <p className="text-lg text-muted-foreground mt-2">Panel de control del equipo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
              <div className="bg-primary/10 p-3 rounded-full">{item.icon}</div>
              <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
               <Button asChild className="w-full">
                <Link href={`/partidos/gestion/${teamId}/${item.href}`}>
                  Ir a {item.title}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

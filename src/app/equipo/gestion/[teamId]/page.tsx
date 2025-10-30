'use client';

import { useParams } from 'next/navigation';
import {
  Users,
  CalendarDays,
  ClipboardList,
  BarChart3,
  ArrowLeft,
  ChevronRight,
  Trophy,
  Briefcase,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc } from 'firebase/firestore';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds?: string[];
}

const menuItems = [
  {
    title: 'Mi Plantilla',
    description: 'Gestiona los jugadores del equipo.',
    icon: <Users className="w-8 h-8 text-primary" />,
    href: '/miembros',
  },
  {
    title: 'Cuerpo Técnico',
    description: 'Invita y gestiona a tus colaboradores.',
    icon: <Briefcase className="w-8 h-8 text-primary" />,
    href: '/cuerpo-tecnico',
    disabled: false,
  },
  {
    title: 'Mis Partidos',
    description: 'Planifica y revisa los resultados de los partidos.',
    icon: <Trophy className="w-8 h-8 text-primary" />,
    href: '/partidos',
    disabled: false,
  },
  {
    title: 'Mis Asistencias',
    description: 'Controla la asistencia a los entrenamientos.',
    icon: <ClipboardList className="w-8 h-8 text-primary" />,
    href: '/asistencias',
    disabled: true,
  },
  {
    title: 'Mis Estadísticas',
    description: 'Analiza el rendimiento del equipo y los jugadores.',
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    href: '/estadisticas',
    disabled: true,
  },
];

export default function TeamDashboardPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  if (isLoadingTeam) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-80 mb-8" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-48 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Equipo no encontrado</h2>
        <Button asChild variant="outline">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis equipos
          </Link>
        </Button>
      </div>
    );
  }

  const isOwner = user?.uid === team.ownerId;
  const isMember = team.memberIds?.includes(user?.uid ?? '');
  const canView = isOwner || isMember;

  if (!canView) {
     return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-4">No tienes permiso para ver este equipo.</p>
        <Button asChild variant="outline">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis equipos
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mis Equipos
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">
          Panel de {team.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Selecciona una sección para empezar a gestionar tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {menuItems.map((item) => (
          <Card
            key={item.title}
            className={`flex flex-col hover:shadow-lg transition-shadow ${
              item.disabled ? 'bg-muted/50' : ''
            }`}
          >
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
              <div
                className={`bg-primary/10 p-4 rounded-full ${
                  item.disabled ? 'opacity-50' : ''
                }`}
              >
                {item.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle className="font-headline text-xl mb-1">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full" disabled={item.disabled}>
                <Link href={`/equipo/gestion/${teamId}${item.href}`}>
                  {item.disabled ? 'Próximamente' : `Acceder`}
                  {!item.disabled && <ChevronRight className="w-4 h-4 ml-2" />}
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

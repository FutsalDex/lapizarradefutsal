'use client';

import { useParams } from 'next/navigation';
import { doc } from 'firebase/firestore';
import { useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart2, CalendarCheck, Shield, UserPlus, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

const navItems = [
    { title: 'Mi Plantilla', href: '#', icon: <Users className="w-8 h-8 text-primary" /> },
    { title: 'Mis Partidos', href: '#', icon: <Shield className="w-8 h-8 text-primary" /> },
    { title: 'Control de Asistencia', href: '#', icon: <CalendarCheck className="w-8 h-8 text-primary" /> },
    { title: 'Mis Estadísticas', href: '#', icon: <BarChart2 className="w-8 h-8 text-primary" /> },
];

interface Team {
  id: string;
  name: string;
  club?: string;
  season?: string;
}

// Mock data, to be replaced with Firestore data
const teamMembers = [
  { name: 'Álex García', initials: 'AG', role: 'Jugador' },
  { name: 'Sofía Martínez', initials: 'SM', role: 'Jugador' },
];

export default function TeamDashboardPage() {
  const params = useParams();
  const { teamId } = params;
  const firestore = useFirestore();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || typeof teamId !== 'string') return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const { data: team, isLoading } = useDoc<Team>(teamRef);

  if (isLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-80 mb-8" />
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 space-y-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {Array.from({length: 4}).map((_, i) => <Skeleton key={i} className="h-28" />)}
                    </div>
                    <Skeleton className="h-96" />
                </div>
                <div className="lg:col-span-1">
                    <Skeleton className="h-64" />
                </div>
            </div>
        </div>
    );
  }

  if (!team) {
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
       <Button asChild variant="outline" className="mb-8">
          <Link href="/partidos/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Link>
        </Button>
      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">{team.name}</h1>
        <p className="text-lg text-muted-foreground mt-2">Panel de control del equipo.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                {navItems.map(item => (
                    <Card key={item.title} className="hover:shadow-lg hover:border-primary/50 transition-all">
                        <Link href="#">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-lg font-medium font-headline">{item.title}</CardTitle>
                                {item.icon}
                            </CardHeader>
                            <CardContent>
                                <p className="text-xs text-muted-foreground">Accede a la sección de {item.title.toLowerCase()}</p>
                            </CardContent>
                        </Link>
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center"><Users className="mr-2"/>Mi Plantilla</CardTitle>
                    <CardDescription>Visualiza y gestiona los miembros de tu equipo.</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {teamMembers.map((member) => (
                        <div key={member.name} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.name}</p>
                                <p className="text-sm text-muted-foreground">{member.role}</p>
                            </div>
                            </div>
                            <Button variant="ghost" size="sm">Gestionar</Button>
                        </div>
                        ))}
                    </div>
                     <Separator className="my-6" />
                    <div className="flex flex-col sm:flex-row items-center justify-between rounded-lg border p-4">
                        <div className='mb-4 sm:mb-0'>
                            <h4 className="font-semibold">Invitar nuevo miembro</h4>
                            <p className="text-sm text-muted-foreground">
                            Envía una invitación para que se unan a tu equipo.
                            </p>
                        </div>
                        <Button>
                            <UserPlus className="mr-2" /> Invitar Jugador
                        </Button>
                    </div>
                </CardContent>
            </Card>

        </div>
        <div className="lg:col-span-1 space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Información General</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Nombre del Equipo</h4>
                        <p className="text-muted-foreground">{team.name}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Club</h4>
                        <p className="text-muted-foreground">{team.club || 'No especificado'}</p>
                    </div>
                    <div>
                        <h4 className="font-semibold text-sm mb-1">Temporada</h4>
                        <p className="text-muted-foreground">{team.season || 'No especificada'}</p>
                    </div>
                     <Button variant="outline" className="w-full mt-4">Editar Información</Button>
                </CardContent>
            </Card>
        </div>
      </div>
    </div>
  );
}

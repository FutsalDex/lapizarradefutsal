
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, doc, query, where } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { BarChart2, CalendarCheck, Shield, UserPlus, Users, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  club?: string;
  season?: string;
}

interface TeamInvitation {
  userId: string;
  status: 'pending' | 'accepted' | 'rejected';
}

interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

const getInitials = (name?: string) => {
    return name?.charAt(0).toUpperCase() || '';
}

export default function TeamDashboardPage() {
  const params = useParams();
  const { teamId } = params;
  const firestore = useFirestore();

  // 1. Get Team Info
  const teamRef = useMemoFirebase(() => {
    if (!firestore || typeof teamId !== 'string') return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  // 2. Get accepted invitations to find member IDs
  const invitationsRef = useMemoFirebase(() => {
      if(!firestore || typeof teamId !== 'string') return null;
      return collection(firestore, 'teamInvitations');
  }, [firestore, teamId]);
  const acceptedInvitationsQuery = useMemoFirebase(() => {
      if(!invitationsRef || !teamId) return null;
      return query(invitationsRef, where('teamId', '==', teamId), where('status', '==', 'accepted'));
  }, [invitationsRef, teamId]);
  const { data: acceptedInvitations, isLoading: isLoadingInvitations } = useCollection<TeamInvitation>(acceptedInvitationsQuery);

  // 3. Get user profiles for the members
  const memberIds = useMemo(() => acceptedInvitations?.map(inv => inv.userId) || [], [acceptedInvitations]);
  
  const usersRef = useMemoFirebase(() => {
    if (!firestore || memberIds.length === 0) return null;
    return collection(firestore, 'users');
  }, [firestore, memberIds.length]);

  const membersQuery = useMemoFirebase(() => {
      if(!usersRef || memberIds.length === 0) return null;
      return query(usersRef, where('__name__', 'in', memberIds));
  }, [usersRef, memberIds]);
  
  const { data: teamMembers, isLoading: isLoadingMembers } = useCollection<UserProfile>(membersQuery);
  
  const isLoading = isLoadingTeam || isLoadingInvitations || isLoadingMembers;

  if (isLoading && !team) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-64 mb-2" />
            <Skeleton className="h-6 w-80 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
                <Skeleton className="h-96" />
            </div>
        </div>
    );
  }

  if (!team && !isLoading) {
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Card Mi Plantilla */}
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="flex items-center"><Users className="mr-2"/>Mi Plantilla</CardTitle>
                <CardDescription>Visualiza y gestiona los miembros de tu equipo.</CardDescription>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
                {isLoadingMembers ? (
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                  </div>
                ) : teamMembers && teamMembers.length > 0 ? (
                    teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{getInitials(member.firstName) || getInitials(member.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.firstName} {member.lastName}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            </div>
                            <Button variant="ghost" size="sm">Gestionar</Button>
                        </div>
                    ))
                ) : (
                    <p className="text-muted-foreground text-center py-4">Aún no hay miembros en este equipo.</p>
                )}
            </CardContent>
             <div className="p-6 pt-0">
                <Separator className="my-4" />
                <Button className="w-full">
                    <UserPlus className="mr-2" /> Invitar Jugador
                </Button>
             </div>
        </Card>

        {/* Card Mis Partidos */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><Shield className="mr-2"/>Mis Partidos</CardTitle>
                <CardDescription>Registra y revisa los resultados de los partidos.</CardDescription>
            </CardHeader>
            <CardContent>
                <p className="text-muted-foreground text-center py-4">Aún no se han registrado partidos.</p>
                 <Button className="w-full mt-4">Registrar Nuevo Partido</Button>
            </CardContent>
        </Card>

        {/* Card Control de Asistencia */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><CalendarCheck className="mr-2"/>Control de Asistencia</CardTitle>
                <CardDescription>Lleva un registro de la asistencia a los entrenamientos y partidos.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground text-center py-4">No hay datos de asistencia disponibles.</p>
                 <Button className="w-full mt-4">Pasar Lista</Button>
            </CardContent>
        </Card>

        {/* Card Mis Estadísticas */}
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center"><BarChart2 className="mr-2"/>Mis Estadísticas</CardTitle>
                <CardDescription>Analiza el rendimiento general de tu equipo.</CardDescription>
            </CardHeader>
            <CardContent>
                 <p className="text-muted-foreground text-center py-4">No hay estadísticas para mostrar.</p>
                  <Button variant="outline" className="w-full mt-4">Ver Gráficos Detallados</Button>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

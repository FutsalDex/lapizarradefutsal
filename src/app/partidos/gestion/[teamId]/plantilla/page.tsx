
'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
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

export default function TeamRosterPage() {
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
    // Firestore 'in' queries are limited to 30 items. For larger teams, this needs pagination or a different approach.
    if (memberIds.length > 30) {
        console.warn("Team has more than 30 members, query will be truncated.");
    }
    return collection(firestore, 'users');
  }, [firestore, memberIds.length]);

  const membersQuery = useMemoFirebase(() => {
      if(!usersRef || memberIds.length === 0) return null;
      return query(usersRef, where('__name__', 'in', memberIds.slice(0, 30)));
  }, [usersRef, memberIds]);
  
  const { data: teamMembers, isLoading: isLoadingMembers } = useCollection<UserProfile>(membersQuery);
  
  const isLoading = isLoadingTeam || isLoadingInvitations || isLoadingMembers;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/partidos/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
        {isLoadingTeam ? <Skeleton className='h-10 w-1/2' /> : <h1 className="text-4xl font-bold font-headline text-primary">Plantilla de {team?.name}</h1>}
        <p className="text-lg text-muted-foreground mt-2">Visualiza y gestiona los miembros de tu equipo.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    {isLoadingMembers ? 'Cargando...' : `${teamMembers?.length || 0} jugadores en la plantilla.`}
                </CardDescription>
            </div>
            <Button>
                <UserPlus className="mr-2" /> Invitar Jugador
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-4">
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
                <div className="divide-y">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{getInitials(member.firstName) || getInitials(member.email)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-medium">{member.firstName || 'Usuario'} {member.lastName || ''}</p>
                                <p className="text-sm text-muted-foreground">{member.email}</p>
                            </div>
                            </div>
                            <Button variant="ghost" size="sm">Gestionar</Button>
                        </div>
                    ))}
                </div>
            ) : (
                <p className="text-muted-foreground text-center py-8">Aún no hay miembros en este equipo. ¡Invita a tu primer jugador!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

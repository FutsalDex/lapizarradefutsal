
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

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    const first = firstName?.charAt(0) || '';
    const last = lastName?.charAt(0) || '';
    if (first && last) return `${first}${last}`.toUpperCase();
    return (email?.charAt(0) || '').toUpperCase();
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
    if (!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const membersQuery = useMemoFirebase(() => {
    if (!usersRef || memberIds.length === 0) return null;
    // Firestore 'in' queries are limited to 30 items per query.
    // For larger teams, this needs pagination or multiple queries.
    if (memberIds.length > 10) {
      console.warn("Team has more than 10 members, this query might be truncated. Consider pagination for larger teams.");
    }
    return query(usersRef, where('id', 'in', memberIds.slice(0, 10)));
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
                    {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `${teamMembers?.length || 0} jugadores en la plantilla.`}
                </CardDescription>
            </div>
            <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Invitar Jugador
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading && !teamMembers ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                                <Skeleton className="h-5 w-28 mb-1" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </div>
                        <Skeleton className="h-9 w-24 rounded-md" />
                    </div>
                ))}
              </div>
            ) : teamMembers && teamMembers.length > 0 ? (
                <div className="divide-y">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-4">
                            <Avatar>
                                <AvatarFallback>{getInitials(member.firstName, member.lastName, member.email)}</AvatarFallback>
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

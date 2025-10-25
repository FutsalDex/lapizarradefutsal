'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, documentId } from 'firebase/firestore';
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

interface TeamMember {
  id: string; // This is the userId
  role?: string;
}

interface UserProfile {
    id: string;
    firstName?: string;
    lastName?: string;
    email: string;
}

const getInitials = (firstName?: string, lastName?: string, email?: string) => {
    if (firstName && lastName) return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
    if (firstName) return firstName.charAt(0).toUpperCase();
    return (email?.charAt(0) || '').toUpperCase();
}

function TeamRoster({ memberIds }: { memberIds: string[] }) {
    const firestore = useFirestore();

    const membersQuery = useMemoFirebase(() => {
        if (!firestore || memberIds.length === 0) return null;
        if (memberIds.length > 30) {
            console.warn("Team has more than 30 members, this query will be truncated. Implement pagination.");
        }
        return query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0, 30)));
    }, [firestore, memberIds]);

    const { data: teamMembers, isLoading: isLoadingMembers } = useCollection<UserProfile>(membersQuery);

    if (isLoadingMembers) {
        return (
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
        );
    }
    
    if (teamMembers && teamMembers.length > 0) {
        return (
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
        );
    }

    return (
        <p className="text-muted-foreground text-center py-8">Aún no hay miembros en este equipo. ¡Invita a tu primer jugador!</p>
    );
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

  // 2. Get member IDs from the 'members' subcollection
  const membersSubcollectionRef = useMemoFirebase(() => {
      if(!firestore || typeof teamId !== 'string') return null;
      return collection(firestore, 'teams', teamId, 'members');
  }, [firestore, teamId]);
  const { data: teamMembersDocs, isLoading: isLoadingMembersSubcollection } = useCollection<TeamMember>(membersSubcollectionRef);

  const memberIds = useMemo(() => {
    if (!teamMembersDocs) return [];
    return teamMembersDocs.map(memberDoc => memberDoc.id);
  }, [teamMembersDocs]);

  const isLoading = isLoadingTeam || isLoadingMembersSubcollection;

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
                    {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `${memberIds.length} jugadores en la plantilla.`}
                </CardDescription>
            </div>
            <Button>
                <UserPlus className="mr-2 h-4 w-4" /> Invitar Jugador
            </Button>
        </CardHeader>
        <CardContent className="space-y-4">
            {isLoading && <Skeleton className="h-20 w-full" />}
            {!isLoading && memberIds.length > 0 && <TeamRoster memberIds={memberIds} />}
            {!isLoading && memberIds.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Aún no hay miembros en este equipo. ¡Invita a tu primer jugador!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

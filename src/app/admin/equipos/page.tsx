
'use client';

import { useMemo } from 'react';
import { collection, query, getDocs } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  club?: string;
  season?: string;
  ownerId: string;
}

interface UserProfile {
    id: string;
    email: string;
}


function TeamsTable({ teams, users }: { teams: Team[], users: UserProfile[] }) {
    const usersMap = useMemo(() => new Map(users.map(u => [u.id, u.email])), [users]);

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Nombre del Equipo</TableHead>
                    <TableHead>Club</TableHead>
                    <TableHead>Temporada</TableHead>
                    <TableHead>Propietario (Email)</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {teams.map((team) => (
                    <TableRow key={team.id}>
                        <TableCell className="font-medium">{team.name}</TableCell>
                        <TableCell>{team.club ?? '-'}</TableCell>
                        <TableCell>{team.season ?? '-'}</TableCell>
                        <TableCell className="text-muted-foreground">{usersMap.get(team.ownerId) ?? team.ownerId}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function AdminTeamsPage() {
  const firestore = useFirestore();
  const { user } = useUser();

  // Admin sees all teams, regular users see nothing on this page.
  const teamsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teams');
  }, [firestore]);

  const usersCollectionRef = useMemoFirebase(() => {
    if(!firestore) return null;
    return collection(firestore, 'users');
  }, [firestore]);

  const { data: teams, isLoading: isLoadingTeams } = useCollection<Team>(teamsCollectionRef);
  const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersCollectionRef);

  const isLoading = isLoadingTeams || isLoadingUsers;
  const isAdmin = user?.email === 'futsaldex@gmail.com';

  if (!isAdmin) {
    return (
         <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
         </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/admin`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel de Admin
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Equipos</h1>
        <p className="text-lg text-muted-foreground mt-2">Lista de todos los equipos creados en la plataforma.</p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Todos los Equipos</CardTitle>
            <CardDescription>
                {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `${teams?.length ?? 0} equipos en total.`}
            </CardDescription>
        </CardHeader>
        <CardContent>
           {isLoading 
                ? <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4">
                            <Skeleton className="h-4 flex-grow" />
                        </div>
                    ))}
                  </div>
                : <TeamsTable teams={teams || []} users={users || []} />
           }
        </CardContent>
      </Card>
    </div>
  );
}

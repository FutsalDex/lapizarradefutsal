'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, Timestamp, doc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Trophy, ClipboardList, BarChart2, Eye, Pencil, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"


interface Match {
    id: string;
    competition: string;
    createdAt: Timestamp;
    date: Timestamp | Date | string;
    isFinished: boolean;
    localScore: number;
    localTeam: string;
    matchType: string;
    matchday: string;
    teamId: string;
    userId: string;
    visitorScore: number;
    visitorTeam: string;
}

interface Team {
  id: string;
  name: string;
}

function MatchCard({ match }: { match: Match }) {
    const matchDate = new Date(match.date as any);

    return (
        <Card className="flex flex-col hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div className="text-center">
                    <p className="font-semibold text-sm">{match.localTeam} vs {match.visitorTeam}</p>
                    <p className="text-xs text-muted-foreground">
                        {matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>
                 <div className="text-5xl font-bold tracking-tight text-center my-4 text-primary">
                    <span>{match.localScore}</span>
                    <span className="mx-2 text-3xl text-muted-foreground">-</span>
                    <span>{match.visitorScore}</span>
                </div>
                <div className='text-center'>
                    <Badge variant="secondary">{match.matchType}</Badge>
                </div>
            </CardContent>
            <CardFooter className="p-2 bg-muted/50 border-t flex justify-around">
                <Button variant="ghost" size="sm"><ClipboardList className="mr-2 h-4 w-4"/>Convocar</Button>
                <Button variant="ghost" size="icon"><BarChart2 className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon"><Pencil className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
            </CardFooter>
        </Card>
    );
}


export default function TeamMatchesPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const [filter, setFilter] = useState('Todos');

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    const baseQuery = query(collection(firestore, 'matches'), where('teamId', '==', teamId), where('userId', '==', user.uid));
    if (filter !== 'Todos') {
        return query(baseQuery, where('matchType', '==', filter));
    }
    return baseQuery;
  }, [firestore, teamId, user, filter]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const isLoading = isLoadingTeam || isLoadingMatches;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div>
            <h1 className="text-2xl font-bold">
              Partidos de {isLoadingTeam ? <Skeleton className="h-8 w-32 inline-block" /> : team?.name}
            </h1>
        </div>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href={`/partidos/gestion/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
             <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Partido
            </Button>
        </div>
      </div>
      
       <div className="border rounded-lg p-2 mb-6">
        <Tabs defaultValue="Todos" onValueChange={setFilter} className="w-full">
            <TabsList className="grid w-full grid-cols-5 bg-transparent p-0">
                <TabsTrigger value="Todos">Todos</TabsTrigger>
                <TabsTrigger value="Liga">Liga</TabsTrigger>
                <TabsTrigger value="Copa">Copa</TabsTrigger>
                <TabsTrigger value="Torneo">Torneo</TabsTrigger>
                <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
            </TabsList>
        </Tabs>
       </div>


      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex flex-col items-center gap-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-12 w-1/2" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 h-12 bg-muted/50 border-t"></CardFooter>
                </Card>
            ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No hay partidos para &quot;{filter}&quot;</h2>
          <p>No se ha añadido ningún partido que coincida con este filtro.</p>
        </div>
      )}
    </div>
  );
}

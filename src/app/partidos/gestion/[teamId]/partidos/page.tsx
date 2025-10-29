'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, Timestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Calendar, Shield } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Match {
    id: string;
    competition: string;
    createdAt: Timestamp;
    date: Timestamp;
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

function MatchCard({ match }: { match: Match }) {
    const matchDate = match.date.toDate();

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <div>
                        <CardTitle className="text-xl font-headline">{match.localTeam} vs {match.visitorTeam}</CardTitle>
                        <CardDescription>Jornada {match.matchday} - {match.competition}</CardDescription>
                    </div>
                    {match.isFinished && <Badge variant="secondary">Finalizado</Badge>}
                </div>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center text-center">
                <div className="text-4xl font-bold tracking-tight">
                    <span>{match.localScore}</span>
                    <span className="mx-4 text-muted-foreground">-</span>
                    <span>{match.visitorScore}</span>
                </div>
                 <div className="flex items-center text-sm text-muted-foreground mt-4">
                    <Calendar className="mr-2 h-4 w-4" />
                    {matchDate.toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
                </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full">Ver Estadísticas</Button>
            </CardFooter>
        </Card>
    );
}


export default function TeamMatchesPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(collection(firestore, 'matches'), where('teamId', '==', teamId));
  }, [firestore, teamId]);

  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <div className='flex items-center gap-4'>
             <Shield className="w-8 h-8 text-primary" />
            <div>
                <h1 className="text-3xl font-bold font-headline text-primary">Mis Partidos</h1>
                <p className="text-muted-foreground">Historial de partidos jugados y programados.</p>
            </div>
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
                Registrar Nuevo Partido
            </Button>
        </div>
      </div>
      
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(3)].map((_, i) => (
                <Card key={i}>
                    <CardHeader><Skeleton className="h-6 w-3/4" /></CardHeader>
                    <CardContent className="flex items-center justify-center h-24"><Skeleton className="h-10 w-1/2" /></CardContent>
                    <CardFooter><Skeleton className="h-10 w-full" /></CardFooter>
                </Card>
            ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {matches.map(match => (
            <MatchCard key={match.id} match={match} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No hay partidos registrados</h2>
          <p>Aún no se ha añadido ningún partido para este equipo.</p>
        </div>
      )}
    </div>
  );
}
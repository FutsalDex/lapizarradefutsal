'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart2, CalendarDays, History } from 'lucide-react';
import _ from 'lodash';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

// ====================
// TYPES
// ====================
type Period = '1H' | '2H';

interface MatchEvent {
  type: 'goal' | 'yellowCard' | 'redCard';
  team: 'local' | 'visitor';
  period: Period;
  minute: number;
  playerId?: string;
  playerName?: string;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  teamId: string;
  isFinished: boolean;
  matchType: string;
  date: any; // Firestore timestamp
  squad?: string[];
  events?: MatchEvent[];
}

// ====================
// GOAL CHRONOLOGY COMPONENT
// ====================
const GoalChronology = ({ events, teamName, isLocal }: { events: MatchEvent[], teamName: string, isLocal: boolean }) => {
    const teamGoals = events
        .filter(e => e.type === 'goal' && (isLocal ? e.team === 'local' : e.team === 'visitor'))
        .sort((a, b) => a.minute - b.minute);

    if (teamGoals.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-4">No hubo goles para este equipo.</p>
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="text-xl">Cronología de Goles</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {teamGoals.map((goal, index) => (
                        <div key={index} className="flex justify-between items-center border-b pb-2">
                            <span className="font-medium">{goal.playerName}</span>
                            <span className="text-muted-foreground font-semibold">{goal.minute}'</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    )
}


// ====================
// MAIN PAGE COMPONENT
// ====================
export default function MatchDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const matchId = typeof params.matchId === 'string' ? params.matchId : '';
  
  const firestore = useFirestore();

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: match, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const goalEvents = useMemo(() => {
      if (!match?.events) return [];
      return match.events.filter(e => e.type === 'goal');
  }, [match]);

  const isLoading = isLoadingMatch || isLoadingTeam;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!match || !team) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Partido no encontrado</h2>
            <p className="text-muted-foreground mb-4">No pudimos encontrar los detalles del partido que estás buscando.</p>
            <Button onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Volver a Partidos
            </Button>
      </div>
    );
  }

  const myTeamName = team.name;
  const isMyTeamLocal = match.localTeam === myTeamName;
  const opponentTeamName = isMyTeamLocal ? match.visitorTeam : match.localTeam;

  const formattedDate = match.date?.toDate ? format(match.date.toDate(), 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida';

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
            <History className="h-8 w-8 text-primary"/>
            <div>
                <h1 className="text-2xl font-bold font-headline">
                    Detalles del Partido
                </h1>
                <p className="text-muted-foreground">{formattedDate} - {match.matchType}</p>
            </div>
        </div>
        <div className='flex gap-2'>
            <Button variant="outline" onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver
            </Button>
            <Button asChild>
                <Link href={`/equipo/gestion/${teamId}/partidos/${matchId}`}>
                    <BarChart2 className="mr-2 h-4 w-4"/> Gestionar
                </Link>
            </Button>
        </div>
      </div>

       <Card>
            <CardHeader className="text-center items-center">
                <CardTitle className="text-3xl font-bold">{`${match.localTeam} vs ${match.visitorTeam}`}</CardTitle>
                <CardDescription className="text-6xl font-bold text-primary pt-2">{`${match.localScore} - ${match.visitorScore}`}</CardDescription>
            </CardHeader>
       </Card>

        <Tabs defaultValue="local" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="local">{match.localTeam}</TabsTrigger>
                <TabsTrigger value="visitor">{match.visitorTeam}</TabsTrigger>
            </TabsList>
            <TabsContent value="local">
                <div className="mt-4">
                    <GoalChronology events={goalEvents} teamName={match.localTeam} isLocal={true} />
                </div>
            </TabsContent>
            <TabsContent value="visitor">
                 <div className="mt-4">
                    <GoalChronology events={goalEvents} teamName={match.visitorTeam} isLocal={false} />
                </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}

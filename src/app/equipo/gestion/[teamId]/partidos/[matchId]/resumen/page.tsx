
'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
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

interface PlayerStats {
    goals?: number; assists?: number; yellowCards?: number; redCards?: number; fouls?: number;
    shotsOnTarget?: number; shotsOffTarget?: number; recoveries?: number; turnovers?: number;
    saves?: number; goalsConceded?: number; minutesPlayed?: number; unoVsUno?: number;
}

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
  date: any; // Firestore timestamp or string
  squad?: string[];
  events?: MatchEvent[];
  playerStats?: { [key in Period]?: { [playerId: string]: Partial<PlayerStats> } };
  
  // Legacy fields for backwards compatibility
  localPlayers?: any[];
  visitorPlayers?: any[];
  userTeam?: 'local' | 'visitor';
}


interface Player {
    id: string;
    name: string;
    number: string;
}


// ====================
// HELPER FUNCTIONS
// ====================
const formatStatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds) || totalSeconds < 0) return '00:00';
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const aggregateStats = (squadPlayers: Player[], match: Match | null, teamName: string) => {
    const statsMap = new Map<string, PlayerStats & { name: string; number: string }>();

    if (!match || !squadPlayers.length) return { aggregated: [], totals: {} };

    squadPlayers.forEach(player => {
        statsMap.set(player.id, {
            name: player.name, number: player.number,
            minutesPlayed: 0, goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0,
            saves: 0, goalsConceded: 0, unoVsUno: 0, shotsOnTarget: 0, shotsOffTarget: 0,
            recoveries: 0, turnovers: 0,
        });
    });

    const isModern = match.playerStats && (match.playerStats['1H'] || match.playerStats['2H']);
    
    if (isModern) {
        (['1H', '2H'] as Period[]).forEach(period => {
            const periodStats = match.playerStats?.[period];
            if (!periodStats) return;

            for (const playerId in periodStats) {
                if (statsMap.has(playerId)) {
                    const existingStats = statsMap.get(playerId)!;
                    const playerPeriodStats = periodStats[playerId] as Partial<PlayerStats>;
                    Object.keys(playerPeriodStats).forEach(key => {
                        const statKey = key as keyof PlayerStats;
                        (existingStats[statKey] as number) = (existingStats[statKey] || 0) + (playerPeriodStats[statKey] || 0);
                    });
                }
            }
        });
    } else {
        const isMyTeamLocal = match.localTeam === teamName;
        const legacyPlayerList = isMyTeamLocal ? match.localPlayers : match.visitorPlayers;
        if (legacyPlayerList && Array.isArray(legacyPlayerList)) {
            legacyPlayerList.forEach((legacyPlayer) => {
                if (legacyPlayer.id && statsMap.has(legacyPlayer.id)) {
                    const stats = statsMap.get(legacyPlayer.id)!;
                    stats.goals = legacyPlayer.goals || 0;
                    stats.assists = legacyPlayer.assists || 0;
                    stats.yellowCards = legacyPlayer.amarillas || 0;
                    stats.redCards = legacyPlayer.rojas || 0;
                    stats.fouls = legacyPlayer.faltas || 0;
                    stats.shotsOnTarget = legacyPlayer.tirosPuerta || 0;
                    stats.shotsOffTarget = legacyPlayer.tirosFuera || 0;
                    stats.recoveries = legacyPlayer.recuperaciones || 0;
                    stats.turnovers = legacyPlayer.perdidas || 0;
                    stats.saves = legacyPlayer.paradas || 0;
                    stats.goalsConceded = legacyPlayer.gRec || 0;
                    stats.unoVsUno = legacyPlayer.vs1 || 0;
                    stats.minutesPlayed = legacyPlayer.timeOnCourt || 0;
                }
            });
        }
    }
    
    const aggregated = Array.from(statsMap.values()).sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));

    const totals = aggregated.reduce((acc, player) => {
        acc.goals += player.goals || 0;
        acc.assists += player.assists || 0;
        acc.yellowCards += player.yellowCards || 0;
        acc.redCards += player.redCards || 0;
        acc.fouls += player.fouls || 0;
        acc.saves += player.saves || 0;
        acc.goalsConceded += player.goalsConceded || 0;
        acc.unoVsUno += player.unoVsUno || 0;
        return acc;
    }, {
        goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0, saves: 0, goalsConceded: 0, unoVsUno: 0
    });

    return { aggregated, totals };
};


// ====================
// SUB-COMPONENTS
// ====================

const GoalChronology = ({ events, isLocal }: { events: MatchEvent[], isLocal: boolean }) => {
    const teamGoals = (events || [])
        .filter(e => e.type === 'goal' && (isLocal ? e.team === 'local' : e.team === 'visitor'))
        .sort((a, b) => a.minute - b.minute);

    if (teamGoals.length === 0) {
        return <p className="text-muted-foreground text-sm text-center py-4">No hubo goles para este equipo.</p>
    }

    return (
        <div className="space-y-4">
            {teamGoals.map((goal, index) => (
                <div key={index} className="flex justify-between items-center border-b pb-2">
                    <span className="font-medium">{goal.playerName}</span>
                    <span className="text-muted-foreground font-semibold">{goal.minute}'</span>
                </div>
            ))}
        </div>
    )
}

const PlayerStatsTable = ({ match, teamId, teamName }: { match: Match, teamId: string, teamName: string }) => {
    const firestore = useFirestore();

    const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
    const { data: allPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
    
    const squadPlayers = useMemo(() => {
        if (!allPlayers || !match.squad) return [];
        const squadIds = new Set(match.squad);
        return allPlayers.filter(p => squadIds.has(p.id));
    }, [allPlayers, match.squad]);
    
    const { aggregated, totals } = useMemo(() => aggregateStats(squadPlayers, match, teamName), [squadPlayers, match, teamName]);

    if (isLoadingPlayers) {
        return <Skeleton className="h-40 w-full" />;
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas de Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
                 <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Min.</TableHead>
                                <TableHead>G</TableHead>
                                <TableHead>As</TableHead>
                                <TableHead>TA</TableHead>
                                <TableHead>TR</TableHead>
                                <TableHead>F</TableHead>
                                <TableHead>Par.</TableHead>
                                <TableHead>GC</TableHead>
                                <TableHead>1vs1</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {(aggregated && aggregated.length > 0) ? aggregated.map(player => (
                                <TableRow key={player.number}>
                                    <TableCell className="font-medium">{player.number}</TableCell>
                                    <TableCell>{player.name}</TableCell>
                                    <TableCell>{formatStatTime(player.minutesPlayed || 0)}</TableCell>
                                    <TableCell>{player.goals || 0}</TableCell>
                                    <TableCell>{player.assists || 0}</TableCell>
                                    <TableCell>{player.yellowCards || 0}</TableCell>
                                    <TableCell>{player.redCards || 0}</TableCell>
                                    <TableCell>{player.fouls || 0}</TableCell>
                                    <TableCell>{player.saves || 0}</TableCell>
                                    <TableCell>{player.goalsConceded || 0}</TableCell>
                                    <TableCell>{player.unoVsUno || 0}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={11} className="text-center h-24">No hay datos de jugadores para este partido.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell colSpan={3}>Total Equipo</TableCell>
                                <TableCell>{totals.goals}</TableCell>
                                <TableCell>{totals.assists}</TableCell>
                                <TableCell>{totals.yellowCards}</TableCell>
                                <TableCell>{totals.redCards}</TableCell>
                                <TableCell>{totals.fouls}</TableCell>
                                <TableCell>{totals.saves}</TableCell>
                                <TableCell>{totals.goalsConceded}</TableCell>
                                <TableCell>{totals.unoVsUno}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

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

  const formattedDate = useMemo(() => {
    if (!match?.date) return 'Fecha no disponible';
    try {
        const dateObj = match.date.toDate ? match.date.toDate() : new Date(match.date);
        if (isNaN(dateObj.getTime())) {
          return 'Fecha inválida';
        }
        return format(dateObj, 'dd/MM/yyyy', { locale: es });
    } catch(e) {
        return 'Fecha inválida';
    }
  }, [match?.date]);

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!match || !team) {
    return <div className="container mx-auto px-4 py-8 text-center">No se encontraron datos del partido o del equipo.</div>;
  }

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

        <Tabs defaultValue="chronology" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="chronology">Cronología de Goles</TabsTrigger>
                <TabsTrigger value="stats">Estadísticas de Jugadores</TabsTrigger>
            </TabsList>
            <TabsContent value="chronology">
                <Card className="mt-4">
                    <CardHeader>
                        <CardTitle className="text-xl">Cronología de Goles</CardTitle>
                    </CardHeader>
                    <CardContent className="grid md:grid-cols-2 gap-x-8 gap-y-4">
                        <div>
                           <h3 className="font-semibold mb-2 text-center">{match.localTeam}</h3>
                           <GoalChronology events={goalEvents} isLocal={true} />
                        </div>
                         <div>
                           <h3 className="font-semibold mb-2 text-center">{match.visitorTeam}</h3>
                           <GoalChronology events={goalEvents} isLocal={false} />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="stats">
                 <div className="mt-4">
                    <PlayerStatsTable match={match} teamId={teamId} teamName={team.name}/>
                 </div>
            </TabsContent>
        </Tabs>
    </div>
  );
}

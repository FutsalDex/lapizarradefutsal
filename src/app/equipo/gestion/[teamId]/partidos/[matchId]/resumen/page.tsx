'use client';

import { useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, BarChart2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import _ from 'lodash';

// ====================
// TYPES
// ====================
interface PlayerStats {
  id: string;
  name: string;
  number: string;
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  recoveries: number;
  turnovers: number;
  saves: number;
  goalsConceded: number;
  minutesPlayed: number;
}
type Player = Omit<PlayerStats, 'id'> & { id: string };

interface OpponentPeriodStats {
  goals: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
}

type Period = '1H' | '2H';

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  teamId: string;
  isFinished: boolean;
  squad?: string[];
  playerStats?: {
    '1H'?: { [playerId: string]: Partial<PlayerStats> };
    '2H'?: { [playerId: string]: Partial<PlayerStats> };
  };
  opponentStats?: {
    '1H'?: Partial<OpponentPeriodStats>;
    '2H'?: Partial<OpponentPeriodStats>;
  };
}

// ====================
// HELPER FUNCTIONS
// ====================
const formatStatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

const aggregatePlayerStats = (match: Match): { [playerId: string]: Partial<PlayerStats> } => {
  if (!match.playerStats) return {};
  const aggregated: { [playerId: string]: Partial<PlayerStats> } = {};
  
  for (const period of ['1H', '2H'] as const) {
    const periodStats = match.playerStats[period];
    if (!periodStats) continue;

    for (const playerId in periodStats) {
      if (!aggregated[playerId]) aggregated[playerId] = {};
      const playerPeriodStats = periodStats[playerId];
      for (const statKey in playerPeriodStats) {
        const key = statKey as keyof PlayerStats;
        const value = (playerPeriodStats[key] as number) || 0;
        aggregated[playerId][key] = ((aggregated[playerId][key] as number) || 0) + value;
      }
    }
  }
  return aggregated;
};

const aggregateOpponentStats = (match: Match): Partial<OpponentPeriodStats> => {
  if (!match.opponentStats) return {};
  const aggregated: Partial<OpponentPeriodStats> = {};

  for (const period of ['1H', '2H'] as const) {
    const periodStats = match.opponentStats[period];
    if (!periodStats) continue;

    for (const statKey in periodStats) {
      const key = statKey as keyof OpponentPeriodStats;
      const value = periodStats[key] || 0;
      aggregated[key] = (aggregated[key] || 0) + value;
    }
  }
  return aggregated;
};

// ====================
// MAIN PAGE COMPONENT
// ====================
export default function MatchSummaryPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const matchId = typeof params.matchId === 'string' ? params.matchId : '';
  
  const firestore = useFirestore();

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: match, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  const squadPlayers = useMemo(() => {
    if (!teamPlayers || !match?.squad) return [];
    const squadIds = new Set(match.squad);
    return teamPlayers.filter(p => squadIds.has(p.id)).sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });
  }, [teamPlayers, match?.squad]);

  const aggregatedPlayerStats = useMemo(() => (match ? aggregatePlayerStats(match) : {}), [match]);
  const aggregatedOpponentStats = useMemo(() => (match ? aggregateOpponentStats(match) : {}), [match]);

  const totals = useMemo(() => {
    const initialTotals: Omit<PlayerStats, 'id' | 'name' | 'number'> = {
        goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0,
        shotsOnTarget: 0, shotsOffTarget: 0, recoveries: 0, turnovers: 0,
        saves: 0, goalsConceded: 0, minutesPlayed: 0
    };
    if (!squadPlayers.length) return initialTotals;

    return squadPlayers.reduce((acc, player) => {
        const stats = aggregatedPlayerStats[player.id] || {};
        Object.keys(stats).forEach(key => {
          const statKey = key as keyof PlayerStats;
          acc[statKey] = (acc[statKey] as number || 0) + (stats[statKey] as number || 0);
        });
        return acc;
    }, initialTotals);
  }, [squadPlayers, aggregatedPlayerStats]);

  const isLoading = isLoadingMatch || isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!match || !team) {
    return <div className="container mx-auto px-4 py-8 text-center">No se encontraron datos del partido o del equipo.</div>;
  }
  
  if (!match.isFinished) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Partido no finalizado</h2>
        <p className="text-muted-foreground mb-4">Las estadísticas de resumen solo están disponibles para partidos finalizados.</p>
        <Button onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver
        </Button>
      </div>
    );
  }

  const myTeamName = team.name;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-3xl font-bold font-headline text-primary flex items-center gap-3">
                <BarChart2 /> Resumen del Partido
            </h1>
            <p className="text-muted-foreground">{`${match.localTeam} vs ${match.visitorTeam}`}</p>
        </div>
        <Button variant="outline" onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
            <ArrowLeft className="mr-2 h-4 w-4"/> Volver a Partidos
        </Button>
      </div>

       <Card>
            <CardHeader>
                <CardTitle className="text-center text-4xl font-bold">{`${match.localScore} - ${match.visitorScore}`}</CardTitle>
                <CardDescription className="text-center">{match.localTeam === myTeamName ? '(Local)' : '(Visitante)'} vs {match.visitorTeam}</CardDescription>
            </CardHeader>
       </Card>

      <Card>
        <CardHeader>
            <CardTitle>Estadísticas Totales de {myTeamName}</CardTitle>
        </CardHeader>
        <CardContent>
             <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px] px-2">Jugador</TableHead>
                                <TableHead className="text-center px-1">Min</TableHead>
                                <TableHead className="text-center px-1">G</TableHead>
                                <TableHead className="text-center px-1">A</TableHead>
                                <TableHead className="text-center px-1">T. Puerta</TableHead>
                                <TableHead className="text-center px-1">T. Fuera</TableHead>
                                <TableHead className="text-center px-1">Recup.</TableHead>
                                <TableHead className="text-center px-1">Perdidas</TableHead>
                                <TableHead className="text-center px-1">Paradas</TableHead>
                                <TableHead className="text-center px-1">GC</TableHead>
                                <TableHead className="text-center px-1">TA</TableHead>
                                <TableHead className="text-center px-1">TR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {squadPlayers.map(player => {
                                const stats = aggregatedPlayerStats[player.id] || {};
                                return (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium py-2 px-2">{player.number}. {player.name}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{formatStatTime(stats.minutesPlayed || 0)}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.goals || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.assists || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.shotsOnTarget || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.shotsOffTarget || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.recoveries || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.turnovers || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.saves || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.goalsConceded || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.yellowCards || 0}</TableCell>
                                        <TableCell className="text-center tabular-nums py-2 px-1">{stats.redCards || 0}</TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                        <TableFooter>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell className="px-2">Total Equipo</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{formatStatTime(totals.minutesPlayed)}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.goals}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.assists}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.shotsOnTarget}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.shotsOffTarget}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.recoveries}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.turnovers}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.saves}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.goalsConceded}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.yellowCards}</TableCell>
                                <TableCell className="text-center tabular-nums py-2 px-1">{totals.redCards}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>Estadísticas Totales del Rival</CardTitle>
          <CardDescription>{match.visitorTeam === myTeamName ? match.localTeam : match.visitorTeam}</CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="bg-muted/50 p-4 rounded-lg">
              <dt className="text-sm text-muted-foreground">Goles</dt>
              <dd className="text-2xl font-bold">{aggregatedOpponentStats.goals || 0}</dd>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <dt className="text-sm text-muted-foreground">Tiros a Puerta</dt>
              <dd className="text-2xl font-bold">{aggregatedOpponentStats.shotsOnTarget || 0}</dd>
            </div>
             <div className="bg-muted/50 p-4 rounded-lg">
              <dt className="text-sm text-muted-foreground">Tiros Fuera</dt>
              <dd className="text-2xl font-bold">{aggregatedOpponentStats.shotsOffTarget || 0}</dd>
            </div>
            <div className="bg-muted/50 p-4 rounded-lg">
              <dt className="text-sm text-muted-foreground">Faltas</dt>
              <dd className="text-2xl font-bold">{aggregatedOpponentStats.fouls || 0}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </div>
  );
}

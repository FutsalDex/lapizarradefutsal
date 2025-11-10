
'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Award, Target, Shuffle, Repeat, ShieldAlert, Goal, Hand, User, ShieldCheck, Timer, Users } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import _ from 'lodash';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';


// ====================
// TYPES
// ====================
interface Team {
  id: string;
  name: string;
}

interface Player {
  id: string;
  name: string;
  number: string;
  position: string;
}

interface PlayerStats {
    goals?: number; assists?: number; yellowCards?: number; redCards?: number; fouls?: number;
    shotsOnTarget?: number; shotsOffTarget?: number; recoveries?: number; turnovers?: number;
    saves?: number; goalsConceded?: number; unoVsUno?: number; minutesPlayed?: number;
    pj?: number;
}

interface Match {
  id: string;
  isFinished: boolean;
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  squad?: string[];
  playerStats?: { ['1H']?: { [playerId: string]: Partial<PlayerStats> }, ['2H']?: { [playerId: string]: Partial<PlayerStats> } } | { [playerId: string]: Partial<PlayerStats> }; // Legacy support
}

type StatCategory = keyof PlayerStats;

const YellowCardIcon = () => <div className="w-5 h-6 bg-yellow-400 border border-black rounded-sm" />;
const RedCardIcon = () => <div className="w-5 h-6 bg-red-600 border border-black rounded-sm" />;


const statCategories: {
    key: StatCategory;
    title: string;
    icon: React.ElementType;
    higherIsBetter: boolean;
    isTime?: boolean;
}[] = [
    { key: 'goals', title: 'Máximo Goleador', icon: Goal, higherIsBetter: true },
    { key: 'assists', title: 'Máximo Asistente', icon: Hand, higherIsBetter: true },
    { key: 'shotsOnTarget', title: 'Más Tiros a Puerta', icon: Target, higherIsBetter: true },
    { key: 'shotsOffTarget', title: 'Más Tiros Fuera', icon: Target, higherIsBetter: false },
    { key: 'recoveries', title: 'Más Recuperaciones', icon: Repeat, higherIsBetter: true },
    { key: 'turnovers', title: 'Más Pérdidas', icon: Shuffle, higherIsBetter: false },
    { key: 'fouls', title: 'Más Faltas', icon: ShieldAlert, higherIsBetter: false },
    { key: 'yellowCards', title: 'Más T. Amarillas', icon: YellowCardIcon, higherIsBetter: false },
    { key: 'redCards', title: 'Más T. Rojas', icon: RedCardIcon, higherIsBetter: false },
    { key: 'saves', title: 'Portero con más Paradas', icon: ShieldCheck, higherIsBetter: true },
    { key: 'goalsConceded', title: 'Portero Menos Goleado', icon: Goal, higherIsBetter: false },
    { key: 'minutesPlayed', title: 'Jugador con más minutos', icon: Timer, higherIsBetter: true, isTime: true },
    { key: 'minutesPlayed', title: 'Jugador con menos minutos', icon: Timer, higherIsBetter: false, isTime: true },
    { key: 'minutesPlayed', title: 'Portero con más minutos', icon: Timer, higherIsBetter: true, isTime: true },
    { key: 'minutesPlayed', title: 'Portero con menos minutos', icon: Timer, higherIsBetter: false, isTime: true },
];

const formatStatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds)) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

// ====================
// LEADER CARD COMPONENT
// ====================

const StatLeaderCard = ({ title, player, value, icon: Icon, isTime = false }: { title: string, player: string, value: number, icon: React.ElementType, isTime?: boolean }) => (
    <Card className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-lg">
                <Icon className="w-6 h-6" />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{title}</p>
                <p className="font-bold text-sm">{player || 'N/A'}</p>
            </div>
        </div>
        <p className="text-3xl font-bold tabular-nums">{isTime ? formatStatTime(value) : value}</p>
    </Card>
);

// ====================
// TABLE COMPONENT
// ====================

const PlayerStatsTable = ({ aggregatedStats, searchTerm }: { aggregatedStats: (Partial<PlayerStats> & { name: string; number: string; })[], searchTerm: string }) => {
    
    const filteredAndSortedStats = useMemo(() => {
        return aggregatedStats
            .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => (b.minutesPlayed || 0) - (a.minutesPlayed || 0));
    }, [aggregatedStats, searchTerm]);
    
    const tableHeaders = [
        { key: 'Dorsal', label: '#' },
        { key: 'Nombre', label: 'Nombre' },
        { key: 'minutesPlayed', label: 'Min.' },
        { key: 'pj', label: 'PJ' },
        { key: 'goals', label: 'Goles' },
        { key: 'assists', label: 'Asist.' },
        { key: 'shotsOnTarget', label: 'TP' },
        { key: 'shotsOffTarget', label: 'TF' },
        { key: 'recoveries', label: 'R' },
        { key: 'turnovers', label: 'P' },
        { key: 'saves', label: 'Paradas' },
        { key: 'goalsConceded', label: 'G. Rec.' },
        { key: 'fouls', label: 'Faltas' },
        { key: 'yellowCards', label: 'TA' },
        { key: 'redCards', label: 'TR' },
    ];
    
    const totals = useMemo(() => {
        const initialTotals: Partial<PlayerStats> = {
            minutesPlayed: 0, pj: 0, goals: 0, assists: 0, shotsOnTarget: 0, shotsOffTarget: 0,
            recoveries: 0, turnovers: 0, saves: 0, goalsConceded: 0, fouls: 0, yellowCards: 0, redCards: 0
        };

        return filteredAndSortedStats.reduce((acc, player) => {
            (Object.keys(initialTotals) as Array<keyof typeof initialTotals>).forEach(key => {
                (acc as any)[key] = ((acc as any)[key] || 0) + (player[key] || 0);
            });
            return acc;
        }, initialTotals);
    }, [filteredAndSortedStats]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>Tabla General de Jugadores</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                {tableHeaders.map(h => {
                                     if (h.label === 'Nombre') {
                                        return <TableHead key={h.key} className="w-[150px]">{h.label}</TableHead>
                                    }
                                     if (h.label === '#') {
                                        return <TableHead key={h.key} className="w-[50px]">{h.label}</TableHead>
                                    }
                                    return <TableHead key={h.key} className="text-center">{h.label}</TableHead>
                                })}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAndSortedStats.length > 0 ? (
                                filteredAndSortedStats.map(player => (
                                    <TableRow key={player.number}>
                                        <TableCell>{player.number}</TableCell>
                                        <TableCell className="font-medium">{player.name}</TableCell>
                                        <TableCell className="text-center">{formatStatTime(player.minutesPlayed || 0)}</TableCell>
                                        <TableCell className="text-center">{player.pj || 0}</TableCell>
                                        <TableCell className="text-center">{player.goals || 0}</TableCell>
                                        <TableCell className="text-center">{player.assists || 0}</TableCell>
                                        <TableCell className="text-center">{player.shotsOnTarget || 0}</TableCell>
                                        <TableCell className="text-center">{player.shotsOffTarget || 0}</TableCell>
                                        <TableCell className="text-center">{player.recoveries || 0}</TableCell>
                                        <TableCell className="text-center">{player.turnovers || 0}</TableCell>
                                        <TableCell className="text-center">{player.saves || 0}</TableCell>
                                        <TableCell className="text-center">{player.goalsConceded || 0}</TableCell>
                                        <TableCell className="text-center">{player.fouls || 0}</TableCell>
                                        <TableCell className="text-center">{player.yellowCards || 0}</TableCell>
                                        <TableCell className="text-center">{player.redCards || 0}</TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={tableHeaders.length} className="h-24 text-center">
                                        No hay jugadores que coincidan con la búsqueda.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="font-bold bg-muted/50">
                                <TableCell colSpan={2}>Total</TableCell>
                                <TableCell className="text-center">{formatStatTime(totals.minutesPlayed || 0)}</TableCell>
                                <TableCell className="text-center">{totals.pj}</TableCell>
                                <TableCell className="text-center">{totals.goals}</TableCell>
                                <TableCell className="text-center">{totals.assists}</TableCell>
                                <TableCell className="text-center">{totals.shotsOnTarget}</TableCell>
                                <TableCell className="text-center">{totals.shotsOffTarget}</TableCell>
                                <TableCell className="text-center">{totals.recoveries}</TableCell>
                                <TableCell className="text-center">{totals.turnovers}</TableCell>
                                <TableCell className="text-center">{totals.saves}</TableCell>
                                <TableCell className="text-center">{totals.goalsConceded}</TableCell>
                                <TableCell className="text-center">{totals.fouls}</TableCell>
                                <TableCell className="text-center">{totals.yellowCards}</TableCell>
                                <TableCell className="text-center">{totals.redCards}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="text-xs text-muted-foreground">
                <p><b>Leyenda:</b> Min: Minutos, PJ: Partidos Jugados, G: Goles, Asist: Asistencias, TP: Tiros a Puerta, TF: Tiros Fuera, R: Recuperaciones, P: Pérdidas, TA: T. Amarilla, TR: T. Roja, G. Rec.: Goles Recibidos (porteros).</p>
            </CardFooter>
        </Card>
    );
};

// ====================
// MAIN PAGE COMPONENT
// ====================

export default function PlayerStatsPage() {
    const params = useParams();
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();

    const [filter, setFilter] = useState<'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso'>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    const teamRef = useMemoFirebase(() => {
      if (!firestore || !teamId || !user) return null;
      return doc(firestore, 'teams', teamId);
    }, [firestore, teamId, user]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
    
    const playersRef = useMemoFirebase(() => {
      if (!firestore || !teamId || !user) return null;
      return collection(firestore, `teams/${teamId}/players`);
    }, [firestore, teamId, user]);
    const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);

    const matchesQuery = useMemoFirebase(() => {
        if (!firestore || !teamId || !user) return null;
        return query(
            collection(firestore, 'matches'),
            where('teamId', '==', teamId),
            where('isFinished', '==', true)
        );
    }, [firestore, teamId, user]);
    const { data: finishedMatches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);
    
    const filteredMatches = useMemo(() => {
        if (!finishedMatches) return [];
        if (filter === 'Todos') return finishedMatches;
        return finishedMatches.filter(m => m.matchType === filter);
    }, [finishedMatches, filter]);
    
    const aggregatedStats = useMemo(() => {
        if (!players || !filteredMatches) return [];
    
        const statsMap: { [playerId: string]: Partial<PlayerStats> & { name: string; number: string } } = {};
    
        players.forEach(p => {
            statsMap[p.id] = { 
                name: p.name, number: p.number, pj: 0, minutesPlayed: 0, goals: 0, assists: 0, 
                shotsOnTarget: 0, shotsOffTarget: 0, recoveries: 0, turnovers: 0, saves: 0, 
                goalsConceded: 0, fouls: 0, yellowCards: 0, redCards: 0, unoVsUno: 0,
            };
        });
    
        filteredMatches.forEach(match => {
            if (!match.squad) return;
            
            const playerStats1H = match.playerStats?.['1H'] || {};
            const playerStats2H = match.playerStats?.['2H'] || {};
    
            // Handle legacy flat structure
            const allPlayerStats: { [key: string]: any } = {};
            if (!match.playerStats?.['1H'] && !match.playerStats?.['2H']) {
                 Object.assign(allPlayerStats, match.playerStats);
            }
    
            match.squad.forEach(playerId => {
                if (!statsMap[playerId]) return;
                
                statsMap[playerId].pj! += 1;
    
                const stats1H = playerStats1H[playerId] || {};
                const stats2H = playerStats2H[playerId] || {};
                const legacyStats = allPlayerStats[playerId] || {};

                const statKeys: Array<keyof PlayerStats> = [
                    'minutesPlayed', 'goals', 'assists', 'shotsOnTarget', 'shotsOffTarget', 'recoveries', 
                    'turnovers', 'saves', 'goalsConceded', 'fouls', 'yellowCards', 'redCards', 'unoVsUno'
                ];

                statKeys.forEach(key => {
                    statsMap[playerId][key] = (statsMap[playerId][key] || 0) + 
                                              (stats1H[key] || 0) + 
                                              (stats2H[key] || 0) +
                                              (legacyStats[key] || 0);
                });
            });
        });
        
        return Object.values(statsMap);
    
    }, [players, filteredMatches]);

    const statLeaders = useMemo(() => {
    const leaders: { [key: string]: { player: string; value: number } } = {};
    if (_.isEmpty(aggregatedStats) || !players) return leaders;

    statCategories.forEach(cat => {
        let leaderPlayer: { name: string; value: number } | null = null;

        for (const playerStats of aggregatedStats) {
            const playerInfo = players.find(p => p.number === playerStats.number);
            if (!playerInfo) continue;

            const isGoalkeeperCategory = cat.title.toLowerCase().includes('portero');
            const isOutfieldPlayerCategory = cat.title.toLowerCase().startsWith('jugador');

            if (isGoalkeeperCategory && playerInfo.position !== 'Portero') continue;
            if (isOutfieldPlayerCategory && playerInfo.position === 'Portero') continue;
            
            const statValue = playerStats[cat.key] ?? 0;

            if (leaderPlayer === null) {
                leaderPlayer = { name: playerStats.name, value: statValue };
                continue;
            }

            const isBetter = cat.higherIsBetter
                ? statValue > leaderPlayer.value
                : statValue < leaderPlayer.value;

            if (isBetter) {
                leaderPlayer = { name: playerStats.name, value: statValue };
            }
        }
        
        if (leaderPlayer) {
            leaders[cat.title] = { player: leaderPlayer.name, value: leaderPlayer.value };
        } else {
            leaders[cat.title] = { player: 'N/A', value: 0 };
        }
    });

    return leaders;
}, [aggregatedStats, players]);


    const isLoading = isUserLoading || isLoadingTeam || isLoadingPlayers || isLoadingMatches;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)}
                </div>
                 <Skeleton className="h-64 w-full" />
            </div>
        );
    }
    
    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-muted-foreground">Debes iniciar sesión para ver las estadísticas.</p>
            </div>
        );
    }

    if (!team && !isLoading) {
        return null;
    }

    if (!team) return null;
    
    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
                 <div className="flex items-center gap-4">
                    <Users className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline text-primary">Estadísticas de Jugadores</h1>
                        <p className="text-lg text-muted-foreground mt-1">Rendimiento individual de los jugadores de {team.name}.</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/equipo/gestion/${teamId}/estadisticas`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>
            
             <Card>
                <CardHeader>
                    <CardTitle>Controles</CardTitle>
                    <CardDescription>Filtra por competición y busca jugadores.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row items-center gap-4">
                    <Input 
                        placeholder="Buscar jugador..." 
                        className="max-w-xs"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                    <Tabs value={filter} onValueChange={(value) => setFilter(value as any)}>
                        <TabsList>
                            <TabsTrigger value="Todos">Todos</TabsTrigger>
                            <TabsTrigger value="Liga">Liga</TabsTrigger>
                            <TabsTrigger value="Copa">Copa</TabsTrigger>
                            <TabsTrigger value="Torneo">Torneo</TabsTrigger>
                            <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
                        </TabsList>
                    </Tabs>
                </CardContent>
            </Card>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {statCategories.map(cat => {
                    const leader = statLeaders[cat.title];
                    return leader ? (
                        <StatLeaderCard 
                            key={cat.title}
                            title={cat.title}
                            player={leader.player}
                            value={leader.value}
                            icon={cat.icon}
                            isTime={cat.isTime}
                        />
                    ) : null;
                })}
            </div>

            <PlayerStatsTable 
                aggregatedStats={aggregatedStats || []}
                searchTerm={searchTerm}
            />
        </div>
    );
}

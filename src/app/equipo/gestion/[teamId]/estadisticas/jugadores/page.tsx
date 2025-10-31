'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Award, Target, Shuffle, Repeat, ShieldAlert, Goal, Hand, User, ShieldCheck, Users } from 'lucide-react';
import Link from 'next/link';
import { Input } from '@/components/ui/input';
import _ from 'lodash';

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
}

interface Match {
  id: string;
  isFinished: boolean;
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  playerStats?: { ['1H']?: { [playerId: string]: Partial<PlayerStats> }, ['2H']?: { [playerId: string]: Partial<PlayerStats> } };
}

type StatCategory = keyof PlayerStats;

const YellowCardIcon = () => <div className="w-5 h-6 bg-yellow-400 border border-black rounded-sm" />;


const statCategories: {
    key: StatCategory;
    title: string;
    icon: React.ElementType;
    higherIsBetter: boolean;
}[] = [
    { key: 'goals', title: 'Máximo Goleador', icon: Goal, higherIsBetter: true },
    { key: 'assists', title: 'Máximo Asistente', icon: Hand, higherIsBetter: true },
    { key: 'shotsOnTarget', title: 'Más Tiros a Puerta', icon: Target, higherIsBetter: true },
    { key: 'shotsOffTarget', title: 'Más Tiros Fuera', icon: Target, higherIsBetter: false },
    { key: 'recoveries', title: 'Más Recuperaciones', icon: Repeat, higherIsBetter: true },
    { key: 'turnovers', title: 'Más Pérdidas', icon: Shuffle, higherIsBetter: false },
    { key: 'fouls', title: 'Más Faltas', icon: ShieldAlert, higherIsBetter: false },
    { key: 'yellowCards', title: 'Más T. Amarillas', icon: YellowCardIcon, higherIsBetter: false },
    { key: 'saves', title: 'Portero con más Paradas', icon: ShieldCheck, higherIsBetter: true },
    { key: 'unoVsUno', title: 'Portero mejor en 1vs1', icon: User, higherIsBetter: true },
    { key: 'goalsConceded', title: 'Portero Menos Goleado', icon: Goal, higherIsBetter: false },
    { key: 'goalsConceded', title: 'Portero Más Goleado', icon: Goal, higherIsBetter: true },
];

// ====================
// LEADER CARD COMPONENT
// ====================

const StatLeaderCard = ({ title, player, value, icon: Icon }: { title: string, player: string, value: number, icon: React.ElementType }) => (
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
        <p className="text-3xl font-bold">{value}</p>
    </Card>
);

// ====================
// MAIN PAGE COMPONENT
// ====================

export default function PlayerStatsPage() {
    const params = useParams();
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';
    const firestore = useFirestore();

    const [filter, setFilter] = useState<'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso'>('Todos');
    const [searchTerm, setSearchTerm] = useState('');

    const teamRef = useMemoFirebase(() => doc(firestore, 'teams', teamId), [firestore, teamId]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
    
    const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
    const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);

    const matchesQuery = useMemoFirebase(() => {
        return query(
            collection(firestore, 'matches'),
            where('teamId', '==', teamId),
            where('isFinished', '==', true)
        );
    }, [firestore, teamId]);
    const { data: finishedMatches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);
    
    const filteredMatches = useMemo(() => {
        if (!finishedMatches) return [];
        if (filter === 'Todos') return finishedMatches;
        return finishedMatches.filter(m => m.matchType === filter);
    }, [finishedMatches, filter]);
    
    const aggregatedStats = useMemo(() => {
        if (!players) return {};

        const playerStats: { [playerId: string]: Partial<PlayerStats> & { name: string } } = {};

        players.forEach(p => {
            playerStats[p.id] = { name: p.name };
        });

        filteredMatches.forEach(match => {
            if (!match.playerStats) return;
            for (const period of ['1H', '2H'] as const) {
                const periodStats = match.playerStats[period];
                if (!periodStats) continue;

                for (const playerId in periodStats) {
                    if (playerStats[playerId]) {
                        const stats = periodStats[playerId];
                        for (const statKey in stats) {
                             const key = statKey as StatCategory;
                             playerStats[playerId][key] = (playerStats[playerId][key] || 0) + (stats[key] || 0);
                        }
                    }
                }
            }
        });
        return playerStats;

    }, [players, filteredMatches]);

    const statLeaders = useMemo(() => {
        const leaders: { [key: string]: { player: string; value: number } } = {};
        if (_.isEmpty(aggregatedStats)) return leaders;

        statCategories.forEach(cat => {
            let leaderPlayer = 'N/A';
            let leaderValue = cat.higherIsBetter ? -1 : Infinity;

            for (const playerId in aggregatedStats) {
                 const player = aggregatedStats[playerId];
                 const statValue = player[cat.key] || 0;
                 
                 // Special handling for goalkeepers
                 const playerInfo = players?.find(p => p.id === playerId);
                 if (cat.title.toLowerCase().includes('portero') && playerInfo?.position !== 'Portero') {
                     continue;
                 }


                 if (cat.higherIsBetter) {
                     if (statValue > leaderValue) {
                         leaderValue = statValue;
                         leaderPlayer = player.name;
                     }
                 } else {
                     if (statValue < leaderValue) {
                         leaderValue = statValue;
                         leaderPlayer = player.name;
                     }
                 }
            }
            
            // Only show if a valid leader was found
            if (leaderValue !== Infinity && leaderValue !== -1) {
                leaders[cat.key] = { player: leaderPlayer, value: leaderValue };
            } else {
                leaders[cat.key] = { player: 'N/A', value: 0 };
            }
        });

        return leaders;
    }, [aggregatedStats, players]);


    const isLoading = isLoadingTeam || isLoadingPlayers || isLoadingMatches;

    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="h-10 w-96" />
                <Skeleton className="h-24 w-full" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(12)].map((_, i) => <Skeleton key={i} className="h-20 w-full"/>)}
                </div>
            </div>
        );
    }
    
     if (!team) {
        return <div className="container mx-auto text-center py-10">Equipo no encontrado.</div>;
    }
    
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
                <CardContent className="flex items-center gap-4">
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {statCategories.map(cat => {
                    const leader = statLeaders[cat.key];
                    return leader ? (
                        <StatLeaderCard 
                            key={cat.title}
                            title={cat.title}
                            player={leader.player}
                            value={leader.value}
                            icon={cat.icon}
                        />
                    ) : null;
                })}
            </div>
        </div>
    );
}

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
import { ArrowLeft, Trophy, BarChart, ShieldCheck, TrendingDown, TrendingUp, Crosshair, Target, ShieldAlert, Repeat, Shuffle, HelpCircle, Plus, Minus, Goal } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import _ from 'lodash';


// ====================
// TYPES
// ====================

interface Team {
  id: string;
  name: string;
}

interface PlayerStats {
    goals?: number; assists?: number; yellowCards?: number; redCards?: number; fouls?: number;
    shotsOnTarget?: number; shotsOffTarget?: number; recoveries?: number; turnovers?: number;
}
interface OpponentStats {
    goals?: number; fouls?: number; shotsOnTarget?: number; shotsOffTarget?: number;
    recoveries?: number; turnovers?: number;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  teamId: string;
  isFinished: boolean;
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  playerStats?: { ['1H']?: { [playerId: string]: Partial<PlayerStats> }, ['2H']?: { [playerId: string]: Partial<PlayerStats> } };
  opponentStats?: { ['1H']?: Partial<OpponentStats>, ['2H']?: Partial<OpponentStats> };
}

type MatchResult = 'win' | 'loss' | 'draw';

// ====================
// STATS CARD COMPONENT
// ====================

const StatCard = ({ title, value, icon: Icon }: { title: string, value: string | number, icon: React.ElementType }) => (
    <Card className="flex items-center p-4">
        <div className="bg-primary/10 text-primary p-3 rounded-lg mr-4">
            <Icon className="w-6 h-6" />
        </div>
        <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
        </div>
    </Card>
);

const GoalStatRow = ({ label, value, icon: Icon }: { label: string; value: number; icon: React.ElementType }) => (
    <div className="flex items-center justify-between rounded-lg border p-3">
        <div className="flex items-center gap-3">
            <div className="bg-primary/10 text-primary p-2 rounded-md">
                <Icon className="w-4 h-4" />
            </div>
            <p className="font-medium text-sm">{label}</p>
        </div>
        <p className="text-lg font-bold">{value}</p>
    </div>
);


const YellowCardIcon = () => <div className="w-4 h-5 bg-yellow-400 border border-black rounded-sm" />;


// ====================
// MAIN PAGE COMPONENT
// ====================

export default function TeamOverallStatsPage() {
    const params = useParams();
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';
    const firestore = useFirestore();

    const [filter, setFilter] = useState<'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso'>('Todos');

    const teamRef = useMemoFirebase(() => doc(firestore, 'teams', teamId), [firestore, teamId]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

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
    
    const teamStats = useMemo(() => {
        const initialPerformanceStats = {
            shotsOnTarget: 0, shotsOffTarget: 0,
            foulsCommitted: 0, foulsReceived: 0,
            turnovers: 0, recoveries: 0,
            yellowCards: 0, redCards: 0,
            goalsFor: 0, goalsAgainst: 0,
            goalsFor1H: 0, goalsAgainst1H: 0,
            goalsFor2H: 0, goalsAgainst2H: 0,
        };

        if (!team || !filteredMatches) return { 
            played: 0, wins: 0, losses: 0, draws: 0,
            performance: initialPerformanceStats
        };
        
        let wins = 0;
        let losses = 0;
        let draws = 0;
        
        const performance = filteredMatches.reduce((acc, match) => {
            const isLocal = match.localTeam === team.name;

            // Match result
            const userScore = isLocal ? match.localScore : match.visitorScore;
            const opponentScore = isLocal ? match.visitorScore : match.localScore;
            if (userScore > opponentScore) wins++;
            else if (userScore < opponentScore) losses++;
            else draws++;

            // Player stats
            const playerStats1H = _.values(match.playerStats?.['1H'] || {});
            const playerStats2H = _.values(match.playerStats?.['2H'] || {});
            
            acc.shotsOnTarget += _.sumBy(playerStats1H, 'shotsOnTarget') + _.sumBy(playerStats2H, 'shotsOnTarget');
            acc.shotsOffTarget += _.sumBy(playerStats1H, 'shotsOffTarget') + _.sumBy(playerStats2H, 'shotsOffTarget');
            acc.foulsCommitted += _.sumBy(playerStats1H, 'fouls') + _.sumBy(playerStats2H, 'fouls');
            acc.turnovers += _.sumBy(playerStats1H, 'turnovers') + _.sumBy(playerStats2H, 'turnovers');
            acc.recoveries += _.sumBy(playerStats1H, 'recoveries') + _.sumBy(playerStats2H, 'recoveries');
            acc.yellowCards += _.sumBy(playerStats1H, 'yellowCards') + _.sumBy(playerStats2H, 'yellowCards');
            acc.redCards += _.sumBy(playerStats1H, 'redCards') + _.sumBy(playerStats2H, 'redCards');
            
            // Opponent stats
            const opponentStats1H = match.opponentStats?.['1H'] || {};
            const opponentStats2H = match.opponentStats?.['2H'] || {};

            acc.foulsReceived += (opponentStats1H.fouls || 0) + (opponentStats2H.fouls || 0);

            // Goal stats
            const teamGoals1H = _.sumBy(playerStats1H, 'goals');
            const teamGoals2H = _.sumBy(playerStats2H, 'goals');
            const opponentGoals1H = opponentStats1H.goals || 0;
            const opponentGoals2H = opponentStats2H.goals || 0;

            acc.goalsFor1H += teamGoals1H;
            acc.goalsFor2H += teamGoals2H;
            acc.goalsAgainst1H += opponentGoals1H;
            acc.goalsAgainst2H += opponentGoals2H;
            acc.goalsFor += teamGoals1H + teamGoals2H;
            acc.goalsAgainst += opponentGoals1H + opponentGoals2H;

            return acc;

        }, initialPerformanceStats);

        return {
            played: filteredMatches.length,
            wins,
            losses,
            draws,
            performance
        };

    }, [team, filteredMatches]);

    const isLoading = isLoadingTeam || isLoadingMatches;
    
    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="h-10 w-80" />
                <Skeleton className="h-12 w-full max-w-md" />
                <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><Skeleton className="h-6 w-1/2" /></CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (!team) {
        return <div className="container mx-auto text-center py-10">Equipo no encontrado.</div>;
    }
    
    const { performance } = teamStats;
    const totalShots = performance.shotsOnTarget + performance.shotsOffTarget;


    return (
        <div className="container mx-auto px-4 py-8 space-y-8">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                    <Trophy className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline text-primary">Estadísticas de {team.name}</h1>
                        <p className="text-lg text-muted-foreground mt-1">Un resumen de la actividad y el rendimiento de tu equipo.</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/equipo/gestion/${teamId}/estadisticas`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver
                    </Link>
                </Button>
            </div>

            <div className="mb-6">
                <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="w-full max-w-md">
                    <TabsList>
                        <TabsTrigger value="Todos">Todos</TabsTrigger>
                        <TabsTrigger value="Liga">Liga</TabsTrigger>
                        <TabsTrigger value="Copa">Copa</TabsTrigger>
                        <TabsTrigger value="Torneo">Torneo</TabsTrigger>
                        <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Resumen General de Partidos</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard title="Partidos Jugados" value={teamStats.played} icon={Trophy} />
                    <StatCard title="Ganados" value={teamStats.wins} icon={TrendingUp} />
                    <StatCard title="Perdidos" value={teamStats.losses} icon={TrendingDown} />
                    <StatCard title="Empatados" value={teamStats.draws} icon={ShieldCheck} />
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle className="text-xl">Rendimiento del Equipo</CardTitle>
                </CardHeader>
                 <CardContent className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <StatCard title="Tiros Totales" value={totalShots} icon={BarChart} />
                    <StatCard title="Tiros a Puerta" value={performance.shotsOnTarget} icon={Crosshair} />
                    <StatCard title="Tiros Fuera" value={performance.shotsOffTarget} icon={Target} />
                    <StatCard title="Faltas Cometidas" value={performance.foulsCommitted} icon={ShieldAlert} />
                    <StatCard title="Faltas Recibidas" value={performance.foulsReceived} icon={ShieldCheck} />
                    <StatCard title="Pérdidas de Balón" value={performance.turnovers} icon={Shuffle} />
                    <StatCard title="Robos de Balón" value={performance.recoveries} icon={Repeat} />
                    <StatCard title="Tarjetas Amarillas" value={performance.yellowCards} icon={YellowCardIcon} />
                 </CardContent>
            </Card>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Goles a Favor</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <GoalStatRow label="Totales" value={performance.goalsFor} icon={Plus} />
                        <GoalStatRow label="1ª Parte" value={performance.goalsFor1H} icon={Plus} />
                        <GoalStatRow label="2ª Parte" value={performance.goalsFor2H} icon={Plus} />
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Goles en Contra</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                        <GoalStatRow label="Totales" value={performance.goalsAgainst} icon={Minus} />
                        <GoalStatRow label="1ª Parte" value={performance.goalsAgainst1H} icon={Minus} />
                        <GoalStatRow label="2ª Parte" value={performance.goalsAgainst2H} icon={Minus} />
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

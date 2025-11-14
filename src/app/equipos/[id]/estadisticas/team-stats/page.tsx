
"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, TrendingUp, Shield, TrendingDown, Target, XCircle, ShieldAlert, RefreshCw, ChevronsRightLeft, Plus, Minus } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

type Match = {
    id: string;
    localTeam: string;
    visitorTeam: string;
    date: Timestamp;
    matchType: string;
    localScore: number;
    visitorScore: number;
    isFinished: boolean;
    teamId: string;
    playerStats?: any;
    opponentStats?: any;
};

type MatchStats = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
};

type PerformanceStats = {
    shotsOnTarget: number;
    shotsOffTarget: number;
    totalShots: number;
    foulsCommitted: number;
    foulsReceived: number;
    turnovers: number;
    recoveries: number;
    yellowCards: number;
    redCards: number;
    goalsFor: { total: number; '1H': number; '2H': number };
    goalsAgainst: { total: number; '1H': number; '2H': number };
};

const StatCard = ({ title, value, icon, className }: { title: string, value: number, icon: React.ReactNode, className?: string }) => (
    <Card className={cn("flex items-center p-3 gap-3", className)}>
        <div className="bg-primary/10 p-2 rounded-lg">{icon}</div>
        <div>
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <div className="text-2xl font-bold">{value}</div>
        </div>
    </Card>
);

const GoalCard = ({ title, total, part1, part2, type }: { title: string, total: number, part1: number, part2: number, type: 'for' | 'against' }) => (
    <Card>
        <CardHeader>
            <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                    {type === 'for' ? <Plus className="h-5 w-5"/> : <Minus className="h-5 w-5"/>}
                    <span className="font-medium">Totales</span>
                </div>
                <span className="text-2xl font-bold">{total}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                 <div className="flex items-center gap-2">
                    {type === 'for' ? <Plus className="h-5 w-5"/> : <Minus className="h-5 w-5"/>}
                    <span className="font-medium">1ª Parte</span>
                </div>
                <span className="text-2xl font-bold">{part1}</span>
            </div>
            <div className="flex justify-between items-center p-3 rounded-lg bg-muted">
                <div className="flex items-center gap-2">
                    {type === 'for' ? <Plus className="h-5 w-5"/> : <Minus className="h-5 w-5"/>}
                    <span className="font-medium">2ª Parte</span>
                </div>
                <span className="text-2xl font-bold">{part2}</span>
            </div>
        </CardContent>
    </Card>
);


export default function TeamStatsPage() {
    const params = useParams();
    const teamId = params.id as string;
    const [filter, setFilter] = useState('Todos');

    const [team, loadingTeam] = useDocumentData(doc(db, `teams/${teamId}`));
    const teamName = team?.name || '';

    const matchesQuery = teamId ? query(collection(db, "matches"), where("teamId", "==", teamId), where("isFinished", "==", true)) : null;
    const [matchesSnapshot, loadingMatches, errorMatches] = useCollection(matchesQuery);

    const matches = useMemo(() => 
        matchesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)) || [],
    [matchesSnapshot]);

    const filteredMatches = useMemo(() => {
        if (filter === 'Todos') {
            return matches;
        }
        return matches.filter(match => match.matchType === filter);
    }, [matches, filter]);

    const teamPerformanceStats: PerformanceStats = useMemo(() => {
        const initialStats: PerformanceStats = {
            shotsOnTarget: 0, shotsOffTarget: 0, totalShots: 0,
            foulsCommitted: 0, foulsReceived: 0, turnovers: 0, recoveries: 0,
            yellowCards: 0, redCards: 0,
            goalsFor: { total: 0, '1H': 0, '2H': 0 },
            goalsAgainst: { total: 0, '1H': 0, '2H': 0 }
        };

        return filteredMatches.reduce((acc, match) => {
            const isMyTeamLocal = match.localTeam.trim() === teamName.trim();

            ['1H', '2H'].forEach(period => {
                const myTeamPeriodStats = match.playerStats?.[period] || {};
                const opponentPeriodStats = match.opponentStats?.[period] || {};

                // My Team Stats
                Object.values(myTeamPeriodStats).forEach((player: any) => {
                    acc.shotsOnTarget += player.shotsOnTarget || 0;
                    acc.shotsOffTarget += player.shotsOffTarget || 0;
                    acc.foulsCommitted += player.fouls || 0;
                    acc.turnovers += player.turnovers || 0;
                    acc.recoveries += player.recoveries || 0;
                    acc.yellowCards += player.yellowCards || 0;
                    acc.redCards += player.redCards || 0;
                    acc.goalsFor[period as '1H' | '2H'] += player.goals || 0;
                });
                
                // Opponent Stats
                acc.foulsReceived += opponentPeriodStats.fouls || 0;
                acc.goalsAgainst[period as '1H' | '2H'] += opponentPeriodStats.goals || 0;
            });
            
            return acc;
        }, initialStats);
    }, [filteredMatches, teamName]);

    teamPerformanceStats.totalShots = teamPerformanceStats.shotsOnTarget + teamPerformanceStats.shotsOffTarget;
    teamPerformanceStats.goalsFor.total = teamPerformanceStats.goalsFor['1H'] + teamPerformanceStats.goalsFor['2H'];
    teamPerformanceStats.goalsAgainst.total = teamPerformanceStats.goalsAgainst['1H'] + teamPerformanceStats.goalsAgainst['2H'];

    const matchSummary: MatchStats = useMemo(() => {
        return filteredMatches.reduce((acc, match) => {
            acc.played++;
            const myTeamIsLocal = match.localTeam.trim() === teamName.trim();
            const myTeamWon = myTeamIsLocal ? match.localScore > match.visitorScore : match.visitorScore > match.localScore;
            const isDraw = match.localScore === match.visitorScore;

            if (isDraw) {
                acc.drawn++;
            } else if (myTeamWon) {
                acc.won++;
            } else {
                acc.lost++;
            }
            return acc;
        }, { played: 0, won: 0, drawn: 0, lost: 0 });
    }, [filteredMatches, teamName]);

    const isLoading = loadingTeam || loadingMatches;
    
    const SquareIcon = ({ className }: { className?: string }) => (
        <div className={cn("w-4 h-5 rounded-sm", className)} />
    );


    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold font-headline">Estadísticas del Equipo: {teamName}</h1>
                <Button variant="outline" asChild>
                <Link href={`/equipos/${teamId}/estadisticas`}>
                    <ArrowLeft className="mr-2" />
                    Volver
                </Link>
                </Button>
            </div>

            <Tabs value={filter} onValueChange={setFilter}>
                <TabsList className="mb-6">
                    <TabsTrigger value="Todos">Todos</TabsTrigger>
                    <TabsTrigger value="Liga">Liga</TabsTrigger>
                    <TabsTrigger value="Copa">Copa</TabsTrigger>
                    <TabsTrigger value="Torneo">Torneo</TabsTrigger>
                    <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
                </TabsList>
            </Tabs>
            
            <div className="space-y-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Resumen General de Partidos ({filter})</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {isLoading ? (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                                <Skeleton className="h-24 w-full" />
                            </div>
                        ) : errorMatches ? (
                            <p className="text-destructive">Error: {errorMatches.message}</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                                <StatCard title="Partidos Jugados" value={matchSummary.played} icon={<Trophy className="h-6 w-6 text-primary" />} />
                                <StatCard title="Ganados" value={matchSummary.won} icon={<TrendingUp className="h-6 w-6 text-green-600" />} className="border-green-500/50" />
                                <StatCard title="Empatados" value={matchSummary.drawn} icon={<Shield className="h-6 w-6 text-yellow-600" />} className="border-yellow-500/50" />
                                <StatCard title="Perdidos" value={matchSummary.lost} icon={<TrendingDown className="h-6 w-6 text-red-600" />} className="border-red-500/50" />
                            </div>
                        )}
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Rendimiento del Equipo</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {isLoading ? (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                               {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
                            </div>
                         ) : (
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                <StatCard title="Tiros Totales" value={teamPerformanceStats.totalShots} icon={<Target className="h-6 w-6 text-primary" />} />
                                <StatCard title="Tiros a Puerta" value={teamPerformanceStats.shotsOnTarget} icon={<Target className="h-6 w-6 text-green-600" />} />
                                <StatCard title="Tiros Fuera" value={teamPerformanceStats.shotsOffTarget} icon={<XCircle className="h-6 w-6 text-red-600" />} />
                                <StatCard title="Faltas Cometidas" value={teamPerformanceStats.foulsCommitted} icon={<ShieldAlert className="h-6 w-6 text-yellow-600" />} />
                                <StatCard title="Faltas Recibidas" value={teamPerformanceStats.foulsReceived} icon={<ShieldAlert className="h-6 w-6 text-blue-500" />} />
                                <StatCard title="Pérdidas de Balón" value={teamPerformanceStats.turnovers} icon={<ChevronsRightLeft className="h-6 w-6 text-orange-500" />} />
                                <StatCard title="Robos de Balón" value={teamPerformanceStats.recoveries} icon={<RefreshCw className="h-6 w-6 text-teal-500" />} />
                                <StatCard title="Tarjetas Amarillas" value={teamPerformanceStats.yellowCards} icon={<SquareIcon className="bg-yellow-400" />} />
                            </div>
                         )}
                    </CardContent>
                </Card>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 pb-6">
                    {isLoading ? (
                        <>
                            <Skeleton className="h-64 w-full" />
                            <Skeleton className="h-64 w-full" />
                        </>
                    ) : (
                        <>
                            <GoalCard title="Goles a Favor" total={teamPerformanceStats.goalsFor.total} part1={teamPerformanceStats.goalsFor['1H']} part2={teamPerformanceStats.goalsFor['2H']} type="for"/>
                            <GoalCard title="Goles en Contra" total={teamPerformanceStats.goalsAgainst.total} part1={teamPerformanceStats.goalsAgainst['1H']} part2={teamPerformanceStats.goalsAgainst['2H']} type="against"/>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}



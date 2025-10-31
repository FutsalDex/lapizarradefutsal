'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, Trophy, BarChart, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

// ====================
// TYPES
// ====================

interface Team {
  id: string;
  name: string;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  isFinished: boolean;
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
}

type MatchResult = 'win' | 'loss' | 'draw';

// ====================
// STATS CARD COMPONENT
// ====================

const StatCard = ({ title, value, icon: Icon }: { title: string, value: number, icon: React.ElementType }) => (
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
        if (!team || !filteredMatches) return { played: 0, wins: 0, losses: 0, draws: 0 };
        
        let wins = 0;
        let losses = 0;
        let draws = 0;
        
        filteredMatches.forEach(match => {
            const isLocal = match.localTeam === team.name;
            const userScore = isLocal ? match.localScore : match.visitorScore;
            const opponentScore = isLocal ? match.visitorScore : match.localScore;

            if (userScore > opponentScore) wins++;
            else if (userScore < opponentScore) losses++;
            else draws++;
        });

        return {
            played: filteredMatches.length,
            wins,
            losses,
            draws
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
            </div>
        );
    }

    if (!team) {
        return <div className="container mx-auto text-center py-10">Equipo no encontrado.</div>;
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
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

            {/* TODO: Add more sections like "Rendimiento del Equipo" with charts */}

        </div>
    );
}

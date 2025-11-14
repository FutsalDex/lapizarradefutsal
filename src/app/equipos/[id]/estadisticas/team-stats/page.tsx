
"use client";

import { useState, useMemo } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Trophy, TrendingUp, Shield, TrendingDown, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useCollection, useDocumentData } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Skeleton } from '@/components/ui/skeleton';

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
};

type MatchStats = {
    played: number;
    won: number;
    drawn: number;
    lost: number;
};

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

    const stats: MatchStats = useMemo(() => {
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
                            <Card className="flex items-center p-4 gap-4">
                                <div className="bg-primary/10 p-3 rounded-lg">
                                    <Trophy className="h-6 w-6 text-primary" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Partidos Jugados</CardTitle>
                                    <div className="text-3xl font-bold">{stats.played}</div>
                                </div>
                            </Card>
                            <Card className="flex items-center p-4 gap-4">
                                <div className="bg-green-100 p-3 rounded-lg">
                                    <TrendingUp className="h-6 w-6 text-green-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Ganados</CardTitle>
                                    <div className="text-3xl font-bold text-green-600">{stats.won}</div>
                                </div>
                            </Card>
                            <Card className="flex items-center p-4 gap-4">
                               <div className="bg-yellow-100 p-3 rounded-lg">
                                    <Shield className="h-6 w-6 text-yellow-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Empatados</CardTitle>
                                    <div className="text-3xl font-bold text-yellow-600">{stats.drawn}</div>
                                </div>
                            </Card>
                            <Card className="flex items-center p-4 gap-4">
                               <div className="bg-red-100 p-3 rounded-lg">
                                    <TrendingDown className="h-6 w-6 text-red-600" />
                                </div>
                                <div>
                                    <CardTitle className="text-sm font-medium">Perdidos</CardTitle>
                                    <div className="text-3xl font-bold text-red-600">{stats.lost}</div>
                                </div>
                            </Card>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

'use client';

import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, ResponsiveContainer } from 'recharts';

interface Match {
  id: string;
  isFinished: boolean;
  localScore: number;
  visitorScore: number;
}

interface Player {
    id: string;
    name: string;
    goals: number;
    assists: number;
    minutesPlayed: number;
}

const chartConfig = {
  victorias: { label: "Victorias", color: "hsl(var(--chart-2))" },
  derrotas: { label: "Derrotas", color: "hsl(var(--destructive))" },
  empates: { label: "Empates", color: "hsl(var(--muted-foreground))" },
};

export default function StatsPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();

  const finishedMatchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(
      collection(firestore, 'matches'),
      where('teamId', '==', teamId),
      where('isFinished', '==', true)
    );
  }, [firestore, teamId]);

  const playersQuery = useMemoFirebase(() => {
      if(!firestore || !teamId) return null;
      return query(collection(firestore, 'players'), where('teamId', '==', teamId));
  }, [firestore, teamId]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(finishedMatchesQuery);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersQuery);

  const teamStats = useMemo(() => {
    if (!matches) return { wins: 0, losses: 0, draws: 0, total: 0 };
    return matches.reduce((acc, match) => {
        if (match.localScore > match.visitorScore) acc.wins++;
        else if (match.localScore < match.visitorScore) acc.losses++;
        else acc.draws++;
        acc.total++;
        return acc;
    }, { wins: 0, losses: 0, draws: 0, total: 0 });
  }, [matches]);

  const chartData = [
      { type: 'Victorias', value: teamStats.wins, fill: 'var(--color-victorias)' },
      { type: 'Derrotas', value: teamStats.losses, fill: 'var(--color-derrotas)' },
      { type: 'Empates', value: teamStats.draws, fill: 'var(--color-empates)' },
  ];

  const isLoading = isLoadingMatches || isLoadingPlayers;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/equipo/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel del Equipo
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
          <BarChart3 className="mr-3 h-10 w-10" />
          Estadísticas del Equipo
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Analiza el rendimiento global y de tus jugadores.
        </p>
      </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Victorias</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{teamStats.wins}</div>}
                    <p className="text-xs text-muted-foreground">de {teamStats.total} partidos</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Derrotas</CardTitle>
                    <TrendingDown className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{teamStats.losses}</div>}
                    <p className="text-xs text-muted-foreground">de {teamStats.total} partidos</p>
                </CardContent>
            </Card>
             <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Empates</CardTitle>
                    <Minus className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                     {isLoading ? <Skeleton className="h-8 w-12" /> : <div className="text-2xl font-bold">{teamStats.draws}</div>}
                     <p className="text-xs text-muted-foreground">de {teamStats.total} partidos</p>
                </CardContent>
            </Card>
        </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card>
            <CardHeader>
                <CardTitle>Resumen de Resultados</CardTitle>
                <CardDescription>Distribución de victorias, derrotas y empates.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                    <ChartContainer config={chartConfig} className="h-[250px] w-full">
                        <ResponsiveContainer>
                            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                <CartesianGrid vertical={false} />
                                <XAxis dataKey="type" tickLine={false} tickMargin={10} axisLine={false} />
                                <YAxis />
                                <ChartTooltip content={<ChartTooltipContent />} />
                                <Bar dataKey="value" radius={4} />
                            </BarChart>
                        </ResponsiveContainer>
                    </ChartContainer>
                )}
            </CardContent>
        </Card>
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas de Jugadores</CardTitle>
                <CardDescription>Rendimiento individual de la plantilla.</CardDescription>
            </CardHeader>
            <CardContent>
                 {isLoading ? <Skeleton className="h-[250px] w-full" /> : (
                     !players || players.length === 0 ? (
                         <p className="text-sm text-muted-foreground text-center py-10">No hay datos de jugadores.</p>
                     ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                <TableHead>Jugador</TableHead>
                                <TableHead className="text-center">Goles</TableHead>
                                <TableHead className="text-center">Asistencias</TableHead>
                                <TableHead className="text-center">Minutos</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {players.map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.name}</TableCell>
                                        <TableCell className="text-center">{player.goals || 0}</TableCell>
                                        <TableCell className="text-center">{player.assists || 0}</TableCell>
                                        <TableCell className="text-center">{player.minutesPlayed || 0}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                     )
                 )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

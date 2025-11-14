
"use client";

import { useParams } from 'next/navigation';
import { useDocumentData } from 'react-firebase-hooks/firestore';
import { doc, Timestamp } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, BarChart, History, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from '@/components/ui/skeleton';

type StatRowProps = {
    label: string;
    localValue: number;
    visitorValue: number;
};

const StatRow = ({ label, localValue, visitorValue }: StatRowProps) => (
    <div className="flex justify-between items-center py-2 border-b last:border-none">
        <span className="font-bold text-lg">{localValue}</span>
        <span className="text-sm text-muted-foreground">{label}</span>
        <span className="font-bold text-lg">{visitorValue}</span>
    </div>
);

type PlayerStat = {
  g: number; a: number; ta: number; tr: number; fouls: number; 
  paradas: number; gc: number; vs1: number; minutesPlayed: number;
};

export default function PartidoDetallePage() {
  const params = useParams();
  const matchId = params.id as string;
  const myTeamName = "Juvenil B"; // Asumiendo que este es el nombre de tu equipo

  const [match, loading, error] = useDocumentData(doc(db, 'matches', matchId));

  if (loading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <Skeleton className="h-10 w-48 mb-6" />
            <Skeleton className="h-32 w-full mb-8" />
            <Skeleton className="h-96 w-full" />
        </div>
    );
  }

  if (error || !match) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Partido no encontrado</h1>
        <p className="text-muted-foreground">{error?.message}</p>
        <Link href="/partidos">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Partidos
          </Button>
        </Link>
      </div>
    );
  }

  const {
    localTeam, visitorTeam, date, competition, localScore, visitorScore,
    events = [], playerStats = {}, opponentStats = {}
  } = match;
  
  const matchDate = (date as Timestamp)?.toDate ? (date as Timestamp).toDate() : new Date(date);
  
  const isMyTeamLocal = localTeam === myTeamName;
  const rivalName = "RIVAL";

  const calculateTotalTeamStats = (playerData: any, opponentData: any) => {
    const myTeamStats = { tirosPuerta: 0, tirosFuera: 0, faltas: 0, recuperaciones: 0, perdidas: 0 };
    const opponentTeamStats = { tirosPuerta: 0, tirosFuera: 0, faltas: 0, recuperaciones: 0, perdidas: 0 };
  
    ['1H', '2H'].forEach(period => {
      // Suma las estadísticas de nuestro equipo (playerData)
      if (playerData[period]) {
          Object.values(playerData[period]).forEach((p: any) => {
              myTeamStats.tirosPuerta += p.shotsOnTarget || 0;
              myTeamStats.tirosFuera += p.shotsOffTarget || 0;
              myTeamStats.faltas += p.fouls || 0;
              myTeamStats.recuperaciones += p.recoveries || 0;
              myTeamStats.perdidas += p.turnovers || 0;
          });
      }
      // Suma las estadísticas del oponente (opponentData)
      if (opponentData[period]) {
          const oppStats = opponentData[period];
          opponentTeamStats.tirosPuerta += oppStats.shotsOnTarget || 0;
          opponentTeamStats.tirosFuera += oppStats.shotsOffTarget || 0;
          opponentTeamStats.faltas += oppStats.fouls || 0;
          opponentTeamStats.recuperaciones += oppStats.recoveries || 0;
          opponentTeamStats.perdidas += oppStats.turnovers || 0;
      }
    });

    return { 
        local: isMyTeamLocal ? myTeamStats : opponentTeamStats,
        visitor: isMyTeamLocal ? opponentTeamStats : myTeamStats
    };
  }
  
  const teamStats = calculateTotalTeamStats(playerStats, opponentStats);
  
  const combinedPlayerStats = () => {
    const combined: Record<string, PlayerStat & { name?: string, id?: string }> = {};

    ['1H', '2H'].forEach(period => {
        if (playerStats[period]) {
            Object.entries(playerStats[period]).forEach(([playerId, stats]: [string, any]) => {
                if (!combined[playerId]) {
                    combined[playerId] = { id: playerId, minutesPlayed: 0, g: 0, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0 };
                }
                combined[playerId].minutesPlayed += stats.minutesPlayed || 0;
                combined[playerId].g += stats.goals || 0;
                combined[playerId].a += stats.assists || 0;
                combined[playerId].ta += stats.yellowCards || 0;
                combined[playerId].tr += stats.redCards || 0;
                combined[playerId].fouls += stats.fouls || 0;
                combined[playerId].paradas += stats.saves || 0;
                combined[playerId].gc += stats.goalsConceded || 0;
                combined[playerId].vs1 += stats.unoVsUno || 0;
            });
        }
    });
    
    // Find player names from events
    events.forEach((event: any) => {
        if(event.playerId && combined[event.playerId] && !combined[event.playerId].name) {
            combined[event.playerId].name = event.playerName;
        }
    });

    return Object.values(combined);
  };
  
  const finalPlayerStats = combinedPlayerStats();
  
  const totals = finalPlayerStats.reduce((acc, player) => {
        acc.g += player.g;
        acc.a += player.a;
        acc.ta += player.ta;
        acc.tr += player.tr;
        acc.fouls += player.fouls;
        acc.paradas += player.paradas;
        acc.gc += player.gc;
        acc.vs1 += player.vs1;
        acc.totalSeconds += player.minutesPlayed;
        return acc;
    }, { g: 0, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0, totalSeconds: 0 });

    const totalMinutes = Math.floor(totals.totalSeconds / 60);
    const totalSecondsRemaining = totals.totalSeconds % 60;
    const totalTimeFormatted = `${totalMinutes}:${String(totalSecondsRemaining).padStart(2, '0')}`;
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    const displayLocalTeam = isMyTeamLocal ? myTeamName : rivalName;
    const displayVisitorTeam = isMyTeamLocal ? rivalName : myTeamName;


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <div className="bg-muted p-3 rounded-full">
                <History className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold font-headline">Detalles del Partido</h1>
                <p className="text-muted-foreground">{format(matchDate, "EEEE, dd MMMM yyyy", { locale: es })} - {competition}</p>
            </div>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" asChild>
                <Link href="/partidos">
                    <ArrowLeft className="mr-2" />
                    Volver
                </Link>
            </Button>
            <Button asChild>
                 <Link href={`/partidos/${matchId}/estadisticas`}>
                    <BarChart className="mr-2" />
                    Gestionar
                </Link>
            </Button>
        </div>
      </div>
      
      <Card className="mb-8 text-center">
        <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">{displayLocalTeam} vs {displayVisitorTeam}</h2>
            <p className="text-6xl font-bold text-primary">{localScore} - {visitorScore}</p>
        </CardContent>
      </Card>
      
      <Tabs defaultValue="datos">
        <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="datos">Datos del Partido</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas de Jugadores</TabsTrigger>
        </TabsList>
        <TabsContent value="datos">
            <Card>
                <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                         <div className="text-center">
                            <h3 className="font-bold text-lg mb-4">Cronología de Goles</h3>
                        </div>
                        <div className="flex justify-between font-bold text-sm text-muted-foreground border-b pb-2">
                            <h4 className="w-1/2">{displayLocalTeam}</h4>
                            <h4 className="w-1/2 text-right">{displayVisitorTeam}</h4>
                        </div>
                        <div className="space-y-4">
                            {events.filter((e: any) => e.type === 'goal').sort((a:any, b:any) => a.minute - b.minute).map((goal: any, index: number) => (
                                <div key={index} className="flex items-center text-sm border-b last:border-none pb-2">
                                    {goal.team === 'local' ? (
                                        <div className="w-1/2 flex justify-between items-center pr-4">
                                            <span className="font-medium">{goal.playerName}</span>
                                            <span className="text-muted-foreground">{goal.minute}'</span>
                                        </div>
                                    ) : <div className="w-1/2 pr-4"></div>}
                                    
                                     <div className="w-[1px] bg-border h-4"></div>

                                    {goal.team === 'visitor' ? (
                                        <div className="w-1/2 flex justify-between items-center pl-4">
                                            <span className="text-muted-foreground">{goal.minute}'</span>
                                            <span className="font-medium text-right">{goal.playerName}</span>
                                        </div>
                                    ) : <div className="w-1/2 pl-4"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-4">
                       <h3 className="font-bold text-center text-lg">Estadísticas del Equipo</h3>
                       <div className="flex justify-between font-bold border-b pb-2 mb-2">
                            <h4 className="text-left">{displayLocalTeam}</h4>
                            <h4 className="text-right">{displayVisitorTeam}</h4>
                        </div>
                       <div className="space-y-2">
                            <StatRow label="Tiros a Puerta" localValue={teamStats.local.tirosPuerta} visitorValue={teamStats.visitor.tirosPuerta} />
                            <StatRow label="Tiros Fuera" localValue={teamStats.local.tirosFuera} visitorValue={teamStats.visitor.tirosFuera} />
                            <StatRow label="Faltas" localValue={teamStats.local.faltas} visitorValue={teamStats.visitor.faltas} />
                            <StatRow label="Recuperaciones" localValue={teamStats.local.recuperaciones} visitorValue={teamStats.visitor.recuperaciones} />
                            <StatRow label="Pérdidas" localValue={teamStats.local.perdidas} visitorValue={teamStats.visitor.perdidas} />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="estadisticas">
            <Card>
                <CardHeader>
                    <CardTitle>Estadísticas de Jugadores</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-center">Min.</TableHead>
                                    <TableHead className="text-center">G</TableHead>
                                    <TableHead className="text-center">As</TableHead>
                                    <TableHead className="text-center">TA</TableHead>
                                    <TableHead className="text-center">TR</TableHead>
                                    <TableHead className="text-center">F</TableHead>
                                    <TableHead className="text-center">Par.</TableHead>
                                    <TableHead className="text-center">GC</TableHead>
                                    <TableHead className="text-center">1vs1</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {finalPlayerStats.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="py-2 px-4 font-medium">{player.name || 'Desconocido'}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{formatTime(player.minutesPlayed)}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.g}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.a}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.ta}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.tr}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.fouls}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.paradas}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.gc}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.vs1}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter>
                                <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                    <TableCell className="py-2 px-4">Total Equipo</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totalTimeFormatted}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.g}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.a}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.ta}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.tr}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.fouls}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.paradas}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.gc}</TableCell>
                                    <TableCell className="text-center py-2 px-4">{totals.vs1}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
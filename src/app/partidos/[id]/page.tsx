
"use client";

import { useParams } from 'next/navigation';
import { matches } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { ArrowLeft, BarChart, History } from 'lucide-react';
import Link from 'next/link';

const goalChronology = [
    { team: 'local', player: 'Marc Romera', minute: 10 },
    { team: 'local', player: 'Adam', minute: 20 },
    { team: 'local', player: 'Adam', minute: 22 },
    { team: 'rival', player: 'Rival', minute: 25 },
    { team: 'local', player: 'Marc Romera', minute: 26 },
    { team: 'local', player: 'Hugo', minute: 28 },
    { team: 'local', player: 'Marc Muñoz', minute: 30 },
    { team: 'local', player: 'Adam', minute: 47 },
    { team: 'local', player: 'Hugo', minute: 48 },
];

const teamStats = {
    local: { tirosPuerta: 18, tirosFuera: 10, faltas: 6, recuperaciones: 25, perdidas: 15 },
    visitor: { tirosPuerta: 8, tirosFuera: 5, faltas: 8, recuperaciones: 18, perdidas: 22 },
};

const playerStats = [
    { id: 1, name: "Manel", timePlayed: "25:00", g: 0, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 2, gc: 1, vs1: 1 },
    { id: 2, name: "Marc Montoro", timePlayed: "22:57", g: 0, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0 },
    { id: 5, name: "Dani", timePlayed: "19:02", g: 0, a: 2, ta: 0, tr: 0, fouls: 1, paradas: 0, gc: 0, vs1: 0 },
    { id: 6, name: "Adam", timePlayed: "24:22", g: 3, a: 0, ta: 0, tr: 0, fouls: 1, paradas: 0, gc: 0, vs1: 0 },
    { id: 7, name: "Hugo", timePlayed: "17:40", g: 2, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0 },
    { id: 8, name: "Victor", timePlayed: "22:05", g: 0, a: 0, ta: 0, tr: 0, fouls: 1, paradas: 0, gc: 0, vs1: 0 },
    { id: 9, name: "Marc Romera", timePlayed: "18:32", g: 2, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0 },
    { id: 10, name: "Iker Rando", timePlayed: "18:15", g: 0, a: 0, ta: 0, tr: 0, fouls: 1, paradas: 0, gc: 0, vs1: 0 },
    { id: 11, name: "Roger", timePlayed: "19:30", g: 0, a: 1, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0 },
    { id: 12, name: "Marc Muñoz", timePlayed: "16:10", g: 1, a: 1, ta: 0, tr: 0, fouls: 1, paradas: 0, gc: 0, vs1: 0 },
    { id: 15, name: "Lucas", timePlayed: "25:00", g: 0, a: 0, ta: 0, tr: 0, fouls: 1, paradas: 1, gc: 0, vs1: 1 },
    { id: 16, name: "Salva", timePlayed: "14:09", g: 0, a: 1, ta: 0, tr: 0, fouls: 0, paradas: 2, gc: 0, vs1: 0 },
];


export default function PartidoDetallePage() {
  const params = useParams();
  const match = matches.find(m => m.id === params.id);

  if (!match) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Partido no encontrado</h1>
        <Link href="/partidos">
          <Button variant="outline" className="mt-4">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Partidos
          </Button>
        </Link>
      </div>
    );
  }
  
  const [localTeam, visitorTeam] = match.opponent.split(' vs ');

    const totals = playerStats.reduce((acc, player) => {
        acc.g += player.g;
        acc.a += player.a;
        acc.ta += player.ta;
        acc.tr += player.tr;
        acc.fouls += player.fouls;
        acc.paradas += player.paradas;
        acc.gc += player.gc;
        acc.vs1 += player.vs1;
        
        const [mins, secs] = player.timePlayed.split(':').map(Number);
        acc.totalSeconds += (mins * 60) + secs;

        return acc;
    }, { g: 0, a: 0, ta: 0, tr: 0, fouls: 0, paradas: 0, gc: 0, vs1: 0, totalSeconds: 0 });

    const totalMinutes = Math.floor(totals.totalSeconds / 60);
    const totalSecondsRemaining = totals.totalSeconds % 60;
    const totalTimeFormatted = `${totalMinutes}:${String(totalSecondsRemaining).padStart(2, '0')}`;

    const StatRow = ({ label, localValue, visitorValue }: { label: string; localValue: number; visitorValue: number }) => (
        <div className="flex justify-between items-center py-2 border-b last:border-none">
            <span className="font-bold text-lg">{localValue}</span>
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className="font-bold text-lg">{visitorValue}</span>
        </div>
    );


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
            <div className="bg-muted p-3 rounded-full">
                <History className="w-6 h-6 text-primary" />
            </div>
            <div>
                <h1 className="text-2xl font-bold font-headline">Detalles del Partido</h1>
                <p className="text-muted-foreground">{new Date(match.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} - {match.competition}</p>
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
                 <Link href={`/partidos/${match.id}/estadisticas`}>
                    <BarChart className="mr-2" />
                    Gestionar
                </Link>
            </Button>
        </div>
      </div>
      
      <Card className="mb-8 text-center">
        <CardContent className="p-6">
            <h2 className="text-2xl font-bold mb-2">{match.opponent}</h2>
            <p className="text-6xl font-bold text-primary">{match.score}</p>
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
                            <h4 className="w-1/2">{localTeam}</h4>
                            <h4 className="w-1/2 text-right">{visitorTeam}</h4>
                        </div>
                        <div className="space-y-4">
                            {goalChronology.map((goal, index) => (
                                <div key={index} className="flex items-center text-sm border-b last:border-none pb-2">
                                    {goal.team === 'local' ? (
                                        <div className="w-1/2 flex justify-between items-center pr-4">
                                            <span className="font-medium">{goal.player}</span>
                                            <span className="text-muted-foreground">{goal.minute}'</span>
                                        </div>
                                    ) : <div className="w-1/2 pr-4"></div>}
                                    
                                     <div className="w-[1px] bg-border h-4"></div>

                                    {goal.team === 'rival' ? (
                                        <div className="w-1/2 flex justify-between items-center pl-4">
                                            <span className="text-muted-foreground">{goal.minute}'</span>
                                            <span className="font-medium text-right">{goal.player}</span>
                                        </div>
                                    ) : <div className="w-1/2 pl-4"></div>}
                                </div>
                            ))}
                        </div>
                    </div>
                     <div className="space-y-4">
                       <h3 className="font-bold text-center text-lg">Estadísticas del Equipo</h3>
                       <div className="flex justify-between font-bold border-b pb-2 mb-2">
                            <h4 className="text-left">{localTeam}</h4>
                            <h4 className="text-right">{visitorTeam}</h4>
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
                                    <TableHead className="w-[50px] text-center">#</TableHead>
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
                                {playerStats.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="text-center font-medium py-2 px-4">{player.id}</TableCell>
                                        <TableCell className="py-2 px-4">{player.name}</TableCell>
                                        <TableCell className="text-center py-2 px-4">{player.timePlayed}</TableCell>
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
                                    <TableCell colSpan={2} className="py-2 px-4">Total Equipo</TableCell>
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

    
    

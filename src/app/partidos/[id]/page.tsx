
"use client";

import { useParams } from 'next/navigation';
import { matches, Match } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
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

const playerStats = [
    { id: 1, name: "Manel", g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 2, name: "Marc Montoro", g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 5, name: "Dani", g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 6, name: "Adam", g: 3, a: 1, fouls: 2, t_puerta: 5, t_fuera: 1, recup: 4, perdidas: 3, paradas: 0, gc: 0, vs1: 2, ta: 0, tr: 0 },
    { id: 7, name: "Hugo", g: 2, a: 0, fouls: 1, t_puerta: 3, t_fuera: 2, recup: 2, perdidas: 1, paradas: 0, gc: 0, vs1: 1, ta: 0, tr: 0 },
    { id: 8, name: "Victor", g: 0, a: 1, fouls: 0, t_puerta: 1, t_fuera: 0, recup: 3, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 9, name: "Marc Romera", g: 2, a: 2, fouls: 0, t_puerta: 4, t_fuera: 0, recup: 5, perdidas: 2, paradas: 0, gc: 0, vs1: 3, ta: 1, tr: 0 },
    { id: 12, name: "Marc Muñoz", g: 1, a: 0, fouls: 0, t_puerta: 1, t_fuera: 1, recup: 1, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
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
        acc.fouls += player.fouls;
        acc.t_puerta += player.t_puerta;
        acc.t_fuera += player.t_fuera;
        acc.recup += player.recup;
        acc.perdidas += player.perdidas;
        acc.paradas += player.paradas;
        acc.gc += player.gc;
        acc.vs1 += player.vs1;
        acc.ta += player.ta;
        acc.tr += player.tr;
        return acc;
    }, { g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 });

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
      
      <Tabs defaultValue="cronologia">
        <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="cronologia">Cronología de Goles</TabsTrigger>
            <TabsTrigger value="estadisticas">Estadísticas de Jugadores</TabsTrigger>
        </TabsList>
        <TabsContent value="cronologia">
            <Card>
                <CardContent className="p-6">
                    <div className="flex justify-between font-bold border-b pb-2 mb-4">
                        <h3 className="w-1/3">{localTeam}</h3>
                        <div className="w-1/3 text-center"></div>
                        <h3 className="w-1/3 text-right">{visitorTeam}</h3>
                    </div>
                    <div className="space-y-4">
                        {goalChronology.map((goal, index) => (
                            <div key={index} className="flex items-center text-sm">
                                {goal.team === 'local' ? (
                                    <>
                                        <div className="w-1/3 font-medium">{goal.player}</div>
                                        <div className="w-1/3 text-center text-muted-foreground">{goal.minute}'</div>
                                        <div className="w-1/3"></div>
                                    </>
                                ) : (
                                    <>
                                        <div className="w-1/3"></div>
                                        <div className="w-1/3 text-center text-muted-foreground">{goal.minute}'</div>
                                        <div className="w-1/3 text-right font-medium">{goal.player}</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </TabsContent>
        <TabsContent value="estadisticas">
            <Card>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <Table className="text-xs">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="sticky left-0 bg-card min-w-[150px] p-2 text-center">Jugador</TableHead>
                                    <TableHead className="p-2 text-center">G</TableHead>
                                    <TableHead className="p-2 text-center">A</TableHead>
                                    <TableHead className="p-2 text-center">Faltas</TableHead>
                                    <TableHead className="p-2 text-center">T. Puerta</TableHead>
                                    <TableHead className="p-2 text-center">T. Fuera</TableHead>
                                    <TableHead className="p-2 text-center">Recup.</TableHead>
                                    <TableHead className="p-2 text-center">Perdidas</TableHead>
                                    <TableHead className="p-2 text-center">Paradas</TableHead>
                                    <TableHead className="p-2 text-center">GC</TableHead>
                                    <TableHead className="p-2 text-center">1vs1</TableHead>
                                    <TableHead className="p-2 text-center">TA</TableHead>
                                    <TableHead className="p-2 text-center">TR</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {playerStats.map((player) => (
                                    <TableRow key={player.id}>
                                        <TableCell className="sticky left-0 bg-card font-medium p-2">{player.name}</TableCell>
                                        <TableCell className="p-2 text-center">{player.g}</TableCell>
                                        <TableCell className="p-2 text-center">{player.a}</TableCell>
                                        <TableCell className="p-2 text-center">{player.fouls}</TableCell>
                                        <TableCell className="p-2 text-center">{player.t_puerta}</TableCell>
                                        <TableCell className="p-2 text-center">{player.t_fuera}</TableCell>
                                        <TableCell className="p-2 text-center">{player.recup}</TableCell>
                                        <TableCell className="p-2 text-center">{player.perdidas}</TableCell>
                                        <TableCell className="p-2 text-center">{player.paradas}</TableCell>
                                        <TableCell className="p-2 text-center">{player.gc}</TableCell>
                                        <TableCell className="p-2 text-center">{player.vs1}</TableCell>
                                        <TableCell className="p-2 text-center">{player.ta}</TableCell>
                                        <TableCell className="p-2 text-center">{player.tr}</TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                             <TableFooter>
                                <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                    <TableCell className="sticky left-0 bg-muted/50 min-w-[150px] p-2">Total</TableCell>
                                    <TableCell className="text-center p-2">{totals.g}</TableCell>
                                    <TableCell className="text-center p-2">{totals.a}</TableCell>
                                    <TableCell className="text-center p-2">{totals.fouls}</TableCell>
                                    <TableCell className="text-center p-2">{totals.t_puerta}</TableCell>
                                    <TableCell className="text-center p-2">{totals.t_fuera}</TableCell>
                                    <TableCell className="text-center p-2">{totals.recup}</TableCell>
                                    <TableCell className="text-center p-2">{totals.perdidas}</TableCell>
                                    <TableCell className="text-center p-2">{totals.paradas}</TableCell>
                                    <TableCell className="text-center p-2">{totals.gc}</TableCell>
                                    <TableCell className="text-center p-2">{totals.vs1}</TableCell>
                                    <TableCell className="text-center p-2">{totals.ta}</TableCell>
                                    <TableCell className="text-center p-2">{totals.tr}</TableCell>
                                </TableRow>
                            </TableFooter>
                        </Table>
                    </div>
                </CardContent>
            </Card>
             <Card className="mt-8">
                <CardHeader>
                    <CardTitle>Leyenda</CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-2 md:grid-cols-4 gap-x-8 gap-y-2 text-sm text-muted-foreground">
                    <div><span className="font-semibold text-foreground">G:</span> Goles</div>
                    <div><span className="font-semibold text-foreground">A:</span> Asistencias</div>
                    <div><span className="font-semibold text-foreground">TA:</span> T. Amarilla</div>
                    <div><span className="font-semibold text-foreground">TR:</span> T. Roja</div>
                    <div><span className="font-semibold text-foreground">Faltas:</span> Faltas</div>
                    <div><span className="font-semibold text-foreground">T. Puerta:</span> Tiros a Puerta</div>
                    <div><span className="font-semibold text-foreground">T. Fuera:</span> Tiros Fuera</div>
                    <div><span className="font-semibold text-foreground">Recup.:</span> Recuperaciones</div>
                    <div><span className="font-semibold text-foreground">Perdidas:</span> Perdidas</div>
                    <div><span className="font-semibold text-foreground">Paradas:</span> Paradas</div>
                    <div><span className="font-semibold text-foreground">GC:</span> Goles en Contra</div>
                    <div><span className="font-semibold text-foreground">1vs1:</span> Duelos 1vs1 ganados</div>
                </CardContent>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

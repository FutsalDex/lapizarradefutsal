
"use client";

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, RotateCcw, Play, Pause, Plus, Minus } from "lucide-react";
import Link from 'next/link';

const statsPlayers = [
    { id: 1, name: "Manel", min: "25:00", g: 0, a: 0, fouls: 0, t_puerta: 2, t_fuera: 1, recup: 1, perdidas: 0, paradas: 2, gc: 1, vs1: 0, ta: 0, tr: 0 },
    { id: 2, name: "Marc Montoro", min: "22:57", g: 0, a: 0, fouls: 0, t_puerta: 1, t_fuera: 2, recup: 1, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 5, name: "Dani", min: "19:02", g: 0, a: 1, fouls: 0, t_puerta: 1, t_fuera: 0, recup: 1, perdidas: 1, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 6, name: "Adam", min: "24:22", g: 2, a: 0, fouls: 1, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 7, name: "Hugo", min: "17:40", g: 0, a: 0, fouls: 0, t_puerta: 1, t_fuera: 1, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 8, name: "Victor", min: "22:05", g: 0, a: 1, fouls: 1, t_puerta: 1, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 9, name: "Marc Romera", min: "18:32", g: 1, a: 0, fouls: 0, t_puerta: 1, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
];

const StatButton = ({ value, onIncrement, onDecrement }: { value: number, onIncrement: () => void, onDecrement: () => void }) => (
    <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDecrement}><Minus className="h-3 w-3"/></Button>
        <span className="w-4 text-center">{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onIncrement}><Plus className="h-3 w-3"/></Button>
    </div>
);


export default function EstadisticasPartidoPage() {
    const [teamFouls, setTeamFouls] = useState(3);
    const [opponentFouls, setOpponentFouls] = useState(4);
    const [playerStats, setPlayerStats] = useState(statsPlayers);

    const handleStatChange = (playerId: number, stat: keyof typeof playerStats[0], delta: number) => {
        setPlayerStats(prevStats =>
            prevStats.map(player => {
                if (player.id === playerId) {
                    const currentVal = player[stat as keyof typeof player] as number;
                    const newVal = Math.max(0, currentVal + delta);
                    return { ...player, [stat]: newVal };
                }
                return player;
            })
        );
    };

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-4">
            <div>
                <h1 className="text-2xl font-bold font-headline">Marcador y Estadísticas en Vivo</h1>
                <p className="text-muted-foreground">Gestiona el partido en tiempo real y pulsa Guardar para registrar los cambios.</p>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" asChild>
                    <Link href="/partidos">
                        <ArrowLeft className="mr-2" />
                        Volver
                    </Link>
                </Button>
                <Button><Save className="mr-2"/>Guardar</Button>
                <Button variant="secondary"><RotateCcw className="mr-2"/>Reabrir</Button>
            </div>
        </div>

        <Card className="mb-8">
            <CardContent className="p-6">
                <div className="grid grid-cols-3 items-center text-center">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold">Juvenil B</h2>
                        <div className="flex gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full ${i < teamFouls ? 'bg-red-500' : 'bg-muted'}`}></div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm">TM</Button>
                    </div>

                    {/* Score and Timer */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-primary">8 - 1</div>
                        <div className="text-6xl font-bold bg-gray-900 text-white p-4 rounded-lg">
                            25:00
                        </div>
                        <div className="flex gap-2">
                            <Button><Play className="mr-2"/>Iniciar</Button>
                            <Button variant="outline"><RotateCcw className="mr-2"/>Reiniciar</Button>
                            <Button variant="secondary">1ª Parte</Button>
                            <Button variant="secondary">2ª Parte</Button>
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold truncate">MARISTES ADEMAR CLUB ESPORTI...</h2>
                         <div className="flex gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full ${i < opponentFouls ? 'bg-red-500' : 'bg-muted'}`}></div>
                            ))}
                        </div>
                        <Button variant="outline" size="sm">TM</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="team-a">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="team-a">Juvenil B</TabsTrigger>
                <TabsTrigger value="team-b">MARISTES ADEMAR CLUB ESPORTIU A</TabsTrigger>
            </TabsList>
            <TabsContent value="team-a">
                <Card>
                    <CardHeader>
                        <CardTitle>Juvenil B - Estadísticas 1ª Parte</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Jugador</TableHead>
                                        <TableHead>Min</TableHead>
                                        <TableHead>G</TableHead>
                                        <TableHead>A</TableHead>
                                        <TableHead>Faltas</TableHead>
                                        <TableHead>T. Puerta</TableHead>
                                        <TableHead>T. Fuera</TableHead>
                                        <TableHead>Recup.</TableHead>
                                        <TableHead>Perdidas</TableHead>
                                        <TableHead>Paradas</TableHead>
                                        <TableHead>GC</TableHead>
                                        <TableHead>1vs1</TableHead>
                                        <TableHead>TA</TableHead>
                                        <TableHead>TR</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {playerStats.map((player) => (
                                        <TableRow key={player.id}>
                                            <TableCell className="font-medium">{player.id}. {player.name}</TableCell>
                                            <TableCell>{player.min}</TableCell>
                                            <TableCell>
                                                <StatButton value={player.g} onIncrement={() => handleStatChange(player.id, 'g', 1)} onDecrement={() => handleStatChange(player.id, 'g', -1)} />
                                            </TableCell>
                                             <TableCell>
                                                <StatButton value={player.a} onIncrement={() => handleStatChange(player.id, 'a', 1)} onDecrement={() => handleStatChange(player.id, 'a', -1)} />
                                            </TableCell>
                                             <TableCell>
                                                <StatButton value={player.fouls} onIncrement={() => handleStatChange(player.id, 'fouls', 1)} onDecrement={() => handleStatChange(player.id, 'fouls', -1)} />
                                            </TableCell>
                                             <TableCell>
                                                <StatButton value={player.t_puerta} onIncrement={() => handleStatChange(player.id, 't_puerta', 1)} onDecrement={() => handleStatChange(player.id, 't_puerta', -1)} />
                                            </TableCell>
                                             <TableCell>
                                                <StatButton value={player.t_fuera} onIncrement={() => handleStatChange(player.id, 't_fuera', 1)} onDecrement={() => handleStatChange(player.id, 't_fuera', -1)} />
                                            </TableCell>
                                             <TableCell>
                                                <StatButton value={player.recup} onIncrement={() => handleStatChange(player.id, 'recup', 1)} onDecrement={() => handleStatChange(player.id, 'recup', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.perdidas} onIncrement={() => handleStatChange(player.id, 'perdidas', 1)} onDecrement={() => handleStatChange(player.id, 'perdidas', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.paradas} onIncrement={() => handleStatChange(player.id, 'paradas', 1)} onDecrement={() => handleStatChange(player.id, 'paradas', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.gc} onIncrement={() => handleStatChange(player.id, 'gc', 1)} onDecrement={() => handleStatChange(player.id, 'gc', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.vs1} onIncrement={() => handleStatChange(player.id, 'vs1', 1)} onDecrement={() => handleStatChange(player.id, 'vs1', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.ta} onIncrement={() => handleStatChange(player.id, 'ta', 1)} onDecrement={() => handleStatChange(player.id, 'ta', -1)} />
                                            </TableCell>
                                            <TableCell>
                                                <StatButton value={player.tr} onIncrement={() => handleStatChange(player.id, 'tr', 1)} onDecrement={() => handleStatChange(player.id, 'tr', -1)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="team-b">
                 <Card>
                    <CardHeader>
                        <CardTitle>MARISTES ADEMAR CLUB ESPORTIU A - Estadísticas 1ª Parte</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center">Las estadísticas del equipo rival no están disponibles.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

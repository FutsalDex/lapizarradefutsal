
"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, RotateCcw, Play, Pause, Plus, Minus, TimerOff } from "lucide-react";
import Link from 'next/link';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { cn } from '@/lib/utils';


type PlayerStat = {
  id: number;
  name: string;
  timePlayed: number; // in seconds
  g: number;
  a: number;
  fouls: number;
  t_puerta: number;
  t_fuera: number;
  recup: number;
  perdidas: number;
  paradas: number;
  gc: number;
  vs1: number;
  ta: number;
  tr: number;
};

const initialPlayerStats: PlayerStat[] = [
    { id: 1, name: "Manel", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 2, t_fuera: 1, recup: 1, perdidas: 0, paradas: 2, gc: 1, vs1: 0, ta: 0, tr: 0 },
    { id: 2, name: "Marc Montoro", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 1, t_fuera: 2, recup: 1, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 5, name: "Dani", timePlayed: 0, g: 0, a: 1, fouls: 0, t_puerta: 1, t_fuera: 0, recup: 1, perdidas: 1, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 6, name: "Adam", timePlayed: 0, g: 2, a: 0, fouls: 1, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 7, name: "Hugo", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 1, t_fuera: 1, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 8, name: "Victor", timePlayed: 0, g: 0, a: 1, fouls: 1, t_puerta: 1, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 9, name: "Marc Romera", timePlayed: 0, g: 1, a: 0, fouls: 0, t_puerta: 1, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
];

const StatButton = ({ value, onIncrement, onDecrement }: { value: number, onIncrement: () => void, onDecrement: () => void }) => (
    <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDecrement} disabled={value <= 0}><Minus className="h-3 w-3"/></Button>
        <span className="w-4 text-center">{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onIncrement}><Plus className="h-3 w-3"/></Button>
    </div>
);


export default function EstadisticasPartidoPage() {
    const [teamFouls, setTeamFouls] = useState(3);
    const [opponentFouls, setOpponentFouls] = useState(4);
    const [playerStats, setPlayerStats] = useState<PlayerStat[]>(initialPlayerStats.map(p => ({...p, timePlayed: 0})));
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
    
    const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
    const [isActive, setIsActive] = useState(false);
    const [period, setPeriod] = useState('1ª Parte');

    const localTeamScore = playerStats.reduce((acc, player) => acc + player.g, 0);
    const opponentTeamScore = playerStats.reduce((acc, player) => acc + player.gc, 0);

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


    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
                setPlayerStats(prevStats => 
                    prevStats.map(player => 
                        selectedPlayerIds.has(player.id)
                            ? { ...player, timePlayed: player.timePlayed + 1 }
                            : player
                    )
                );
            }, 1000);
        } else {
            if(interval) clearInterval(interval);
        }
        return () => {
            if(interval) clearInterval(interval);
        };
    }, [isActive, time, selectedPlayerIds]);
    
    const toggleTimer = () => {
        setIsActive(!isActive);
    };

    const resetTimer = () => {
        setIsActive(false);
        setTime(25 * 60);
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const handleStatChange = (playerId: number, stat: keyof PlayerStat, delta: number) => {
        setPlayerStats(prevStats =>
            prevStats.map(player => {
                if (player.id === playerId) {
                    const currentVal = player[stat as keyof Omit<PlayerStat, 'name' | 'timePlayed'>] as number;
                    const newVal = Math.max(0, currentVal + delta);
                    return { ...player, [stat]: newVal };
                }
                return player;
            })
        );
    };
    
    const handleTeamFoulChange = (team: 'local' | 'opponent', delta: number) => {
        if (team === 'local') {
            setTeamFouls(prev => Math.max(0, Math.min(5, prev + delta)));
        } else {
            setOpponentFouls(prev => Math.max(0, Math.min(5, prev + delta)));
        }
    }
    
    const handlePlayerSelection = (playerId: number) => {
        setSelectedPlayerIds(prevIds => {
            const newIds = new Set(prevIds);
            if (newIds.has(playerId)) {
                newIds.delete(playerId);
            } else {
                if (newIds.size < 5) {
                    newIds.add(playerId);
                }
            }
            return newIds;
        });
    };
    
    const resetAll = () => {
        setPlayerStats(initialPlayerStats.map(p => ({...p, timePlayed: 0})));
        setTeamFouls(0);
        setOpponentFouls(0);
        resetTimer();
        setPeriod('1ª Parte');
        setSelectedPlayerIds(new Set());
    }

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
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive"><RotateCcw className="mr-2"/>Reiniciar Todo</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción reiniciará el temporizador, el marcador y todas las estadísticas a sus valores iniciales. No se puede deshacer.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={resetAll}>Sí, reiniciar</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </div>
        </div>

        <Card className="mb-8">
            <CardContent className="p-6">
                <div className="grid grid-cols-3 items-center text-center">
                    {/* Team A */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold">Juvenil B</h2>
                        <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleTeamFoulChange('local', -1)}>-</Button>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full ${i < teamFouls ? 'bg-red-500' : 'bg-muted'}`}></div>
                            ))}
                             <Button variant="outline" size="sm" onClick={() => handleTeamFoulChange('local', 1)}>+</Button>
                        </div>
                         <Button variant="outline" size="sm"><TimerOff className="mr-2"/>TM</Button>
                    </div>

                    {/* Score and Timer */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-primary">{localTeamScore} - {opponentTeamScore}</div>
                        <div className="text-6xl font-bold bg-gray-900 text-white p-4 rounded-lg">
                           {formatTime(time)}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={toggleTimer}>
                                {isActive ? <><Pause className="mr-2"/>Pausar</> : <><Play className="mr-2"/>Iniciar</>}
                            </Button>
                            <Button variant="outline" onClick={resetTimer}><RotateCcw className="mr-2"/>Reiniciar</Button>
                            <Button variant={period === '1ª Parte' ? 'secondary' : 'ghost'} onClick={() => setPeriod('1ª Parte')}>1ª Parte</Button>
                            <Button variant={period === '2ª Parte' ? 'secondary' : 'ghost'} onClick={() => setPeriod('2ª Parte')}>2ª Parte</Button>
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold truncate">MARISTES ADEMAR CLUB ESPORTI...</h2>
                         <div className="flex items-center gap-2">
                             <Button variant="outline" size="sm" onClick={() => handleTeamFoulChange('opponent', -1)}>-</Button>
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={`w-4 h-4 rounded-full ${i < opponentFouls ? 'bg-red-500' : 'bg-muted'}`}></div>
                            ))}
                             <Button variant="outline" size="sm" onClick={() => handleTeamFoulChange('opponent', 1)}>+</Button>
                        </div>
                        <Button variant="outline" size="sm"><TimerOff className="mr-2"/>TM</Button>
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
                        <CardTitle>Juvenil B - Estadísticas {period}</CardTitle>
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
                                        <TableRow 
                                            key={player.id} 
                                            onClick={() => handlePlayerSelection(player.id)}
                                            className={cn("cursor-pointer", {
                                                'bg-green-100/50 dark:bg-green-900/30 hover:bg-green-100/60 dark:hover:bg-green-900/40': selectedPlayerIds.has(player.id)
                                            })}
                                        >
                                            <TableCell className="font-medium">{player.id}. {player.name}</TableCell>
                                            <TableCell>{formatTime(player.timePlayed)}</TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.g} onIncrement={() => handleStatChange(player.id, 'g', 1)} onDecrement={() => handleStatChange(player.id, 'g', -1)} />
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.a} onIncrement={() => handleStatChange(player.id, 'a', 1)} onDecrement={() => handleStatChange(player.id, 'a', -1)} />
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.fouls} onIncrement={() => handleStatChange(player.id, 'fouls', 1)} onDecrement={() => handleStatChange(player.id, 'fouls', -1)} />
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.t_puerta} onIncrement={() => handleStatChange(player.id, 't_puerta', 1)} onDecrement={() => handleStatChange(player.id, 't_puerta', -1)} />
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.t_fuera} onIncrement={() => handleStatChange(player.id, 't_fuera', 1)} onDecrement={() => handleStatChange(player.id, 't_fuera', -1)} />
                                            </TableCell>
                                             <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.recup} onIncrement={() => handleStatChange(player.id, 'recup', 1)} onDecrement={() => handleStatChange(player.id, 'recup', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.perdidas} onIncrement={() => handleStatChange(player.id, 'perdidas', 1)} onDecrement={() => handleStatChange(player.id, 'perdidas', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.paradas} onIncrement={() => handleStatChange(player.id, 'paradas', 1)} onDecrement={() => handleStatChange(player.id, 'paradas', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.gc} onIncrement={() => handleStatChange(player.id, 'gc', 1)} onDecrement={() => handleStatChange(player.id, 'gc', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.vs1} onIncrement={() => handleStatChange(player.id, 'vs1', 1)} onDecrement={() => handleStatChange(player.id, 'vs1', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.ta} onIncrement={() => handleStatChange(player.id, 'ta', 1)} onDecrement={() => handleStatChange(player.id, 'ta', -1)} />
                                            </TableCell>
                                            <TableCell onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.tr} onIncrement={() => handleStatChange(player.id, 'tr', 1)} onDecrement={() => handleStatChange(player.id, 'tr', -1)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted/50 font-bold">
                                        <TableCell>Total {period}</TableCell>
                                        <TableCell></TableCell> {/* Empty for Min */}
                                        <TableCell className="text-center">{totals.g}</TableCell>
                                        <TableCell className="text-center">{totals.a}</TableCell>
                                        <TableCell className="text-center">{totals.fouls}</TableCell>
                                        <TableCell className="text-center">{totals.t_puerta}</TableCell>
                                        <TableCell className="text-center">{totals.t_fuera}</TableCell>
                                        <TableCell className="text-center">{totals.recup}</TableCell>
                                        <TableCell className="text-center">{totals.perdidas}</TableCell>
                                        <TableCell className="text-center">{totals.paradas}</TableCell>
                                        <TableCell className="text-center">{totals.gc}</TableCell>
                                        <TableCell className="text-center">{totals.vs1}</TableCell>
                                        <TableCell className="text-center">{totals.ta}</TableCell>
                                        <TableCell className="text-center">{totals.tr}</TableCell>
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
                        <div><span className="font-semibold text-foreground">Min:</span> Minutos (Total Partido)</div>
                        <div><span className="font-semibold text-foreground">G:</span> Goles</div>
                        <div><span className="font-semibold text-foreground">A:</span> Asistencias</div>
                        <div><span className="font-semibold text-foreground">TA:</span> T. Amarilla</div>
                        <div><span className="font-semibold text-foreground">TR:</span> T. Roja</div>
                        <div><span className="font-semibold text-foreground">Faltas:</span> Faltas</div>
                        <div><span className="font-semibold text-foreground">T. Puerta:</span> Tiros a Puerta</div>
                        <div><span className="font-semibold text-foreground">T. Fuera:</span> Tiros Fuera</div>
                        <div><span className="font-semibold text-foreground">Recup:</span> Recuperaciones</div>
                        <div><span className="font-semibold text-foreground">Perdidas:</span> Perdidas</div>
                        <div><span className="font-semibold text-foreground">Paradas:</span> Paradas</div>
                        <div><span className="font-semibold text-foreground">GC:</span> Goles en Contra</div>
                        <div><span className="font-semibold text-foreground">1vs1:</span> Duelos 1vs1 ganados</div>
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="team-b">
                 <Card>
                    <CardHeader>
                        <CardTitle>MARISTES ADEMAR CLUB ESPORTIU A - Estadísticas {period}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground text-center">Las estadísticas del equipo rival no están disponibles.</p>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );

    

    
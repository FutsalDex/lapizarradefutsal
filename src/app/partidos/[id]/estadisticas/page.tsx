

"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, RotateCcw, Play, Pause, Plus, Minus, Flag, ShieldAlert, Target, RefreshCw, XCircle, Goal, ArrowRightLeft } from "lucide-react";
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
import { useToast } from '@/hooks/use-toast';


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
    { id: 1, name: "Manel", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 2, name: "Marc Montoro", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 5, name: "Dani", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 6, name: "Adam", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 7, name: "Hugo", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 8, name: "Victor", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
    { id: 9, name: "Marc Romera", timePlayed: 0, g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0 },
];

const StatButton = ({ value, onIncrement, onDecrement }: { value: number, onIncrement: () => void, onDecrement: () => void }) => (
    <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDecrement} disabled={value <= 0}><Minus className="h-3 w-3"/></Button>
        <span className="w-4 text-center">{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onIncrement}><Plus className="h-3 w-3"/></Button>
    </div>
);

type OpponentStats = {
    goles: number;
    tirosPuerta: number;
    tirosFuera: number;
    faltas: number;
    recuperaciones: number;
    perdidas: number;
}

const getInitialOpponentStats = (): OpponentStats => ({
    goles: 0,
    tirosPuerta: 0,
    tirosFuera: 0,
    faltas: 0,
    recuperaciones: 0,
    perdidas: 0,
});

const getInitialPlayerStats = (): PlayerStat[] => 
    initialPlayerStats.map(p => ({
        ...p,
        timePlayed: 0,
        g: 0, a: 0, fouls: 0, t_puerta: 0, t_fuera: 0, recup: 0, perdidas: 0, paradas: 0, gc: 0, vs1: 0, ta: 0, tr: 0
    }));


const OpponentStatCounter = ({ title, value, onIncrement, onDecrement, icon }: { title: string; value: number; onIncrement: () => void; onDecrement: () => void; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onDecrement} disabled={value <= 0}>
                <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center text-lg font-bold">{value}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onIncrement}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

type Period = '1ª Parte' | '2ª Parte';

type PeriodStats = {
    playerStats: PlayerStat[];
    opponentStats: OpponentStats;
    localTimeoutTaken: boolean;
    opponentTimeoutTaken: boolean;
}

export default function EstadisticasPartidoPage() {
    const { toast } = useToast();
    const [period, setPeriod] = useState<Period>('1ª Parte');

    const [stats, setStats] = useState<Record<Period, PeriodStats>>({
        '1ª Parte': {
            playerStats: getInitialPlayerStats(),
            opponentStats: getInitialOpponentStats(),
            localTimeoutTaken: false,
            opponentTimeoutTaken: false,
        },
        '2ª Parte': {
            playerStats: getInitialPlayerStats(),
            opponentStats: getInitialOpponentStats(),
            localTimeoutTaken: false,
            opponentTimeoutTaken: false,
        }
    });
    
    // States for the current period
    const [playerStats, setPlayerStats] = useState<PlayerStat[]>(stats[period].playerStats);
    const [opponentStats, setOpponentStats] = useState<OpponentStats>(stats[period].opponentStats);
    const [localTimeoutTaken, setLocalTimeoutTaken] = useState<boolean>(stats[period].localTimeoutTaken);
    const [opponentTimeoutTaken, setOpponentTimeoutTaken] = useState<boolean>(stats[period].opponentTimeoutTaken);
    
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<number>>(new Set());
    const [time, setTime] = useState(25 * 60); // 25 minutes in seconds
    const [isActive, setIsActive] = useState(false);

    
    const saveStats = useCallback((auto = false) => {
        setStats(prev => ({
            ...prev,
            [period]: { playerStats, opponentStats, localTimeoutTaken, opponentTimeoutTaken }
        }));
        if (!auto) {
            toast({
                title: "Estadísticas guardadas",
                description: "Las estadísticas del partido se han guardado correctamente.",
            });
        }
    }, [period, playerStats, opponentStats, localTimeoutTaken, opponentTimeoutTaken, toast]);
    
    useEffect(() => {
        const autoSaveInterval = setInterval(() => {
          saveStats(true);
          toast({
            title: "Autoguardado",
            description: "Las estadísticas se han guardado automáticamente.",
          });
        }, 5000); 
        return () => clearInterval(autoSaveInterval);
    }, [saveStats, toast]);
    
    // Effect to update current period stats when period or the main stats object changes
    useEffect(() => {
        const newPeriodStats = stats[period];
        setPlayerStats(newPeriodStats.playerStats);
        setOpponentStats(newPeriodStats.opponentStats);
        setLocalTimeoutTaken(newPeriodStats.localTimeoutTaken);
        setOpponentTimeoutTaken(newPeriodStats.opponentTimeoutTaken);
        
        setIsActive(false);
        setTime(25 * 60);
        setSelectedPlayerIds(new Set());
    }, [period, stats]);

    // Save current stats before changing period
    const handlePeriodChange = (newPeriod: Period) => {
        if (period === newPeriod) return;

        // Save current period's data into the main state
        setStats(prev => ({
            ...prev,
            [period]: { playerStats, opponentStats, localTimeoutTaken, opponentTimeoutTaken }
        }));
        // Switch to the new period
        setPeriod(newPeriod);
    };

    const handleOpponentStatChange = (stat: keyof OpponentStats, delta: number) => {
        setOpponentStats(prev => {
            const newValue = Math.max(0, prev[stat] + delta);
            return { ...prev, [stat]: newValue };
        });
    };

    const totalLocalScore = stats['1ª Parte'].playerStats.reduce((acc, p) => acc + p.g, 0) + (period === '2ª Parte' ? playerStats.reduce((acc, p) => acc + p.g, 0) : 0);
    const totalOpponentScore = stats['1ª Parte'].opponentStats.goles + (period === '2ª Parte' ? opponentStats.goles : 0);
    
    const teamFouls = playerStats.reduce((acc, player) => acc + player.fouls, 0);
    const opponentTeamFouls = opponentStats.faltas;

    const handleTimeout = (team: 'local' | 'opponent') => {
        if (team === 'local') setLocalTimeoutTaken(!localTimeoutTaken);
        else setOpponentTimeoutTaken(!opponentTimeoutTaken);
    };


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
        } else if (!isActive && time !== 0) {
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
        const updatedStats = playerStats.map(player => {
            if (player.id === playerId) {
                const currentVal = player[stat as keyof Omit<PlayerStat, 'name' | 'timePlayed'>] as number;
                const newVal = Math.max(0, currentVal + delta);
                return { ...player, [stat]: newVal };
            }
            return player;
        });
        setPlayerStats(updatedStats);
    };
    
    
    const handlePlayerSelection = (playerId: number) => {
        const newIds = new Set(selectedPlayerIds);
        if (newIds.has(playerId)) {
            newIds.delete(playerId);
        } else {
            if (newIds.size >= 5) {
                toast({
                    variant: "destructive",
                    title: "Límite alcanzado",
                    description: "Solo puedes seleccionar 5 jugadores a la vez.",
                });
                return; // Do not modify the set
            }
            newIds.add(playerId);
        }
        setSelectedPlayerIds(newIds);
    };
    
    const finishGame = () => {
        saveStats(true);
        alert("Partido Finalizado. (Lógica de guardado pendiente)");
        setIsActive(false);
    }
    
    const handleOpponentGoalChange = (delta: number) => {
        const newGoals = Math.max(0, opponentStats.goles + delta);
        const updatedOpponentStats = { ...opponentStats, goles: newGoals };
        setOpponentStats(updatedOpponentStats);
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
                <Button onClick={() => saveStats()}><Save className="mr-2"/>Guardar</Button>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive"><Flag className="mr-2"/>Finalizar</Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Finalizar partido?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción detendrá el cronómetro y guardará el estado final del partido. No podrás volver a editarlo.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={finishGame}>Sí, finalizar</AlertDialogAction>
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
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < teamFouls ? 'bg-destructive' : '')}></div>
                            ))}
                        </div>
                         <Button variant={localTimeoutTaken ? "default" : "outline"} className={cn({"bg-green-500 hover:bg-green-600 text-white": localTimeoutTaken})} size="sm" onClick={() => handleTimeout('local')}>TM</Button>
                    </div>

                    {/* Score and Timer */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-primary">{totalLocalScore} - {totalOpponentScore}</div>
                        <div className="text-6xl font-bold bg-gray-900 text-white p-4 rounded-lg">
                           {formatTime(time)}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={toggleTimer}>
                                {isActive ? <><Pause className="mr-2"/>Pausar</> : <><Play className="mr-2"/>Iniciar</>}
                            </Button>
                            <Button variant="outline" onClick={resetTimer}><RotateCcw className="mr-2"/>Reiniciar</Button>
                            <Button variant={period === '1ª Parte' ? 'secondary' : 'ghost'} onClick={() => handlePeriodChange('1ª Parte')}>1ª Parte</Button>
                            <Button variant={period === '2ª Parte' ? 'secondary' : 'ghost'} onClick={() => handlePeriodChange('2ª Parte')}>2ª Parte</Button>
                        </div>
                    </div>

                    {/* Team B */}
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold truncate">FS Vencedores</h2>
                         <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < opponentTeamFouls ? 'bg-destructive' : '')}></div>
                            ))}
                        </div>
                        <Button variant={opponentTimeoutTaken ? "default" : "outline"} className={cn({"bg-green-500 hover:bg-green-600 text-white": opponentTimeoutTaken})} size="sm" onClick={() => handleTimeout('opponent')}>TM</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue="team-a" value="team-a">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="team-a">Juvenil B</TabsTrigger>
                <TabsTrigger value="team-b">FS Vencedores</TabsTrigger>
            </TabsList>
            <TabsContent value="team-a">
                <Card>
                    <CardHeader>
                        <CardTitle>Juvenil B - Estadísticas {period}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <Table className="text-xs">
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="sticky left-0 bg-card min-w-[150px] p-2 text-center">Jugador</TableHead>
                                        <TableHead className="p-2 text-center">Min</TableHead>
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
                                        <TableRow 
                                            key={player.id} 
                                            onClick={() => handlePlayerSelection(player.id)}
                                            className={cn("cursor-pointer", {
                                                'bg-green-100/50 dark:bg-green-900/30 hover:bg-green-100/60 dark:hover:bg-green-900/40': selectedPlayerIds.has(player.id)
                                            })}
                                        >
                                            <TableCell className={cn(
                                                "sticky left-0 p-2 min-w-[150px]", 
                                                selectedPlayerIds.has(player.id) 
                                                    ? "bg-green-100/50 dark:bg-green-900/30 font-bold" 
                                                    : "bg-card font-medium"
                                            )}>{player.id}. {player.name}</TableCell>
                                            <TableCell className="p-2 text-center">{formatTime(player.timePlayed)}</TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.g} onIncrement={() => handleStatChange(player.id, 'g', 1)} onDecrement={() => handleStatChange(player.id, 'g', -1)} />
                                            </TableCell>
                                             <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.a} onIncrement={() => handleStatChange(player.id, 'a', 1)} onDecrement={() => handleStatChange(player.id, 'a', -1)} />
                                            </TableCell>
                                             <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.fouls} onIncrement={() => handleStatChange(player.id, 'fouls', 1)} onDecrement={() => handleStatChange(player.id, 'fouls', -1)} />
                                            </TableCell>
                                             <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.t_puerta} onIncrement={() => handleStatChange(player.id, 't_puerta', 1)} onDecrement={() => handleStatChange(player.id, 't_puerta', -1)} />
                                            </TableCell>
                                             <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.t_fuera} onIncrement={() => handleStatChange(player.id, 't_fuera', 1)} onDecrement={() => handleStatChange(player.id, 't_fuera', -1)} />
                                            </TableCell>
                                             <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.recup} onIncrement={() => handleStatChange(player.id, 'recup', 1)} onDecrement={() => handleStatChange(player.id, 'recup', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.perdidas} onIncrement={() => handleStatChange(player.id, 'perdidas', 1)} onDecrement={() => handleStatChange(player.id, 'perdidas', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.paradas} onIncrement={() => handleStatChange(player.id, 'paradas', 1)} onDecrement={() => handleStatChange(player.id, 'paradas', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.gc} onIncrement={() => handleStatChange(player.id, 'gc', 1)} onDecrement={() => handleStatChange(player.id, 'gc', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.vs1} onIncrement={() => handleStatChange(player.id, 'vs1', 1)} onDecrement={() => handleStatChange(player.id, 'vs1', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.ta} onIncrement={() => handleStatChange(player.id, 'ta', 1)} onDecrement={() => handleStatChange(player.id, 'ta', -1)} />
                                            </TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}>
                                                <StatButton value={player.tr} onIncrement={() => handleStatChange(player.id, 'tr', 1)} onDecrement={() => handleStatChange(player.id, 'tr', -1)} />
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                     <TableRow>
                                        <TableHead className="sticky left-0 bg-card min-w-[150px] p-2 text-center">Jugador</TableHead>
                                        <TableHead className="p-2 text-center">Min</TableHead>
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
                                    <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                        <TableCell className="sticky left-0 bg-muted/50 min-w-[150px] p-2">Total {period}</TableCell>
                                        <TableCell className="p-2"></TableCell>
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
                        <CardTitle>Estadísticas del Rival - FS Vencedores ({period})</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                           <OpponentStatCounter 
                                title="Goles"
                                value={opponentStats.goles}
                                onIncrement={() => handleOpponentGoalChange(1)}
                                onDecrement={() => handleOpponentGoalChange(-1)}
                                icon={<Goal className="text-muted-foreground" />}
                           />
                           <OpponentStatCounter 
                                title="Tiros a Puerta"
                                value={opponentStats.tirosPuerta}
                                onIncrement={() => handleOpponentStatChange('tirosPuerta', 1)}
                                onDecrement={() => handleOpponentStatChange('tirosPuerta', -1)}
                                icon={<Target className="text-muted-foreground" />}
                           />
                           <OpponentStatCounter 
                                title="Tiros Fuera"
                                value={opponentStats.tirosFuera}
                                onIncrement={() => handleOpponentStatChange('tirosFuera', 1)}
                                onDecrement={() => handleOpponentStatChange('tirosFuera', -1)}
                                icon={<XCircle className="text-muted-foreground" />}
                           />
                           <OpponentStatCounter 
                                title="Faltas"
                                value={opponentStats.faltas}
                                onIncrement={() => handleOpponentStatChange('faltas', 1)}
                                onDecrement={() => handleOpponentStatChange('faltas', -1)}
                                icon={<ShieldAlert className="text-muted-foreground" />}
                           />
                           <OpponentStatCounter 
                                title="Recuperaciones"
                                value={opponentStats.recuperaciones}
                                onIncrement={() => handleOpponentStatChange('recuperaciones', 1)}
                                onDecrement={() => handleOpponentStatChange('recuperaciones', -1)}
                                icon={<RefreshCw className="text-muted-foreground" />}
                           />
                           <OpponentStatCounter 
                                title="Pérdidas"
                                value={opponentStats.perdidas}
                                onIncrement={() => handleOpponentStatChange('perdidas', 1)}
                                onDecrement={() => handleOpponentStatChange('perdidas', -1)}
                                icon={<ArrowRightLeft className="text-muted-foreground" />}
                           />
                        </div>
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}


    
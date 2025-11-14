
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useDocumentData, useCollection } from 'react-firebase-hooks/firestore';
import { doc, updateDoc, collection, query } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Save, Play, Pause, Plus, Minus, Flag, ShieldAlert, Target, RefreshCw, XCircle, Goal, ArrowRightLeft, Lock, Unlock, Loader2 } from "lucide-react";
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
import { Skeleton } from '@/components/ui/skeleton';

type Player = {
  id: string;
  name: string;
  number: string;
}

type PlayerStat = {
  minutesPlayed: number;
  goals: number;
  assists: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  recoveries: number;
  turnovers: number;
  saves: number;
  goalsConceded: number;
  unoVsUno: number;
  yellowCards: number;
  redCards: number;
};

const getInitialPlayerStat = (): PlayerStat => ({
  minutesPlayed: 0, goals: 0, assists: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0,
  recoveries: 0, turnovers: 0, saves: 0, goalsConceded: 0, unoVsUno: 0, yellowCards: 0, redCards: 0,
});

type OpponentStats = {
    goals: number;
    shotsOnTarget: number;
    shotsOffTarget: number;
    fouls: number;
    recoveries: number;
    turnovers: number;
    yellowCards: number;
    redCards: number;
}

const getInitialOpponentStats = (): OpponentStats => ({
    goals: 0, shotsOnTarget: 0, shotsOffTarget: 0, fouls: 0,
    recoveries: 0, turnovers: 0, yellowCards: 0, redCards: 0,
});

const StatButton = ({ value, onIncrement, onDecrement, disabled }: { value: number, onIncrement: () => void, onDecrement: () => void, disabled: boolean }) => (
    <div className="flex items-center justify-center gap-1">
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onDecrement} disabled={value <= 0 || disabled}><Minus className="h-3 w-3"/></Button>
        <span className="w-4 text-center">{value}</span>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onIncrement} disabled={disabled}><Plus className="h-3 w-3"/></Button>
    </div>
);

const OpponentStatCounter = ({ title, value, onIncrement, onDecrement, icon, disabled }: { title: string; value: number; onIncrement: () => void; onDecrement: () => void; icon: React.ReactNode, disabled: boolean }) => (
    <div className="flex items-center justify-between rounded-lg border p-3 bg-card">
        <div className="flex items-center gap-2">
            {icon}
            <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onDecrement} disabled={value <= 0 || disabled}>
                <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center text-lg font-bold">{value}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onIncrement} disabled={disabled}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

type Period = '1H' | '2H';

export default function EstadisticasPartidoPage() {
    const { toast } = useToast();
    const params = useParams();
    const matchId = params.id as string;
    
    const [match, loadingMatch, errorMatch] = useDocumentData(doc(db, "matches", matchId));
    const [playersSnapshot, loadingPlayers] = useCollection(match ? query(collection(db, `teams/${match.teamId}/players`)) : null);

    const [activePlayers, setActivePlayers] = useState<Player[]>([]);

    const [period, setPeriod] = useState<Period>('1H');
    const [isFinished, setIsFinished] = useState(match?.isFinished || false);

    const [playerStats, setPlayerStats] = useState<Record<string, PlayerStat>>({});
    const [opponentStats, setOpponentStats] = useState<OpponentStats>(getInitialOpponentStats());
    const [localTimeoutTaken, setLocalTimeoutTaken] = useState(false);
    const [opponentTimeoutTaken, setOpponentTimeoutTaken] = useState(false);
    
    const [selectedPlayerIds, setSelectedPlayerIds] = useState<Set<string>>(new Set());
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Populate squad players
    useEffect(() => {
        if(match && playersSnapshot) {
            const squadPlayerIds = new Set(match.squad || []);
            const squadPlayers = playersSnapshot.docs
                .map(doc => ({id: doc.id, ...doc.data() } as Player))
                .filter(p => squadPlayerIds.has(p.id))
                .sort((a, b) => Number(a.number) - Number(b.number));
            setActivePlayers(squadPlayers);
        }
    }, [match, playersSnapshot]);
    
    // Load data from match document when it loads or period changes
    useEffect(() => {
        if (match) {
            setIsFinished(match.isFinished);
            const currentPeriodPlayerStats = match.playerStats?.[period] || {};
            const fullPlayerStats: Record<string, PlayerStat> = {};
            activePlayers.forEach(p => {
                fullPlayerStats[p.id] = { ...getInitialPlayerStat(), ...currentPeriodPlayerStats[p.id] };
            });

            setPlayerStats(fullPlayerStats);
            setOpponentStats(match.opponentStats?.[period] || getInitialOpponentStats());
            setLocalTimeoutTaken(match.timeouts?.[period]?.local || false);
            setOpponentTimeoutTaken(match.timeouts?.[period]?.visitor || false);

            setIsActive(false);
            setTime(25 * 60);
            setSelectedPlayerIds(new Set());
        }
    }, [match, period, activePlayers]);


    const saveStats = useCallback(async (auto = false) => {
        if (!match) return;
        if (!auto) setIsSaving(true);
        
        const updateData = {
            [`playerStats.${period}`]: playerStats,
            [`opponentStats.${period}`]: opponentStats,
            [`timeouts.${period}.local`]: localTimeoutTaken,
            [`timeouts.${period}.visitor`]: opponentTimeoutTaken,
            isFinished,
        };

        try {
            await updateDoc(doc(db, "matches", matchId), updateData);
            if (!auto) {
                toast({
                    title: "Estadísticas guardadas",
                    description: "Los cambios se han guardado en Firestore.",
                });
            }
        } catch (error: any) {
            if (!auto) {
                toast({ variant: 'destructive', title: 'Error al guardar', description: error.message });
            }
        } finally {
            if (!auto) setIsSaving(false);
        }
    }, [match, period, playerStats, opponentStats, localTimeoutTaken, opponentTimeoutTaken, isFinished, matchId, toast]);
    
    const handlePeriodChange = (newPeriod: string) => {
        if (period === newPeriod) return;
        saveStats(true); // Auto-save before switching
        setPeriod(newPeriod as Period);
    };

    const handleOpponentStatChange = (stat: keyof OpponentStats, delta: number) => {
        setOpponentStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + delta);
            return { ...prev, [stat]: newValue };
        });
    };

    const totalLocalScore = (match?.localScore || 0);
    const totalOpponentScore = (match?.visitorScore || 0);

    const teamFouls = Object.values(playerStats).reduce((acc, player) => acc + player.fouls, 0);
    const opponentTeamFouls = opponentStats.fouls;

    const handleTimeout = (team: 'local' | 'opponent') => {
        if (team === 'local') {
            setLocalTimeoutTaken(true);
        } else {
            setOpponentTimeoutTaken(true);
        }
    };


    const totals = Object.values(playerStats).reduce((acc, player) => {
        acc.goals += player.goals;
        acc.assists += player.assists;
        acc.fouls += player.fouls;
        // ... sum other stats
        return acc;
    }, { goals: 0, assists: 0, fouls: 0 });


    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
                setPlayerStats(prevStats => {
                    const newStats = {...prevStats};
                    selectedPlayerIds.forEach(id => {
                        if(newStats[id]) {
                            newStats[id] = { ...newStats[id], minutesPlayed: newStats[id].minutesPlayed + 1 }
                        }
                    });
                    return newStats;
                });
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
        }
        return () => {
            if(interval) clearInterval(interval);
        };
    }, [isActive, time, selectedPlayerIds]);
    
    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTime(25 * 60);
    };
    
    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };
    
    const handleStatChange = (playerId: string, stat: keyof PlayerStat, delta: number) => {
        setPlayerStats(prev => {
            const playerStat = prev[playerId];
            if (!playerStat) return prev;
            const currentVal = playerStat[stat as keyof Omit<PlayerStat, 'name' | 'timePlayed'>] as number;
            const newVal = Math.max(0, currentVal + delta);
            return {
                ...prev,
                [playerId]: { ...playerStat, [stat]: newVal }
            };
        });
    };
    
    const handlePlayerSelection = (playerId: string) => {
        if (isFinished) return;
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
                return;
            }
            newIds.add(playerId);
        }
        setSelectedPlayerIds(newIds);
    };
    
    const finishGame = async () => {
        setIsFinished(true);
        setIsActive(false);
        await saveStats(true); // Final auto-save
        await updateDoc(doc(db, "matches", matchId), { isFinished: true });
        toast({ title: "Partido Finalizado" });
    }

    const reopenGame = async () => {
        setIsFinished(false);
        await updateDoc(doc(db, "matches", matchId), { isFinished: false });
        toast({ title: "Partido Reabierto" });
    }

    const isLoading = loadingMatch || loadingPlayers;

    if (isLoading) {
        return <div className="container mx-auto px-4 py-8"><Loader2 className="animate-spin" /> Cargando datos del partido...</div>
    }

    if (errorMatch) {
        return <p className="text-destructive">Error: {errorMatch.message}</p>
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
                <Button onClick={() => saveStats()} disabled={isSaving || isFinished}>
                    {isSaving ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                    Guardar
                </Button>
                {isFinished ? (
                     <Button variant="outline" onClick={reopenGame}><Unlock className="mr-2"/>Reabrir</Button>
                ) : (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="destructive"><Flag className="mr-2"/>Finalizar</Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>¿Finalizar partido?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta acción detendrá el cronómetro y guardará el estado final del partido. No podrás volver a editarlo hasta que lo reabras.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={finishGame}>Sí, finalizar</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                )}
            </div>
        </div>

        <Card className="mb-8">
            <CardContent className="p-6">
                <div className="grid grid-cols-3 items-center text-center">
                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold truncate">{match?.localTeam}</h2>
                        <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < teamFouls ? 'bg-destructive' : '')}></div>
                            ))}
                        </div>
                         <Button variant={localTimeoutTaken ? "default" : "outline"} className={cn({"bg-primary hover:bg-primary/90 text-primary-foreground": localTimeoutTaken})} size="sm" onClick={() => handleTimeout('local')} disabled={isFinished}>TM</Button>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <div className="text-6xl font-bold text-primary">{totalLocalScore} - {totalOpponentScore}</div>
                        <div className="text-6xl font-bold bg-gray-900 text-white p-4 rounded-lg">
                           {formatTime(time)}
                        </div>
                        <div className="flex gap-2">
                            <Button onClick={toggleTimer} disabled={isFinished}>
                                {isActive ? <><Pause className="mr-2"/>Pausar</> : <><Play className="mr-2"/>Iniciar</>}
                            </Button>
                            <Button variant="outline" onClick={resetTimer} disabled={isFinished}><RefreshCw className="mr-2"/>Reiniciar</Button>
                            <Button variant={period === '1H' ? 'secondary' : 'ghost'} onClick={() => handlePeriodChange('1H')}>1ª Parte</Button>
                            <Button variant={period === '2H' ? 'secondary' : 'ghost'} onClick={() => handlePeriodChange('2H')}>2ª Parte</Button>
                        </div>
                    </div>

                    <div className="flex flex-col items-center gap-4">
                        <h2 className="text-2xl font-bold truncate">{match?.visitorTeam}</h2>
                         <div className="flex items-center gap-2">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < opponentTeamFouls ? 'bg-destructive' : '')}></div>
                            ))}
                        </div>
                        <Button variant={opponentTimeoutTaken ? "default" : "outline"} className={cn({"bg-primary hover:bg-primary/90 text-primary-foreground": opponentTimeoutTaken})} size="sm" onClick={() => handleTimeout('opponent')} disabled={isFinished}>TM</Button>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Tabs defaultValue={match?.localTeam === "Juvenil B" ? "team-a" : "team-b"}>
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="team-a">{match?.localTeam}</TabsTrigger>
                <TabsTrigger value="team-b">{match?.visitorTeam}</TabsTrigger>
            </TabsList>
            <TabsContent value="team-a">
                <Card>
                    <CardHeader>
                        <CardTitle>{match?.localTeam} - Estadísticas {period}</CardTitle>
                    </CardHeader>
                    <CardContent>
                    {match?.localTeam === "Juvenil B" ? (
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
                                    {activePlayers.map((player) => (
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
                                            )}>{player.number}. {player.name}</TableCell>
                                            <TableCell className="p-2 text-center">{formatTime(playerStats[player.id]?.minutesPlayed || 0)}</TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.goals || 0} onIncrement={() => handleStatChange(player.id, 'goals', 1)} onDecrement={() => handleStatChange(player.id, 'goals', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.assists || 0} onIncrement={() => handleStatChange(player.id, 'assists', 1)} onDecrement={() => handleStatChange(player.id, 'assists', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.fouls || 0} onIncrement={() => handleStatChange(player.id, 'fouls', 1)} onDecrement={() => handleStatChange(player.id, 'fouls', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.shotsOnTarget || 0} onIncrement={() => handleStatChange(player.id, 'shotsOnTarget', 1)} onDecrement={() => handleStatChange(player.id, 'shotsOnTarget', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.shotsOffTarget || 0} onIncrement={() => handleStatChange(player.id, 'shotsOffTarget', 1)} onDecrement={() => handleStatChange(player.id, 'shotsOffTarget', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.recoveries || 0} onIncrement={() => handleStatChange(player.id, 'recoveries', 1)} onDecrement={() => handleStatChange(player.id, 'recoveries', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.turnovers || 0} onIncrement={() => handleStatChange(player.id, 'turnovers', 1)} onDecrement={() => handleStatChange(player.id, 'turnovers', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.saves || 0} onIncrement={() => handleStatChange(player.id, 'saves', 1)} onDecrement={() => handleStatChange(player.id, 'saves', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.goalsConceded || 0} onIncrement={() => handleStatChange(player.id, 'goalsConceded', 1)} onDecrement={() => handleStatChange(player.id, 'goalsConceded', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.unoVsUno || 0} onIncrement={() => handleStatChange(player.id, 'unoVsUno', 1)} onDecrement={() => handleStatChange(player.id, 'unoVsUno', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.yellowCards || 0} onIncrement={() => handleStatChange(player.id, 'yellowCards', 1)} onDecrement={() => handleStatChange(player.id, 'yellowCards', -1)} disabled={isFinished} /></TableCell>
                                            <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.redCards || 0} onIncrement={() => handleStatChange(player.id, 'redCards', 1)} onDecrement={() => handleStatChange(player.id, 'redCards', -1)} disabled={isFinished} /></TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                                <TableFooter>
                                    <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                    </TableRow>
                                </TableFooter>
                            </Table>
                        </div>
                        ) : (
                             <OpponentStatCounters disabled={isFinished} opponentStats={opponentStats} handleOpponentStatChange={handleOpponentStatChange} />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
            <TabsContent value="team-b">
                <Card>
                    <CardHeader>
                        <CardTitle>{match?.visitorTeam} - Estadísticas {period}</CardTitle>
                    </CardHeader>
                    <CardContent>
                         {match?.visitorTeam === "Juvenil B" ? (
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
                                        {activePlayers.map((player) => (
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
                                                )}>{player.number}. {player.name}</TableCell>
                                                <TableCell className="p-2 text-center">{formatTime(playerStats[player.id]?.minutesPlayed || 0)}</TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.goals || 0} onIncrement={() => handleStatChange(player.id, 'goals', 1)} onDecrement={() => handleStatChange(player.id, 'goals', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.assists || 0} onIncrement={() => handleStatChange(player.id, 'assists', 1)} onDecrement={() => handleStatChange(player.id, 'assists', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.fouls || 0} onIncrement={() => handleStatChange(player.id, 'fouls', 1)} onDecrement={() => handleStatChange(player.id, 'fouls', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.shotsOnTarget || 0} onIncrement={() => handleStatChange(player.id, 'shotsOnTarget', 1)} onDecrement={() => handleStatChange(player.id, 'shotsOnTarget', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.shotsOffTarget || 0} onIncrement={() => handleStatChange(player.id, 'shotsOffTarget', 1)} onDecrement={() => handleStatChange(player.id, 'shotsOffTarget', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.recoveries || 0} onIncrement={() => handleStatChange(player.id, 'recoveries', 1)} onDecrement={() => handleStatChange(player.id, 'recoveries', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.turnovers || 0} onIncrement={() => handleStatChange(player.id, 'turnovers', 1)} onDecrement={() => handleStatChange(player.id, 'turnovers', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.saves || 0} onIncrement={() => handleStatChange(player.id, 'saves', 1)} onDecrement={() => handleStatChange(player.id, 'saves', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.goalsConceded || 0} onIncrement={() => handleStatChange(player.id, 'goalsConceded', 1)} onDecrement={() => handleStatChange(player.id, 'goalsConceded', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.unoVsUno || 0} onIncrement={() => handleStatChange(player.id, 'unoVsUno', 1)} onDecrement={() => handleStatChange(player.id, 'unoVsUno', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.yellowCards || 0} onIncrement={() => handleStatChange(player.id, 'yellowCards', 1)} onDecrement={() => handleStatChange(player.id, 'yellowCards', -1)} disabled={isFinished} /></TableCell>
                                                <TableCell className="p-2" onClick={(e) => e.stopPropagation()}><StatButton value={playerStats[player.id]?.redCards || 0} onIncrement={() => handleStatChange(player.id, 'redCards', 1)} onDecrement={() => handleStatChange(player.id, 'redCards', -1)} disabled={isFinished} /></TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                    <TableFooter>
                                        <TableRow className="bg-muted/50 font-bold hover:bg-muted/50">
                                        </TableRow>
                                    </TableFooter>
                                </Table>
                            </div>
                        ) : (
                            <OpponentStatCounters disabled={isFinished} opponentStats={opponentStats} handleOpponentStatChange={handleOpponentStatChange} />
                        )}
                    </CardContent>
                </Card>
            </TabsContent>
        </Tabs>
    </div>
  );
}

const OpponentStatCounters = ({ opponentStats, handleOpponentStatChange, disabled }: { opponentStats: OpponentStats, handleOpponentStatChange: (stat: keyof OpponentStats, delta: number) => void, disabled: boolean }) => (
    <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <OpponentStatCounter title="Goles" value={opponentStats.goals} onIncrement={() => handleOpponentStatChange('goals', 1)} onDecrement={() => handleOpponentStatChange('goals', -1)} icon={<Goal className="text-muted-foreground" />} disabled={disabled}/>
            <OpponentStatCounter title="Tiros a Puerta" value={opponentStats.shotsOnTarget} onIncrement={() => handleOpponentStatChange('shotsOnTarget', 1)} onDecrement={() => handleOpponentStatChange('shotsOnTarget', -1)} icon={<Target className="text-muted-foreground" />} disabled={disabled}/>
            <OpponentStatCounter title="Tiros Fuera" value={opponentStats.shotsOffTarget} onIncrement={() => handleOpponentStatChange('shotsOffTarget', 1)} onDecrement={() => handleOpponentStatChange('shotsOffTarget', -1)} icon={<XCircle className="text-muted-foreground" />} disabled={disabled}/>
            <OpponentStatCounter title="Faltas" value={opponentStats.fouls} onIncrement={() => handleOpponentStatChange('fouls', 1)} onDecrement={() => handleOpponentStatChange('fouls', -1)} icon={<ShieldAlert className="text-muted-foreground" />} disabled={disabled}/>
            <OpponentStatCounter title="Recuperaciones" value={opponentStats.recoveries} onIncrement={() => handleOpponentStatChange('recoveries', 1)} onDecrement={() => handleOpponentStatChange('recoveries', -1)} icon={<RefreshCw className="text-muted-foreground" />} disabled={disabled}/>
            <OpponentStatCounter title="Pérdidas" value={opponentStats.turnovers} onIncrement={() => handleOpponentStatChange('turnovers', 1)} onDecrement={() => handleOpponentStatChange('turnovers', -1)} icon={<ArrowRightLeft className="text-muted-foreground" />} disabled={disabled}/>
        </div>
    </div>
);

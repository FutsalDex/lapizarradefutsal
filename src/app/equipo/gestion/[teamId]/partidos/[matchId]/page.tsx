'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RefreshCw, Plus, Minus, Flag, Unlock, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import _ from 'lodash';

// ====================
// TYPES
// ====================
interface Player {
  id: string;
  name: string;
  number: string;
  // Stats
  goals: number;
  assists: number;
  foulsCommitted: number;
  foulsReceived: number;
  yellowCards: number;
  redCards: number;
  minutesPlayed: number;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  localFouls?: number;
  visitorFouls?: number;
  localTimeouts?: number;
  visitorTimeouts?: number;
  teamId: string;
  isFinished: boolean;
  squad?: string[];
  playerStats?: { [playerId: string]: Partial<Player> };
}

type Period = '1H' | '2H';

// ====================
// SCOREBOARD COMPONENT
// ====================
const FoulIndicator = ({ count }: { count: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-red-500", i < count ? "bg-red-500" : "bg-transparent")}/>
        ))}
    </div>
);


const Scoreboard = ({ match, onUpdate }: { match: Match; onUpdate: (data: Partial<Match>) => void }) => {
  const [time, setTime] = useState(20 * 60);
  const [isActive, setIsActive] = useState(false);
  const [period, setPeriod] = useState<Period>('1H');

  const { toast } = useToast();

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isActive && time > 0) {
      interval = setInterval(() => {
        setTime((prevTime) => prevTime - 1);
      }, 1000);
    } else if (time === 0) {
      setIsActive(false);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isActive, time]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const handleTimeout = (team: 'local' | 'visitor') => {
    const field = team === 'local' ? 'localTimeouts' : 'visitorTimeouts';
    const currentVal = match[field] || 0;
    if (currentVal < 1) { // Futsal has 1 timeout per half
        onUpdate({ [field]: currentVal + 1 });
        setTime(prev => Math.min(20 * 60, prev + 60)); // Add 60s, but don't exceed max time
        toast({title: `Tiempo muerto para ${team === 'local' ? match.localTeam : match.visitorTeam}`});
    }
  };
  
  const resetPeriod = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setTime(20 * 60);
    setIsActive(false);
    onUpdate({ localFouls: 0, visitorFouls: 0, localTimeouts: 0, visitorTimeouts: 0 });
    toast({ title: `Iniciada ${newPeriod === '1H' ? '1ª Parte' : '2ª Parte'}`})
  }

  const PeriodButton = ({ value, children }: { value: Period; children: React.ReactNode }) => (
    <Button
        onClick={() => resetPeriod(value)}
        variant={period === value ? "secondary" : "outline"}
        size="sm"
        className="text-xs px-4"
    >
        {children}
    </Button>
  );

  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-3 items-start text-center mb-4 gap-4">
            <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold truncate">{match.localTeam}</div>
                <FoulIndicator count={match.localFouls || 0} />
            </div>
            
            <div className="text-5xl md:text-7xl font-bold tabular-nums text-primary">
                {match.localScore} - {match.visitorScore}
            </div>

            <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold truncate">{match.visitorTeam}</div>
                <FoulIndicator count={match.visitorFouls || 0} />
            </div>
        </div>

        <div className="flex justify-center items-center gap-4 mb-4">
            <Button size="sm" variant="outline" onClick={() => handleTimeout('local')} disabled={(match.localTimeouts || 0) >= 1} className={cn("w-16", (match.localTimeouts || 0) >= 1 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>TM</Button>
            <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
                {formatTime(time)}
            </div>
            <Button size="sm" variant="outline" onClick={() => handleTimeout('visitor')} disabled={(match.visitorTimeouts || 0) >= 1} className={cn("w-16", (match.visitorTimeouts || 0) >= 1 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>TM</Button>
        </div>

        <div className="flex justify-center items-center gap-4">
            <Button onClick={() => setIsActive(!isActive)} variant={isActive ? "destructive" : "default"} size="sm" className={cn(!isActive && "bg-primary hover:bg-primary/90")}>
                {isActive ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                {isActive ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button onClick={() => resetPeriod(period)} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4"/> Reiniciar
            </Button>
            <div className="flex gap-2">
                <PeriodButton value="1H">1ª Parte</PeriodButton>
                <PeriodButton value="2H">2ª Parte</PeriodButton>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};


// ====================
// STATS TABLE COMPONENT
// ====================
const StatsTable = ({ teamName, players, match, onUpdate, isMyTeam }: { teamName: string, players: Player[], match: Match, onUpdate: (data: Partial<Match>) => void, isMyTeam: boolean }) => {
    const [activePlayerId, setActivePlayerId] = useState<string | null>(null);

    const handleStatChange = (playerId: string, stat: keyof Player, increment: boolean) => {
        const playerStats = match.playerStats?.[playerId] || {};
        let currentVal = (playerStats[stat] as number) || 0;
        let newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
        
        const updatedStats = _.cloneDeep(match.playerStats || {});
        _.set(updatedStats, `${playerId}.${stat}`, newVal);
        
        let scoreUpdate: Partial<Match> = {};
        if (stat === 'goals' && isMyTeam) {
             const scoreField = match.localTeam === teamName ? 'localScore' : 'visitorScore';
             const newScore = increment ? (match[scoreField] || 0) + 1 : Math.max(0, (match[scoreField] || 0) - 1);
             scoreUpdate[scoreField] = newScore;
        } else if (stat === 'goals' && !isMyTeam) {
             const scoreField = match.localTeam !== teamName ? 'localScore' : 'visitorScore';
             const newScore = increment ? (match[scoreField] || 0) + 1 : Math.max(0, (match[scoreField] || 0) - 1);
             scoreUpdate[scoreField] = newScore;
        }

        onUpdate({ playerStats: updatedStats, ...scoreUpdate });
    };

    const toggleActivePlayer = (playerId: string) => {
        setActivePlayerId(prevId => prevId === playerId ? null : playerId);
    }

    const StatButton = ({ stat, playerId }: { stat: keyof Player, playerId: string }) => (
        <div className="flex items-center gap-1 justify-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(playerId, stat, false)}><Minus className="h-4 w-4"/></Button>
            <span className="w-4 text-center tabular-nums">{((match.playerStats?.[playerId] as any)?.[stat] || 0)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(playerId, stat, true)}><Plus className="h-4 w-4"/></Button>
        </div>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>{teamName}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[150px]">Jugador</TableHead>
                                <TableHead className="text-center">Min</TableHead>
                                <TableHead className="text-center">G</TableHead>
                                <TableHead className="text-center">A</TableHead>
                                <TableHead className="text-center">FC</TableHead>
                                <TableHead className="text-center">FR</TableHead>
                                <TableHead className="text-center">TA</TableHead>
                                <TableHead className="text-center">TR</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                             {players.length > 0 ? players.map(player => {
                                const stats = match.playerStats?.[player.id] || {};
                                return (
                                    <TableRow key={player.id} className={cn(activePlayerId === player.id && "bg-primary/10")}>
                                        <TableCell>
                                            <Button variant="link" className="p-0 text-left h-auto text-foreground hover:no-underline" onClick={() => toggleActivePlayer(player.id)}>
                                                <span className="font-bold mr-2">{player.number}.</span>{player.name}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums">{stats.minutesPlayed || 0}</TableCell>
                                        <TableCell><StatButton stat="goals" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="assists" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="foulsCommitted" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="foulsReceived" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="yellowCards" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="redCards" playerId={player.id} /></TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={8} className="text-center h-24 text-muted-foreground">
                                        {isMyTeam ? "No hay jugadores convocados." : "Las estadísticas del rival no están disponibles."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            {isMyTeam && (
                <CardFooter>
                    <p className="text-xs text-muted-foreground">
                        <b>Leyenda:</b> <b>Min:</b> Minutos Jugados, <b>G:</b> Goles, <b>A:</b> Asistencias, <b>FC:</b> Faltas Cometidas, <b>FR:</b> Faltas Recibidas, <b>TA:</b> Tarjetas Amarillas, <b>TR:</b> Tarjetas Rojas.
                    </p>
                </CardFooter>
            )}
        </Card>
    );
};

// ====================
// MAIN PAGE COMPONENT
// ====================
export default function MatchStatsPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const matchId = typeof params.matchId === 'string' ? params.matchId : '';
  
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [localMatchData, setLocalMatchData] = useState<Match | null>(null);

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: remoteMatchData, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  useEffect(() => {
    if (remoteMatchData) {
      setLocalMatchData(remoteMatchData);
    }
  }, [remoteMatchData]);

  const debouncedUpdate = useCallback(_.debounce(async (data: Partial<Match>) => {
    if (!matchRef || remoteMatchData?.isFinished) return;
    await updateDoc(matchRef, data);
    toast({title: "Autoguardado", description: "Cambios guardados."});
  }, 2000), [matchRef, toast, remoteMatchData?.isFinished]);

  const handleUpdate = (data: Partial<Match>) => {
    if (localMatchData?.isFinished) return;
    setLocalMatchData(prev => {
        if (!prev) return null;
        const newState = { ...prev, ...data };
        debouncedUpdate(newState);
        return newState;
    });
  };

  const toggleMatchFinished = async () => {
    if (!matchRef || !localMatchData) return;
    debouncedUpdate.flush();
    const newStatus = !localMatchData.isFinished;
    const finalData = { isFinished: newStatus };
    await updateDoc(matchRef, finalData);
    toast({
        title: newStatus ? "Partido Finalizado" : "Partido Reabierto",
        description: `Las estadísticas ${newStatus ? 'finales han sido guardadas' : 'pueden ser editadas de nuevo'}.`
    });
  }

  const squadPlayers = useMemo(() => {
    if (!teamPlayers || !localMatchData?.squad) return [];
    const squadIds = new Set(localMatchData.squad);
    const filteredPlayers = teamPlayers.filter(p => squadIds.has(p.id));
    
    // Sort players by dorsal number (ascending)
    return filteredPlayers.sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);

        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        
        return numA - numB;
    });
  }, [teamPlayers, localMatchData?.squad]);

  const isLoading = isLoadingMatch || isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!localMatchData || !team) {
    return <div className="container mx-auto px-4 py-8 text-center">No se encontraron datos del partido o del equipo.</div>;
  }
  
  const myTeamName = team.name;
  const opponentTeamName = localMatchData.localTeam === myTeamName ? localMatchData.visitorTeam : localMatchData.localTeam;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                <ClipboardList /> Marcador y Estadísticas en Vivo
            </h1>
            <p className="text-muted-foreground">Gestiona el partido en tiempo real. Los cambios se guardan automáticamente.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver
            </Button>
            <Button onClick={toggleMatchFinished} variant={localMatchData.isFinished ? "outline" : "destructive"}>
                {localMatchData.isFinished 
                    ? <><Unlock className="mr-2 h-4 w-4"/> Reabrir Partido</> 
                    : <><Flag className="mr-2 h-4 w-4"/> Finalizar Partido</>
                }
            </Button>
        </div>
      </div>

      <Scoreboard match={localMatchData} onUpdate={handleUpdate} />

      <Tabs defaultValue="myTeam" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="myTeam">{myTeamName}</TabsTrigger>
            <TabsTrigger value="opponent">{opponentTeamName}</TabsTrigger>
        </TabsList>
        <TabsContent value="myTeam">
            <StatsTable 
                teamName={myTeamName}
                players={squadPlayers}
                match={localMatchData}
                onUpdate={handleUpdate}
                isMyTeam={true}
            />
        </TabsContent>
        <TabsContent value="opponent">
            <StatsTable 
                teamName={opponentTeamName}
                players={[]} // Opponent players not implemented
                match={localMatchData}
                onUpdate={handleUpdate}
                isMyTeam={false}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}

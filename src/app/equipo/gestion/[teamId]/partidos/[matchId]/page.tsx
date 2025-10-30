'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RefreshCw, Plus, Minus, Flag, Unlock, ClipboardList } from 'lucide-react';
import { cn } from '@/lib/utils';
import _ from 'lodash';

// ====================
// TYPES
// ====================
interface PlayerStats {
  id: string;
  name: string;
  number: string;
  // Stats
  goals: number;
  assists: number;
  yellowCards: number;
  redCards: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  recoveries: number;
  turnovers: number;
  saves: number;
  goalsConceded: number;
  minutesPlayed: number;
}
type Player = Omit<PlayerStats, 'id'> & { id: string };


interface OpponentStats {
  goals: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
}

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  localScore: number;
  visitorScore: number;
  teamId: string;
  isFinished: boolean;
  squad?: string[];
  playerStats?: { [playerId: string]: Partial<PlayerStats> };
  opponentStats?: Partial<OpponentStats>;
  fouls?: { local: number; visitor: number };
  timeouts?: { local: number; visitor: number };
}


// ====================
// HELPER FUNCTIONS
// ====================
const formatStatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};


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

const Scoreboard = ({
  match,
  time,
  isTimerActive,
  onTimerToggle,
  onTimeReset,
  onTimeout
}: {
  match: Match;
  time: number;
  isTimerActive: boolean;
  onTimerToggle: () => void;
  onTimeReset: () => void;
  onTimeout: (team: 'local' | 'visitor') => void;

}) => {

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  
  const localFouls = match.fouls?.local ?? 0;
  const visitorFouls = match.fouls?.visitor ?? 0;
  const localTimeouts = match.timeouts?.local ?? 0;
  const visitorTimeouts = match.timeouts?.visitor ?? 0;


  return (
    <Card>
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-3 items-start text-center mb-4 gap-4">
            <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold truncate">{match.localTeam}</div>
                 <FoulIndicator count={localFouls} />
            </div>
            
            <div className="text-5xl md:text-7xl font-bold tabular-nums text-primary">
                {match.localScore} - {match.visitorScore}
            </div>

            <div className="space-y-2">
                <div className="text-xl md:text-2xl font-bold truncate">{match.visitorTeam}</div>
                <FoulIndicator count={visitorFouls} />
            </div>
        </div>
        
        <div className="flex justify-center items-center gap-4 mb-4">
             <Button size="sm" variant="outline" onClick={() => onTimeout('local')} disabled={localTimeouts >= 2} className={cn("w-16 mx-auto", localTimeouts > 0 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                TM {localTimeouts > 0 && `(${localTimeouts})`}
             </Button>
             <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
                {formatTime(time)}
            </div>
            <Button size="sm" variant="outline" onClick={() => onTimeout('visitor')} disabled={visitorTimeouts >= 2} className={cn("w-16 mx-auto", visitorTimeouts > 0 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                TM {visitorTimeouts > 0 && `(${visitorTimeouts})`}
            </Button>
        </div>


        <div className="flex justify-center items-center gap-4">
            <Button onClick={onTimerToggle} variant="default" size="sm" className={cn(isTimerActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}>
                {isTimerActive ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                {isTimerActive ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button onClick={onTimeReset} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4"/> Reiniciar
            </Button>
        </div>
      </CardContent>
    </Card>
  );
};


// ====================
// STATS TABLE COMPONENT
// ====================
const StatsTable = ({ teamName, players, match, onUpdate, isMyTeam, onActivePlayersChange, activePlayerIds }: { teamName: string, players: Player[], match: Match, onUpdate: (data: Partial<Match>) => void, isMyTeam: boolean, onActivePlayersChange: (ids: string[]) => void, activePlayerIds: string[] }) => {
    const { toast } = useToast();

    const handleStatChange = (playerId: string, stat: keyof PlayerStats, increment: boolean) => {
        const playerStats = match.playerStats?.[playerId] || {};
        let currentVal = (playerStats[stat] as number) || 0;
        let newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
        
        const updatedStats = _.cloneDeep(match.playerStats || {});
        _.set(updatedStats, `${playerId}.${stat}`, newVal);
        
        let batchUpdate: Partial<Match> = { playerStats: updatedStats };
        const isLocalTeam = match.localTeam === teamName;
        const scoreField = isLocalTeam ? 'localScore' : 'visitorScore';
        
        if (stat === 'goals' && isMyTeam) {
             const scoreDiff = newVal - currentVal;
             const newScore = (match[scoreField] || 0) + scoreDiff;
             batchUpdate[scoreField] = newScore;
        }

        if (stat === 'fouls' && isMyTeam) {
             const foulDiff = newVal - currentVal;
             const currentFouls = match.fouls?.[isLocalTeam ? 'local' : 'visitor'] ?? 0;
             const newFouls = currentFouls + foulDiff;
             
             const updatedFouls = _.cloneDeep(match.fouls || {});
             _.set(updatedFouls, isLocalTeam ? 'local' : 'visitor', newFouls);
             batchUpdate.fouls = updatedFouls;
        }

        onUpdate(batchUpdate);
    };

    const toggleActivePlayer = (playerId: string) => {
        const newActiveIds = activePlayerIds.includes(playerId)
            ? activePlayerIds.filter(id => id !== playerId)
            : [...activePlayerIds, playerId];

        if (newActiveIds.length > 5) {
            toast({
                title: 'Límite alcanzado',
                description: 'Ya has seleccionado 5 jugadores.',
                variant: 'destructive',
            });
            return;
        }
        onActivePlayersChange(newActiveIds);
    }

     const totals = useMemo(() => {
        const initialTotals: Omit<PlayerStats, 'id' | 'name' | 'number'> = {
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0,
            shotsOnTarget: 0, shotsOffTarget: 0, recoveries: 0, turnovers: 0,
            saves: 0, goalsConceded: 0, minutesPlayed: 0
        };
        if (!players || !match.playerStats) return initialTotals;
        
        return players.reduce((acc, player) => {
            const stats = match.playerStats![player.id] || {};
            acc.goals += stats.goals || 0;
            acc.assists += stats.assists || 0;
            acc.yellowCards += stats.yellowCards || 0;
            acc.redCards += stats.redCards || 0;
            acc.fouls += stats.fouls || 0;
            acc.shotsOnTarget += stats.shotsOnTarget || 0;
            acc.shotsOffTarget += stats.shotsOffTarget || 0;
            acc.recoveries += stats.recoveries || 0;
            acc.turnovers += stats.turnovers || 0;
            acc.saves += stats.saves || 0;
            acc.goalsConceded += stats.goalsConceded || 0;
            acc.minutesPlayed += stats.minutesPlayed || 0;
            return acc;
        }, initialTotals);
    }, [players, match.playerStats]);

    const StatButton = ({ stat, playerId }: { stat: keyof PlayerStats, playerId: string }) => (
        <div className="flex items-center gap-1 justify-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(playerId, stat, false)}><Minus className="h-4 w-4"/></Button>
            <span className="w-4 text-center tabular-nums">{((match.playerStats?.[playerId] as any)?.[stat] || 0)}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(playerId, stat, true)}><Plus className="h-4 w-4"/></Button>
        </div>
    );
    
    const tableHeaders = (
        <TableRow>
            <TableHead className="w-[150px] px-2">Jugador</TableHead>
            <TableHead className="text-center px-1">Min</TableHead>
            <TableHead className="text-center px-1">G</TableHead>
            <TableHead className="text-center px-1">A</TableHead>
            <TableHead className="text-center px-1">Faltas</TableHead>
            <TableHead className="text-center px-1">T. Puerta</TableHead>
            <TableHead className="text-center px-1">T. Fuera</TableHead>
            <TableHead className="text-center px-1">Recup.</TableHead>
            <TableHead className="text-center px-1">Perdidas</TableHead>
            <TableHead className="text-center px-1">Paradas</TableHead>
            <TableHead className="text-center px-1">GC</TableHead>
            <TableHead className="text-center px-1">TA</TableHead>
            <TableHead className="text-center px-1">TR</TableHead>
        </TableRow>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>{teamName} - Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {tableHeaders}
                        </TableHeader>
                        <TableBody>
                             {players.length > 0 ? players.map(player => {
                                const stats = match.playerStats?.[player.id] || {};
                                return (
                                    <TableRow key={player.id} className={cn(activePlayerIds.includes(player.id) && "bg-primary/20 border-2 border-primary")}>
                                        <TableCell className="py-1 px-2">
                                            <Button variant="link" className="p-0 text-left h-auto text-foreground hover:no-underline" onClick={() => toggleActivePlayer(player.id)}>
                                                <span className="font-bold mr-2">{player.number}.</span>
                                                <span className='text-black'>{player.name}</span>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums py-1 px-1">{formatStatTime(stats.minutesPlayed || 0)}</TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="goals" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="assists" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="fouls" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="shotsOnTarget" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="shotsOffTarget" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="recoveries" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="turnovers" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="saves" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="goalsConceded" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="yellowCards" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="redCards" playerId={player.id} /></TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={13} className="text-center h-24 text-muted-foreground">
                                        {isMyTeam ? "No hay jugadores convocados." : "Las estadísticas del rival no están disponibles."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                         <TableFooter>
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell className="px-2">Total</TableCell>
                                <TableCell className="text-center tabular-nums py-1 px-1">{formatStatTime(totals.minutesPlayed)}</TableCell>
                                <TableCell className="text-center px-1">{totals.goals}</TableCell>
                                <TableCell className="text-center px-1">{totals.assists}</TableCell>
                                <TableCell className="text-center px-1">{totals.fouls}</TableCell>
                                <TableCell className="text-center px-1">{totals.shotsOnTarget}</TableCell>
                                <TableCell className="text-center px-1">{totals.shotsOffTarget}</TableCell>
                                <TableCell className="text-center px-1">{totals.recoveries}</TableCell>
                                <TableCell className="text-center px-1">{totals.turnovers}</TableCell>
                                <TableCell className="text-center px-1">{totals.saves}</TableCell>
                                <TableCell className="text-center px-1">{totals.goalsConceded}</TableCell>
                                <TableCell className="text-center px-1">{totals.yellowCards}</TableCell>
                                <TableCell className="text-center px-1">{totals.redCards}</TableCell>
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
            {isMyTeam && (
                <CardFooter>
                  <div className="w-full text-xs text-muted-foreground">
                      <b className="block mb-2">Leyenda:</b>
                      <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                          <div><b>Min:</b> Minutos</div>
                          <div><b>G:</b> Goles</div>
                          <div><b>A:</b> Asistencias</div>
                          <div><b>TA:</b> T. Amarilla</div>
                          <div><b>TR:</b> T. Roja</div>
                          <div><b>Faltas:</b> Faltas</div>
                          <div><b>T. Puerta:</b> Tiros a Puerta</div>
                          <div><b>T. Fuera:</b> Tiros Fuera</div>
                          <div><b>Recup:</b> Recuperaciones</div>
                          <div><b>Perdidas:</b> Perdidas</div>
                          <div><b>Paradas:</b> Paradas</div>
                          <div><b>GC:</b> Goles en Contra</div>
                      </div>
                  </div>
                </CardFooter>
            )}
        </Card>
    );
};

const OpponentStatsTable = ({ teamName, match, onUpdate }: { teamName: string, match: Match, onUpdate: (data: Partial<Match>) => void }) => {

    const handleStatChange = (stat: keyof OpponentStats, increment: boolean) => {
        const opponentStats = match.opponentStats || { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0 };
        let currentVal = opponentStats[stat] || 0;
        let newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);

        const updatedStats = _.cloneDeep(match.opponentStats || {});
         _.set(updatedStats, stat, newVal);
        
        let batchUpdate: Partial<Match> = { opponentStats: updatedStats };
        const scoreField = 'visitorScore';

        if (stat === 'goals') {
             const scoreDiff = newVal - currentVal;
             const newScore = (match[scoreField] || 0) + scoreDiff;
             batchUpdate[scoreField] = newScore;
        }

        if (stat === 'fouls') {
             const foulDiff = newVal - currentVal;
             const currentFouls = match.fouls?.visitor ?? 0;
             const newFouls = currentFouls + foulDiff;

             const updatedFouls = _.cloneDeep(match.fouls || {});
             _.set(updatedFouls, `visitor`, newFouls);
             batchUpdate.fouls = updatedFouls;
        }

        onUpdate(batchUpdate);
    };

    const StatRow = ({ label, stat }: { label: string, stat: keyof OpponentStats }) => (
         <TableRow>
            <TableCell className="font-medium">{label}</TableCell>
            <TableCell className="text-right">
                <div className="flex items-center gap-1 justify-end">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(stat, false)}><Minus className="h-4 w-4"/></Button>
                    <span className="w-6 text-center tabular-nums">{match.opponentStats?.[stat] || 0}</span>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(stat, true)}><Plus className="h-4 w-4"/></Button>
                </div>
            </TableCell>
        </TableRow>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas del Rival - {teamName}</CardTitle>
            </CardHeader>
            <CardContent>
                 <Table>
                    <TableBody>
                        <StatRow label="Goles" stat="goals" />
                        <StatRow label="Faltas" stat="fouls" />
                        <StatRow label="Tiros a Puerta" stat="shotsOnTarget" />
                        <StatRow label="Tiros Fuera" stat="shotsOffTarget" />
                        <StatRow label="Tiros Bloqueados" stat="shotsBlocked" />
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    )
}

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
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);
  
  const [time, setTime] = useState(0); 
  const [isTimerActive, setIsTimerActive] = useState(false);

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: remoteMatchData, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  useEffect(() => {
    if (remoteMatchData) {
      setLocalMatchData(prevLocal => {
        if (_.isEqual(prevLocal, remoteMatchData)) {
            return prevLocal;
        }
        return remoteMatchData;
      });
    }
  }, [remoteMatchData]);

  const debouncedUpdate = useCallback(_.debounce((data: Partial<Match>) => {
    if (!matchRef || remoteMatchData?.isFinished) return;
    updateDoc(matchRef, data);
  }, 1000), [matchRef, remoteMatchData?.isFinished]);

  const handleUpdate = (data: Partial<Match>) => {
    if (localMatchData?.isFinished) return;
    setLocalMatchData(prevData => {
        const newState = _.merge({}, prevData, data);
        debouncedUpdate(newState);
        return newState as Match;
    });
  };
  
    const maxTime = 50 * 60;
    
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isTimerActive && time < maxTime) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime + 1);
                 if (activePlayerIds.length > 0) {
                     setLocalMatchData(prevData => {
                        if (!prevData) return null;
                        const newLocalData = _.cloneDeep(prevData);
                        activePlayerIds.forEach(playerId => {
                            const currentMinutes = _.get(newLocalData, `playerStats.${playerId}.minutesPlayed`, 0);
                            _.set(newLocalData, `playerStats.${playerId}.minutesPlayed`, currentMinutes + 1);
                        });
                        debouncedUpdate({ playerStats: newLocalData.playerStats });
                        return newLocalData;
                    });
                }
            }, 1000);
        } else if (time >= maxTime) {
            setIsTimerActive(false);
        }

        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerActive, time, maxTime, activePlayerIds, debouncedUpdate]);


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
    return teamPlayers.filter(p => squadIds.has(p.id)).sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
    });
  }, [teamPlayers, localMatchData?.squad]);
  
  const handleTimeout = (team: 'local' | 'visitor') => {
    if(!localMatchData) return;
    const currentVal = localMatchData.timeouts?.[team] ?? 0;
    if (currentVal < 2) {
        const updatedTimeouts = _.cloneDeep(localMatchData.timeouts || {});
        _.set(updatedTimeouts, team, currentVal + 1);
        handleUpdate({ timeouts: updatedTimeouts });
    }
  };

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

      <Scoreboard 
        match={localMatchData} 
        time={time}
        isTimerActive={isTimerActive}
        onTimerToggle={() => setIsTimerActive(!isTimerActive)}
        onTimeReset={() => setTime(0)}
        onTimeout={handleTimeout}
      />

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
                onActivePlayersChange={setActivePlayerIds}
                activePlayerIds={activePlayerIds}
            />
        </TabsContent>
        <TabsContent value="opponent">
             <OpponentStatsTable 
                teamName={opponentTeamName}
                match={localMatchData}
                onUpdate={handleUpdate}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}

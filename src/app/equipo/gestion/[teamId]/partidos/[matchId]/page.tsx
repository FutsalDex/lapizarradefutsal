'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { doc, updateDoc, collection } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RefreshCw, Plus, Minus, Shield, Flag } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import _, { set } from 'lodash';

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

const Scoreboard = ({ match, onUpdate }: { match: Match; onUpdate: (data: Partial<Match>) => void }) => {
  const [time, setTime] = useState(20 * 60); // 20 minutes in seconds
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

  const handleFoul = (team: 'local' | 'visitor') => {
    const field = team === 'local' ? 'localFouls' : 'visitorFouls';
    const currentVal = match[field] || 0;
    if (currentVal < 5) {
      onUpdate({ [field]: currentVal + 1 });
    }
  };
  
  const resetPeriod = (newPeriod: Period) => {
    setPeriod(newPeriod);
    setTime(20 * 60);
    setIsActive(false);
    onUpdate({ localFouls: 0, visitorFouls: 0, localTimeouts: 0, visitorTimeouts: 0 });
    toast({ title: `Iniciada ${newPeriod === '1H' ? '1ª Parte' : '2ª Parte'}`})
  }

  return (
    <Card className="text-center">
      <CardContent className="p-4 md:p-6">
        <div className="grid grid-cols-3 items-center gap-4">
          <div className="text-lg md:text-xl font-bold">{match.localTeam}</div>
          <div className="text-4xl md:text-6xl font-bold tabular-nums">
            {match.localScore} - {match.visitorScore}
          </div>
          <div className="text-lg md:text-xl font-bold">{match.visitorTeam}</div>
        </div>

        <div className="text-6xl md:text-8xl font-mono font-bold my-4 tabular-nums">
          {formatTime(time)}
        </div>

        <div className="flex justify-center items-center gap-4 mb-6">
            <Button onClick={() => setIsActive(!isActive)} variant={isActive ? "destructive" : "default"} size="lg">
                {isActive ? <Pause className="mr-2 h-6 w-6"/> : <Play className="mr-2 h-6 w-6"/>}
                {isActive ? 'Pausar' : 'Iniciar'}
            </Button>
            <Button onClick={() => resetPeriod(period)} variant="outline" size="lg">
                <RefreshCw className="mr-2 h-6 w-6"/> Reiniciar
            </Button>
        </div>

        <RadioGroup value={period} onValueChange={(value) => resetPeriod(value as Period)} className="flex justify-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="1H" id="1h" />
                <Label htmlFor="1h">1ª Parte</Label>
            </div>
            <div className="flex items-center space-x-2">
                <RadioGroupItem value="2H" id="2h" />
                <Label htmlFor="2h">2ª Parte</Label>
            </div>
        </RadioGroup>


        <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
                <div className="font-semibold">Faltas: {match.localFouls || 0}</div>
                <Button size="sm" variant="outline" onClick={() => handleFoul('local')} disabled={(match.localFouls || 0) >= 5}>+ Falta Local</Button>
                <div className="font-semibold mt-2">T. Muerto: {match.localTimeouts || 0}</div>
                <Button size="sm" variant="outline" onClick={() => handleTimeout('local')} disabled={(match.localTimeouts || 0) >= 1}>+ T.M. Local</Button>
            </div>
            <div className="space-y-2">
                <div className="font-semibold">Faltas: {match.visitorFouls || 0}</div>
                <Button size="sm" variant="outline" onClick={() => handleFoul('visitor')} disabled={(match.visitorFouls || 0) >= 5}>+ Falta Visitante</Button>
                 <div className="font-semibold mt-2">T. Muerto: {match.visitorTimeouts || 0}</div>
                <Button size="sm" variant="outline" onClick={() => handleTimeout('visitor')} disabled={(match.visitorTimeouts || 0) >= 1}>+ T.M. Visitante</Button>
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
        if (stat === 'goals') {
             const scoreField = isMyTeam ? (match.localTeam === teamName ? 'localScore' : 'visitorScore') : (match.localTeam === teamName ? 'localScore' : 'visitorScore');
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
            <span className="w-4 text-center">{((match.playerStats?.[playerId] as any)?.[stat] || 0)}</span>
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
                            {players.map(player => {
                                const stats = match.playerStats?.[player.id] || {};
                                return (
                                    <TableRow key={player.id} className={cn(activePlayerId === player.id && "bg-primary/10")}>
                                        <TableCell>
                                            <Button variant="link" className="p-0 text-left h-auto" onClick={() => toggleActivePlayer(player.id)}>
                                                <span className="font-bold mr-2">{player.number}.</span>{player.name}
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center">{stats.minutesPlayed || 0}</TableCell>
                                        <TableCell><StatButton stat="goals" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="assists" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="foulsCommitted" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="foulsReceived" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="yellowCards" playerId={player.id} /></TableCell>
                                        <TableCell><StatButton stat="redCards" playerId={player.id} /></TableCell>
                                    </TableRow>
                                )
                            })}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
};

// ====================
// MAIN PAGE COMPONENT
// ====================
export default function MatchStatsPage() {
  const params = useParams();
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
    if (!matchRef) return;
    await updateDoc(matchRef, data);
    toast({title: "Autoguardado", description: "Cambios guardados."});
  }, 2000), [matchRef, toast]);

  const handleUpdate = (data: Partial<Match>) => {
    setLocalMatchData(prev => {
        if (!prev) return null;
        const newState = { ...prev, ...data };
        debouncedUpdate(newState);
        return newState;
    });
  };

  const handleFinishMatch = async () => {
    if (!matchRef) return;
    debouncedUpdate.flush(); // Ensure any pending updates are sent
    const finalData = { ...localMatchData, isFinished: true };
    await updateDoc(matchRef, finalData);
    toast({title: "Partido Finalizado", description: "Estadísticas finales guardadas."});
  }

  const squadPlayers = useMemo(() => {
    if (!teamPlayers || !localMatchData?.squad) return [];
    const squadIds = new Set(localMatchData.squad);
    return teamPlayers.filter(p => squadIds.has(p.id));
  }, [teamPlayers, localMatchData?.squad]);

  const isLoading = isLoadingMatch || isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!localMatchData || !team) {
    return <div className="container mx-auto px-4 py-8 text-center">No se encontraron datos del partido o del equipo.</div>;
  }
  
  const myTeamIsLocal = localMatchData.localTeam === team.name;
  const myTeamName = team.name;
  const opponentTeamName = myTeamIsLocal ? localMatchData.visitorTeam : localMatchData.localTeam;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      <div className="flex justify-between items-center">
        <Button asChild variant="outline">
          <Link href={`/equipo/gestion/${teamId}/partidos`}>
            <ArrowLeft className="mr-2 h-4 w-4"/> Volver a Partidos
          </Link>
        </Button>
        <h1 className="text-2xl font-bold font-headline text-primary">Partido en Vivo</h1>
        <Button onClick={handleFinishMatch} variant="destructive">
            <Flag className="mr-2 h-4 w-4"/> Finalizar Partido
        </Button>
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
             <p className="text-center text-muted-foreground mt-4">La gestión de estadísticas para el equipo rival no está implementada.</p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

    
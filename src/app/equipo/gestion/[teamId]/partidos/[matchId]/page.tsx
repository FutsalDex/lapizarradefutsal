
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { doc, updateDoc, collection, arrayUnion, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow, TableFooter } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Play, Pause, RefreshCw, Plus, Minus, Flag, Unlock, ClipboardList, Goal, ShieldAlert, Crosshair, Target, Repeat, Shuffle, UserCheck, Save } from 'lucide-react';
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
  unoVsUno?: number;
}
type Player = Omit<PlayerStats, 'id'> & { id: string };

type Period = '1H' | '2H';

interface OpponentStats {
  goals: number;
  fouls: number;
  shotsOnTarget: number;
  shotsOffTarget: number;
  shotsBlocked: number;
  recoveries: number;
  turnovers: number;
}

interface MatchEvent {
  type: 'goal' | 'yellowCard' | 'redCard';
  team: 'local' | 'visitor';
  period: Period;
  minute: number;
  playerId?: string;
  playerName?: string;
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
  playerStats?: { [key in Period]?: { [playerId: string]: Partial<PlayerStats> } } | { [playerId: string]: Partial<PlayerStats> }; // Legacy support
  opponentStats?: { [key in Period]?: Partial<OpponentStats> } | Partial<OpponentStats>; // Legacy support
  fouls?: { local: number; visitor: number };
  timeouts?: { local: number; visitor: number };
  events?: MatchEvent[];
}


// ====================
// HELPER FUNCTIONS
// ====================
const formatStatTime = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Migrates a match object from a legacy data structure to the new period-based structure.
 */
function migrateLegacyMatchData(matchData: Match): Match {
    if (!matchData) return matchData;

    const needsMigration = (stats: any) => stats && !stats['1H'] && !stats['2H'] && Object.keys(stats).length > 0;

    let migratedData = _.cloneDeep(matchData);
    let wasMigrated = false;

    // Migrate playerStats
    if (needsMigration(migratedData.playerStats)) {
        console.log("Migrating legacy playerStats...");
        const legacyPlayerStats = migratedData.playerStats;
        migratedData.playerStats = {
            '1H': legacyPlayerStats as { [playerId: string]: Partial<PlayerStats> },
            '2H': {}
        };
        wasMigrated = true;
    }

    // Migrate opponentStats
    if (needsMigration(migratedData.opponentStats)) {
        console.log("Migrating legacy opponentStats...");
        const legacyOpponentStats = migratedData.opponentStats;
        migratedData.opponentStats = {
            '1H': legacyOpponentStats as Partial<OpponentStats>,
            '2H': { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 }
        };
        wasMigrated = true;
    }
    
    // Ensure stats objects exist if they are null/undefined
    if (!migratedData.playerStats) {
        migratedData.playerStats = { '1H': {}, '2H': {} };
    }
    if (!migratedData.opponentStats) {
        migratedData.opponentStats = { 
            '1H': { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 },
            '2H': { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 }
        };
    }
    
    if (wasMigrated) {
        console.log("Data migration complete:", migratedData);
    }
    
    return migratedData;
}


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
  onTimeout,
  period,
  setPeriod,
  localFouls,
  visitorFouls,
}: {
  match: Match;
  time: number;
  isTimerActive: boolean;
  onTimerToggle: () => void;
  onTimeReset: () => void;
  onTimeout: (team: 'local' | 'visitor') => void;
  period: Period;
  setPeriod: (period: Period) => void;
  localFouls: number;
  visitorFouls: number;
}) => {

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };
  
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
                TM
             </Button>
             <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
                {formatTime(time)}
            </div>
            <Button size="sm" variant="outline" onClick={() => onTimeout('visitor')} disabled={visitorTimeouts >= 2} className={cn("w-16 mx-auto", visitorTimeouts > 0 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                TM
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
             <div className="flex rounded-md border p-1">
                <Button onClick={() => setPeriod('1H')} variant={period === '1H' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">1ª Parte</Button>
                <Button onClick={() => setPeriod('2H')} variant={period === '2H' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">2ª Parte</Button>
            </div>
        </div>
      </CardContent>
    </Card>
  );
};


// ====================
// STATS TABLE COMPONENT
// ====================
const StatsTable = ({ teamName, players, match, onUpdate, isMyTeam, onActivePlayersChange, activePlayerIds, period, time }: { teamName: string, players: Player[], match: Match, onUpdate: (data: Partial<Match>) => void, isMyTeam: boolean, onActivePlayersChange: (ids: string[]) => void, activePlayerIds: string[], period: Period, time: number }) => {
    const { toast } = useToast();

    const handleStatChange = (playerId: string, stat: keyof PlayerStats, increment: boolean) => {
        const player = players.find(p => p.id === playerId);
        if (!player) return;

        const playerStats = _.get(match.playerStats, `${period}.${playerId}`, {});
        let currentVal = (playerStats[stat] as number) || 0;
        let newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
        
        const updatedStats = _.cloneDeep(match.playerStats || {});
        _.set(updatedStats, `${period}.${playerId}.${stat}`, newVal);
        
        let batchUpdate: Partial<Match> = { playerStats: updatedStats };
        const isLocalTeam = match.localTeam === teamName;
        
        if (stat === 'goals' && isMyTeam) {
             const currentLocalScore = _.sumBy(players, p => _.get(updatedStats, `1H.${p.id}.goals`, 0) + _.get(updatedStats, `2H.${p.id}.goals`, 0));
             const currentVisitorScore = (_.get(match.opponentStats, '1H.goals', 0) + _.get(match.opponentStats, '2H.goals', 0));
             
             if(isLocalTeam) {
                 batchUpdate.localScore = currentLocalScore;
                 batchUpdate.visitorScore = currentVisitorScore;
             } else {
                 batchUpdate.localScore = currentVisitorScore;
                 batchUpdate.visitorScore = currentLocalScore;
             }

             // Add or remove goal event
             if (increment) {
                 const minuteInPeriod = Math.floor((25 * 60 - time) / 60);
                 const eventMinute = period === '2H' ? 25 + minuteInPeriod : minuteInPeriod;
                 const newEvent: MatchEvent = {
                     type: 'goal',
                     team: isLocalTeam ? 'local' : 'visitor',
                     period: period,
                     minute: eventMinute,
                     playerId: player.id,
                     playerName: player.name
                 };
                 batchUpdate.events = arrayUnion(newEvent) as any;
             } else {
                // This is complex. For now, we don't support removing events easily.
                // A better implementation would be to give events unique IDs.
             }
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
        const initialTotals: Omit<PlayerStats, 'id' | 'name' | 'number' | 'minutesPlayed'> & {minutesPlayed: number} = {
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0,
            shotsOnTarget: 0, shotsOffTarget: 0, recoveries: 0, turnovers: 0,
            saves: 0, goalsConceded: 0, minutesPlayed: 0
        };
        if (!players || !match.playerStats || !match.playerStats[period]) return initialTotals;
        
        return players.reduce((acc, player) => {
            const stats = (match.playerStats as any)[period]?.[player.id] || {};
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
    }, [players, match.playerStats, period]);
    
    const minutesPlayedTotals = useMemo(() => {
        const totalMinutes: { [playerId: string]: number } = {};
        if (!players || !match.playerStats) return totalMinutes;

        players.forEach(player => {
            const min1H = _.get(match.playerStats, `1H.${player.id}.minutesPlayed`, 0);
            const min2H = _.get(match.playerStats, `2H.${player.id}.minutesPlayed`, 0);
            totalMinutes[player.id] = min1H + min2H;
        });

        return totalMinutes;

    }, [players, match.playerStats]);


    const StatButton = ({ stat, playerId }: { stat: keyof PlayerStats, playerId: string }) => (
        <div className="flex items-center gap-1 justify-center">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleStatChange(playerId, stat, false)}><Minus className="h-4 w-4"/></Button>
            <span className="w-4 text-center tabular-nums">{((_.get(match.playerStats, `${period}.${playerId}`) as any)?.[stat] || 0)}</span>
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
            <TableHead className="text-center px-1">1vs1</TableHead>
            <TableHead className="text-center px-1">TA</TableHead>
            <TableHead className="text-center px-1">TR</TableHead>
        </TableRow>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>{teamName} - Estadísticas {period === '1H' ? '1ª Parte' : '2ª Parte'}</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {tableHeaders}
                        </TableHeader>
                        <TableBody>
                             {players.length > 0 ? players.map(player => {
                                const stats = _.get(match.playerStats, `${period}.${player.id}`, {});
                                return (
                                    <TableRow key={player.id} className={cn(activePlayerIds.includes(player.id) && "bg-primary/20 border-2 border-primary")}>
                                        <TableCell className="py-1 px-2">
                                            <Button variant="link" className="p-0 text-left h-auto text-foreground hover:no-underline" onClick={() => toggleActivePlayer(player.id)}>
                                                <span className="font-bold mr-2">{player.number}.</span>
                                                <span className='text-black'>{player.name}</span>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums py-1 px-1">{formatStatTime(minutesPlayedTotals[player.id] || 0)}</TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="goals" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="assists" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="fouls" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="shotsOnTarget" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="shotsOffTarget" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="recoveries" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="turnovers" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="saves" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="goalsConceded" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="unoVsUno" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="yellowCards" playerId={player.id} /></TableCell>
                                        <TableCell className="py-1 px-1"><StatButton stat="redCards" playerId={player.id} /></TableCell>
                                    </TableRow>
                                )
                            }) : (
                                <TableRow>
                                    <TableCell colSpan={14} className="text-center h-24 text-muted-foreground">
                                        {isMyTeam ? "No hay jugadores convocados." : "Las estadísticas del rival no están disponibles."}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                         <TableFooter>
                            {tableHeaders}
                            <TableRow className="bg-muted/50 font-bold">
                                <TableCell className="px-2">Total {period === '1H' ? '1ª Parte' : '2ª Parte'}</TableCell>
                                <TableCell className="text-center tabular-nums py-1 px-1"></TableCell>
                                <TableCell className="text-center px-1">{totals.goals}</TableCell>
                                <TableCell className="text-center px-1">{totals.assists}</TableCell>
                                <TableCell className="text-center px-1">{totals.fouls}</TableCell>
                                <TableCell className="text-center px-1">{totals.shotsOnTarget}</TableCell>
                                <TableCell className="text-center px-1">{totals.shotsOffTarget}</TableCell>
                                <TableCell className="text-center px-1">{totals.recoveries}</TableCell>
                                <TableCell className="text-center px-1">{totals.turnovers}</TableCell>
                                <TableCell className="text-center px-1">{totals.saves}</TableCell>
                                <TableCell className="text-center px-1">{totals.goalsConceded}</TableCell>
                                <TableCell className="text-center px-1">{_.sumBy(Object.values((match.playerStats as any)?.[period] || {}), 'unoVsUno') || 0}</TableCell>
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
                          <div><b>Min:</b> Minutos (Total Partido)</div>
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
                          <div><b>1vs1:</b> Duelos 1vs1 ganados</div>
                      </div>
                  </div>
                </CardFooter>
            )}
        </Card>
    );
};

const OpponentStatsGrid = ({ teamName, match, onUpdate, period, time }: { teamName: string, match: Match, onUpdate: (data: Partial<Match>) => void, period: Period, time: number }) => {

    const handleStatChange = (stat: keyof OpponentStats, increment: boolean) => {
        const opponentStats = _.get(match.opponentStats, period, { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 });
        let currentVal = opponentStats[stat] || 0;
        let newVal = increment ? currentVal + 1 : Math.max(0, currentVal - 1);

        const updatedStats = _.cloneDeep(match.opponentStats || {});
        _.set(updatedStats, `${period}.${stat}`, newVal);
        
        let batchUpdate: Partial<Match> = { opponentStats: updatedStats };
        
        if (stat === 'goals') {
             const goals1H = _.get(updatedStats, '1H.goals', 0);
             const goals2H = _.get(updatedStats, '2H.goals', 0);

             const isOpponentLocal = match.localTeam === teamName;

             if(isOpponentLocal) {
                batchUpdate.localScore = goals1H + goals2H;
             } else {
                batchUpdate.visitorScore = goals1H + goals2H;
             }

             // Add or remove goal event
             if (increment) {
                 const minuteInPeriod = Math.floor((25 * 60 - time) / 60);
                 const eventMinute = period === '2H' ? 25 + minuteInPeriod : minuteInPeriod;
                 const newEvent: MatchEvent = {
                     type: 'goal',
                     team: isOpponentLocal ? 'local' : 'visitor',
                     period: period,
                     minute: eventMinute,
                     playerName: 'Rival'
                 };
                 batchUpdate.events = arrayUnion(newEvent) as any;
             }
        }

        onUpdate(batchUpdate);
    };
    
    const opponentStatItems = [
        { label: "Goles", stat: "goals" as keyof OpponentStats, icon: Goal },
        { label: "Tiros a Puerta", stat: "shotsOnTarget" as keyof OpponentStats, icon: Crosshair },
        { label: "Tiros Fuera", stat: "shotsOffTarget" as keyof OpponentStats, icon: Target },
        { label: "Faltas", stat: "fouls" as keyof OpponentStats, icon: ShieldAlert },
        { label: "Recuperaciones", stat: "recoveries" as keyof OpponentStats, icon: Repeat },
        { label: "Pérdidas", stat: "turnovers" as keyof OpponentStats, icon: Shuffle },
    ]

    const StatCounter = ({ label, stat, icon: Icon }: { label: string, stat: keyof OpponentStats, icon: React.ElementType }) => (
        <div className="flex items-center justify-between rounded-lg border bg-card text-card-foreground shadow-sm p-3">
             <div className="flex items-center gap-3">
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
             </div>
             <div className="flex items-center gap-2">
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleStatChange(stat, false)}><Minus className="h-4 w-4"/></Button>
                <span className="w-6 text-center tabular-nums font-bold text-lg">{_.get(match.opponentStats, `${period}.${stat}`, 0)}</span>
                <Button variant="outline" size="icon" className="h-7 w-7" onClick={() => handleStatChange(stat, true)}><Plus className="h-4 w-4"/></Button>
            </div>
        </div>
    );

    return (
        <Card>
            <CardHeader>
                <CardTitle>Estadísticas del Rival - {teamName} ({period === '1H' ? '1ª Parte' : '2ª Parte'})</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                 {opponentStatItems.map(item => (
                    <StatCounter key={item.stat} label={item.label} stat={item.stat} icon={item.icon} />
                 ))}
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
  
  const matchDuration = 25 * 60; // 25 minutes in seconds
  const [time, setTime] = useState(matchDuration); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [period, setPeriod] = useState<Period>('1H');
  const [isSaving, setIsSaving] = useState(false);

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: remoteMatchData, isLoading: isLoadingMatch, error } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  useEffect(() => {
    if (remoteMatchData) {
      setLocalMatchData(prevLocal => {
        const migratedData = migrateLegacyMatchData(remoteMatchData);
        // Only update local state if remote data is different to avoid re-renders
        if (!_.isEqual(prevLocal, migratedData)) {
            return migratedData;
        }
        return prevLocal;
      });
    }
  }, [remoteMatchData]);

  const debouncedSave = useCallback(
    _.debounce(async (dataToSave: Match) => {
      if (!matchRef) return;
      setIsSaving(true);
      try {
        await updateDoc(matchRef, {
          ...dataToSave,
          updatedAt: serverTimestamp(),
        });
      } catch (err) {
        console.error(err);
        toast({
          title: "Error de guardado automático",
          description: "No se pudieron guardar los últimos cambios.",
          variant: "destructive",
        });
      } finally {
        setIsSaving(false);
      }
    }, 5000), // 5000ms debounce time
    [matchRef, toast]
  );

  const handleUpdate = (data: Partial<Match>) => {
    if (localMatchData?.isFinished) return;
    setLocalMatchData(prevData => {
        if (!prevData) return null;
        const newState = _.mergeWith({}, prevData, data, (objValue, srcValue) => {
            if (_.isArray(objValue) && _.isArray(srcValue)) {
                return _.unionWith(objValue, srcValue, _.isEqual);
            }
        });
        debouncedSave(newState as Match);
        return newState as Match;
    });
  };
  
  useEffect(() => {
      let interval: NodeJS.Timeout | null = null;
      if (isTimerActive && time > 0) {
          interval = setInterval(() => {
              setTime(prevTime => prevTime - 1);
               if (activePlayerIds.length > 0) {
                   setLocalMatchData(prevData => {
                      if (!prevData) return null;
                      const newLocalData = _.cloneDeep(prevData);
                      activePlayerIds.forEach(playerId => {
                          const currentMinutes = _.get(newLocalData, `playerStats.${period}.${playerId}.minutesPlayed`, 0);
                          _.set(newLocalData, `playerStats.${period}.${playerId}.minutesPlayed`, (currentMinutes || 0) + 1);
                      });
                      return newLocalData;
                  });
              }
          }, 1000);
      } else if (time <= 0) {
          setIsTimerActive(false);
      }

      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isTimerActive, time, activePlayerIds, period]);

  const handleManualSave = async () => {
      if (!matchRef || !localMatchData) return;
      debouncedSave.cancel(); // Cancel any pending auto-save
      setIsSaving(true);
      try {
          await updateDoc(matchRef, {
              ...localMatchData,
              updatedAt: serverTimestamp(),
          });
          toast({
              title: "Guardado",
              description: "Los datos del partido se han guardado correctamente.",
          });
      } catch (err) {
          console.error(err);
          toast({
              title: "Error al guardar",
              description: "No se pudieron guardar los datos del partido.",
              variant: "destructive",
          });
      } finally {
          setIsSaving(false);
      }
  };


  const toggleMatchFinished = async () => {
    if (!matchRef || !localMatchData) return;
    await handleManualSave();
    const newStatus = !localMatchData.isFinished;
    await updateDoc(matchRef, { isFinished: newStatus });
    toast({
        title: newStatus ? "Partido Finalizado" : "Partido Reabierto",
        description: `Las estadísticas ${newStatus ? 'finales han sido guardadas' : 'pueden ser editadas de nuevo'}.`
    });
  }
  
  const handlePeriodChange = (newPeriod: Period) => {
    if (period !== newPeriod) {
        setIsTimerActive(false);
        setTime(matchDuration);
        setPeriod(newPeriod);
    }
  };

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

  const localFouls = useMemo(() => {
    if (!localMatchData) return 0;
    const teamName = team?.name;
    const isMyTeamLocal = localMatchData.localTeam === teamName;
    if (isMyTeamLocal) {
      return _.sumBy(squadPlayers, p => _.get(localMatchData?.playerStats, `${period}.${p.id}.fouls`, 0));
    }
    return _.get(localMatchData?.opponentStats, `${period}.fouls`, 0);
  }, [squadPlayers, localMatchData, period, team]);

  const visitorFouls = useMemo(() => {
    if (!localMatchData) return 0;
    const teamName = team?.name;
    const isMyTeamLocal = localMatchData.localTeam === teamName;
    if (!isMyTeamLocal) {
      return _.sumBy(squadPlayers, p => _.get(localMatchData?.playerStats, `${period}.${p.id}.fouls`, 0));
    }
    return _.get(localMatchData?.opponentStats, `${period}.fouls`, 0);
  }, [squadPlayers, localMatchData, period, team]);


  const isLoading = isLoadingMatch || isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!localMatchData || !team) {
    return <div className="container mx-auto px-4 py-8 text-center">No se encontraron datos del partido o del equipo.</div>;
  }
  
  const myTeamName = team.name;
  const isMyTeamLocal = localMatchData.localTeam === myTeamName;
  const opponentTeamName = isMyTeamLocal ? localMatchData.visitorTeam : localMatchData.localTeam;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex justify-between items-center">
        <div>
            <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                <ClipboardList /> Marcador y Estadísticas en Vivo
            </h1>
            <p className="text-muted-foreground">Gestiona el partido en tiempo real y pulsa Guardar para registrar los cambios.</p>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver
            </Button>
            <Button onClick={handleManualSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4"/> {isSaving ? 'Guardando...' : 'Guardar'}
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
        onTimeReset={() => setTime(matchDuration)}
        onTimeout={handleTimeout}
        period={period}
        setPeriod={handlePeriodChange}
        localFouls={localFouls}
        visitorFouls={visitorFouls}
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
                period={period}
                time={time}
            />
        </TabsContent>
        <TabsContent value="opponent">
             <OpponentStatsGrid
                teamName={opponentTeamName}
                match={localMatchData}
                onUpdate={handleUpdate}
                period={period}
                time={time}
            />
        </TabsContent>
      </Tabs>
    </div>
  );
}

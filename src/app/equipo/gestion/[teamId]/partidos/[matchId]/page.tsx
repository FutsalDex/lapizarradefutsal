
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
import { ArrowLeft, Play, Pause, RefreshCw, Plus, Minus, Flag, Unlock, ClipboardList, Goal, ShieldAlert, Crosshair, Target, Repeat, Shuffle, UserCheck, Save, Settings } from 'lucide-react';
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
  fouls?: { [key in Period]?: { local: number; visitor: number } };
  timeouts?: { [key in Period]?: { local: number; visitor: number } };
  events?: MatchEvent[];
  // Legacy fields
  localPlayers?: any[];
  visitorPlayers?: any[];
  userTeam?: 'local' | 'visitor';
}


// ====================
// HELPER FUNCTIONS
// ====================
const formatStatTime = (totalSeconds: number) => {
    if (isNaN(totalSeconds)) totalSeconds = 0;
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
};

/**
 * Migrates a match object from a legacy data structure to the new period-based structure.
 */
function migrateLegacyMatchData(matchData: Match): Match {
    if (!matchData) return matchData;

    let migratedData = _.cloneDeep(matchData);
    let wasMigrated = false;

    const needsPlayerStatsMigration = (stats: any) => stats && !stats['1H'] && !stats['2H'] && Object.keys(stats).length > 0 && !Array.isArray(stats);
    const needsOpponentStatsMigration = (stats: any) => stats && !stats['1H'] && !stats['2H'] && Object.keys(stats).length > 0 && !Array.isArray(stats);
    
    // Migrate flat playerStats to 1H
    if (needsPlayerStatsMigration(migratedData.playerStats)) {
        const legacyPlayerStats = migratedData.playerStats as { [playerId: string]: Partial<PlayerStats> };
        migratedData.playerStats = {
            '1H': legacyPlayerStats,
            '2H': {}
        };
         Object.keys(legacyPlayerStats).forEach(playerId => {
            migratedData.playerStats!['2H']![playerId] = {};
        });
        wasMigrated = true;
    } else if (matchData.localPlayers && matchData.userTeam) { // Migrate from localPlayers/visitorPlayers
        const playerList = matchData.userTeam === 'local' ? matchData.localPlayers : matchData.visitorPlayers;
        if (playerList && Array.isArray(playerList)) {
            const playerStats1H: { [playerId: string]: Partial<PlayerStats> } = {};
            playerList.forEach(p => {
                playerStats1H[p.id] = {
                    goals: p.goals || 0,
                    assists: p.assists || 0,
                    yellowCards: p.amarillas || 0,
                    redCards: p.rojas || 0,
                    fouls: p.faltas || 0,
                    shotsOnTarget: p.tirosPuerta || 0,
                    shotsOffTarget: p.tirosFuera || 0,
                    recoveries: p.recuperaciones || 0,
                    turnovers: p.perdidas || 0,
                    saves: p.paradas || 0,
                    goalsConceded: p.gRec || 0,
                    minutesPlayed: p.timeOnCourt || 0,
                    unoVsUno: p.vs1 || 0,
                }
            });
            migratedData.playerStats = { '1H': playerStats1H, '2H': {} };
            wasMigrated = true;
        }
    }


    if (needsOpponentStatsMigration(migratedData.opponentStats)) {
        const legacyOpponentStats = migratedData.opponentStats;
        migratedData.opponentStats = { 
            '1H': legacyOpponentStats as Partial<OpponentStats>,
            '2H': { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 }
        };
        wasMigrated = true;
    }
    
    // Ensure all nested structures exist to prevent runtime errors
    if (!migratedData.playerStats) migratedData.playerStats = { '1H': {}, '2H': {} };
    if (!migratedData.playerStats['1H']) migratedData.playerStats['1H'] = {};
    if (!migratedData.playerStats['2H']) migratedData.playerStats['2H'] = {};
    
    if (!migratedData.opponentStats) migratedData.opponentStats = { '1H': {}, '2H': {} };
    if (!migratedData.opponentStats['1H']) (migratedData.opponentStats as any)['1H'] = { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 };
    if (!migratedData.opponentStats['2H']) (migratedData.opponentStats as any)['2H'] = { goals: 0, fouls: 0, shotsOnTarget: 0, shotsOffTarget: 0, shotsBlocked: 0, recoveries: 0, turnovers: 0 };
    
    if (!migratedData.timeouts) migratedData.timeouts = { '1H': {local: 0, visitor: 0}, '2H': {local: 0, visitor: 0} };
    if (!migratedData.timeouts['1H']) migratedData.timeouts['1H'] = {local: 0, visitor: 0};
    if (!migratedData.timeouts['2H']) migratedData.timeouts['2H'] = {local: 0, visitor: 0};

    if (!migratedData.fouls) migratedData.fouls = { '1H': {local: 0, visitor: 0}, '2H': {local: 0, visitor: 0} };
    if (!migratedData.fouls['1H']) migratedData.fouls['1H'] = {local: 0, visitor: 0};
    if (!migratedData.fouls['2H']) migratedData.fouls['2H'] = {local: 0, visitor: 0};

    if (wasMigrated) {
        console.log("Legacy match data migrated for compatibility.");
    }
    
    return migratedData;
}


// ====================
// SCOREBOARD COMPONENT
// ====================
const FoulIndicator = ({ count }: { count: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(5)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-destructive", i < count ? "bg-destructive" : "bg-transparent")}/>
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
}: {
  match: Match;
  time: number;
  isTimerActive: boolean;
  onTimerToggle: () => void;
  onTimeReset: () => void;
  onTimeout: (team: 'local' | 'visitor') => void;
  period: Period;
  setPeriod: (period: Period) => void;
}) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  const localTimeoutsUsed = _.get(match, `timeouts.${period}.local`, 0) > 0;
  const visitorTimeoutsUsed = _.get(match, `timeouts.${period}.visitor`, 0) > 0;
  const localFouls = _.get(match, `fouls.${period}.local`, 0);
  const visitorFouls = _.get(match, `fouls.${period}.visitor`, 0);

  return (
    <Card>
      <CardContent className="p-4 md:p-6 text-center">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="grid grid-cols-3 items-start w-full max-w-4xl">
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-xl font-bold truncate">{match.localTeam}</h2>
              <FoulIndicator count={localFouls} />
            </div>
            <div className="text-5xl md:text-7xl font-bold tabular-nums text-primary">
              {match.localScore} - {match.visitorScore}
            </div>
            <div className="flex flex-col items-center space-y-2">
              <h2 className="text-xl font-bold truncate">{match.visitorTeam}</h2>
              <FoulIndicator count={visitorFouls} />
            </div>
          </div>
          <div className="flex justify-center items-center w-full max-w-4xl">
            <div className="flex-1 flex justify-center">
                <Button 
                    variant={localTimeoutsUsed ? "default" : "outline"}
                    onClick={() => onTimeout('local')}
                    className={cn("h-12 w-24 transition-colors")}
                    disabled={localTimeoutsUsed}
                >
                    TM
                </Button>
            </div>
            <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
              {formatTime(time)}
            </div>
            <div className="flex-1 flex justify-center">
                <Button
                    variant={visitorTimeoutsUsed ? "default" : "outline"}
                    onClick={() => onTimeout('visitor')}
                    className={cn("h-12 w-24 transition-colors")}
                    disabled={visitorTimeoutsUsed}
                >
                    TM
                </Button>
            </div>
          </div>
          <div className="flex justify-center items-center gap-2">
            <Button onClick={onTimerToggle} variant="default" size="sm" className={cn(isTimerActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}>
              {isTimerActive ? <Pause className="h-4 w-4"/> : <Play className="h-4 w-4"/>}
              <span className="ml-2">{isTimerActive ? 'Pausar' : 'Iniciar'}</span>
            </Button>
            <Button onClick={onTimeReset} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4"/>
                <span className="ml-2">Reiniciar</span>
            </Button>
            <div className="flex rounded-md border p-1 bg-muted">
                <Button onClick={() => setPeriod('1H')} variant={period === '1H' ? 'primary' : 'ghost'} size="sm" className={cn("h-8 px-3")}>1ª Parte</Button>
                <Button onClick={() => setPeriod('2H')} variant={period === '2H' ? 'primary' : 'ghost'} size="sm" className={cn("h-8 px-3")}>2ª Parte</Button>
            </div>
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
        const isMyTeamLocal = match.localTeam === teamName;
        
        if (stat === 'goals' && isMyTeam) {
            const teamGoals1H = _.sumBy(players, p => _.get(updatedStats, `1H.${p.id}.goals`, 0));
            const teamGoals2H = _.sumBy(players, p => _.get(updatedStats, `2H.${p.id}.goals`, 0));
            const opponentGoals1H = _.get(match.opponentStats, '1H.goals', 0);
            const opponentGoals2H = _.get(match.opponentStats, '2H.goals', 0);

            if(isMyTeamLocal) {
                batchUpdate.localScore = teamGoals1H + teamGoals2H;
                batchUpdate.visitorScore = opponentGoals1H + opponentGoals2H;
            } else {
                batchUpdate.localScore = opponentGoals1H + opponentGoals2H;
                batchUpdate.visitorScore = teamGoals1H + teamGoals2H;
            }

             // Add or remove goal event
             if (increment) {
                 const minuteInPeriod = Math.floor((25 * 60 - time) / 60);
                 const eventMinute = period === '2H' ? 25 + minuteInPeriod : minuteInPeriod;
                 const newEvent: MatchEvent = {
                     type: 'goal',
                     team: isMyTeamLocal ? 'local' : 'visitor',
                     period: period,
                     minute: eventMinute,
                     playerId: player.id,
                     playerName: player.name
                 };
                 batchUpdate.events = arrayUnion(newEvent) as any;
             }
        }
        
        if (stat === 'fouls') {
          const fouls = _.sumBy(Object.values(_.get(updatedStats, period, {})), 'fouls');
          
          const updatedFouls = _.cloneDeep(match.fouls || {});
          
          if(isMyTeamLocal) {
            _.set(updatedFouls, `${period}.local`, fouls);
          } else {
            _.set(updatedFouls, `${period}.visitor`, fouls);
          }
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
        const initialTotals: Omit<PlayerStats, 'id' | 'name' | 'number' | 'minutesPlayed'> & {minutesPlayed: number} = {
            goals: 0, assists: 0, yellowCards: 0, redCards: 0, fouls: 0,
            shotsOnTarget: 0, shotsOffTarget: 0, recoveries: 0, turnovers: 0,
            saves: 0, goalsConceded: 0, minutesPlayed: 0
        };
        if (!players || !match.playerStats || !match.playerStats[period as Period]) return initialTotals;
        
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
        <div className="flex items-center gap-0.5 justify-center">
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStatChange(playerId, stat, false)}><Minus className="h-3 w-3"/></Button>
            <span className="w-4 text-center tabular-nums text-sm font-bold">{((_.get(match.playerStats, `${period}.${playerId}`) as any)?.[stat] || 0)}</span>
            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleStatChange(playerId, stat, true)}><Plus className="h-3 w-3"/></Button>
        </div>
    );
    
    const tableHeaders = (
        <TableRow>
            <TableHead className="py-1 px-2 text-xs w-[150px]">Jugador</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">Min</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">G</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">A</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">Faltas</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">T.P.</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">T.F.</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">Rec.</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">Perd.</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">Par.</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">GC</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">1vs1</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">TA</TableHead>
            <TableHead className="text-center py-1 px-1 text-xs">TR</TableHead>
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
                                const isActive = activePlayerIds.includes(player.id);
                                return (
                                    <TableRow key={player.id} className={cn(isActive && "bg-accent")}>
                                        <TableCell className="py-1 px-2 w-[150px]">
                                            <Button variant="link" className="p-0 text-left h-auto text-foreground hover:no-underline" onClick={() => toggleActivePlayer(player.id)}>
                                                 <span className={cn("font-bold mr-2 w-6", isActive && "text-accent-foreground")}>{player.number}.</span>
                                                 <span className={cn('truncate', isActive && 'font-bold text-accent-foreground')}>{player.name}</span>
                                            </Button>
                                        </TableCell>
                                        <TableCell className="text-center tabular-nums py-1 px-1 text-xs">{formatStatTime(minutesPlayedTotals[player.id] || 0)}</TableCell>
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
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-1">
                          <div><b>Min:</b> Minutos (Total Partido)</div>
                          <div><b>G:</b> Goles</div>
                          <div><b>A:</b> Asistencias</div>
                          <div><b>TA:</b> T. Amarilla</div>
                          <div><b>TR:</b> T. Roja</div>
                          <div><b>Faltas:</b> Faltas</div>
                          <div><b>T.P.:</b> Tiros a Puerta</div>
                          <div><b>T.F.:</b> Tiros Fuera</div>
                          <div><b>Rec.:</b> Recuperaciones</div>
                          <div><b>Perd.:</b> Perdidas</div>
                          <div><b>Par.:</b> Paradas</div>
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
        
        if (stat === 'fouls') {
          const fouls = _.get(updatedStats, `${period}.fouls`, 0);
          const isOpponentLocal = match.localTeam === teamName;
          const updatedFouls = _.cloneDeep(match.fouls || {});

          if(isOpponentLocal) {
            _.set(updatedFouls, `${period}.local`, fouls);
          } else {
            _.set(updatedFouls, `${period}.visitor`, fouls);
          }
          batchUpdate.fouls = updatedFouls;
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
  const { toast } = useToast();

  const [localMatchData, setLocalMatchData] = useState<Match | null>(null);
  const [activePlayerIds, setActivePlayerIds] = useState<string[]>([]);
  
  const matchDuration = 25 * 60; // 25 minutes in seconds
  const [time, setTime] = useState(matchDuration); 
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [period, setPeriod] = useState<Period>('1H');
  const [isSaving, setIsSaving] = useState(false);

  const matchRef = useMemoFirebase(() => doc(firestore, `matches/${matchId}`), [firestore, matchId]);
  const { data: remoteMatchData, isLoading: isLoadingMatch } = useDoc<Match>(matchRef);
  
  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<any>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: teamPlayers, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  useEffect(() => {
    if (remoteMatchData) {
        setLocalMatchData(prevLocal => {
            const migratedData = migrateLegacyMatchData(remoteMatchData);
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
    }, 5000), 
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
      } else if (isTimerActive && time === 0) {
          setIsTimerActive(false);
      }

      return () => {
          if (interval) clearInterval(interval);
      };
  }, [isTimerActive, time, activePlayerIds, period]);

  const handleManualSave = async () => {
      if (!matchRef || !localMatchData) return;
      debouncedSave.cancel(); 
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
    if(!localMatchData || localMatchData.isFinished) return;
    
    setLocalMatchData(currentMatchData => {
        if (!currentMatchData) return null;

        const currentVal = _.get(currentMatchData.timeouts, `${period}.${team}`, 0);
        
        if (currentVal > 0) {
          return currentMatchData; // Do nothing if timeout already used
        }

        const updatedTimeouts = _.cloneDeep(currentMatchData.timeouts || {});
        _.set(updatedTimeouts, `${period}.${team}`, 1);
        
        const updatedData = { ...currentMatchData, timeouts: updatedTimeouts };
        handleUpdate(updatedData);
        return updatedData;
    });
  };

  const isLoading = isLoadingMatch || isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return <div className="container mx-auto px-4 py-8"><Skeleton className="h-screen w-full"/></div>;
  }
  
  if (!localMatchData || !team) {
    return null;
  }
  
  const myTeamName = team.name;
  const isMyTeamLocal = localMatchData.localTeam === myTeamName;
  const opponentTeamName = isMyTeamLocal ? localMatchData.visitorTeam : localMatchData.localTeam;

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <div>
            <h1 className="text-2xl font-bold font-headline text-primary flex items-center gap-2">
                <ClipboardList /> Marcador y Estadísticas en Vivo
            </h1>
            <p className="text-muted-foreground">Gestiona el partido en tiempo real y pulsa Guardar para registrar los cambios.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" onClick={() => router.push(`/equipo/gestion/${teamId}/partidos`)}>
                <ArrowLeft className="mr-2 h-4 w-4"/> Volver
            </Button>
            <Button onClick={handleManualSave} disabled={isSaving}>
                <Save className="mr-2 h-4 w-4"/> {isSaving ? 'Guardando...' : 'Guardar'}
            </Button>
            <Button onClick={toggleMatchFinished} variant={localMatchData.isFinished ? "outline" : "destructive"}>
                {localMatchData.isFinished 
                    ? <><Unlock className="mr-2 h-4 w-4"/> Reabrir</> 
                    : <><Flag className="mr-2 h-4 w-4"/> Finalizar</>
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
      />

      <Tabs defaultValue="myTeam" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="myTeam">{myTeamName}</TabsTrigger>
            <TabsTrigger value="opponent">{opponentTeamName}</TabsTrigger>
        </TabsList>
        <TabsContent value="myTeam" className="mt-4">
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
        <TabsContent value="opponent" className="mt-4">
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

```
- src/firebase/use-auth-user.ts:
```ts

'use client';
import { useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useAuth } from './provider';

// Return type for useUser() - specific to user auth state
export interface UserHookResult {
  user: User | null;
  isUserLoading: boolean;
  setUser: (user: User | null) => void;
}

const authState = {
  user: null as User | null,
  isUserLoading: true,
  listeners: new Set<(result: UserHookResult) => void>(),
};

// Listen to auth state changes and notify all active hooks
let unsubscribe: (() => void) | null = null;
function ensureSubscription(auth: any) {
  if (unsubscribe) return;

  unsubscribe = onAuthStateChanged(
    auth,
    (firebaseUser) => {
      authState.user = firebaseUser;
      authState.isUserLoading = false;
      authState.listeners.forEach((listener) =>
        listener({ ...authState, setUser: (user) => (authState.user = user) })
      );
    },
    (error) => {
      console.error('useUser: onAuthStateChanged error:', error);
      authState.user = null;
      authState.isUserLoading = false;
      authState.listeners.forEach((listener) =>
        listener({ ...authState, setUser: (user) => (authState.user = user) })
      );
    }
  );
}

/**
 * Hook specifically for accessing and managing the authenticated user's state.
 * This provides the User object, loading status, and subscribes to auth state changes.
 * @returns {UserHookResult} Object with user, isUserLoading, and a setUser function.
 */
export const useUser = (): UserHookResult => {
  const auth = useAuth();
  const [state, setState] = useState<UserHookResult>({
    user: authState.user,
    isUserLoading: authState.isUserLoading,
    setUser: (user: User | null) => {
      authState.user = user;
      // Notifying listeners here is tricky; might be better to manage this centrally
    },
  });

  useEffect(() => {
    ensureSubscription(auth);

    const listener = (newState: UserHookResult) => {
      setState(newState);
    };

    authState.listeners.add(listener);

    // Initial sync
    listener({
      ...authState,
      setUser: (user: User | null) => {
        authState.user = user;
        // Optionally, re-notify all listeners if state is changed programmatically
        authState.listeners.forEach((l) => l({ ...authState, setUser: (u) => (authState.user = u) }));
      },
    });

    // Cleanup subscription on unmount
    return () => {
      authState.listeners.delete(listener);
    };
  }, [auth]);

  return state;
};

```
- src/middleware.ts:
```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization')
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/'], // rutas donde aplicará el middleware
}
```
- src/lib/data.ts:
```ts

import placeholderImages from './placeholder-images.json';

const exerciseImages = placeholderImages.placeholderImages.filter(p => p.id.startsWith('exercise-'));

export type Exercise = {
  id: string;
  number: string;
  name: string; // This will be mapped from 'Ejercicio'
  description: string; // Mapped from 'Descripción de la tarea'
  category: string; // Mapped from 'Categoría'
  fase: string; // Mapped from 'Fase'
  edad: string[]; // Mapped from 'Edad'
  objectives: string; // Mapped from 'Objetivos'
  duration: string; // Mapped from 'Duración (min)'
  numberOfPlayers: string; // Mapped from 'Número de jugadores'
  variations: string; // Mapped from 'Variantes'
  consejos: string; // Mapped from 'Consejos para el entrenador'
  image: string; // Mapped from 'Imagen'
  aiHint?: string;
  visible: boolean;
  userId?: string;
  createdAt?: any;
  'Espacio y materiales necesarios'?: string;
};

export function mapExercise(doc: any): Exercise {
    const data = doc.data ? doc.data() : doc; // Handle both doc snapshot and plain objects
    return {
        id: doc.id,
        number: data['Número'] || '',
        name: data['Ejercicio'] || 'Ejercicio sin nombre',
        description: data['Descripción de la tarea'] || '',
        category: data['Categoría'] || 'Sin categoría',
        fase: data['Fase'] || 'Fase no especificada',
        edad: data['Edad'] || [],
        objectives: data['Objetivos'] || '',
        duration: data['Duración (min)'] || '0',
        numberOfPlayers: data['Número de jugadores'] || '',
        variations: data['Variantes'] || '',
        consejos: data['Consejos para el entrenador'] || '',
        image: data['Imagen'] || '',
        aiHint: data['aiHint'] || '',
        visible: data['Visible'] !== false,
        'Espacio y materiales necesarios': data['Espacio y materiales necesarios'] || '',
        ...data
    };
}


export const sessions: Session[] = [
    {
        id: '1',
        name: 'Sesión de Técnica y Posesión',
        date: '2024-08-01',
        exercises: [{id: '1', name: 'Rondo 4 vs 1'}],
    },
    {
        id: '2',
        name: 'Entrenamiento Físico y Transiciones',
        date: '2024-08-03',
        exercises: [{id: '2', name: 'Finalización 2 vs 1'}],
    },
    {
        id: '3',
        name: 'Preparación de Partido',
        date: '2024-08-05',
        exercises: [{id: '2', name: 'Finalización 2 vs 1'}],
    }
]

export type Session = {
    id: string;
    name: string;
    date: string;
    exercises: Partial<Exercise>[]; // Can be partial if just storing references
}


export type Match = {
    id: string;
    opponent: string;
    date: string;
    result: 'Victoria' | 'Derrota' | 'Empate';
    score: string;
    stats: {
        goals: number;
        assists: number;
        shots: number;
        possession: number;
    }
}

export const matches: Match[] = [
    {
        id: '1',
        opponent: 'Titanes del Futsal',
        date: '2024-07-28',
        result: 'Victoria',
        score: '5 - 3',
        stats: {
            goals: 5,
            assists: 4,
            shots: 15,
            possession: 65,
        }
    },
    {
        id: '2',
        opponent: 'Inter Sala',
        date: '2024-07-21',
        result: 'Derrota',
        score: '2 - 4',
        stats: {
            goals: 2,
            assists: 1,
            shots: 8,
            possession: 45,
        }
    },
    {
        id: '3',
        opponent: 'Furia Roja FS',
        date: '2024-07-14',
        result: 'Empate',
        score: '2 - 2',
        stats: {
            goals: 2,
            assists: 2,
            shots: 12,
            possession: 55,
        }
    }
]

```
- src/middleware.ts:
```ts
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  if (process.env.NODE_ENV === 'development') {
    response.headers.set('Access-Control-Allow-Origin', '*')
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-api-key, x-goog-api-client, x-goog-request-params')
  }

  return response
}

export const config = {
  matcher: ['/api/:path*', '/'], // rutas donde aplicará el middleware
}
```

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RefreshCw, Plus, Minus, Flag, Settings, BarChart, Goal, ShieldAlert, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import Link from 'next/link';


const FoulIndicator = ({ count, max = 5 }: { count: number; max?: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(max)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-red-500", i < count ? "bg-red-500" : "bg-transparent")}/>
        ))}
    </div>
);

const StatCounter = ({ label, value, onIncrement, onDecrement, icon: Icon }: { label: string; value: number; onIncrement: () => void; onDecrement: () => void; icon: React.ElementType }) => (
    <div className="flex items-center justify-between border-b py-3 last:border-none">
        <div className="flex items-center gap-3">
            <Icon className="h-5 w-5 text-muted-foreground" />
            <span className="font-medium text-sm">{label}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onDecrement}><Minus className="h-4 w-4"/></Button>
            <span className="w-6 text-center tabular-nums font-bold text-lg">{value}</span>
            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onIncrement}><Plus className="h-4 w-4"/></Button>
        </div>
    </div>
);

const GeneralStats = ({ localStats, visitorStats, onStatChange, onResetAll }: { 
    localStats: any, 
    visitorStats: any, 
    onStatChange: (team: 'local' | 'visitor', stat: keyof typeof localStats, increment: boolean) => void,
    onResetAll: () => void
}) => {
    
    const YellowCardIcon = () => <div className="w-3 h-4 bg-yellow-400 border border-black" />;
    const RedCardIcon = () => <div className="w-3 h-4 bg-red-600 border border-black" />;

    return (
        <Card className="w-full max-w-2xl shadow-lg mt-8">
             <CardHeader className="bg-primary text-primary-foreground p-4 flex flex-row items-center justify-between rounded-t-lg">
                <CardTitle className="text-lg">Estadísticas Generales</CardTitle>
                <Button variant="destructive" size="sm" onClick={onResetAll}>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Reiniciar Todo
                </Button>
            </CardHeader>
            <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-x-8">
                 {/* Local Team Stats */}
                <div className="space-y-2">
                    <h3 className="font-bold text-center mb-2">Local</h3>
                    <StatCounter 
                        label="Goles" 
                        value={localStats.goals}
                        onIncrement={() => onStatChange('local', 'goals', true)}
                        onDecrement={() => onStatChange('local', 'goals', false)}
                        icon={Goal}
                    />
                     <StatCounter 
                        label="Faltas" 
                        value={localStats.fouls}
                        onIncrement={() => onStatChange('local', 'fouls', true)}
                        onDecrement={() => onStatChange('local', 'fouls', false)}
                        icon={ShieldAlert}
                    />
                     <StatCounter 
                        label="T. Amarillas" 
                        value={localStats.yellowCards}
                        onIncrement={() => onStatChange('local', 'yellowCards', true)}
                        onDecrement={() => onStatChange('local', 'yellowCards', false)}
                        icon={YellowCardIcon}
                    />
                     <StatCounter 
                        label="T. Rojas" 
                        value={localStats.redCards}
                        onIncrement={() => onStatChange('local', 'redCards', true)}
                        onDecrement={() => onStatChange('local', 'redCards', false)}
                        icon={RedCardIcon}
                    />
                </div>
                 {/* Visitor Team Stats */}
                <div className="space-y-2">
                    <h3 className="font-bold text-center mb-2">Visitante</h3>
                     <StatCounter 
                        label="Goles" 
                        value={visitorStats.goals}
                        onIncrement={() => onStatChange('visitor', 'goals', true)}
                        onDecrement={() => onStatChange('visitor', 'goals', false)}
                        icon={Goal}
                    />
                     <StatCounter 
                        label="Faltas" 
                        value={visitorStats.fouls}
                        onIncrement={() => onStatChange('visitor', 'fouls', true)}
                        onDecrement={() => onStatChange('visitor', 'fouls', false)}
                        icon={ShieldAlert}
                    />
                     <StatCounter 
                        label="T. Amarillas" 
                        value={visitorStats.yellowCards}
                        onIncrement={() => onStatChange('visitor', 'yellowCards', true)}
                        onDecrement={() => onStatChange('visitor', 'yellowCards', false)}
                        icon={YellowCardIcon}
                    />
                     <StatCounter 
                        label="T. Rojas" 
                        value={visitorStats.redCards}
                        onIncrement={() => onStatChange('visitor', 'redCards', true)}
                        onDecrement={() => onStatChange('visitor', 'redCards', false)}
                        icon={RedCardIcon}
                    />
                </div>
            </CardContent>
        </Card>
    )
}


export default function QuickScoreboardPage() {
    const { toast } = useToast();
    
    // Config state
    const [matchDuration, setMatchDuration] = useState(25 * 60);
    const [localTeam, setLocalTeam] = useState('Local');
    const [visitorTeam, setVisitorTeam] = useState('Visitante');
    const [maxTimeouts, setMaxTimeouts] = useState(1);

    // Main Scoreboard State
    const [localTimeouts, setLocalTimeouts] = useState(0);
    const [visitorTimeouts, setVisitorTimeouts] = useState(0);
    
    // General Stats State
    const [generalStats, setGeneralStats] = useState({
        local: { goals: 0, fouls: 0, yellowCards: 0, redCards: 0 },
        visitor: { goals: 0, fouls: 0, yellowCards: 0, redCards: 0 },
    });

    // Timer and Period State
    const [time, setTime] = useState(matchDuration);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [period, setPeriod] = useState(1);
    
    // Config Dialog State
    const [configDuration, setConfigDuration] = useState(25);
    const [configLocalName, setConfigLocalName] = useState('Local');
    const [configVisitorName, setConfigVisitorName] = useState('Visitante');
    const [isSheetOpen, setIsSheetOpen] = useState(false);

    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isTimerActive && time > 0) {
            interval = setInterval(() => {
                setTime(prevTime => prevTime - 1);
            }, 1000);
        } else if (isTimerActive && time === 0) {
            setIsTimerActive(false);
            toast({ title: "Tiempo Finalizado", description: `Ha terminado la ${period}ª parte.` });
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isTimerActive, time, period, toast]);

    const formatTime = (seconds: number) => {
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    };
    
    const handleTimeout = (team: 'local' | 'visitor') => {
        const state = team === 'local' ? localTimeouts : visitorTimeouts;
        const setter = team === 'local' ? setLocalTimeouts : setVisitorTimeouts;
        if (state < maxTimeouts) {
            setter(prev => prev + 1);
            toast({ title: 'Tiempo Muerto', description: `Tiempo muerto solicitado por ${team === 'local' ? localTeam : visitorTeam}.` });
        }
    };
    
    const resetPeriod = () => {
        setTime(matchDuration);
        setIsTimerActive(false);
        setLocalTimeouts(0);
        setVisitorTimeouts(0);
        setGeneralStats(prev => ({
            ...prev,
            local: { ...prev.local, fouls: 0 },
            visitor: { ...prev.visitor, fouls: 0 },
        }));
    };

    const handlePeriodChange = (newPeriod: number) => {
        if (period !== newPeriod) {
            setPeriod(newPeriod);
            resetPeriod();
        }
    };
    
    const resetMatch = () => {
        setGeneralStats({
            local: { goals: 0, fouls: 0, yellowCards: 0, redCards: 0 },
            visitor: { goals: 0, fouls: 0, yellowCards: 0, redCards: 0 },
        });
        handlePeriodChange(1);
    };

    const applySettings = () => {
        setLocalTeam(configLocalName);
        setVisitorTeam(configVisitorName);
        const newDurationInSeconds = configDuration * 60;
        setMatchDuration(newDurationInSeconds);
        if (!isTimerActive) {
            setTime(newDurationInSeconds);
        }
        toast({title: "Configuración guardada", description: "Se han aplicado los nuevos ajustes."})
        setIsSheetOpen(false);
    };
    
    const handleGeneralStatChange = (team: 'local' | 'visitor', stat: keyof typeof generalStats.local, increment: boolean) => {
        setGeneralStats(prev => {
            const currentVal = prev[team][stat];
            const newValue = increment ? currentVal + 1 : Math.max(0, currentVal - 1);
    
            if (stat === 'fouls' && increment && newValue > 5) {
                toast({ title: 'Límite de Faltas', description: 'El equipo ha superado las 5 faltas acumuladas.', variant: 'destructive'});
            }
    
            return {
                ...prev,
                [team]: { ...prev[team], [stat]: newValue }
            };
        });
    };
    
    useEffect(() => {
        setConfigLocalName(localTeam);
        setConfigVisitorName(visitorTeam);
        setConfigDuration(matchDuration / 60);
    }, [isSheetOpen, localTeam, visitorTeam, matchDuration]);
    

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
            <div className="w-full max-w-2xl">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href={`/equipo/gestion`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
            </div>
            <div className="text-center mb-8">
                 <div className="flex justify-center items-center mb-4">
                    <div className="bg-primary/10 p-4 rounded-lg">
                        <BarChart className="w-8 h-8 text-primary" />
                    </div>
                 </div>
                <h1 className="text-4xl font-bold font-headline text-primary">Marcador Rápido</h1>
                <p className="text-lg text-muted-foreground mt-2">Usa el marcador para un partido rápido o un entrenamiento.</p>
            </div>
            
            <Card className="w-full max-w-2xl shadow-lg">
                <CardContent className="p-4 md:p-8 space-y-6">
                    {/* Score Display */}
                    <div className="flex items-center justify-between text-center mb-4 gap-4">
                        <div className="flex-1 space-y-2">
                            <h2 className="text-lg md:text-xl font-bold truncate">{localTeam}</h2>
                             <FoulIndicator count={generalStats.local.fouls} />
                        </div>
                        
                        <div className="text-4xl md:text-5xl font-bold tabular-nums text-primary px-4">
                            {generalStats.local.goals} - {generalStats.visitor.goals}
                        </div>

                        <div className="flex-1 space-y-2">
                            <h2 className="text-lg md:text-xl font-bold truncate">{visitorTeam}</h2>
                            <FoulIndicator count={generalStats.visitor.fouls} />
                        </div>
                    </div>
                    
                    {/* Timer */}
                    <div className="flex justify-center items-center gap-4 mb-4">
                         <Button size="sm" variant="outline" onClick={() => handleTimeout('local')} disabled={localTimeouts >= maxTimeouts} className={cn("w-16 mx-auto", localTimeouts > 0 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                            TM
                         </Button>
                         <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
                            {formatTime(time)}
                        </div>
                        <Button size="sm" variant="outline" onClick={() => handleTimeout('visitor')} disabled={visitorTimeouts >= maxTimeouts} className={cn("w-16 mx-auto", visitorTimeouts > 0 && "bg-primary hover:bg-primary/90 text-primary-foreground")}>
                            TM
                        </Button>
                    </div>

                    {/* Main Controls */}
                    <div className="flex justify-center items-center gap-4">
                        <Button onClick={() => setIsTimerActive(!isTimerActive)} variant="default" size="sm" className={cn(isTimerActive ? "bg-destructive hover:bg-destructive/90" : "bg-primary hover:bg-primary/90")}>
                            {isTimerActive ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                            {isTimerActive ? 'Pausar' : 'Iniciar'}
                        </Button>
                        <Button onClick={resetPeriod} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4"/> Reiniciar
                        </Button>
                        <Dialog open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <DialogTrigger asChild>
                                 <Button variant="ghost" size="icon"><Settings /></Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-md">
                                <DialogHeader>
                                    <DialogTitle>Configuración del Marcador</DialogTitle>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="local-name">Equipo Local</Label>
                                        <Input id="local-name" value={configLocalName} onChange={(e) => setConfigLocalName(e.target.value)} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="visitor-name">Equipo Visitante</Label>
                                        <Input id="visitor-name" value={configVisitorName} onChange={(e) => setConfigVisitorName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Tiempo (min)</Label>
                                        <Input id="duration" type="number" value={configDuration} onChange={(e) => setConfigDuration(Number(e.target.value))} />
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button onClick={applySettings} className="w-full">Aplicar Cambios</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>

                    {/* Period selection */}
                    <div className="flex justify-center pt-4">
                        <div className="flex rounded-md border p-1">
                            <Button onClick={() => handlePeriodChange(1)} variant={period === 1 ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">1ª Parte</Button>
                            <Button onClick={() => handlePeriodChange(2)} variant={period === 2 ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">2ª Parte</Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <GeneralStats 
                localStats={generalStats.local}
                visitorStats={generalStats.visitor}
                onStatChange={handleGeneralStatChange}
                onResetAll={resetMatch}
            />
        </div>
    );
}

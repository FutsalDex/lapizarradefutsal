'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RefreshCw, Plus, Minus, Flag, Settings, BarChart } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

const FoulIndicator = ({ count, max = 5 }: { count: number; max?: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(max)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-red-500", i < count ? "bg-red-500" : "bg-transparent")}/>
        ))}
    </div>
);

export default function QuickScoreboardPage() {
    const { toast } = useToast();
    
    const [matchDuration, setMatchDuration] = useState(25 * 60);
    const [localTeam, setLocalTeam] = useState('Local');
    const [visitorTeam, setVisitorTeam] = useState('Visitante');
    const [localScore, setLocalScore] = useState(0);
    const [visitorScore, setVisitorScore] = useState(0);
    const [localFouls, setLocalFouls] = useState(0);
    const [visitorFouls, setVisitorFouls] = useState(0);
    const [localTimeouts, setLocalTimeouts] = useState(0);
    const [visitorTimeouts, setVisitorTimeouts] = useState(0);
    const [maxTimeouts, setMaxTimeouts] = useState(1);

    const [time, setTime] = useState(matchDuration);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [period, setPeriod] = useState(1);
    
    // Config state for the sheet
    const [configDuration, setConfigDuration] = useState(25);
    const [configTimeouts, setConfigTimeouts] = useState(1);
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

    const handleScoreChange = (team: 'local' | 'visitor', increment: boolean) => {
        const setter = team === 'local' ? setLocalScore : setVisitorScore;
        setter(prev => (increment ? prev + 1 : Math.max(0, prev - 1)));
    };
    
    const handleFoulChange = (team: 'local' | 'visitor', increment: boolean) => {
        const setter = team === 'local' ? setLocalFouls : setVisitorFouls;
        setter(prev => {
            const newValue = increment ? prev + 1 : Math.max(0, prev - 1);
            if (increment && newValue > 5) {
                toast({ title: 'Límite de Faltas', description: 'El equipo ha superado las 5 faltas acumuladas.', variant: 'destructive'});
                return 6;
            }
            return newValue;
        });
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
        setLocalFouls(0);
        setVisitorFouls(0);
        setLocalTimeouts(0);
        setVisitorTimeouts(0);
    };

    const handlePeriodChange = (newPeriod: number) => {
        if (period !== newPeriod) {
            setPeriod(newPeriod);
            resetPeriod();
        }
    };
    
    const resetMatch = () => {
        setLocalScore(0);
        setVisitorScore(0);
        handlePeriodChange(1);
    };

    const applySettings = () => {
        setLocalTeam(configLocalName);
        setVisitorTeam(configVisitorName);
        setMaxTimeouts(configTimeouts);
        const newDurationInSeconds = configDuration * 60;
        setMatchDuration(newDurationInSeconds);
        if (!isTimerActive) {
            setTime(newDurationInSeconds);
        }
        toast({title: "Configuración guardada", description: "Se han aplicado los nuevos ajustes."})
        setIsSheetOpen(false);
    };
    
    useEffect(() => {
        setConfigLocalName(localTeam);
        setConfigVisitorName(visitorTeam);
        setConfigDuration(matchDuration / 60);
        setConfigTimeouts(maxTimeouts);
    }, [isSheetOpen, localTeam, visitorTeam, matchDuration, maxTimeouts]);

    return (
        <div className="container mx-auto px-4 py-8 flex flex-col items-center">
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
                    <div className="grid grid-cols-3 items-start text-center mb-4 gap-4">
                        <div className="space-y-2">
                            <h2 className="text-xl md:text-2xl font-bold truncate">{localTeam}</h2>
                             <FoulIndicator count={localFouls} />
                        </div>
                        
                        <div className="text-5xl md:text-6xl font-bold tabular-nums text-primary">
                            {localScore} - {visitorScore}
                        </div>

                        <div className="space-y-2">
                            <h2 className="text-xl md:text-2xl font-bold truncate">{visitorTeam}</h2>
                            <FoulIndicator count={visitorFouls} />
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
                        <Button onClick={() => setIsTimerActive(!isTimerActive)} variant="default" size="sm" className={cn(isTimerActive ? "bg-destructive hover:bg-destructive/90" : "bg-green-600 hover:bg-green-700")}>
                            {isTimerActive ? <Pause className="mr-2 h-4 w-4"/> : <Play className="mr-2 h-4 w-4"/>}
                            {isTimerActive ? 'Pausar' : 'Iniciar'}
                        </Button>
                        <Button onClick={resetPeriod} variant="outline" size="sm">
                            <RefreshCw className="mr-2 h-4 w-4"/> Reiniciar
                        </Button>
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                 <Button variant="ghost" size="icon"><Settings /></Button>
                            </SheetTrigger>
                            <SheetContent>
                                <SheetHeader>
                                    <SheetTitle>Configuración del Marcador</SheetTitle>
                                </SheetHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="local-name">Nombre Equipo Local</Label>
                                        <Input id="local-name" value={configLocalName} onChange={(e) => setConfigLocalName(e.target.value)} />
                                    </div>
                                     <div className="space-y-2">
                                        <Label htmlFor="visitor-name">Nombre Equipo Visitante</Label>
                                        <Input id="visitor-name" value={configVisitorName} onChange={(e) => setConfigVisitorName(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="duration">Duración de la Parte (minutos)</Label>
                                        <Input id="duration" type="number" value={configDuration} onChange={(e) => setConfigDuration(Number(e.target.value))} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="timeouts">Tiempos Muertos por Parte</Label>
                                        <Input id="timeouts" type="number" value={configTimeouts} onChange={(e) => setConfigTimeouts(Number(e.target.value))} min="1" max="5"/>
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Puntuación</Label>
                                        <div className='flex gap-4'>
                                            <Input type="number" value={localScore} onChange={(e) => setLocalScore(Number(e.target.value))} />
                                            <Input type="number" value={visitorScore} onChange={(e) => setVisitorScore(Number(e.target.value))} />
                                        </div>
                                    </div>
                                     <div className="space-y-2">
                                        <Label>Faltas</Label>
                                         <div className='flex gap-4'>
                                            <Input type="number" value={localFouls} onChange={(e) => setLocalFouls(Number(e.target.value))} />
                                            <Input type="number" value={visitorFouls} onChange={(e) => setVisitorFouls(Number(e.target.value))} />
                                        </div>
                                    </div>
                                </div>
                                <Button onClick={applySettings} className="w-full">Aplicar Cambios</Button>
                            </SheetContent>
                        </Sheet>
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
        </div>
    );
}

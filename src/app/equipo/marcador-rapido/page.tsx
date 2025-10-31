'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RefreshCw, Plus, Minus, Flag, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Label } from '@/components/ui/label';

const FoulIndicator = ({ count, max = 5 }: { count: number, max?: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(max)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-yellow-500", i < count ? "bg-yellow-500" : "bg-transparent")}/>
        ))}
    </div>
);

export default function QuickScoreboardPage() {
    const { toast } = useToast();
    
    const [matchDuration, setMatchDuration] = useState(20 * 60);
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
    const [configDuration, setConfigDuration] = useState(20);
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
            if (newValue > 5) {
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
        setPeriod(newPeriod);
        resetPeriod();
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
             <Card className="w-full max-w-4xl bg-gray-900 text-white shadow-2xl">
                <CardContent className="p-4 md:p-6 space-y-4">
                    {/* Score Display */}
                    <div className="text-center space-y-4">
                        <div className="grid grid-cols-3 items-center">
                            <h2 className="text-2xl md:text-4xl font-bold truncate">{localTeam}</h2>
                            <div className="text-5xl md:text-7xl font-bold tabular-nums">
                                {localScore} - {visitorScore}
                            </div>
                            <h2 className="text-2xl md:text-4xl font-bold truncate">{visitorTeam}</h2>
                        </div>
                         <div className="grid grid-cols-3 items-center text-sm text-gray-400">
                             <div className="flex justify-center items-center gap-2">
                                <Button size="sm" variant="outline" className="text-gray-900" onClick={() => handleScoreChange('local', false)}><Minus className="h-4 w-4"/></Button>
                                GOL
                                <Button size="sm" variant="outline" className="text-gray-900" onClick={() => handleScoreChange('local', true)}><Plus className="h-4 w-4"/></Button>
                             </div>
                             <div></div>
                             <div className="flex justify-center items-center gap-2">
                                <Button size="sm" variant="outline" className="text-gray-900" onClick={() => handleScoreChange('visitor', false)}><Minus className="h-4 w-4"/></Button>
                                GOL
                                <Button size="sm" variant="outline" className="text-gray-900" onClick={() => handleScoreChange('visitor', true)}><Plus className="h-4 w-4"/></Button>
                             </div>
                        </div>
                    </div>

                    {/* Timer and Fouls */}
                     <div className="bg-black/50 p-4 rounded-lg space-y-4">
                        <div className="flex justify-center items-center gap-4 md:gap-8">
                             <div className="text-center">
                                <div className="text-sm text-gray-400">FALTAS</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-700" onClick={() => handleFoulChange('local', false)}><Minus className="h-4 w-4"/></Button>
                                    <span className="text-2xl font-bold w-6 text-center">{localFouls}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-700" onClick={() => handleFoulChange('local', true)}><Plus className="h-4 w-4"/></Button>
                                </div>
                             </div>
                             <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums">
                                {formatTime(time)}
                            </div>
                             <div className="text-center">
                                <div className="text-sm text-gray-400">FALTAS</div>
                                <div className="flex items-center gap-2 mt-1">
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-700" onClick={() => handleFoulChange('visitor', false)}><Minus className="h-4 w-4"/></Button>
                                    <span className="text-2xl font-bold w-6 text-center">{visitorFouls}</span>
                                    <Button variant="ghost" size="icon" className="h-7 w-7 text-white hover:bg-gray-700" onClick={() => handleFoulChange('visitor', true)}><Plus className="h-4 w-4"/></Button>
                                </div>
                            </div>
                        </div>
                        {/* Timeouts */}
                        <div className="flex justify-between items-center px-4">
                            <div className='flex flex-col items-center gap-2'>
                                <span className='text-xs text-gray-400'>TIEMPO MUERTO</span>
                                <Button size="sm" variant="outline" className="text-gray-900 w-20" onClick={() => handleTimeout('local')} disabled={localTimeouts >= maxTimeouts}>TM</Button>
                                <FoulIndicator count={localTimeouts} max={maxTimeouts} />
                            </div>
                            <div className='flex flex-col items-center gap-2'>
                                <span className='text-xs text-gray-400'>TIEMPO MUERTO</span>
                                <Button size="sm" variant="outline" className="text-gray-900 w-20" onClick={() => handleTimeout('visitor')} disabled={visitorTimeouts >= maxTimeouts}>TM</Button>
                                <FoulIndicator count={visitorTimeouts} max={maxTimeouts} />
                            </div>
                        </div>
                    </div>

                    {/* Main Controls */}
                    <div className="flex justify-center items-center flex-wrap gap-2 md:gap-4">
                        <Button onClick={() => setIsTimerActive(!isTimerActive)} size="lg" className={cn("w-32", isTimerActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}>
                            {isTimerActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                            {isTimerActive ? 'Pausar' : 'Iniciar'}
                        </Button>
                        <Button onClick={resetPeriod} variant="outline" className="text-gray-900" size="lg"><RefreshCw className="mr-2"/> Reiniciar Parte</Button>
                        <div className="flex rounded-md border p-1 bg-gray-200">
                            <Button onClick={() => handlePeriodChange(1)} variant={period === 1 ? 'secondary' : 'ghost'} className={cn(period === 1 ? 'text-black' : 'text-gray-900')}>1ª PARTE</Button>
                            <Button onClick={() => handlePeriodChange(2)} variant={period === 2 ? 'secondary' : 'ghost'} className={cn(period === 2 ? 'text-black' : 'text-gray-900')}>2ª PARTE</Button>
                        </div>
                         <Button onClick={resetMatch} variant="destructive" size="lg"><Flag className="mr-2"/> Reiniciar Partido</Button>
                        <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
                            <SheetTrigger asChild>
                                 <Button variant="outline" size="icon" className="text-gray-900"><Settings /></Button>
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
                                </div>
                                <Button onClick={applySettings} className="w-full">Aplicar Cambios</Button>
                            </SheetContent>
                        </Sheet>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

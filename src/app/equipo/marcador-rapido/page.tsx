'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Play, Pause, RefreshCw, Plus, Minus, Flag, ShieldAlert, BarChart3, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const FoulIndicator = ({ count, max = 5 }: { count: number, max?: number }) => (
    <div className="flex justify-center gap-1.5 mt-2">
        {[...Array(max)].map((_, i) => (
            <div key={i} className={cn("h-3 w-3 rounded-full border border-red-500", i < count ? "bg-red-500" : "bg-transparent")}/>
        ))}
    </div>
);

export default function QuickScoreboardPage() {
    const { toast } = useToast();
    const matchDuration = 25 * 60; // 25 minutes

    const [localTeam, setLocalTeam] = useState('Local');
    const [visitorTeam, setVisitorTeam] = useState('Visitante');
    const [localScore, setLocalScore] = useState(0);
    const [visitorScore, setVisitorScore] = useState(0);
    const [localFouls, setLocalFouls] = useState(0);
    const [visitorFouls, setVisitorFouls] = useState(0);
    const [localTimeouts, setLocalTimeouts] = useState(0);
    const [visitorTimeouts, setVisitorTimeouts] = useState(0);

    const [time, setTime] = useState(matchDuration);
    const [isTimerActive, setIsTimerActive] = useState(false);
    const [period, setPeriod] = useState(1);

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
        if (state < 1) {
            setter(1);
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

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="text-center mb-8">
                 <div className="flex items-center justify-center gap-3">
                    <BarChart3 className="h-10 w-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline text-primary">Marcador Rápido</h1>
                        <p className="text-lg text-muted-foreground mt-1">Un marcador simple para tus partidos o entrenamientos.</p>
                    </div>
                </div>
            </div>

            <Card className="max-w-4xl mx-auto">
                <CardContent className="p-4 md:p-6 space-y-6">
                    {/* Team Names and Scores */}
                    <div className="grid grid-cols-3 items-start text-center gap-4">
                        <div className="space-y-2">
                             <Input className="text-xl md:text-2xl font-bold text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0" value={localTeam} onChange={e => setLocalTeam(e.target.value)} />
                             <div className="flex items-center justify-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => handleScoreChange('local', false)}><Minus/></Button>
                                <span className="text-5xl md:text-7xl font-bold tabular-nums">{localScore}</span>
                                <Button size="icon" variant="outline" onClick={() => handleScoreChange('local', true)}><Plus/></Button>
                             </div>
                             <FoulIndicator count={localFouls} />
                        </div>
                        
                        <div className="text-5xl md:text-7xl font-bold tabular-nums text-primary pt-10">
                            -
                        </div>

                        <div className="space-y-2">
                            <Input className="text-xl md:text-2xl font-bold text-center border-0 focus-visible:ring-0 focus-visible:ring-offset-0" value={visitorTeam} onChange={e => setVisitorTeam(e.target.value)} />
                             <div className="flex items-center justify-center gap-2">
                                <Button size="icon" variant="outline" onClick={() => handleScoreChange('visitor', false)}><Minus/></Button>
                                <span className="text-5xl md:text-7xl font-bold tabular-nums">{visitorScore}</span>
                                <Button size="icon" variant="outline" onClick={() => handleScoreChange('visitor', true)}><Plus/></Button>
                             </div>
                            <FoulIndicator count={visitorFouls} />
                        </div>
                    </div>
                    
                    {/* Timer and Controls */}
                    <div className="bg-muted p-4 rounded-lg space-y-4">
                        <div className="flex justify-center items-center gap-4">
                            <Button variant="outline" onClick={() => handleTimeout('local')} disabled={localTimeouts >= 1}>TM</Button>
                            <div className="text-6xl md:text-8xl font-mono font-bold tabular-nums bg-gray-900 text-white rounded-lg px-4 py-2">
                                {formatTime(time)}
                            </div>
                            <Button variant="outline" onClick={() => handleTimeout('visitor')} disabled={visitorTimeouts >= 1}>TM</Button>
                        </div>

                        <div className="flex justify-center items-center gap-2 md:gap-4">
                            <Button onClick={() => setIsTimerActive(!isTimerActive)} size="sm" className={cn("w-28", isTimerActive ? "bg-red-600 hover:bg-red-700" : "bg-green-600 hover:bg-green-700")}>
                                {isTimerActive ? <Pause className="mr-2"/> : <Play className="mr-2"/>}
                                {isTimerActive ? 'Pausar' : 'Iniciar'}
                            </Button>
                            <Button onClick={resetPeriod} variant="outline" size="sm"><RefreshCw className="mr-2"/> Reiniciar Parte</Button>
                            <div className="flex rounded-md border p-1 bg-background">
                                <Button onClick={() => handlePeriodChange(1)} variant={period === 1 ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">1ªP</Button>
                                <Button onClick={() => handlePeriodChange(2)} variant={period === 2 ? 'secondary' : 'ghost'} size="sm" className="h-8 px-3">2ªP</Button>
                            </div>
                             <Button onClick={resetMatch} variant="destructive" size="sm"><Flag className="mr-2"/> Reiniciar Partido</Button>
                        </div>
                    </div>

                    {/* Fouls */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> <span className="font-medium">Faltas {localTeam}</span></div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleFoulChange('local', false)}><Minus/></Button>
                                    <span className="text-lg font-bold w-6 text-center">{localFouls}</span>
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleFoulChange('local', true)}><Plus/></Button>
                                </div>
                            </CardContent>
                        </Card>
                         <Card>
                            <CardContent className="p-3 flex items-center justify-between">
                                <div className="flex items-center gap-2"><ShieldAlert className="text-destructive"/> <span className="font-medium">Faltas {visitorTeam}</span></div>
                                <div className="flex items-center gap-2">
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleFoulChange('visitor', false)}><Minus/></Button>
                                    <span className="text-lg font-bold w-6 text-center">{visitorFouls}</span>
                                    <Button size="icon" variant="outline" className="h-8 w-8" onClick={() => handleFoulChange('visitor', true)}><Plus/></Button>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                </CardContent>
            </Card>
        </div>
    );
}

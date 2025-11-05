"use client";

import { useState, useEffect, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Play, Pause, RotateCcw, Plus, Minus, Goal, ShieldAlert, BarChart3, Settings } from "lucide-react";
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';

type Stat = {
    goles: number;
    faltas: number;
    amarillas: number;
    rojas: number;
};

type Periodo = '1ª Parte' | '2ª Parte';

const initialStats: Stat = {
    goles: 0,
    faltas: 0,
    amarillas: 0,
    rojas: 0,
};

const StatCounter = ({ title, value, onIncrement, onDecrement, icon }: { title: string; value: number; onIncrement: () => void; onDecrement: () => void; icon: React.ReactNode }) => (
    <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
            {icon}
            <span className="font-medium">{title}</span>
        </div>
        <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onDecrement} disabled={value <= 0}>
                <Minus className="h-4 w-4" />
            </Button>
            <span className="w-6 text-center text-lg font-bold">{value}</span>
            <Button variant="outline" size="icon" className="h-7 w-7" onClick={onIncrement}>
                <Plus className="h-4 w-4" />
            </Button>
        </div>
    </div>
);

export default function MarcadorRapidoPage() {
    const { toast } = useToast();
    const [localStats, setLocalStats] = useState<Stat>(initialStats);
    const [visitanteStats, setVisitanteStats] = useState<Stat>(initialStats);
    const [time, setTime] = useState(25 * 60);
    const [isActive, setIsActive] = useState(false);
    const [periodo, setPeriodo] = useState<Periodo>('1ª Parte');
    
    useEffect(() => {
        let interval: NodeJS.Timeout | null = null;
        if (isActive && time > 0) {
            interval = setInterval(() => {
                setTime((prevTime) => prevTime - 1);
            }, 1000);
        } else if (time === 0) {
            setIsActive(false);
            toast({ title: `Final de la ${periodo}` });
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, time, periodo, toast]);

    const toggleTimer = () => setIsActive(!isActive);

    const resetTimer = () => {
        setIsActive(false);
        setTime(25 * 60);
    };
    
    const handleStatChange = (
        team: 'local' | 'visitante', 
        stat: keyof Stat, 
        delta: number
    ) => {
        const setStats = team === 'local' ? setLocalStats : setVisitanteStats;
        setStats(prev => {
            const newValue = Math.max(0, (prev[stat] || 0) + delta);
            return { ...prev, [stat]: newValue };
        });
    };

    const resetAll = () => {
        resetTimer();
        setLocalStats(initialStats);
        setVisitanteStats(initialStats);
        setPeriodo('1ª Parte');
        toast({
            title: "Marcador reiniciado",
            description: "Todas las estadísticas y el tiempo han sido restablecidos.",
        });
    }

    const formatTime = (timeInSeconds: number) => {
        const minutes = Math.floor(timeInSeconds / 60);
        const seconds = timeInSeconds % 60;
        return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
    };

    const SquareIcon = ({ className }: { className?: string }) => (
        <div className={cn("w-3 h-4", className)} />
    );

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
            <Button variant="outline" asChild>
                <Link href="/panel">
                    <ArrowLeft className="mr-2" />
                    Volver al Panel
                </Link>
            </Button>
        </div>
        <div className="text-center mb-8 max-w-lg mx-auto">
            <div className="flex justify-center mb-4">
                <div className="bg-muted p-3 rounded-full inline-flex">
                    <BarChart3 className="w-8 h-8 text-primary" />
                </div>
            </div>
            <h1 className="text-4xl font-bold font-headline">Marcador Rápido</h1>
            <p className="text-lg text-muted-foreground mt-2">
                Usa el marcador para un partido rápido o un entrenamiento.
            </p>
        </div>

        <div className="max-w-2xl mx-auto space-y-8">
            <Card>
                <CardContent className="p-6">
                    <div className="grid grid-cols-3 items-center text-center">
                        {/* Equipo Local */}
                        <div className="flex flex-col items-center gap-4">
                            <h2 className="text-xl font-bold">Local</h2>
                            <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < localStats.faltas ? 'bg-destructive' : '')}></div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm">TM</Button>
                        </div>

                        {/* Score y Timer */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="text-6xl font-bold text-primary">{localStats.goles} - {visitanteStats.goles}</div>
                            <div className="text-6xl font-bold bg-gray-900 text-white p-4 rounded-lg w-full">
                               {formatTime(time)}
                            </div>
                        </div>

                        {/* Equipo Visitante */}
                        <div className="flex flex-col items-center gap-4">
                            <h2 className="text-xl font-bold">Visitante</h2>
                            <div className="flex items-center gap-2">
                                {[...Array(5)].map((_, i) => (
                                    <div key={i} className={cn("w-4 h-4 rounded-full border-2 border-destructive", i < visitanteStats.faltas ? 'bg-destructive' : '')}></div>
                                ))}
                            </div>
                            <Button variant="outline" size="sm">TM</Button>
                        </div>
                    </div>
                     <div className="flex justify-center gap-4 mt-6">
                        <Button onClick={toggleTimer}>
                            {isActive ? <><Pause className="mr-2"/>Pausar</> : <><Play className="mr-2"/>Iniciar</>}
                        </Button>
                        <Button variant="outline" onClick={resetTimer}><RotateCcw className="mr-2"/>Reiniciar</Button>
                        <Button variant="ghost" size="icon"><Settings /></Button>
                    </div>
                    <div className="flex justify-center gap-2 mt-4">
                        <Button variant={periodo === '1ª Parte' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPeriodo('1ª Parte')}>1ª Parte</Button>
                        <Button variant={periodo === '2ª Parte' ? 'secondary' : 'ghost'} size="sm" onClick={() => setPeriodo('2ª Parte')}>2ª Parte</Button>
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader className="flex-row items-center justify-between bg-primary text-primary-foreground p-4 rounded-t-lg">
                    <CardTitle className="text-lg">Estadísticas Generales</CardTitle>
                    <Button variant="destructive" onClick={resetAll}><RotateCcw className="mr-2"/>Reiniciar Todo</Button>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <h3 className="font-bold text-center">Local</h3>
                             <StatCounter 
                                title="Goles"
                                value={localStats.goles}
                                onIncrement={() => handleStatChange('local', 'goles', 1)}
                                onDecrement={() => handleStatChange('local', 'goles', -1)}
                                icon={<Goal className="text-muted-foreground" />}
                           />
                            <StatCounter 
                                title="Faltas"
                                value={localStats.faltas}
                                onIncrement={() => handleStatChange('local', 'faltas', 1)}
                                onDecrement={() => handleStatChange('local', 'faltas', -1)}
                                icon={<ShieldAlert className="text-muted-foreground" />}
                           />
                            <StatCounter 
                                title="T. Amarillas"
                                value={localStats.amarillas}
                                onIncrement={() => handleStatChange('local', 'amarillas', 1)}
                                onDecrement={() => handleStatChange('local', 'amarillas', -1)}
                                icon={<SquareIcon className="bg-yellow-400" />}
                           />
                           <StatCounter 
                                title="T. Rojas"
                                value={localStats.rojas}
                                onIncrement={() => handleStatChange('local', 'rojas', 1)}
                                onDecrement={() => handleStatChange('local', 'rojas', -1)}
                                icon={<SquareIcon className="bg-red-600" />}
                           />
                        </div>
                         <div className="space-y-4">
                            <h3 className="font-bold text-center">Visitante</h3>
                             <StatCounter 
                                title="Goles"
                                value={visitanteStats.goles}
                                onIncrement={() => handleStatChange('visitante', 'goles', 1)}
                                onDecrement={() => handleStatChange('visitante', 'goles', -1)}
                                icon={<Goal className="text-muted-foreground" />}
                           />
                            <StatCounter 
                                title="Faltas"
                                value={visitanteStats.faltas}
                                onIncrement={() => handleStatChange('visitante', 'faltas', 1)}
                                onDecrement={() => handleStatChange('visitante', 'faltas', -1)}
                                icon={<ShieldAlert className="text-muted-foreground" />}
                           />
                            <StatCounter 
                                title="T. Amarillas"
                                value={visitanteStats.amarillas}
                                onIncrement={() => handleStatChange('visitante', 'amarillas', 1)}
                                onDecrement={() => handleStatChange('visitante', 'amarillas', -1)}
                                icon={<SquareIcon className="bg-yellow-400" />}
                           />
                           <StatCounter 
                                title="T. Rojas"
                                value={visitanteStats.rojas}
                                onIncrement={() => handleStatChange('visitante', 'rojas', 1)}
                                onDecrement={() => handleStatChange('visitante', 'rojas', -1)}
                                icon={<SquareIcon className="bg-red-600" />}
                           />
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}

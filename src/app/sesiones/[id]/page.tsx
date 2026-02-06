
'use client';

import { useState, useMemo, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc, query, where, getDocs } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ArrowLeft, Download, Shield, Pencil } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import Image from 'next/image';
import { FutsalCourt } from '@/components/futsal-court';

// ====================
// TIPOS Y SCHEMAS
// ====================

type SessionData = {
    id: string;
    name: string;
    date: any;
    time?: string;
    facility?: string;
    objectives?: string;
    exercises: {
        initial: string[];
        main: string[];
        final: string[];
    };
    sessionType?: 'basic' | 'pro';
    microcycle?: string;
};

type Phase = 'initial' | 'main' | 'final';

// ====================
// COMPONENTES DE PREVISUALIZACIÓN
// ====================

function BasicSessionPreview({ sessionData, exercises }: { sessionData: SessionData, exercises: Exercise[] }) {
    const getExercisesForPhase = (phase: Phase) => {
        const exerciseIds = sessionData.exercises[phase] || [];
        const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));
        return exerciseIds.map(id => exerciseMap.get(id)).filter(Boolean) as Exercise[];
    };

    const PhaseSection = ({ title, phase }: { title: string; phase: Phase }) => {
        const phaseExercises = getExercisesForPhase(phase);
        if (phaseExercises.length === 0) return null;

        return (
            <div className="space-y-2">
                <h3 className="font-bold text-center text-lg bg-gray-200 py-1">{title}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {phaseExercises.map((ex, index) => (
                         <Card key={`${ex.id}-${index}`} className="flex flex-col overflow-hidden">
                             <CardContent className="p-0">
                                <div className="relative aspect-video w-full bg-muted">
                                    {ex.image ? (
                                        <Image
                                            src={ex.image}
                                            alt={ex.name}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <FutsalCourt className="w-full h-full p-1" />
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-1 bg-muted/50 h-10 flex items-center justify-center">
                               <p className="font-semibold text-[9px] text-center w-full leading-tight">{ex.name}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    const date = sessionData.date?.toDate ? sessionData.date.toDate() : new Date();

    return (
        <div className="bg-white text-black w-[21cm] h-[29.7cm] mx-auto p-4 rounded-lg shadow-lg overflow-hidden border flex flex-col">
            <div className="p-2 bg-gray-100 border-b grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-800">
                <div className="font-bold text-lg col-span-2 text-center">Sesión núm: {sessionData.name}</div>
                {date && <div className="font-semibold">Fecha: <span className="font-normal">{format(date, 'PPP', { locale: es })}</span></div>}
                {sessionData.time && <div className="font-semibold">Hora: <span className="font-normal">{sessionData.time}</span></div>}
                {sessionData.facility && <div className="font-semibold">Instalación: <span className="font-normal">{sessionData.facility}</span></div>}
            </div>
            <ScrollArea className="flex-grow">
                 <div className="p-4 space-y-4">
                    <PhaseSection title="Fase Inicial" phase="initial" />
                    <PhaseSection title="Fase Principal" phase="main" />
                    <PhaseSection title="Fase Final" phase="final" />
                 </div>
            </ScrollArea>
        </div>
    )
}

function ProSessionPreview({ sessionData, exercises }: { sessionData: SessionData, exercises: Exercise[] }) {
    const allSessionExercises = useMemo(() => {
        const exerciseMap = new Map(exercises.map(ex => [ex.id, ex]));
        const initial = (sessionData.exercises?.initial || []).map(id => exerciseMap.get(id)).filter(Boolean) as Exercise[];
        const main = (sessionData.exercises?.main || []).map(id => exerciseMap.get(id)).filter(Boolean) as Exercise[];
        const final = (sessionData.exercises?.final || []).map(id => exerciseMap.get(id)).filter(Boolean) as Exercise[];
        return [...initial, ...main, ...final];
    }, [sessionData, exercises]);
    
    const exercisePages = useMemo(() => {
        const pages = [];
        for (let i = 0; i < allSessionExercises.length; i += 3) {
            pages.push(allSessionExercises.slice(i, i + 3));
        }
        return pages;
    }, [allSessionExercises]);


    const ExercisePreview = ({ exercise }: { exercise: Exercise }) => (
         <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="col-span-1 space-y-2">
                 <div className="relative aspect-video bg-muted rounded-md">
                      {exercise.image ? (
                        <Image src={exercise.image} alt={exercise.name} fill className="object-contain p-2" />
                    ) : (
                        <FutsalCourt className="w-full h-full p-1" />
                    )}
                 </div>
                <div className="rounded-md overflow-hidden text-xs text-center border">
                    <div className="grid grid-cols-2 gap-px bg-border">
                        <div className="bg-background p-1"><span className="font-semibold block">Tiempo</span>{exercise.duration} min</div>
                        <div className="bg-background p-1"><span className="font-semibold block">Jugadores</span>{exercise.numberOfPlayers}</div>
                    </div>
                    <div className="bg-background p-1 truncate" title={exercise['Espacio y materiales necesarios'] || ''}>
                        <span className="font-semibold block">Materiales</span>
                        {exercise['Espacio y materiales necesarios'] || 'N/A'}
                    </div>
                </div>
             </div>
             <div className="md:col-span-2 space-y-2">
                 <h4 className="font-bold bg-muted p-2 rounded-t-md text-center">{exercise.name}</h4>
                 <div>
                     <h5 className="font-semibold text-sm">Descripción</h5>
                     <p className="text-xs text-muted-foreground mb-2">{exercise.description}</p>
                 </div>
                  <div>
                    <h5 className="font-semibold text-sm">Objetivos</h5>
                    <p className="text-xs text-muted-foreground">{exercise.objectives}</p>
                 </div>
             </div>
        </div>
    );
    
    const date = sessionData.date?.toDate ? sessionData.date.toDate() : new Date();

    return (
        <>
            {exercisePages.map((pageExercises, pageIndex) => (
                 <div key={pageIndex} className="bg-white text-black w-full md:w-[21cm] h-auto md:h-[29.7cm] mx-auto p-6 rounded-lg shadow-lg overflow-hidden border flex flex-col mb-4 print-page">
                    <div className="p-2 bg-gray-800 text-white grid grid-cols-3 gap-4 items-center text-center text-sm">
                        <div className="flex items-center justify-center gap-2"><span>Microciclo:</span><span className="font-bold">{sessionData.microcycle || 'N/A'}</span></div>
                        <div className="flex items-center justify-center gap-2"><span>Sesión:</span><span className="font-bold">{sessionData.name}</span></div>
                        <div className="flex items-center justify-center gap-2"><span>Fecha:</span><span className="font-bold">{format(date, "dd/MM/yyyy")}</span></div>
                    </div>
                     <ScrollArea className="flex-grow">
                        {pageExercises.map(ex => <ExercisePreview key={ex.id} exercise={ex} />)}
                     </ScrollArea>
                </div>
            ))}
        </>
    );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function SesionDetallePage() {
    const params = useParams();
    const sessionId = params.id as string;
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const pdfPreviewRef = useRef<HTMLDivElement>(null);
    const { toast } = useToast();
    
    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<{ subscription?: 'Básico' | 'Pro' }>(userProfileRef);
    const isPro = userProfile?.subscription === 'Pro';

    const sessionRef = useMemoFirebase(() => {
        if (!firestore || !user || !sessionId) return null;
        return doc(firestore, `users/${user.uid}/sessions`, sessionId);
    }, [firestore, user, sessionId]);
    
    const { data: session, isLoading: isLoadingSession } = useDoc<SessionData>(sessionRef);

    const allExercisesCollection = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'exercises');
    }, [firestore]);

    const { data: rawExercises, isLoading: isLoadingExercises } = useCollection<any>(allExercisesCollection);

    const exercises = useMemo(() => {
        if (!rawExercises) return [];
        return rawExercises.map(mapExercise);
    }, [rawExercises]);
    
    const isLoading = isUserLoading || isLoadingSession || isLoadingExercises;
    
    const handleDownloadPdf = async () => {
        const element = pdfPreviewRef.current;
        if (!element) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el contenido para generar el PDF.' });
            return;
        }

        if (session?.sessionType === 'pro' && !isPro) {
             toast({ variant: 'destructive', title: 'Función Pro', description: 'Necesitas una suscripción Pro para descargar este formato de PDF.' });
             return;
        }

        toast({ title: 'Generando PDF...', description: 'Esto puede tardar unos segundos.' });
        try {
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 0,
                filename: `sesion-${session?.name || 'entrenamiento'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().from(element).set(opt).save();
        } catch (e) {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo generar el PDF.' });
        }
    };


    if (isLoading) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-screen w-full" />
            </div>
        )
    }

    if (!session) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                <h2 className="text-2xl font-bold mb-4">Sesión no encontrada</h2>
                <p className="text-muted-foreground">La sesión que buscas no existe o ha sido eliminada.</p>
                 <Button asChild variant="link" className="mt-4">
                    <Link href="/equipo/mis-sesiones">
                      <ArrowLeft className="mr-2 h-4 w-4" />
                      Volver a Mis Sesiones
                    </Link>
                </Button>
            </div>
        )
    }

    return (
        <div className="bg-gray-100 min-h-screen">
            <header className="bg-background border-b sticky top-0 z-10">
                 <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div>
                         <Button asChild variant="outline">
                            <Link href="/equipo/mis-sesiones">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Volver a Mis Sesiones
                            </Link>
                        </Button>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button asChild variant="outline">
                            <Link href={`/sesiones?sessionId=${sessionId}`}>
                                <Pencil className="mr-2 h-4 w-4"/>
                                Editar
                            </Link>
                        </Button>
                        <Button onClick={handleDownloadPdf} disabled={!isPro && session.sessionType === 'pro'}>
                            <Download className="mr-2 h-4 w-4"/>
                            Descargar PDF
                            {!isPro && session.sessionType === 'pro' && <Shield className="ml-2 h-4 w-4"/>}
                        </Button>
                    </div>
                </div>
            </header>
            <main className="py-8">
                 <div className="container mx-auto px-4">
                    <div ref={pdfPreviewRef}>
                        {session.sessionType === 'pro' ? (
                            <ProSessionPreview sessionData={session} exercises={exercises} />
                        ) : (
                            <BasicSessionPreview sessionData={session} exercises={exercises} />
                        )}
                    </div>
                 </div>
            </main>
        </div>
    );
}

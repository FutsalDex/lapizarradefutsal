'use client';

import { useState, useMemo, useEffect } from 'react';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, query, where } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ClipboardList, Trophy, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface Match {
  id: string;
  localTeam: string;
  visitorTeam: string;
  date: any; // Firestore timestamp
  isFinished: boolean;
  localScore?: number;
  visitorScore?: number;
}

interface Session {
  id: string;
  name: string;
  date: any; // Firestore timestamp
}

type CalendarEvent = {
  id: string;
  date: Date;
  title: string;
  type: 'match' | 'session';
  details: string;
};

function EventDetails({ event }: { event: CalendarEvent | null }) {
    if (!event) {
        return (
            <Card>
                <CardHeader><CardTitle>Elige un evento</CardTitle></CardHeader>
                <CardContent><p className="text-muted-foreground">Selecciona una fecha en el calendario para ver los detalles del evento.</p></CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <div className="flex items-center gap-3">
                    {event.type === 'match' ? <Trophy className="h-6 w-6 text-primary" /> : <ClipboardList className="h-6 w-6 text-primary" />}
                    <div>
                        <CardTitle>{event.title}</CardTitle>
                        <CardDescription>{format(event.date, 'eeee, dd MMMM yyyy', {locale: es})}</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                <p>{event.details}</p>
                 <Button asChild variant="link" className="px-0 mt-2">
                    <Link href="#">Ver detalles completos</Link>
                 </Button>
            </CardContent>
        </Card>
    );
}

export default function EventsCalendarPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
    const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);

    const sessionsQuery = useMemoFirebase(() => {
        if (!user) return null;
        return query(collection(firestore, `users/${user.uid}/sessions`));
    }, [firestore, user]);

    const matchesQuery = useMemoFirebase(() => {
        if (!user) return null;
        // This assumes matches have a `userId` field. If they are tied to a team, this query needs adjustment.
        // For simplicity, we'll use userId.
        return query(collection(firestore, 'matches'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: sessions, isLoading: isLoadingSessions } = useCollection<Session>(sessionsQuery);
    const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

    const allEvents = useMemo<CalendarEvent[]>(() => {
        const sessionEvents: CalendarEvent[] = (sessions || []).map(s => ({
            id: `session-${s.id}`,
            date: s.date?.toDate ? s.date.toDate() : new Date(s.date),
            title: s.name,
            type: 'session',
            details: `Sesión de entrenamiento: ${s.name}`
        }));
        
        const matchEvents: CalendarEvent[] = (matches || []).map(m => ({
            id: `match-${m.id}`,
            date: m.date?.toDate ? m.date.toDate() : new Date(m.date),
            title: `${m.localTeam} vs ${m.visitorTeam}`,
            type: 'match',
            details: m.isFinished 
                ? `Partido finalizado: ${m.localTeam} ${m.localScore} - ${m.visitorScore} ${m.visitorTeam}`
                : `Partido programado: ${m.localTeam} vs ${m.visitorTeam}`
        }));

        return [...sessionEvents, ...matchEvents];
    }, [sessions, matches]);

    const eventDates = useMemo(() => allEvents.map(e => e.date), [allEvents]);

    useEffect(() => {
        if (selectedDate) {
            const eventOnDay = allEvents.find(e => format(e.date, 'yyyy-MM-dd') === format(selectedDate, 'yyyy-MM-dd'));
            setSelectedEvent(eventOnDay || null);
        } else {
            setSelectedEvent(null);
        }
    }, [selectedDate, allEvents]);
    
    const isLoading = isUserLoading || isLoadingSessions || isLoadingMatches;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Button asChild variant="outline" className="mb-4">
                    <Link href={`/equipo/gestion`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
                <div className="text-center">
                    <h1 className="text-4xl font-bold font-headline text-primary">Mis Eventos</h1>
                    <p className="text-lg text-muted-foreground mt-2">Tu calendario de partidos y sesiones de entrenamiento.</p>
                </div>
            </div>
            {isLoading && (
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2"><Skeleton className="w-full aspect-square" /></div>
                    <div><Skeleton className="w-full h-48" /></div>
                </div>
            )}
             {!isLoading && !user && (
                 <Card className="text-center py-16 max-w-lg mx-auto">
                    <CardHeader><CardTitle>Acceso Requerido</CardTitle><CardDescription>Debes iniciar sesión para ver tus eventos.</CardDescription></CardHeader>
                    <CardContent><Button asChild><Link href="/acceso">Acceder</Link></Button></CardContent>
                 </Card>
             )}
            {!isLoading && user && (
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        <Card>
                            <CardContent className="p-0">
                                <Calendar
                                    mode="single"
                                    selected={selectedDate}
                                    onSelect={setSelectedDate}
                                    className="w-full"
                                    locale={es}
                                    modifiers={{ events: eventDates }}
                                    modifiersStyles={{ events: { color: 'hsl(var(--primary))', fontWeight: 'bold' } }}
                                />
                            </CardContent>
                        </Card>
                    </div>
                    <div className="md:col-span-1">
                        <EventDetails event={selectedEvent} />
                    </div>
                </div>
            )}
        </div>
    );
}

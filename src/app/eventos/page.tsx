"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { sessions, matches } from '@/lib/data';
import { es } from 'date-fns/locale';
import { format } from 'date-fns';

type Event = {
  date: Date;
  type: 'session' | 'match';
  title: string;
  details: string;
  link: string;
};

export default function EventosPage() {
  const allEvents: Event[] = [
    ...sessions.map(s => ({
      date: new Date(s.date),
      type: 'session' as const,
      title: 'Sesión de entrenamiento:',
      details: s.name,
      link: `/sesiones/${s.id}`
    })),
    ...matches.map(m => ({
      date: new Date(m.date),
      type: 'match' as const,
      title: 'Partido:',
      details: m.opponent,
      link: `/partidos/${m.id}`
    }))
  ];

  const eventDates = allEvents.map(e => e.date);

  const [date, setDate] = useState<Date | undefined>(new Date('2025-11-01T00:00:00'));
  
  const selectedEvent = date ? allEvents.find(e => e.date.toDateString() === date.toDateString()) : undefined;

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
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline text-primary">Mis Eventos</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Tu calendario de partidos y sesiones de entrenamiento.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
        <div className="md:col-span-2">
           <Card>
            <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="p-4 w-full"
                locale={es}
                month={new Date('2025-10-01T00:00:00')}
                modifiers={{ with_event: eventDates }}
                modifiersClassNames={{
                    with_event: 'bg-primary/20 rounded-md',
                }}
            />
           </Card>
        </div>
        <div className="md:col-span-1">
          <Card>
            <CardContent className="p-6">
              {date && (
                <div className="flex items-center gap-3 mb-4 text-sm text-muted-foreground">
                    <CalendarIcon className="w-5 h-5"/>
                    <p>{format(date, 'EEEE, dd MMMM yyyy', { locale: es })}</p>
                </div>
              )}
              
              {selectedEvent ? (
                <div className="space-y-2">
                    <p className="font-semibold">{selectedEvent.title}</p>
                    <p className="text-muted-foreground">{selectedEvent.details}</p>
                    <Link href={selectedEvent.link} className="text-primary hover:underline text-sm font-semibold">
                      Ver detalles completos
                    </Link>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No hay eventos para este día.</p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

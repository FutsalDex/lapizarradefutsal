
"use client";

import { sessions } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Calendar, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const exampleSessions = sessions;


export default function SesionesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="text-left">
          <h1 className="text-4xl font-bold font-headline">Mis Sesiones</h1>
          <p className="text-lg text-muted-foreground mt-2">Organiza y planifica tus entrenamientos.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0 w-full md:w-auto">
          <Link href="/sesiones/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Sesión
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exampleSessions.map((session) => (
          <Card key={session.id} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className='relative'>
                <CardTitle>{session.name}</CardTitle>
                <Badge variant="secondary" className="absolute top-4 right-4">Básico</Badge>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-3 h-5 w-5" />
                <span>{new Date(session.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <ListChecks className="mr-3 h-5 w-5" />
                <span>{session.exercises.length} ejercicios</span>
              </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`/sesiones/${session.id}`}>Ver Detalles</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

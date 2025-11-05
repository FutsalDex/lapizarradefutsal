import { sessions } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { PlusCircle, Calendar, ListChecks } from 'lucide-react';

export default function SesionesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold font-headline">Gestor de Sesiones</h1>
          <p className="text-lg text-muted-foreground mt-2">Organiza y planifica tus entrenamientos.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0 w-full md:w-auto">
          <Link href="/sesiones/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Sesión
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sessions.map((session) => (
          <Card key={session.id} className="flex flex-col hover:border-primary transition-colors">
            <CardHeader>
              <CardTitle className="font-headline text-xl">{session.name}</CardTitle>
              <CardDescription className="flex items-center pt-2">
                <Calendar className="mr-2 h-4 w-4" />
                {new Date(session.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <div className="flex items-center text-sm text-muted-foreground">
                <ListChecks className="mr-2 h-4 w-4" />
                <span>{session.exercises.length} ejercicios</span>
              </div>
              <ul className="mt-4 list-disc list-inside text-muted-foreground/80 space-y-1">
                {session.exercises.slice(0, 3).map(ex => (
                    <li key={ex.id}>{ex.title}</li>
                ))}
                {session.exercises.length > 3 && <li>...y {session.exercises.length - 3} más.</li>}
              </ul>
            </CardContent>
            <CardFooter>
              <Button variant="outline" className="w-full">Ver Detalles</Button>
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}

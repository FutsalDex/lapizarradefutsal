
'use client';

import {
  Users,
  Calendar,
  ClipboardList,
  ChevronRight,
  Headphones,
  Timer,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import Link from 'next/link';

const dashboardItems = [
  {
    title: 'Gestión de Equipos',
    description: 'Crea nuevos equipos, gestiona sus miembros y accede a sus paneles de control.',
    icon: <Users className="w-6 h-6 text-primary" />,
    href: '#',
  },
  {
    title: 'Mis Sesiones',
    description: 'Encuentra y organiza todas las sesiones de entrenamiento que has creado manualmente.',
    icon: <ClipboardList className="w-6 h-6 text-primary" />,
    href: '/sesiones',
  },
  {
    title: 'Mis Eventos',
    description: 'Visualiza la cronología de todos tus partidos y sesiones de entrenamiento guardados.',
    icon: <Calendar className="w-6 h-6 text-primary" />,
    href: '#',
  },
  {
    title: 'Marcador Rápido',
    description: 'Usa un marcador con crono para un partido rápido o una sesión de entrenamiento.',
    icon: <Timer className="w-6 h-6 text-primary" />,
    href: '#',
  },
  {
    title: 'Soporte Técnico',
    description: 'Chatea con nuestro entrenador por IA configurado para darte respuestas sobre dudas, órdenes, etc.',
    icon: <Headphones className="w-6 h-6 text-primary" />,
    href: '#',
  },
];

export default function PartidosPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline text-primary">Panel de Mi Equipo</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {user ? `Bienvenido, ${user.displayName || 'entrenador'}.` : 'Bienvenido.'} Aquí tienes el centro de mando para tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {dashboardItems.map((item) => (
          <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow">
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
              <div className="bg-primary/10 p-3 rounded-full">{item.icon}</div>
              <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
               <Button asChild className="w-full">
                <Link href={item.href}>
                  Ir a {item.title}
                  <ChevronRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </Card>
        ))}
         <Card className="md:col-span-2 lg:col-span-3 flex flex-col md:flex-row items-center justify-between p-6 bg-primary/5 border-primary/20">
            <div className='mb-4 md:mb-0'>
                <h3 className='font-bold text-lg'>¿Necesitas inspiración?</h3>
                <p className='text-muted-foreground text-sm'>Usa nuestro asistente con IA para generar ejercicios personalizados.</p>
            </div>
            <Button asChild>
                <Link href="/ia-sugerencias">Ir al Asistente IA</Link>
            </Button>
        </Card>
      </div>
    </div>
  );
}

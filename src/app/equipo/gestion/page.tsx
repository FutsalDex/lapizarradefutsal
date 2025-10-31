'use client';

import {
  Users,
  Calendar,
  ClipboardList,
  BarChart3,
  ArrowRight,
  Shield,
  Upload,
  MessageSquare,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase/use-auth-user';

const menuItems = [
  {
    title: 'Gestión de Equipos',
    description: 'Crea nuevos equipos, gestiona sus miembros y accede a sus paneles de control.',
    icon: <Shield className="w-8 h-8 text-primary" />,
    href: '/equipo/gestion/equipos',
    disabled: false,
    soon: false,
  },
  {
    title: 'Mis Sesiones',
    description: 'Encuentra y organiza todas las sesiones de entrenamiento que has creado manualmente.',
    icon: <Calendar className="w-8 h-8 text-primary" />,
    href: '/sesiones',
    disabled: false,
    soon: false,
  },
  {
    title: 'Mis Ejercicios',
    description: 'Aporta ejercicios a la comunidad, gestiónalos y gana puntos para tu suscripción.',
    icon: <Upload className="w-8 h-8 text-primary" />,
    href: '/admin/ejercicios/alta',
    disabled: false,
    soon: false,
  },
  {
    title: 'Mis Eventos',
    description: 'Visualiza la cronología de todos tus partidos y sesiones de entrenamiento guardados.',
    icon: <ClipboardList className="w-8 h-8 text-primary" />,
    href: '#',
    disabled: true,
    soon: true,
  },
  {
    title: 'Marcador Rápido',
    description: 'Usa un marcador con crono para un partido rápido o una sesión de entrenamiento.',
    icon: <BarChart3 className="w-8 h-8 text-primary" />,
    href: '#',
    disabled: true,
    soon: true,
  },
  {
    title: 'Soporte Técnico',
    description: 'Chatea con nuestro entrenador por IA configurado para darte respuestas sobre dudas, órdenes, etc.',
    icon: <MessageSquare className="w-8 h-8 text-primary" />,
    href: '#',
    disabled: true,
    soon: true,
  },
];

export default function TeamDashboardPage() {
  const { user } = useUser();

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline text-primary">Panel de Mi Equipo</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {user ? `Bienvenido, ${user.displayName || 'entrenador'}.` : 'Bienvenido.'} Aquí tienes el centro de mando para tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
        {menuItems.map((item) => (
          <Card
            key={item.title}
            className={`flex flex-col hover:shadow-lg transition-shadow ${
              item.disabled ? 'bg-muted/50' : ''
            }`}
          >
            <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
              <div
                className={`bg-primary/10 p-4 rounded-lg ${
                  item.disabled ? 'opacity-50' : ''
                }`}
              >
                {item.icon}
              </div>
            </CardHeader>
            <CardContent className="flex-grow">
              <CardTitle className="font-headline text-xl mb-1">{item.title}</CardTitle>
              <CardDescription>{item.description}</CardDescription>
            </CardContent>
            <div className="p-6 pt-0">
              <Button asChild className="w-full" disabled={item.disabled}>
                <Link href={item.href}>
                  {item.soon ? 'Próximamente' : `Ir a ${item.title}`}
                  {!item.soon && <ArrowRight className="w-4 h-4 ml-2" />}
                </Link>
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}


'use client';

import {
  Users,
  ChevronRight,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useUser } from '@/firebase';
import Link from 'next/link';

const adminItems = [
  {
    title: 'Gestión de Equipos',
    description: 'Visualiza y gestiona todos los equipos creados en la plataforma.',
    icon: <Users className="w-6 h-6 text-primary" />,
    href: '/admin/equipos',
  },
];

export default function AdminPage() {
  const { user } = useUser();
  const isAdmin = user?.email === 'futsaldex@gmail.com';

  if (!isAdmin) {
    return (
         <div className="container mx-auto px-4 py-8 text-center">
            <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
            <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
         </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-10">
        <h1 className="text-4xl font-bold font-headline text-primary">Panel de Administración</h1>
        <p className="text-lg text-muted-foreground mt-2">
          {user ? `Bienvenido, ${user.displayName || 'administrador'}.` : 'Bienvenido.'} 
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
        {adminItems.map((item) => (
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
      </div>
    </div>
  );
}



'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { useUser } from '@/firebase';
import { ArrowLeft, ChevronRight, List, UploadCloud } from 'lucide-react';

const exerciseAdminItems = [
  {
    title: 'Alta de Ejercicios',
    description: 'Añade ejercicios a la biblioteca, individualmente o en lote.',
    icon: <UploadCloud className="w-8 h-8 text-primary" />,
    href: '/admin/ejercicios/alta',
  },
  {
    title: 'Listado de Ejercicios',
    description: 'Visualiza y explora todos los ejercicios de la biblioteca pública.',
    icon: <List className="w-8 h-8 text-primary" />,
    href: '/admin/ejercicios/listado',
  },
];

export default function AdminExercisesDashboardPage() {
    const { user, isUserLoading } = useUser();
    const isAdmin = user?.email === 'futsaldex@gmail.com';

    if (isUserLoading) {
        return <div className="container mx-auto px-4 py-8 text-center">Cargando...</div>
    }

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
            <div className="mb-8">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href={`/admin`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel de Admin
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Ejercicios</h1>
                <p className="text-lg text-muted-foreground mt-2">Selecciona una opción para gestionar la biblioteca de ejercicios.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                {exerciseAdminItems.map((item) => (
                <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow">
                    <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                        <div className="bg-primary/10 p-4 rounded-full">{item.icon}</div>
                    </CardHeader>
                    <CardContent className="flex-grow">
                        <CardTitle className="font-headline text-xl mb-1">{item.title}</CardTitle>
                        <CardDescription>{item.description}</CardDescription>
                    </CardContent>
                    <div className="p-6 pt-0">
                    <Button asChild className="w-full">
                        <Link href={item.href}>
                        Acceder
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

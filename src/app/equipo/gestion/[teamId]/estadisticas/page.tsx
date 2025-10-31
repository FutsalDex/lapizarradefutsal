'use client';

import { useParams } from 'next/navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft, ArrowRight, BarChart, Trophy, Users } from 'lucide-react';

export default function TeamStatsDashboardPage() {
    const params = useParams();
    const teamId = typeof params.teamId === 'string' ? params.teamId : '';

    const statsItems = [
        {
            title: 'Estadísticas del Equipo',
            description: 'Resumen del rendimiento en partidos: victorias, derrotas, goles a favor, goles en contra y más métricas globales.',
            icon: <Trophy className="w-8 h-8 text-primary" />,
            href: `/equipo/gestion/${teamId}/estadisticas/equipo`,
            disabled: false,
        },
        {
            title: 'Estadísticas de Jugadores',
            description: 'Consulta las estadísticas individuales de todos los jugadores de tu plantilla: goles, asistencias, tarjetas y más.',
            icon: <Users className="w-8 h-8 text-primary" />,
            href: `/equipo/gestion/${teamId}/estadisticas/jugadores`,
            disabled: false,
        },
    ];

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                 <div className="flex items-center gap-4">
                    <BarChart className="w-10 h-10 text-primary" />
                    <div>
                        <h1 className="text-4xl font-bold font-headline text-primary">Estadísticas</h1>
                        <p className="text-lg text-muted-foreground mt-2">Selecciona qué estadísticas del equipo quieres consultar.</p>
                    </div>
                </div>
                 <Button asChild variant="outline">
                    <Link href={`/equipo/gestion/${teamId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                {statsItems.map((item) => (
                    <Card key={item.title} className="flex flex-col hover:shadow-lg transition-shadow bg-card">
                         <CardHeader className="flex-row items-center gap-4 space-y-0 pb-4">
                            <div className="bg-primary/10 p-4 rounded-lg">{item.icon}</div>
                            <CardTitle className="font-headline text-xl">{item.title}</CardTitle>
                        </CardHeader>
                        <CardContent className="flex-grow">
                            <CardDescription>{item.description}</CardDescription>
                        </CardContent>
                        <div className="p-6 pt-0">
                            <Button asChild className="w-full" disabled={item.disabled}>
                                <Link href={item.href}>
                                    {item.disabled ? "Próximamente" : "Ver Estadísticas"}
                                    {!item.disabled && <ArrowRight className="w-4 h-4 ml-2" />}
                                </Link>
                            </Button>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}

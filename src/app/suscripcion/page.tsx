
'use client';

import { useState } from 'react';
import { useUser } from '@/firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Star, CheckCircle, ArrowRight, Book, Gift } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

const plans = [
    {
        name: 'Plan Básico',
        price: 19.95,
        features: [
            'Acceso a la biblioteca de ejercicios',
            'Crear sesiones de entrenamiento',
            'Gestión de 1 equipo',
            'Marcador rápido',
        ],
        cta: 'Mejorar a Básico',
        isCurrent: false,
    },
    {
        name: 'Pro',
        price: 39.95,
        features: [
            'Todo lo del plan Basic',
            'Gestión de hasta 3 equipos',
            'Añadir miembros al cuerpo técnico',
            'Estadísticas avanzadas',
            'Exportar sesiones a PDF Pro',
        ],
        cta: 'Mejorar a Pro',
        isCurrent: false,
    }
];

export default function SuscripcionPage() {
    const { user, isUserLoading } = useUser();
    
    // Mock data, to be replaced with Firestore data
    const userSubscription = {
        plan: 'Invitado',
        status: 'Activa',
        endDate: 'N/A',
        points: 450,
        nextReward: 500,
    };
    
    const displayPlans = plans.map(p => ({ ...p, isCurrent: p.name === userSubscription.plan }));

    if (isUserLoading) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-48 w-full" />
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-64 w-full" />
                    <Skeleton className="h-64 w-full" />
                </div>
            </div>
        );
    }
    
    if (!user) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold">Acceso denegado</h1>
                <p className="text-muted-foreground mt-2">Debes iniciar sesión para ver tu suscripción.</p>
                <Button asChild className="mt-4">
                  <Link href="/acceso">Iniciar Sesión</Link>
                </Button>
            </div>
        )
    }

    const pointsProgress = (userSubscription.points / userSubscription.nextReward) * 100;
    const isGuest = userSubscription.plan === 'Invitado';

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8">
                <h1 className="text-4xl font-bold font-headline text-primary">Suscripción y Puntos</h1>
                <p className="text-lg text-muted-foreground mt-2">Gestiona tu plan y comprueba cómo ganar y canjear tus puntos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                <div className="lg:col-span-1 space-y-8">
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-xl">Mi Plan Actual</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between items-baseline">
                                <span className="text-3xl font-bold">{userSubscription.plan}</span>
                                <Badge variant={userSubscription.status === 'Activa' ? 'default' : 'destructive'}>
                                    {userSubscription.status}
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {isGuest 
                                    ? 'El modo Invitado te da acceso a la biblioteca de ejercicios durante 7 días y acceso al resto de servicios en modo demostración. Cambia a un Plan Básico o Pro para disfrutar de esta herramienta al 100%' 
                                    : `Tu suscripción se renueva el ${userSubscription.endDate}.`
                                }
                            </p>
                        </CardContent>
                    </Card>
                     <Card>
                        <CardHeader>
                            <CardTitle className="text-xl flex items-center gap-2"><Star className="text-amber-400"/>Mis Puntos</CardTitle>
                             <CardDescription>Gana puntos aportando ejercicios a la comunidad y canjéalos por meses gratis.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-center">
                                <p className="text-5xl font-bold">{userSubscription.points}</p>
                                <p className="text-sm text-muted-foreground">puntos</p>
                            </div>
                            <div>
                                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                    <span>Tu progreso</span>
                                    <span>Próxima recompensa: {userSubscription.nextReward} pts</span>
                                </div>
                                <Progress value={pointsProgress} />
                            </div>
                        </CardContent>
                        <CardFooter className='flex flex-col gap-2'>
                           <Button className="w-full" disabled={userSubscription.points < userSubscription.nextReward}>
                                <Gift className="mr-2 h-4 w-4"/>
                                Canjear Recompensa
                           </Button>
                           <Button variant="outline" className="w-full" asChild>
                                <Link href="/equipo/mis-ejercicios">
                                <Book className="mr-2 h-4 w-4"/>Aportar ejercicio
                                </Link>
                           </Button>
                        </CardFooter>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="bg-muted/30">
                        <CardHeader>
                            <CardTitle>Planes Disponibles</CardTitle>
                            <CardDescription>Elige el plan que mejor se adapte a tus necesidades como entrenador.</CardDescription>
                        </CardHeader>
                        <CardContent className="grid md:grid-cols-2 gap-6">
                            {displayPlans.map(plan => (
                                <Card key={plan.name} className={plan.isCurrent ? 'border-primary' : ''}>
                                    <CardHeader>
                                        <CardTitle className="font-headline">{plan.name}</CardTitle>
                                        <p className="text-3xl font-bold">
                                            {plan.price > 0 ? `${plan.price}€` : 'Gratis'}
                                            {plan.price > 0 && <span className="text-sm font-normal text-muted-foreground">/mes</span>}
                                        </p>
                                    </CardHeader>
                                    <CardContent className="flex-grow">
                                        <ul className="space-y-3">
                                            {plan.features.map(feature => (
                                                <li key={feature} className="flex items-start text-sm">
                                                    <CheckCircle className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </CardContent>
                                    <CardFooter>
                                        <Button className="w-full" disabled={plan.isCurrent}>
                                            {plan.isCurrent ? 'Plan Actual' : plan.cta}
                                            {!plan.isCurrent && <ArrowRight className="ml-2 h-4 w-4"/>}
                                        </Button>
                                    </CardFooter>
                                </Card>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

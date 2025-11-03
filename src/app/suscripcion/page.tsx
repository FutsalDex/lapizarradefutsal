
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Star, Gift, Book, ArrowRight, CheckCircle, Send } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { doc } from 'firebase/firestore';

interface UserProfile {
    subscription?: string;
    createdAt?: { toDate: () => Date };
    points?: number;
}


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
        cta: 'Suscribirse a Básico',
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
        cta: 'Suscribirse a Pro',
    }
];


export default function SuscripcionPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);

    const isTrialActive = useMemo(() => {
        if (!userProfile?.createdAt) return false;
        const thirtyDaysInMillis = 30 * 24 * 60 * 60 * 1000;
        const registrationDate = userProfile.createdAt.toDate();
        return (new Date().getTime() - registrationDate.getTime()) < thirtyDaysInMillis;
    }, [userProfile]);

    const currentPlan = userProfile?.subscription === 'Basic' || userProfile?.subscription === 'Pro' 
        ? userProfile.subscription 
        : 'Invitado';

    const userSubscription = {
        plan: currentPlan,
        status: 'Activa',
        endDate: 'N/A', // To be implemented
        points: userProfile?.points || 450,
        nextReward: 500,
    };
    
    if (isUserLoading || isLoadingProfile) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-4xl space-y-8">
                <Skeleton className="h-10 w-1/3" />
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
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold font-headline text-primary">Suscripción y Puntos</h1>
                <p className="text-lg text-muted-foreground mt-2">Gestiona tu plan y comprueba cómo ganar y canjear tus puntos.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
                 <Card className="lg:col-span-1">
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
                 <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle className="text-xl flex items-center gap-2"><Star className="text-amber-400"/>Mis Puntos</CardTitle>
                         <CardDescription>¡Tu esfuerzo tiene recompensa! Aporta ejercicios a la comunidad, invita a tus amigos a unirse (¡y llévate 50 puntos si se suscriben!) y canjea tus puntos por meses gratis de suscripción.</CardDescription>
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
                    <CardFooter className='flex flex-col sm:flex-row gap-2'>
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
            
            <div className="mb-12 text-center">
                <h2 className="text-3xl font-bold font-headline text-primary">Planes Disponibles</h2>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 mb-12 max-w-4xl mx-auto">
                {plans.map(plan => (
                    <Card key={plan.name} className="flex flex-col">
                        <CardHeader>
                            <CardTitle className="font-headline text-2xl">{plan.name}</CardTitle>
                            <p className="text-4xl font-bold">
                                {plan.price > 0 ? `${plan.price}€` : 'Gratis'}
                                {plan.price > 0 && <span className="text-base font-normal text-muted-foreground">/año</span>}
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
                    </Card>
                ))}
            </div>

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Send className="h-5 w-5" />
                        Instrucciones de Pago
                    </CardTitle>
                    <CardDescription>
                        Para activar o renovar tu suscripción, sigue estos sencillos pasos.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div>
                        <h3 className="font-semibold mb-2">1. Envía tu pago por Bizum al:</h3>
                        <div className="bg-muted p-3 rounded-md text-center">
                            <p className="text-2xl font-bold tracking-widest text-primary">607 820 029</p>
                        </div>
                    </div>
                    <div>
                        <h3 className="font-semibold mb-2">2. Usa el siguiente concepto en el pago:</h3>
                        <div className="bg-muted p-3 rounded-md">
                            <code className="text-sm font-mono">LaPizarra ({user.email})</code>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">Ejemplo: LaPizarra (entrenador@email.com)</p>
                    </div>
                    <div>
                        <p className="text-sm text-muted-foreground">
                            Tu cuenta se activará o renovará en un plazo máximo de 24 horas. Recibirás un correo de confirmación. ¡Gracias por tu confianza!
                        </p>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}

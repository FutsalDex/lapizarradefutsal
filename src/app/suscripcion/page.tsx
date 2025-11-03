
'use client';

import { useMemo } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Star, Gift, Book, ArrowRight, CheckCircle, Send, UserPlus, Mail, PlusCircle, Repeat, CalendarCheck, Euro, FileUp, Users } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { doc, collection, query, where } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';

interface UserProfile {
    subscription?: string;
    createdAt?: { toDate: () => Date };
    points?: number;
    subscriptionEndDate?: { toDate: () => Date };
}

interface UserExercise {
    id: string;
}

const StatCard = ({ title, value, icon: Icon, subtext }: { title: string; value: string | number; icon: React.ElementType; subtext?: string; }) => (
    <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            {subtext && <p className="text-xs text-muted-foreground">{subtext}</p>}
        </CardContent>
    </Card>
);

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
    
    const userExercisesQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'userExercises'), where('userId', '==', user.uid));
    }, [firestore, user]);

    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    const { data: userExercises, isLoading: isLoadingExercises } = useCollection<UserExercise>(userExercisesQuery);

    const userSubscription = {
        plan: userProfile?.subscription || 'Invitado',
        points: userProfile?.points || 0,
        endDate: userProfile?.subscriptionEndDate?.toDate(),
    };

    const uploadedExercisesCount = userExercises?.length ?? 0;
    const renewalSavings = ((userSubscription.points / 1200) * 39.95).toFixed(2);
    
    // Placeholder data for new cards
    const invitedFriendsCount = 0;
    const pointsFromFriends = invitedFriendsCount * 25;


    if (isUserLoading || isLoadingProfile || isLoadingExercises) {
        return (
            <div className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)}
                </div>
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

    const pointsProgress = (userSubscription.points / 1200) * 100;

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold font-headline text-primary">Suscripción y Puntos</h1>
                <p className="text-lg text-muted-foreground mt-2">Gestiona tu plan y comprueba cómo ganar y canjear tus puntos.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mb-12">
                <StatCard 
                    title="Ejercicios subidos" 
                    value={uploadedExercisesCount} 
                    icon={FileUp} 
                    subtext={`${uploadedExercisesCount * 10} puntos ganados`}
                />
                 <StatCard 
                    title="Amigos invitados" 
                    value={invitedFriendsCount} 
                    icon={Users}
                    subtext={`${pointsFromFriends} puntos ganados`}
                />
                <StatCard 
                    title="Puntos acumulados" 
                    value={userSubscription.points} 
                    icon={Star}
                    subtext="¡Sigue sumando!" 
                />
                <StatCard 
                    title="Ahorro en renovación" 
                    value={`${renewalSavings} €`}
                    icon={Euro}
                    subtext="Basado en el Plan Pro Anual"
                />
                <StatCard 
                    title="Próxima Renovación" 
                    value={userSubscription.endDate ? format(userSubscription.endDate, 'dd/MM/yyyy') : 'N/A'}
                    icon={CalendarCheck}
                    subtext={userSubscription.plan}
                />
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-12">
                 <Card className="lg:col-span-1">
                    <CardHeader>
                        <CardTitle className="text-xl">Programa de Fidelización</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className='text-sm text-muted-foreground'>Tu esfuerzo y colaboración tienen recompensa. Aporta ejercicios a la comunidad (10 puntos por ejercicio y/o invita a tus amigos a unirse (25 puntos si se suscriben) y canjea tus puntos por meses gratis de suscripción.</p>
                        <div>
                             <div className="flex justify-between text-xs text-muted-foreground mb-1">
                                <span>Tu progreso para 1 año gratis</span>
                                <span>1200 pts</span>
                            </div>
                            <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary">
                                <div className="absolute h-full w-full flex">
                                    {[...Array(11)].map((_, i) => (
                                        <div key={i} className="h-full w-px bg-background/50 ml-[8.33%]" />
                                    ))}
                                </div>
                                <Progress value={pointsProgress} className="absolute h-full" />
                            </div>
                             <div className="flex justify-between text-xs text-muted-foreground mt-1">
                                {[...Array(13)].map((_, i) => (
                                    <span key={i} className="transform -translate-x-1/2">{i * 100}</span>
                                ))}
                            </div>
                        </div>
                         <div className="pt-4 space-y-4">
                                <div className="rounded-lg border bg-card p-4 text-center">
                                    <Book className="mx-auto h-8 w-8 text-primary mb-2" />
                                    <h4 className="font-semibold">Aporta Ejercicios</h4>
                                    <p className="text-sm text-muted-foreground mb-3">Gana 10 puntos por cada ejercicio que subas a la comunidad.</p>
                                    <Button variant="outline" size="sm" asChild>
                                        <Link href="/equipo/mis-ejercicios">
                                            <PlusCircle className="mr-2 h-4 w-4" />
                                            Subir Ejercicio
                                        </Link>
                                    </Button>
                                </div>
                                <div className="rounded-lg border bg-card p-4 text-center">
                                    <UserPlus className="mx-auto h-8 w-8 text-primary mb-2" />
                                    <h4 className="font-semibold">Invita a tus Amigos</h4>
                                    <p className="text-sm text-muted-foreground mb-3">Gana 25 puntos si se suscriben a un plan de pago.</p>
                                    <div className="flex w-full max-w-sm items-center space-x-2">
                                        <Input type="email" placeholder="Email del amigo" className="text-xs" />
                                        <Button type="submit" size="sm">
                                            <Mail className="mr-2 h-4 w-4" />
                                            Invitar
                                        </Button>
                                    </div>
                                </div>
                        </div>
                    </CardContent>
                    <CardFooter>
                       <Button className="w-full" disabled={userSubscription.points < 100}>
                            <Gift className="mr-2 h-4 w-4"/>
                            Canjear 1 Mes de Suscripción (100 pts)
                       </Button>
                    </CardFooter>
                </Card>

                <div className='lg:col-span-2 space-y-8'>
                    <div className="mb-12 text-center">
                        <h2 className="text-3xl font-bold font-headline text-primary">Planes Disponibles</h2>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-8">
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
                                    <code className="text-sm font-mono">LaPizarra (entrenadordefutsal@gmail.com)</code>
                                </div>
                                <p className="text-xs text-muted-foreground mt-2">Ejemplo: LaPizarra (entrenadordefutsal@gmail.com)</p>
                            </div>
                            <div>
                                <p className="text-sm text-muted-foreground">
                                    Tu cuenta se activará o renovará en un plazo máximo de 24 horas. Recibirás un correo de confirmación. ¡Gracias por tu confianza!
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

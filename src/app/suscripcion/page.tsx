
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Star, Gift, Book, ArrowRight, CheckCircle, Send, UserPlus, Mail, Euro, FileUp, Users, CalendarCheck, PlusCircle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { doc, collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

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
    const { toast } = useToast();

    const [isInviting, setIsInviting] = useState(false);

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
    
    const isSubscribed = userSubscription.plan === 'Básico' || userSubscription.plan === 'Pro';

    const uploadedExercisesCount = userExercises?.length ?? 0;
    const renewalSavings = ((userSubscription.points / 1200) * 39.95).toFixed(2);
    
    const invitedFriendsCount = 0;
    const pointsFromFriends = invitedFriendsCount * 25;

    const handleWhatsAppInvite = () => {
        if (!user) return;
        
        // As a real implementation would require a proper domain, we'll use a placeholder.
        // The idea is to create a unique registration link for the referral.
        const referralLink = `https://lapizarra-95eqd.web.app/acceso?ref=${user.uid}`;
        const message = encodeURIComponent(`¡Hola! Te invito a unirte a LaPizarra, la mejor app para entrenadores de futsal. Regístrate usando mi enlace: ${referralLink}`);
        
        window.open(`https://wa.me/?text=${message}`, '_blank');

        toast({
            title: "Enlace de invitación listo",
            description: "Comparte el enlace con tus amigos a través de WhatsApp.",
        });
    };


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

    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-12 text-center">
                 <h1 className="text-4xl font-bold font-headline text-primary">Programa de Fidelización</h1>
                <p className="text-muted-foreground mt-2 max-w-2xl mx-auto">Tu esfuerzo y colaboración tienen recompensa. Aporta ejercicios a la comunidad (10 puntos por ejercicio y/o invita a tus amigos a unirse (25 puntos si se suscriben) y canjea tus puntos por meses gratis de suscripción.</p>
            </div>

            <div className="mb-12">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
                        subtext={`Basado en el plan ${userSubscription.plan}`}
                    />
                     <StatCard 
                        title="Mi Plan" 
                        value={userSubscription.plan}
                        icon={Star}
                        subtext={userSubscription.endDate ? `Vence el ${format(userSubscription.endDate, 'dd/MM/yyyy')}` : 'Sin suscripción activa'}
                    />
                    <StatCard 
                        title="Próxima Renovación" 
                        value={userSubscription.endDate ? format(userSubscription.endDate, 'dd/MM/yyyy') : 'N/A'}
                        icon={CalendarCheck}
                        subtext={userSubscription.plan}
                    />
                </div>
            </div>
            
            <div className='space-y-8'>
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <UserPlus className="h-5 w-5" />
                            Invita a tus Amigos
                        </CardTitle>
                        <CardDescription>
                            Gana 25 puntos si se suscriben a un plan de pago.
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <p className="text-sm text-muted-foreground mb-4">
                           Pulsa el botón para generar un mensaje de WhatsApp con tu enlace de invitación personal. Compártelo con tus amigos para que se unan a LaPizarra.
                        </p>
                        <Button 
                            onClick={handleWhatsAppInvite} 
                            disabled={!isSubscribed || isInviting} 
                            className="w-full"
                        >
                            <svg className="mr-2 h-5 w-5" role="img" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><title>WhatsApp</title><path fill="currentColor" d="M12.04 2.01C6.58 2.01 2.13 6.46 2.13 11.92c0 1.77.46 3.45 1.32 4.95L2.05 22l5.25-1.38c1.45.79 3.08 1.21 4.74 1.21 5.46 0 9.91-4.45 9.91-9.91s-4.45-9.91-9.91-9.91zm0 18.16c-1.5 0-2.96-.4-4.22-1.13l-.3-.18-3.12.82.83-3.04-.2-.32a8.23 8.23 0 0 1-1.28-4.38c0-4.54 3.68-8.22 8.22-8.22 4.54 0 8.22 3.68 8.22 8.22s-3.68 8.22-8.22 8.22zm4.52-6.15c-.25-.12-1.47-.72-1.7-.82s-.39-.12-.56.12c-.16.25-.64.82-.79.99s-.29.16-.56.04c-.26-.12-1.1-."/></svg>
                            Invitar por WhatsApp
                        </Button>
                        {!isSubscribed && (
                            <p className="text-center text-xs text-muted-foreground mt-2">
                                Necesitas un plan de suscripción para invitar amigos.
                            </p>
                        )}
                    </CardContent>
                </Card>

                <div className="mb-12 text-center">
                    <h2 className="text-3xl font-bold font-headline text-primary">Planes Disponibles</h2>
                </div>
                
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
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
    );

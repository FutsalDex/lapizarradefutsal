
'use client';

import { useMemo, useState } from 'react';
import { useUser, useFirestore, useDoc, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Star, Gift, Book, ArrowRight, CheckCircle, Send, UserPlus, Mail, Euro, FileUp, Users, CalendarCheck, PlusCircle, Copy } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { doc, collection, query, where, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { Input } from '@/components/ui/input';
import { format } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

interface UserProfile {
    subscription?: 'Básico' | 'Pro' | 'Invitado';
    createdAt?: { toDate: () => Date };
    points?: number;
    subscriptionStartDate?: { toDate: () => Date };
    subscriptionEndDate?: { toDate: () => Date };
}

interface UserExercise {
    id: string;
}

interface Invitation {
    inviterId: string;
    inviteeEmail: string;
    status: 'pending' | 'completed' | 'rejected';
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
        price: 19.90,
        features: [
            'Acceso a la biblioteca de ejercicios',
            'Crear sesiones de entrenamiento',
            'Gestión de 1 equipo',
            'Marcador rápido',
            'Guardar mis ejercicios favoritos',
            'Descargar sesiones en PDF'
        ],
        cta: 'Suscribirse a Básico',
    },
    {
        name: 'Plan Pro',
        price: 39.90,
        features: [
            'Todo lo del plan Básico',
            'Gestión de hasta 3 equipos',
            'Añadir miembros al cuerpo técnico',
            'Estadísticas avanzadas',
            'Descargar sesiones a PDF Pro',
        ],
        cta: 'Suscribirse a Pro',
    }
];


export default function SuscripcionPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const [isInviting, setIsInviting] = useState(false);
    const [inviteEmail, setInviteEmail] = useState('');


    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfile>(userProfileRef);
    
    const userExercisesQuery = useMemoFirebase(() => {
        if (!user || !firestore || !userProfile) return null; // Wait for userProfile
        const startDate = userProfile?.subscriptionStartDate?.toDate() || new Date(0);
        return query(
            collection(firestore, 'userExercises'), 
            where('userId', '==', user.uid),
            where('createdAt', '>=', startDate)
        );
    }, [firestore, user, userProfile]);
    
    const userInvitationsQuery = useMemoFirebase(() => {
        if (!user || !firestore || !userProfile) return null; // Wait for userProfile
        const startDate = userProfile?.subscriptionStartDate?.toDate() || new Date(0);
        return query(
            collection(firestore, 'invitations'), 
            where('inviterId', '==', user.uid), 
            where('status', '==', 'completed'),
            where('completedAt', '>=', startDate)
        );
    }, [firestore, user, userProfile]);


    const { data: userExercises, isLoading: isLoadingExercises } = useCollection<UserExercise>(userExercisesQuery);
    const { data: completedInvitations, isLoading: isLoadingInvitations } = useCollection<Invitation>(userInvitationsQuery);


    const userSubscription = {
        plan: userProfile?.subscription || 'Invitado',
        points: userProfile?.points || 0,
        endDate: userProfile?.subscriptionEndDate?.toDate(),
    };
    
    const isSubscribed = userSubscription.plan === 'Básico' || userSubscription.plan === 'Pro';

    const renewalSavings = useMemo(() => {
        const points = userSubscription.points;
        let discount = 0;
        if (userSubscription.plan === 'Básico') {
            discount = points * 0.02;
        } else if (userSubscription.plan === 'Pro') {
            discount = points * 0.04;
        }
        return discount.toFixed(2);
    }, [userSubscription.points, userSubscription.plan]);
    
    const uploadedExercisesCount = userExercises?.length ?? 0;
    const invitedFriendsCount = completedInvitations?.length ?? 0;
    const pointsFromFriends = invitedFriendsCount * 25;

    const handleSendInvite = async () => {
        if (!user || !inviteEmail) {
            toast({ variant: 'destructive', title: 'Error', description: 'Introduce un correo válido.' });
            return;
        }
        if (inviteEmail.toLowerCase() === user.email?.toLowerCase()) {
            toast({ variant: 'destructive', title: 'Error', description: 'No puedes invitarte a ti mismo.' });
            return;
        }

        setIsInviting(true);
        try {
            const usersRef = collection(firestore, 'users');
            const q = query(usersRef, where('email', '==', inviteEmail));
            const userSnapshot = await getDocs(q);

            if (!userSnapshot.empty) {
                toast({ variant: 'destructive', title: 'Usuario ya registrado', description: 'Este usuario ya forma parte de LaPizarra.' });
                setIsInviting(false);
                return;
            }

            await addDoc(collection(firestore, 'invitations'), {
                inviterId: user.uid,
                inviterEmail: user.email,
                inviteeEmail: inviteEmail,
                status: 'pending',
                createdAt: serverTimestamp(),
            });

            const baseUrl = 'https://my-web-app--lapizarra-95eqd.europe-west4.hosted.app';
            const message = `¡Hola! Te invito a unirte a LaPizarra, una app genial para entrenadores de futsal. Regístrate usando este enlace: ${baseUrl}/acceso`;
            const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;

            window.open(whatsappUrl, '_blank');

            toast({ title: 'Invitación Lista', description: `Se ha abierto WhatsApp para que envíes la invitación a ${inviteEmail}.` });
            setInviteEmail('');

        } catch (error) {
            console.error(error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo procesar la invitación.' });
        } finally {
            setIsInviting(false);
        }
    };

    const hasReachedInvitationLimit = invitedFriendsCount >= 10;

    if (isUserLoading || isLoadingProfile || isLoadingExercises || isLoadingInvitations) {
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
                        subtext={`${uploadedExercisesCount * 10} puntos ganados este año`}
                    />
                     <StatCard 
                        title="Amigos suscritos" 
                        value={invitedFriendsCount} 
                        icon={Users}
                        subtext={`${pointsFromFriends} puntos ganados este año`}
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
                            Gana 25 puntos si se suscriben a un plan de pago. Introduce su email para generar un mensaje de WhatsApp con el enlace de invitación.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         <div className="flex flex-col sm:flex-row w-full max-w-md items-center space-y-2 sm:space-y-0 sm:space-x-2">
                             <Input 
                                type="email" 
                                placeholder="Email del amigo"
                                value={inviteEmail}
                                onChange={(e) => setInviteEmail(e.target.value)}
                                disabled={!isSubscribed || isInviting || hasReachedInvitationLimit}
                                className="w-full"
                            />
                            <Button 
                                onClick={handleSendInvite} 
                                disabled={!isSubscribed || isInviting || !inviteEmail || hasReachedInvitationLimit}
                                className="w-full sm:w-auto"
                            >
                                {isInviting ? 'Generando...' : 'Invitar por WhatsApp'}
                            </Button>
                        </div>
                        <div className="text-sm text-muted-foreground max-w-md">
                            <p>Invitaciones enviadas este año: {invitedFriendsCount} de 10</p>
                            <Progress value={(invitedFriendsCount / 10) * 100} className="w-full mt-1" />
                            {hasReachedInvitationLimit && (
                                <p className="text-destructive font-semibold mt-2">Has alcanzado el límite de invitaciones para este año.</p>
                            )}
                        </div>
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
                                    {plan.price > 0 ? `${plan.price.toFixed(2)}€` : 'Gratis'}
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

    
}

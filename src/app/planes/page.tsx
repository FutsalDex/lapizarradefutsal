
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowRight, CheckCircle, Send } from 'lucide-react';
import { useUser } from '@/firebase';
import { useRef } from 'react';

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
            'Descargar sesiones en PDF',
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

export default function PlanesPage() {
    const { user } = useUser();
    const paymentRef = useRef<HTMLDivElement>(null);

    const handleScrollToPayment = () => {
        paymentRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
        });
    };


    return (
        <div className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="mb-12 text-center">
                <h1 className="text-4xl font-bold font-headline text-primary">Planes de Suscripción</h1>
                <p className="text-lg text-muted-foreground mt-2">Elige el plan que mejor se adapte a tus necesidades como entrenador.</p>
            </div>

            <div className="grid md:grid-cols-2 gap-8 mb-12">
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
                        <CardFooter>
                            <Button className="w-full" onClick={handleScrollToPayment}>
                                {plan.cta}
                                <ArrowRight className="ml-2 h-4 w-4"/>
                            </Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>

            <div ref={paymentRef}>
                {user && (
                    <Card className="mt-8">
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
                )}
                 {!user && (
                     <Card className="mt-8 text-center py-8">
                         <CardContent>
                            <p className="text-muted-foreground mb-4">Debes iniciar sesión para poder realizar el pago y activar tu suscripción.</p>
                            <Button asChild>
                                <Link href="/acceso">Iniciar Sesión</Link>
                            </Button>
                         </CardContent>
                     </Card>
                )}
            </div>
        </div>
    );
}

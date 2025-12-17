
<<<<<<< HEAD
'use client';

import { useState, useRef, useEffect } from 'react';
import { useUser, useAuth, useStorage, useFirestore } from '@/firebase';
import { updateProfile, EmailAuthProvider, reauthenticateWithCredential, updatePassword } from 'firebase/auth';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { doc, updateDoc } from 'firebase/firestore';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User as UserIcon, Save, Camera, Lock } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDoc } from '@/firebase/firestore/use-doc';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

const profileSchema = z.object({
  displayName: z.string().min(2, 'El nombre debe tener al menos 2 caracteres.'),
  email: z.string().email('Email inválido.'),
});

const securitySchema = z.object({
    currentPassword: z.string().min(1, 'La contraseña actual es requerida.'),
    newPassword: z.string().min(6, 'La nueva contraseña debe tener al menos 6 caracteres.'),
    confirmPassword: z.string(),
}).refine(data => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas no coinciden.',
    path: ['confirmPassword'],
});


type ProfileFormValues = z.infer<typeof profileSchema>;
type SecurityFormValues = z.infer<typeof securitySchema>;

interface UserProfileData {
    subscription?: string;
    subscriptionEndDate?: { toDate: () => Date };
}

function ProfileForm() {
    const { user, setUser } = useUser();
    const auth = useAuth();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const userProfileRef = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return doc(firestore, 'users', user.uid);
    }, [user, firestore]);

    const { data: userProfile } = useDoc<UserProfileData>(userProfileRef);

    const form = useForm<ProfileFormValues>({
        resolver: zodResolver(profileSchema),
        defaultValues: {
            displayName: '',
            email: '',
        }
    });
    
    useEffect(() => {
        if (user) {
            form.reset({
                displayName: user.displayName || '',
                email: user.email || '',
            });
        }
    }, [user, form]);
    
    const onSubmit = async (data: ProfileFormValues) => {
        if (!user || !auth.currentUser) return;
        setIsSubmitting(true);
        try {
            await updateProfile(auth.currentUser, {
                displayName: data.displayName,
            });
            await updateDoc(doc(firestore, "users", user.uid), { displayName: data.displayName });

            // Force update the local user state for immediate UI refresh
            setUser({ ...auth.currentUser });

            toast({
                title: 'Perfil actualizado',
                description: 'Tus datos se han guardado correctamente.',
            });
        } catch (error) {
            console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No se pudo actualizar tu perfil.',
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    const subscriptionEndDate = userProfile?.subscriptionEndDate?.toDate();

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
                <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Información de la Cuenta</CardTitle>
                        <CardDescription>Estos datos son visibles para otros miembros de tus equipos.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                            <FormField
                            control={form.control}
                            name="displayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Tu nombre" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                            />
                        <FormField
                            control={form.control}
                            name="email"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input type="email" {...field} disabled />
                                    </FormControl>
                                    <p className="text-sm text-muted-foreground">No puedes cambiar tu dirección de correo electrónico.</p>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormItem>
                            <FormLabel>Suscripción</FormLabel>
                            <Input value={userProfile?.subscription || 'Invitado'} disabled />
                        </FormItem>
                        {subscriptionEndDate && (
                            <FormItem>
                                <FormLabel>Fin de la Suscripción</FormLabel>
                                <Input value={format(subscriptionEndDate, 'PPP', { locale: es })} disabled />
                            </FormItem>
                        )}
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}

function SecurityForm() {
    const { user } = useUser();
    const auth = useAuth();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<SecurityFormValues>({
        resolver: zodResolver(securitySchema),
        defaultValues: {
            currentPassword: '',
            newPassword: '',
            confirmPassword: '',
        },
    });

    const onSubmit = async (data: SecurityFormValues) => {
        if (!user || !user.email) return;

        setIsSubmitting(true);
        try {
            const credential = EmailAuthProvider.credential(user.email, data.currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, data.newPassword);
            toast({
                title: 'Contraseña actualizada',
                description: 'Tu contraseña se ha cambiado correctamente.',
            });
            form.reset();
        } catch (error: any) {
            let description = 'No se pudo actualizar tu contraseña.';
            if (error.code === 'auth/wrong-password') {
                description = 'La contraseña actual es incorrecta.';
            } else if (error.code === 'auth/weak-password') {
                description = 'La nueva contraseña es demasiado débil.';
            }
             console.error(error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: description,
            });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl mx-auto">
                 <Card>
                    <CardHeader>
                        <CardTitle className="text-xl">Cambiar Contraseña</CardTitle>
                        <CardDescription>Para mayor seguridad, te recomendamos que uses una contraseña única.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                         <FormField
                            control={form.control}
                            name="currentPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contraseña Actual</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="newPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="confirmPassword"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Confirmar Nueva Contraseña</FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                            <Input type="password" {...field} className="pl-9" />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                    </CardContent>
                    <CardFooter className="justify-end">
                        <Button type="submit" disabled={isSubmitting}>
                            <Save className="mr-2 h-4 w-4" />
                            {isSubmitting ? 'Guardando...' : 'Cambiar Contraseña'}
                        </Button>
                    </CardFooter>
                </Card>
            </form>
        </Form>
    )
}

export default function PerfilPage() {
  const { user, isUserLoading } = useUser();
 
  if (isUserLoading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Skeleton className="h-8 w-48 mb-8" />
        <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-1"><Skeleton className="h-64 w-full" /></div>
            <div className="md:col-span-2"><Skeleton className="h-80 w-full" /></div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold">Acceso denegado</h1>
        <p className="text-muted-foreground mt-2">Debes iniciar sesión para ver tu perfil.</p>
        <Button asChild className="mt-4">
          <Link href="/acceso">Iniciar Sesión</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="mb-8">
            <h1 className="text-4xl font-bold font-headline text-primary">Mi Perfil</h1>
            <p className="text-lg text-muted-foreground mt-2">Gestiona tu información personal y la configuración de tu cuenta.</p>
        </div>

        <Tabs defaultValue="profile" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="profile">Datos Personales</TabsTrigger>
                <TabsTrigger value="security">Seguridad</TabsTrigger>
            </TabsList>
            <TabsContent value="profile" className="mt-6">
                <ProfileForm />
            </TabsContent>
            <TabsContent value="security" className="mt-6">
                <SecurityForm />
            </TabsContent>
        </Tabs>
    </div>
  );
}

    

    
=======
"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save, User } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Mi Perfil</h1>
        <p className="text-lg text-muted-foreground mt-2">Gestiona tu información personal y la configuración de tu cuenta.</p>
      </div>

      <Tabs defaultValue="personal" className="max-w-2xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Datos Personales</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <Card>
            <CardHeader>
                <CardTitle>Información de la Cuenta</CardTitle>
                <CardDescription>Estos datos son visibles para otros miembros de tus equipos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="nombre">Nombre</Label>
                <Input id="nombre" defaultValue="Francisco" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" defaultValue="futsaldex@gmail.com" disabled />
                <p className="text-xs text-muted-foreground">No puedes cambiar tu dirección de correo electrónico.</p>
              </div>
               <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="suscripcion">Suscripción</Label>
                        <Input id="suscripcion" defaultValue="Pro" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fin-suscripcion">Fin de la Suscripción</Label>
                        <Input id="fin-suscripcion" defaultValue="1 de octubre de 2026" disabled />
                    </div>
               </div>
              <div className="flex justify-end">
                <Button>
                  <Save className="mr-2 h-4 w-4" />
                  Guardar Cambios
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seguridad">
          <Card>
            <CardHeader>
              <CardTitle>Cambiar Contraseña</CardTitle>
              <CardDescription>
                Para mayor seguridad, te recomendamos que uses una contraseña única.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input id="new-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Nueva Contraseña</Label>
                <Input id="confirm-password" type="password" />
              </div>
               <div className="flex justify-end pt-4">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Cambiar Contraseña
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

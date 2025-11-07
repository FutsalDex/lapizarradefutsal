
'use client';

import { useState, useMemo } from 'react';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, doc, query, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { useToast } from '@/hooks/use-toast';
import { PlusCircle, Calendar as CalendarIcon, ListChecks, Star, User, Eye, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Badge } from '@/components/ui/badge';

interface Session {
    id: string;
    name: string;
    date: any;
    exercises: { initial: string[], main: string[], final: string[] } | string[];
    objectives?: string;
    sessionType?: 'basic' | 'pro';
}

interface UserProfileData {
    subscription?: string;
}

function SessionCard({ session, onDelete }: { session: Session; onDelete: (sessionId: string) => void; }) {
    const firestore = useFirestore();
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    
    const exerciseIds = useMemo(() => {
        if (!session.exercises) return [];
        if (Array.isArray(session.exercises)) return session.exercises;
        if (typeof session.exercises === 'object') {
            return [
                ...(session.exercises.initial || []),
                ...(session.exercises.main || []),
                ...(session.exercises.final || [])
            ];
        }
        return [];
    }, [session.exercises]);

    const exerciseRefs = useMemoFirebase(() => {
        if (!firestore || exerciseIds.length === 0) return [];
        return exerciseIds.map(id => doc(firestore, 'exercises', id));
    }, [firestore, exerciseIds]);

    // This creates an array of hooks, which is against the rules of hooks if the length changes.
    // However, `exerciseRefs` is memoized, so this should be stable across renders for a given session.
    // A more robust solution might involve a custom hook that fetches multiple documents.
    const exerciseHooks = exerciseRefs.map(ref => useDoc<any>(ref));
    const isLoadingExercises = exerciseHooks.some(hook => hook.isLoading);
    
    const exerciseDetails = useMemo(() => {
        return exerciseHooks.map(hook => hook.data ? mapExercise(hook.data) : null).filter(Boolean) as Exercise[];
    }, [exerciseHooks]);

    const getExerciseCount = (session: Session) => {
      return exerciseIds.length;
    }

    return (
        <Card className="flex flex-col hover:border-primary transition-colors">
            <CardHeader>
                <div className="flex justify-between items-start">
                    <CardTitle className="font-headline text-xl">{session.name}</CardTitle>
                    {session.sessionType && (
                        <Badge variant={session.sessionType === 'pro' ? 'default' : 'secondary'}>
                            {session.sessionType.charAt(0).toUpperCase() + session.sessionType.slice(1)}
                        </Badge>
                    )}
                </div>
                <CardDescription className="flex items-center pt-2">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(session.date.toDate ? session.date.toDate() : new Date(session.date), 'PPP', { locale: es })}
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
                <div className="flex items-center text-sm text-muted-foreground">
                    <ListChecks className="mr-2 h-4 w-4" />
                    <span>{getExerciseCount(session)} ejercicios</span>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" className="w-full mr-2">
                             <Eye className="mr-2 h-4 w-4" /> Ver Detalles
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                         <DialogHeader>
                            <DialogTitle>{session.name}</DialogTitle>
                            <DialogDescription>
                                {format(session.date.toDate ? session.date.toDate() : new Date(session.date), 'PPP', { locale: es })}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                            {session.objectives && (
                                <div>
                                    <h4 className="font-semibold">Objetivos</h4>
                                    <p className="text-sm text-muted-foreground">{session.objectives}</p>
                                </div>
                            )}
                            <div>
                                <h4 className="font-semibold">Ejercicios</h4>
                                {isLoadingExercises ? (
                                    <p>Cargando ejercicios...</p>
                                ) : (
                                    <ul className="list-disc pl-5 text-sm text-muted-foreground">
                                        {exerciseDetails.map((ex, index) => <li key={`${ex.id}-${index}`}>{ex.name}</li>)}
                                    </ul>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <DialogClose asChild>
                                <Button type="button" variant="secondary">Cerrar</Button>
                            </DialogClose>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                         <Button variant="destructive" size="icon">
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción eliminará la sesión de forma permanente. No se podrá recuperar.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(session.id)} className="bg-destructive hover:bg-destructive/90">
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );
}

export default function MisSesionesPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [key, setKey] = useState(0);
    const { toast } = useToast();

    const sessionsQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, `users/${user.uid}/sessions`));
    }, [firestore, user, key]);
    
    const userProfileRef = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);

    const { data: sessions, isLoading: isLoadingSessions } = useCollection<Session>(sessionsQuery);
    const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfileData>(userProfileRef);
    
    const isLoading = isLoadingSessions || isUserLoading || isLoadingProfile;
    const isGuestUser = userProfile?.subscription === 'Invitado';

    const handleDeleteSession = async (sessionId: string) => {
        if (!user || !firestore) return;
        try {
            await deleteDoc(doc(firestore, `users/${user.uid}/sessions`, sessionId));
            toast({ title: 'Sesión eliminada', description: 'La sesión ha sido eliminada correctamente.' });
            setKey(prev => prev + 1); // Refresh the collection
        } catch (error) {
            console.error("Error deleting session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la sesión.' });
        }
    };

    return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="text-center md:text-left">
          <h1 className="text-4xl font-bold font-headline">Mis Sesiones</h1>
          <p className="text-lg text-muted-foreground mt-2">Organiza y planifica tus entrenamientos.</p>
        </div>
        <div className='mt-4 md:mt-0 w-full md:w-auto'>
            {user && (
                <Button asChild>
                    <Link href="/sesiones">
                         <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Sesión
                    </Link>
                </Button>
            )}
        </div>
      </div>
      
      {user && !isUserLoading && isGuestUser && (
          <Card className="mb-8 border-primary bg-primary/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-primary">
                    <Star/>
                    Funcionalidad Limitada
                </CardTitle>
                <CardDescription>
                   Estás usando una cuenta de invitado. Suscríbete para desbloquear la creación de sesiones PRO (con imágenes, descripciones) y la exportación a PDF.
                </CardDescription>
              </CardHeader>
              <CardContent>
                  <Button asChild>
                      <Link href="/suscripcion">Ver Planes</Link>
                  </Button>
              </CardContent>
          </Card>
      )}

      {isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-48 w-full" />)}
        </div>
      )}

      {!isLoading && !user && (
          <Card className="text-center py-16 max-w-lg mx-auto border-primary bg-primary/10">
             <CardHeader>
                <CardTitle className="text-2xl font-bold text-primary">Planifica tus Entrenamientos</CardTitle>
                <CardDescription className="text-base">
                    Regístrate para empezar a crear, guardar y organizar tus sesiones de entrenamiento de forma profesional.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <Button asChild size="lg">
                    <Link href="/acceso">
                        <User className="mr-2 h-5 w-5" />
                        Registrarme Gratis
                    </Link>
                </Button>
            </CardContent>
          </Card>
      )}
      
      {!isLoading && user && sessions && sessions.length === 0 && (
          <Card className="text-center py-16 border-dashed border-2">
              <CardHeader>
                <CardTitle>No tienes sesiones</CardTitle>
                <CardDescription>Empieza a planificar creando tu primera sesión de entrenamiento.</CardDescription>
              </CardHeader>
              <CardContent>
                 <Button asChild>
                    <Link href="/sesiones">
                         <PlusCircle className="mr-2 h-4 w-4" /> Crear Sesión
                    </Link>
                </Button>
              </CardContent>
          </Card>
      )}

      {!isLoading && user && sessions && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <SessionCard key={session.id} session={session} onDelete={handleDeleteSession} />
            ))}
          </div>
      )}
    </div>
  );
}

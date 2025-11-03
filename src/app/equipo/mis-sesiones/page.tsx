

'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, query } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle, Calendar as CalendarIcon, ListChecks, Search, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Badge } from '@/components/ui/badge';
import { useDoc } from '@/firebase';

const sessionSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
  objectives: z.string().optional(),
  exercises: z.array(z.string()).min(1, 'Debes seleccionar al menos un ejercicio.'),
});

type SessionFormValues = z.infer<typeof sessionSchema>;

interface Session {
    id: string;
    name: string;
    date: any;
    exercises: { initial: string[], main: string[], final: string[] } | any;
    sessionType?: 'basic' | 'pro';
}

interface UserProfileData {
    subscription?: string;
}

function CreateSessionDialog({ onSessionCreated }: { onSessionCreated: () => void }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();

    const [isOpen, setIsOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    
    const exercisesCollection = useMemoFirebase(() => collection(firestore, 'exercises'), [firestore]);
    const { data: rawExercises, isLoading: isLoadingExercises } = useCollection<any>(exercisesCollection);

    const allExercises = useMemo(() => {
        if (!rawExercises) return [];
        return rawExercises.map(mapExercise);
    }, [rawExercises]);
    
    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: { name: '', date: new Date(), objectives: '', exercises: [] },
    });

    const filteredExercises = useMemo(() => {
        if (!allExercises) return [];
        return allExercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }, [allExercises, searchTerm]);

    const onSubmit = async (values: SessionFormValues) => {
        if (!user) return;
        setIsSubmitting(true);
        try {
            await addDoc(collection(firestore, `users/${user.uid}/sessions`), {
                ...values,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Éxito', description: 'Sesión de entrenamiento creada.' });
            onSessionCreated();
            setIsOpen(false);
            form.reset();
        } catch (error) {
            console.error("Error creating session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la sesión.' });
        } finally {
            setIsSubmitting(false);
        }
    };
    
    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Sesión
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Crear Nueva Sesión</DialogTitle>
                    <DialogDescription>Planifica tu próximo entrenamiento.</DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre de la sesión</FormLabel><FormControl><Input placeholder="Ej: Sesión de Finalización" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-[240px] pl-3 text-left font-normal', !field.value && 'text-muted-foreground')} >{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem>)}/>
                        <FormField control={form.control} name="objectives" render={({ field }) => ( <FormItem><FormLabel>Objetivos (opcional)</FormLabel><FormControl><Textarea placeholder="Ej: Mejorar la precisión en el tiro" {...field} /></FormControl><FormMessage /></FormItem> )} />
                        
                        <FormField
                            control={form.control}
                            name="exercises"
                            render={() => (
                                <FormItem>
                                    <FormLabel>Ejercicios</FormLabel>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                        <Input placeholder="Buscar ejercicios..." className="pl-9 mb-2" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
                                    </div>
                                    <ScrollArea className="h-60 w-full rounded-md border">
                                        <div className="p-4">
                                            {isLoadingExercises ? <p>Cargando ejercicios...</p> : filteredExercises.map((item) => (
                                                <FormField key={item.id} control={form.control} name="exercises"
                                                    render={({ field }) => (
                                                        <FormItem key={item.id} className="flex flex-row items-start space-x-3 space-y-0 py-2">
                                                            <FormControl>
                                                                <Checkbox
                                                                    checked={field.value?.includes(item.id)}
                                                                    onCheckedChange={(checked) => {
                                                                        return checked
                                                                        ? field.onChange([...field.value, item.id])
                                                                        : field.onChange(field.value?.filter((value) => value !== item.id));
                                                                    }}
                                                                />
                                                            </FormControl>
                                                            <FormLabel className="font-normal">{item.name}</FormLabel>
                                                        </FormItem>
                                                    )}
                                                />
                                            ))}
                                        </div>
                                    </ScrollArea>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Creando...' : 'Crear Sesión'}</Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

export default function SesionesPage() {
    const firestore = useFirestore();
    const { user, isUserLoading } = useUser();
    const [key, setKey] = useState(0);

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

    const getExerciseCount = (session: Session) => {
        if (!session.exercises) return 0;
        if (Array.isArray(session.exercises)) {
            return session.exercises.length;
        }
        if (typeof session.exercises === 'object') {
            return (session.exercises.initial?.length || 0) +
                   (session.exercises.main?.length || 0) +
                   (session.exercises.final?.length || 0);
        }
        return 0;
    }

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
          <Card className="text-center py-16">
              <CardHeader><CardTitle>Inicia Sesión</CardTitle><CardDescription>Debes iniciar sesión para ver y crear sesiones.</CardDescription></CardHeader>
              <CardContent><Button asChild><Link href="/acceso">Acceder</Link></Button></CardContent>
          </Card>
      )}
      
      {!isLoading && user && sessions && sessions.length === 0 && (
          <Card className="text-center py-16">
              <CardHeader><CardTitle>No tienes sesiones</CardTitle><CardDescription>Empieza a planificar creando tu primera sesión de entrenamiento.</CardDescription></CardHeader>
          </Card>
      )}

      {!isLoading && user && sessions && sessions.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessions.map((session) => (
              <Card key={session.id} className="flex flex-col hover:border-primary transition-colors">
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
                <CardFooter>
                  <Button variant="outline" className="w-full" disabled>Ver Detalles</Button>
                </CardFooter>
              </Card>
            ))}
          </div>
      )}
    </div>
  );
}

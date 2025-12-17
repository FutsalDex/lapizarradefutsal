<<<<<<< HEAD
'use client';

import { useState, useMemo, useRef, useSearchParams } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, updateDoc, Timestamp, query, where, getDocs } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useRouter } from 'next/navigation';

=======

"use client";

import { sessions } from '@/lib/data';
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Plus, Calendar as CalendarIcon, Save, Trash2, Eye, Download, Shield, Replace, Loader2, Pencil } from 'lucide-react';
import Link from 'next/link';
<<<<<<< HEAD
import { Exercise, mapExercise } from '@/lib/data';
import Image from 'next/image';
import { FutsalCourt } from '@/components/futsal-court';
import { useDoc } from '@/firebase';
import { Separator } from '@/components/ui/separator';

// ====================
// TIPOS Y SCHEMAS
// ====================
const sessionSchema = z.object({
  name: z.string().min(1, 'El número de sesión es requerido.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
  time: z.string().optional(),
  facility: z.string().optional(),
  microcycle: z.string().optional(),
  club: z.string().optional(),
  team: z.string().optional(),
  season: z.string().optional(),
});

type SessionFormValues = z.infer<typeof sessionSchema>;
type PhaseType = 'initial' | 'main' | 'final';

// ====================
// COMPONENTES
// ====================

const ExerciseCard = ({
  exercise,
  onRemove,
  title,
  children,
}: {
  exercise: Exercise | null;
  onRemove: () => void;
  title: string;
  children: React.ReactNode;
}) => {
  if (exercise) {
    return (
      <div className="relative group">
        <Card className="overflow-hidden h-48 flex flex-col">
          <div className="relative w-full h-full bg-muted">
            <Image
              src={exercise.image || `https://picsum.photos/seed/${exercise.id}/400/250`}
              alt={exercise.name}
              data-ai-hint={exercise.aiHint || 'futsal drill court'}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-black/60" />
          </div>
          <CardHeader className="absolute top-0 z-10 p-2 text-white">
            <CardTitle className="text-sm font-bold truncate">{exercise.name}</CardTitle>
            <CardDescription className="text-xs text-gray-300">
              {exercise.duration} min
            </CardDescription>
          </CardHeader>
          <CardContent className="absolute bottom-0 z-10 p-2 flex gap-2">
            {children}
            <Button size="icon" variant="destructive" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); onRemove(); }}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
=======
import { PlusCircle, Calendar, ListChecks } from 'lucide-react';
import { Badge } from '@/components/ui/badge';


const exampleSessions = sessions;

>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

  return (
<<<<<<< HEAD
    <div className="h-48">
      {children}
=======
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className="text-left">
          <h1 className="text-4xl font-bold font-headline">Mis Sesiones</h1>
          <p className="text-lg text-muted-foreground mt-2">Organiza y planifica tus entrenamientos.</p>
        </div>
        <Button asChild className="mt-4 md:mt-0 w-full md:w-auto">
          <Link href="/sesiones/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Crear Nueva Sesión
          </Link>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {exampleSessions.map((session) => (
          <Card key={session.id} className="flex flex-col hover:border-primary/50 transition-colors">
            <CardHeader className='relative'>
                <CardTitle>{session.name}</CardTitle>
                <Badge variant="secondary" className="absolute top-4 right-4">Básico</Badge>
            </CardHeader>
            <CardContent className="flex-grow space-y-4">
               <div className="flex items-center text-muted-foreground">
                <Calendar className="mr-3 h-5 w-5" />
                <span>{new Date(session.date).toLocaleDateString('es-ES', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <ListChecks className="mr-3 h-5 w-5" />
                <span>{session.exercises.length} ejercicios</span>
              </div>
            </CardContent>
            <CardFooter>
                <Button variant="outline" className="w-full" asChild>
                    <Link href={`/sesiones/${session.id}`}>Ver Detalles</Link>
                </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
    </div>
  );
};


function ExercisePickerDialog({ allExercises, onSelect, phase, children }: { allExercises: Exercise[], onSelect: (id: Exercise, phase: PhaseType) => void, phase: PhaseType, children: React.ReactNode }) {
    const [searchTerm, setSearchTerm] = useState('');
    const [categoryFilter, setCategoryFilter] = useState('Todas');
    const [ageFilter, setAgeFilter] = useState('Todas');

    const categories = useMemo(() => {
        if (!allExercises) return [];
        return [...new Set(allExercises.map(e => e.category).filter(Boolean))];
    }, [allExercises]);
    
    const ages = useMemo(() => {
        if (!allExercises) return [];
        const allAges = allExercises.flatMap(e => e.edad || []);
        return [...new Set(allAges)].sort();
    }, [allExercises]);

    const filteredExercises = useMemo(() => {
        if (!allExercises) return [];
        return allExercises.filter(ex => {
            const matchesSearch = ex.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesCategory = categoryFilter === 'Todas' || ex.category === categoryFilter;
            const matchesAge = ageFilter === 'Todas' || (Array.isArray(ex.edad) && ex.edad.some(e => e.toLowerCase() === ageFilter.toLowerCase()));
            return matchesSearch && matchesCategory && matchesAge && ex.visible;
        });
    }, [allExercises, searchTerm, categoryFilter, ageFilter]);
    
    return (
        <Dialog>
            <DialogTrigger asChild>{children}</DialogTrigger>
            <DialogContent className="max-w-4xl h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Seleccionar Ejercicio</DialogTitle>
                    <DialogDescription>Busca y selecciona un ejercicio de tu biblioteca.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <Input
                            placeholder="Buscar por nombre..."
                            className="sm:col-span-1"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                       <Select onValueChange={setCategoryFilter} defaultValue="Todas">
                          <SelectTrigger>
                            <SelectValue placeholder="Categoría" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todas">Todas las Categorías</SelectItem>
                            {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                          </SelectContent>
                        </Select>
                         <Select onValueChange={setAgeFilter} defaultValue="Todas">
                          <SelectTrigger>
                            <SelectValue placeholder="Edad" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Todas">Todas las Edades</SelectItem>
                            {ages.map(age => <SelectItem key={age} value={age} className="capitalize">{age}</SelectItem>)}
                          </SelectContent>
                        </Select>
                    </div>
                </div>
                <ScrollArea className="flex-grow rounded-md border">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
                        {filteredExercises.map(exercise => (
                             <Card key={exercise.id} className="overflow-hidden group">
                                <CardContent className="p-0 relative">
                                     <div className="relative aspect-video w-full bg-muted">
                                         {exercise.image ? (
                                            <Image
                                                src={exercise.image}
                                                alt={exercise.name}
                                                fill
                                                className="object-contain"
                                                data-ai-hint={exercise.aiHint}
                                            />
                                        ) : (
                                            <FutsalCourt className="absolute inset-0 w-full h-full object-cover p-2" />
                                        )}
                                        <div className="absolute inset-0 bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                             <DialogClose asChild>
                                                <Button size="icon" className="rounded-full h-10 w-10" onClick={() => onSelect(exercise, phase)}>
                                                    <Plus className="h-5 w-5" />
                                                </Button>
                                             </DialogClose>
                                        </div>
                                     </div>
                                </CardContent>
                                <CardFooter className="p-2">
                                    <div className='w-full text-center'>
                                        <p className="font-semibold truncate text-xs">{exercise.name}</p>
                                    </div>
                                </CardFooter>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
}

function AddExerciseCard({ title }: { title: string }) {
    return (
        <Card className="relative flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent hover:border-primary hover:bg-accent/50 transition-colors cursor-pointer">
            <CardHeader className="p-0">
                <CardTitle className="text-lg font-semibold">{title}</CardTitle>
            </CardHeader>
            <CardContent className="p-0 mt-2">
                <div className="flex items-center justify-center h-8 w-8 rounded-full bg-primary text-primary-foreground">
                    <Plus className="h-5 w-5" />
                </div>
            </CardContent>
        </Card>
    );
}


function PhaseSection({ title, phase, exercises, onExerciseSelected, onRemoveExercise, onAddSlot, limit }: { 
    title: string, 
    phase: PhaseType, 
    exercises: (Exercise | null)[], 
    onExerciseSelected: (phase: PhaseType, index: number, exercise: Exercise) => void,
    onRemoveExercise: (phase: PhaseType, index: number) => void,
    onAddSlot: (phase: PhaseType) => void,
    limit: number 
}) {
    const firestore = useFirestore();
    const exercisesCollection = useMemoFirebase(() => collection(firestore, 'exercises'), [firestore]);
    const { data: rawExercises } = useCollection<any>(exercisesCollection);
    const allExercises = useMemo(() => rawExercises ? rawExercises.map(mapExercise).sort((a,b) => a.name.localeCompare(b.name)) : [], [rawExercises]);
    
    const atLimit = exercises.length >= limit;

    return (
        <div>
            <h3 className="text-xl font-semibold mb-4 border-b pb-2">{title}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                {exercises.map((ex, index) => (
                    <ExerciseCard
                        key={`${phase}-${index}`}
                        exercise={ex}
                        onRemove={() => onRemoveExercise(phase, index)}
                        title={`Tarea ${index + 1}`}
                    >
                        <ExercisePickerDialog allExercises={allExercises} onSelect={(exercise) => onExerciseSelected(phase, index, exercise)} phase={phase}>
                            {ex ? (
                                <Button size="icon" variant="secondary" className="h-8 w-8" onClick={(e) => e.stopPropagation()}>
                                    <Replace className="h-4 w-4" />
                                </Button>
                            ) : (
                                <AddExerciseCard title={`Tarea ${index + 1}`} />
                            )}
                        </ExercisePickerDialog>
                    </ExerciseCard>
                ))}
                {!atLimit && (
                    <Card className="flex flex-col items-center justify-center text-center p-4 border-2 border-dashed h-48 bg-transparent hover:border-primary hover:bg-accent/50 cursor-pointer" onClick={() => onAddSlot(phase)}>
                        <CardHeader className="p-0">
                            <CardTitle className="text-lg font-semibold text-muted-foreground">Añadir Tarea</CardTitle>
                        </CardHeader>
                        <CardContent className="p-0 mt-2">
                            <div className="flex items-center justify-center h-8 w-8 rounded-full bg-secondary text-secondary-foreground">
                                <Plus className="h-6 w-6" />
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function CreateSessionPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const router = useRouter();
    const searchParams = useSearchParams();
    const sessionId = searchParams.get('sessionId');
    const teamId = searchParams.get('teamId');
    const firestore = useFirestore();

    const [isSaving, setIsSaving] = useState(false);
    
    // State for selected exercises
    const [initialExercises, setInitialExercises] = useState<(Exercise | null)[]>([null]);
    const [mainExercises, setMainExercises] = useState<(Exercise | null)[]>([null, null]);
    const [finalExercises, setFinalExercises] = useState<(Exercise | null)[]>([null]);


    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            date: new Date(),
            name: '1',
            microcycle: '',
            team: '',
            season: '',
            club: '',
        },
    });

     useEffect(() => {
        if (teamId) {
            const fetchTeamData = async () => {
                if(!firestore) return;
                const teamDocRef = doc(firestore, 'teams', teamId);
                const teamDoc = await getDoc(teamDocRef);
                if (teamDoc.exists()) {
                    const data = teamDoc.data();
                    // Set default values for the form from the team data
                    form.setValue('team', data.name);
                    form.setValue('club', data.club);
                }
            };
            fetchTeamData();
        }
    }, [teamId, form, firestore]);
    
     useEffect(() => {
        if (sessionId && firestore) {
            const fetchSession = async () => {
                const sessionRef = doc(firestore, 'sessions', sessionId);
                const sessionSnap = await getDoc(sessionRef);
                if (sessionSnap.exists()) {
                    const sessionData = sessionSnap.data();

                    const fetchExercises = async (ids: string[]) => {
                        if (!ids || ids.length === 0) return [];
                        const exercisesData: Record<string, Exercise> = {};
                        const chunks = [];
                        for (let i = 0; i < ids.length; i += 30) {
                            chunks.push(ids.slice(i, i + 30));
                        }
                        for(const chunk of chunks) {
                            const exercisesQuery = query(collection(firestore, 'exercises'), where('__name__', 'in', chunk));
                            const exercisesSnapshot = await getDocs(exercisesQuery);
                            exercisesSnapshot.forEach(doc => {
                                exercisesData[doc.id] = { id: doc.id, ...doc.data() } as Exercise;
                            });
                        }
                        return ids.map(id => exercisesData[id] || null);
                    }
                    
                    const populatedInitial = await fetchExercises(sessionData.initialExercises || []);
                    const populatedMain = await fetchExercises(sessionData.mainExercises || []);
                    const populatedFinal = await fetchExercises(sessionData.finalExercises || []);
                    
                    setInitialExercises(populatedInitial.length > 0 ? populatedInitial : [null]);
                    setMainExercises(populatedMain.length > 0 ? populatedMain : [null, null]);
                    setFinalExercises(populatedFinal.length > 0 ? populatedFinal : [null]);
                    
                    form.reset({
                        date: (sessionData.date as Timestamp).toDate(),
                        microcycle: sessionData.microcycle || '',
                        name: sessionData.sessionNumber,
                        team: sessionData.team || '',
                        club: sessionData.club || '',
                        season: sessionData.season || '',
                    });
                }
            };
            fetchSession();
        }
    }, [sessionId, form, firestore]);


    const handleExerciseSelected = (type: PhaseType, index: number, exercise: Exercise) => {
         const updaters = {
            'initial': setInitialExercises,
            'main': setMainExercises,
            'final': setFinalExercises
        };
        const updater = updaters[type];
        updater(prev => {
            const newExercises = [...prev];
            newExercises[index] = exercise;
            return newExercises;
        });
    };

    const addExerciseSlot = (type: PhaseType) => {
        const updaters = {
            'initial': { set: setInitialExercises, limit: 2 },
            'main': { set: setMainExercises, limit: 4 },
            'final': { set: setFinalExercises, limit: 2 }
        };
        
        const updater = updaters[type];

        updater.set(prev => prev.length < updater.limit ? [...prev, null] : prev);
    }
    
    const removeExerciseSlot = (type: PhaseType, index: number) => {
        const updater = {
            'initial': setInitialExercises,
            'main': setMainExercises,
            'final': setFinalExercises
        }[type];
        
        updater(prev => {
            const newArr = prev.filter((_, i) => i !== index);
            return newArr.length > 0 ? newArr : [null]; // Always keep at least one slot
        });
    }

    const handleSaveSession = async (data: SessionFormValues) => {
        if (!user || !firestore) {
            toast({ title: 'Error', description: 'Debes iniciar sesión para guardar una sesión.', variant: 'destructive'});
            return;
        }
        
        const allExercises = [...initialExercises, ...mainExercises, ...finalExercises].filter(Boolean);
        if (allExercises.length === 0) {
            toast({ title: 'Sesión vacía', description: 'Debes añadir al menos un ejercicio para guardar la sesión.', variant: 'destructive'});
            return;
        }

        setIsSaving(true);
        
        const sanitizedData = {
            date: data.date,
            team: data.team || '',
            season: data.season || '',
            club: data.club || '',
            microcycle: data.microcycle || '',
            sessionNumber: data.name || '1',
        };

        const sessionData = {
            ...sanitizedData,
            userId: user.uid,
            teamId: teamId || null,
            initialExercises: initialExercises.map(ex => ex?.id).filter(Boolean),
            mainExercises: mainExercises.map(ex => ex?.id).filter(Boolean),
            finalExercises: finalExercises.map(ex => ex?.id).filter(Boolean),
        };
        
        try {
            if (sessionId) {
                const sessionRef = doc(firestore, 'sessions', sessionId);
                await updateDoc(sessionRef, {
                    ...sessionData,
                    updatedAt: serverTimestamp()
                });
                toast({ title: '¡Sesión Actualizada!', description: 'Tu sesión de entrenamiento ha sido actualizada.' });
            } else {
                const newSession = await addDoc(collection(firestore, 'sessions'), {
                    ...sessionData,
                    createdAt: serverTimestamp(),
                });
                toast({ title: '¡Sesión Guardada!', description: 'Tu sesión de entrenamiento ha sido guardada.' });
                router.push(`/sesiones?sessionId=${newSession.id}`);
            }
        } catch (error) {
            console.error("Error saving session: ", error);
            toast({ title: 'Error', description: 'No se pudo guardar la sesión.', variant: 'destructive' });
        } finally {
            setIsSaving(false);
        }
    }

    return (
        <>
            <div className="container mx-auto max-w-6xl py-12 px-4">
                <div className="text-center mb-12">
                    <div className="flex justify-center mb-4">
                        <Pencil className="h-16 w-16 text-primary" />
                    </div>
                    <h1 className="text-4xl font-bold font-headline tracking-tight text-primary">
                        Creador de Sesiones
                    </h1>
                    <p className="text-xl text-muted-foreground mt-2">
                        Diseña tu sesión de entrenamiento paso a paso o deja que la IA te ayude.
                    </p>
                </div>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleSaveSession)} className="space-y-12">
                        <Card>
                            <CardHeader>
                                <CardTitle>Información de la Sesión</CardTitle>
                                <CardDescription>Completa los datos básicos de tu entrenamiento.</CardDescription>
                            </CardHeader>
                            <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="date" render={({ field }) => ( <FormItem> <FormLabel>Día de entrenamiento</FormLabel> <Popover> <PopoverTrigger asChild> <Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')} > <CalendarIcon className="mr-2 h-4 w-4" /> {field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>} </Button> </PopoverTrigger> <PopoverContent className="w-auto p-0"> <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus locale={es} /> </PopoverContent> </Popover> <FormMessage /> </FormItem> )} />
                                <FormField control={form.control} name="microcycle" render={({ field }) => ( <FormItem> <FormLabel>Microciclo</FormLabel> <FormControl> <Input type="number" placeholder="Ej: 1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                                <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Número de sesión</FormLabel> <FormControl> <Input type="number" placeholder="Ej: 1" {...field} /> </FormControl> <FormMessage /> </FormItem> )} />
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2"><Users className="h-5 w-5" />Datos del Equipo</CardTitle>
                                <CardDescription>Información sobre el equipo y los recursos para esta sesión.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <FormField control={form.control} name="season" render={({ field }) => ( <FormItem> <FormLabel>Temporada</FormLabel> <FormControl> <Input placeholder="Ej: 2024-2025" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
                                    <FormField control={form.control} name="club" render={({ field }) => ( <FormItem> <FormLabel>Club</FormLabel> <FormControl> <Input placeholder="Nombre del club" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
                                    <FormField control={form.control} name="team" render={({ field }) => ( <FormItem> <FormLabel>Equipo</FormLabel> <FormControl> <Input placeholder="Ej: Cadete A" {...field}/> </FormControl> <FormMessage /> </FormItem> )}/>
                                </div>
                                <Separator />
                            </CardContent>
                        </Card>

                        <div>
                            <h2 className="text-2xl font-bold font-headline text-primary mb-2">Estructura de la Sesión</h2>
                            <p className="text-muted-foreground mb-6">Selecciona los ejercicios para cada fase del entrenamiento.</p>
                            <div className="space-y-8">
                                <PhaseSection
                                    title="Fase Inicial"
                                    phase="initial"
                                    exercises={initialExercises}
                                    onExerciseSelected={handleExerciseSelected}
                                    onRemoveExercise={removeExerciseSlot}
                                    onAddSlot={addExerciseSlot}
                                    limit={2}
                                />
                                <PhaseSection
                                    title="Fase Principal"
                                    phase="main"
                                    exercises={mainExercises}
                                    onExerciseSelected={handleExerciseSelected}
                                    onRemoveExercise={removeExerciseSlot}
                                    onAddSlot={addExerciseSlot}
                                    limit={4}
                                />
                                 <PhaseSection
                                    title="Fase Final"
                                    phase="final"
                                    exercises={finalExercises}
                                    onExerciseSelected={handleExerciseSelected}
                                    onRemoveExercise={removeExerciseSlot}
                                    onAddSlot={addExerciseSlot}
                                    limit={2}
                                />
                            </div>
                        </div>

                        <Separator />

                        <div className="flex flex-col md:flex-row justify-end items-center gap-4">
                            <Button size="lg" type="submit" disabled={isSaving}>
                                {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Save className="mr-2 h-5 w-5" />}
                                {sessionId ? 'Actualizar Sesión' : 'Guardar Sesión'}
                            </Button>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );
}

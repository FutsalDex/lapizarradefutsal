
'use client';

import { useState, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection } from '@/firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { PlusCircle, CalendarIcon, Search, Save, Trash2, BookOpen, Clock, Users, ArrowLeft, Star, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

// ====================
// TIPOS Y SCHEMAS
// ====================
const sessionSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
  time: z.string().optional(),
  facility: z.string().optional(),
  objectives: z.string().min(3, 'Los objetivos son requeridos'),
  initialExercises: z.array(z.string()),
  mainExercises: z.array(z.string()),
  finalExercises: z.array(z.string()),
});

type SessionFormValues = z.infer<typeof sessionSchema>;
type Phase = 'initialExercises' | 'mainExercises' | 'finalExercises';


// ====================
// COMPONENTES
// ====================

function ExercisePickerSheet({ allExercises, selectedIds, onSelect, phase, children }: { allExercises: Exercise[], selectedIds: string[], onSelect: (id: string, phase: Phase) => void, phase: Phase, children: React.ReactNode }) {
    const [searchTerm, setSearchTerm] = useState('');

    const filteredExercises = useMemo(() => {
        if (!allExercises) return [];
        return allExercises.filter(ex => ex.name.toLowerCase().includes(searchTerm.toLowerCase()) && ex.visible);
    }, [allExercises, searchTerm]);

    return (
        <Sheet>
            <SheetTrigger asChild>{children}</SheetTrigger>
            <SheetContent className="w-full sm:max-w-lg">
                <SheetHeader>
                    <SheetTitle>Seleccionar Ejercicios</SheetTitle>
                </SheetHeader>
                <div className="py-4">
                    <div className="relative mb-4">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Buscar ejercicios..."
                            className="pl-9"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <ScrollArea className="h-[calc(100vh-12rem)] rounded-md border">
                        <div className="p-4 space-y-2">
                            {filteredExercises.map(exercise => (
                                <div
                                    key={exercise.id}
                                    className="flex items-center gap-3 rounded-md p-2 hover:bg-muted"
                                >
                                    <Checkbox
                                        id={`${phase}-${exercise.id}`}
                                        checked={selectedIds.includes(exercise.id)}
                                        onCheckedChange={() => onSelect(exercise.id, phase)}
                                    />
                                    <label htmlFor={`${phase}-${exercise.id}`} className="w-full cursor-pointer">
                                        <p className="font-semibold">{exercise.name}</p>
                                        <p className="text-xs text-muted-foreground">{exercise.category}</p>
                                    </label>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </div>
            </SheetContent>
        </Sheet>
    );
}

function ExerciseCard({ exercise, onRemove }: { exercise: Exercise, onRemove: () => void }) {
    return (
        <Card className="bg-muted/50">
            <CardContent className="p-3 flex items-center justify-between">
                <div>
                    <p className="font-semibold text-sm">{exercise.name}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                        <span className="flex items-center gap-1"><BookOpen className="h-3 w-3" />{exercise.category}</span>
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{exercise.duration} min</span>
                        <span className="flex items-center gap-1"><Users className="h-3 w-3" />{exercise.numberOfPlayers}</span>
                    </div>
                </div>
                <Button variant="ghost" size="icon" className="text-destructive" onClick={onRemove}>
                    <Trash2 className="h-4 w-4" />
                </Button>
            </CardContent>
        </Card>
    )
}

function PhaseSection({ title, phase, allExercises, selectedIds, onExerciseToggle, control }: { title: string, phase: Phase, allExercises: Exercise[], selectedIds: string[], onExerciseToggle: (id: string, phase: Phase) => void, control: any }) {

    const selectedExercises = useMemo(() => {
        return allExercises.filter(ex => selectedIds.includes(ex.id));
    }, [allExercises, selectedIds]);

    return (
        <Card>
            <CardHeader>
                <CardTitle>{title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {selectedExercises.length > 0 ? (
                    selectedExercises.map(ex => (
                        <ExerciseCard key={ex.id} exercise={ex} onRemove={() => onExerciseToggle(ex.id, phase)} />
                    ))
                ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">No has añadido ejercicios a esta fase.</p>
                )}
            </CardContent>
            <CardFooter>
                 <ExercisePickerSheet
                    allExercises={allExercises}
                    selectedIds={selectedIds}
                    onSelect={onExerciseToggle}
                    phase={phase}
                >
                    <Button variant="outline" type="button">
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Ejercicio
                    </Button>
                </ExercisePickerSheet>
            </CardFooter>
        </Card>
    );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function CreateSessionPage() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const exercisesCollection = useMemoFirebase(() => collection(firestore, 'exercises'), [firestore]);
    const { data: rawExercises, isLoading: isLoadingExercises } = useCollection<any>(exercisesCollection);

    const allExercises = useMemo(() => {
        if (!rawExercises) return [];
        return rawExercises.map(mapExercise).sort((a,b) => a.name.localeCompare(b.name));
    }, [rawExercises]);
    
    const form = useForm<SessionFormValues>({
        resolver: zodResolver(sessionSchema),
        defaultValues: {
            name: '',
            date: new Date(),
            time: format(new Date(), 'HH:mm'),
            facility: '',
            objectives: '',
            initialExercises: [],
            mainExercises: [],
            finalExercises: [],
        },
    });

    const handleExerciseToggle = (exerciseId: string, phase: Phase) => {
        const currentIds = form.getValues(phase);
        const newIds = currentIds.includes(exerciseId)
            ? currentIds.filter(id => id !== exerciseId)
            : [...currentIds, exerciseId];
        form.setValue(phase, newIds, { shouldValidate: true });
    };

    const handleSave = async (sessionType: 'basic' | 'pro') => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear una sesión.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const values = form.getValues();
            
            let exercisesData: any = {
                initial: values.initialExercises,
                main: values.mainExercises,
                final: values.finalExercises,
            };

            if (sessionType === 'pro') {
                const allIds = [...values.initialExercises, ...values.mainExercises, ...values.finalExercises];
                const exerciseDocs = await Promise.all(
                    allIds.map(id => getDoc(doc(firestore, 'exercises', id)))
                );
                
                const exercisesById = exerciseDocs.reduce((acc, docSnap) => {
                    if (docSnap.exists()) {
                        acc[docSnap.id] = mapExercise(docSnap.data());
                    }
                    return acc;
                }, {} as { [id: string]: Exercise });
                
                exercisesData = {
                    initial: values.initialExercises.map(id => exercisesById[id]).filter(Boolean),
                    main: values.mainExercises.map(id => exercisesById[id]).filter(Boolean),
                    final: values.finalExercises.map(id => exercisesById[id]).filter(Boolean),
                };
            }


            await addDoc(collection(firestore, `users/${user.uid}/sessions`), {
                name: values.name,
                date: values.date,
                objectives: values.objectives,
                time: values.time,
                facility: values.facility,
                exercises: exercisesData,
                sessionType: sessionType,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Éxito', description: `Sesión de entrenamiento ${sessionType === 'pro' ? 'Pro' : 'Básica'} creada.` });
            form.reset();
        } catch (error) {
            console.error("Error creating session:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear la sesión.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const watchedValues = form.watch();

    return (
        <div className="container mx-auto px-4 py-8">
            <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                             <Button asChild variant="outline" className="mb-4">
                                <Link href={`/equipo/gestion`}>
                                    <ArrowLeft className="mr-2 h-4 w-4" />
                                    Volver al Panel
                                </Link>
                            </Button>
                            <h1 className="text-4xl font-bold font-headline text-primary">Crear Sesión de Entrenamiento</h1>
                            <p className="text-lg text-muted-foreground mt-2">Planifica tu próximo entrenamiento paso a paso.</p>
                        </div>
                        
                        <Dialog>
                            <DialogTrigger asChild>
                                 <Button size="lg">
                                    <Save className="mr-2 h-4 w-4" />
                                    Guardar Sesión
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader>
                                    <DialogTitle>Elige el tipo de sesión</DialogTitle>
                                    <DialogDescription>
                                        Selecciona cómo quieres guardar esta sesión de entrenamiento. La versión Pro guarda todos los detalles de cada ejercicio.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid grid-cols-2 gap-4 py-4">
                                    <DialogClose asChild>
                                        <Button variant="outline" onClick={() => handleSave('basic')} disabled={isSubmitting}>
                                            <Shield className="mr-2 h-4 w-4" />
                                            Básica
                                        </Button>
                                    </DialogClose>
                                    <DialogClose asChild>
                                        <Button onClick={() => handleSave('pro')} disabled={isSubmitting}>
                                            <Star className="mr-2 h-4 w-4" />
                                            Pro
                                        </Button>
                                    </DialogClose>
                                </div>
                                <DialogFooter>
                                    <p className="text-xs text-muted-foreground">Podrás descargar ambas versiones en PDF más adelante.</p>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>

                    </div>

                    <Card>
                        <CardHeader><CardTitle>Detalles de la Sesión</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Nombre</FormLabel><FormControl><Input placeholder="Ej: Mejora de la finalización" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')} >{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="time" render={({ field }) => ( <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="facility" render={({ field }) => ( <FormItem><FormLabel>Instalación</FormLabel><FormControl><Input placeholder="Ej: Polideportivo Municipal" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="objectives" render={({ field }) => ( <FormItem className="md:col-span-2 lg:col-span-4"><FormLabel>Objetivos Principales</FormLabel><FormControl><Textarea placeholder="Define los objetivos clave para este entrenamiento..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         <PhaseSection
                            title="Fase Inicial (Calentamiento)"
                            phase="initialExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.initialExercises}
                            onExerciseToggle={handleExerciseToggle}
                            control={form.control}
                        />
                        <PhaseSection
                            title="Fase Principal"
                            phase="mainExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.mainExercises}
                            onExerciseToggle={handleExerciseToggle}
                            control={form.control}
                        />
                         <PhaseSection
                            title="Fase Final (Vuelta a la Calma)"
                            phase="finalExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.finalExercises}
                            onExerciseToggle={handleExerciseToggle}
                            control={form.control}
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}

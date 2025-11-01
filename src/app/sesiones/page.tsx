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
import { PlusCircle, CalendarIcon, Search, Save, Trash2, BookOpen, Clock, Users, ArrowLeft, Eye, Download } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';

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
type SessionType = 'basic' | 'pro';


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
        <Card className="w-48 h-36 flex flex-col items-center justify-center text-center p-2 relative group">
             <p className="font-semibold text-sm leading-tight">{exercise.name}</p>
             <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemove}>
                <Trash2 className="h-3 w-3" />
             </Button>
        </Card>
    )
}

function AddExerciseCard({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-48 h-36 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 hover:border-primary hover:text-primary transition-colors"
    >
      <PlusCircle className="h-8 w-8 mb-2" />
      <span className="text-sm font-medium">Añadir Tarea</span>
    </button>
  );
}


function PhaseSection({ title, phase, allExercises, selectedIds, onExerciseToggle, control }: { title: string, phase: Phase, allExercises: Exercise[], selectedIds: string[], onExerciseToggle: (id: string, phase: Phase) => void, control: any }) {

    const selectedExercises = useMemo(() => {
        return allExercises.filter(ex => selectedIds.includes(ex.id));
    }, [allExercises, selectedIds]);

    return (
        <div className="space-y-4">
             <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
             <div className="flex flex-wrap gap-4">
                {selectedExercises.map(ex => (
                    <ExerciseCard key={ex.id} exercise={ex} onRemove={() => onExerciseToggle(ex.id, phase)} />
                ))}

                 <ExercisePickerSheet
                    allExercises={allExercises}
                    selectedIds={selectedIds}
                    onSelect={onExerciseToggle}
                    phase={phase}
                >
                    <AddExerciseCard onClick={() => {}}/>
                </ExercisePickerSheet>
             </div>
        </div>
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
    const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('pro');

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

    const handleSave = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear una sesión.' });
            return;
        }
        setIsSubmitting(true);
        try {
            const values = form.getValues();
            
            let exercisesData: any;

            if (selectedSessionType === 'pro') {
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

            } else { // Basic session
                 exercisesData = {
                    initial: values.initialExercises,
                    main: values.mainExercises,
                    final: values.finalExercises,
                };
            }


            await addDoc(collection(firestore, `users/${user.uid}/sessions`), {
                name: values.name,
                date: values.date,
                objectives: values.objectives,
                time: values.time,
                facility: values.facility,
                exercises: exercisesData,
                sessionType: selectedSessionType,
                userId: user.uid,
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Éxito', description: `Sesión de entrenamiento ${selectedSessionType === 'pro' ? 'Pro' : 'Básica'} creada.` });
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
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver Sesión
                                </Button>
                            </DialogTrigger>
                             <DialogContent className="sm:max-w-xl">
                                <DialogHeader>
                                    <DialogTitle>Elige el tipo de sesión</DialogTitle>
                                    <DialogDescription>
                                        Selecciona cómo quieres guardar la sesión.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 grid grid-cols-2 gap-4">
                                     <div
                                        className={cn(
                                            "cursor-pointer rounded-md border-2 p-4 text-center transition-colors",
                                            selectedSessionType === 'basic' ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                                        )}
                                        onClick={() => setSelectedSessionType('basic')}
                                    >
                                        <h3 className="font-semibold text-lg mb-2">Básico</h3>
                                        <div className="relative mx-auto h-48 w-36 rounded-md border bg-muted p-2">
                                             <Image
                                                src="https://placehold.co/144x192/e2e8f0/64748b?text=B%C3%A1sico"
                                                alt="Previsualización de sesión Básica"
                                                width={144}
                                                height={192}
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>

                                    <div
                                        className={cn(
                                            "cursor-pointer rounded-md border-2 p-4 text-center transition-colors",
                                            selectedSessionType === 'pro' ? 'border-primary bg-primary/10' : 'border-transparent hover:bg-muted'
                                        )}
                                        onClick={() => setSelectedSessionType('pro')}
                                    >
                                        <h3 className="font-semibold text-lg mb-2">Pro</h3>
                                         <div className="relative mx-auto h-48 w-36 rounded-md border bg-muted p-2">
                                             <Image
                                                src="https://placehold.co/144x192/d1fae5/10b981?text=Pro"
                                                alt="Previsualización de sesión Pro"
                                                width={144}
                                                height={192}
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                                <DialogFooter className="sm:justify-end gap-2">
                                     <DialogClose asChild>
                                        <Button onClick={handleSave} disabled={isSubmitting}>
                                            <Save className="mr-2 h-4 w-4"/>
                                            {isSubmitting ? 'Guardando...' : 'Guardar Sesión'}
                                        </Button>
                                    </DialogClose>
                                     <Button variant="outline" disabled>
                                        <Download className="mr-2 h-4 w-4" />
                                        Descargar PDF
                                    </Button>
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

                    <div className="space-y-8">
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

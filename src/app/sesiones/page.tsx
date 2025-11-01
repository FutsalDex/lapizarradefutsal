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
import { PlusCircle, CalendarIcon, Search, Save, Trash2, BookOpen, Clock, Users, ArrowLeft, Eye, Download, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { FutsalCourt } from '@/components/futsal-court';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

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

function ProSessionPreview({ sessionData, exercises }: { sessionData: SessionFormValues, exercises: Exercise[] }) {
    const getExercisesForPhase = (phase: Phase) => {
        return sessionData[phase].map(id => exercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
    };
    
    const PhasePreview = ({ title, exercises }: { title: string, exercises: Exercise[] }) => {
        if (exercises.length === 0) return null;
        return (
            <>
                <div className="bg-gray-200 text-gray-800 p-2 text-center">
                    <h3 className="font-bold text-sm">{title}</h3>
                </div>
                {exercises.map(ex => (
                    <div key={ex.id} className="p-4 border-b grid grid-cols-3 gap-4">
                         <div className="col-span-1 space-y-2">
                             <div className="relative aspect-video bg-muted rounded-md">
                                  {ex.image ? (
                                    <Image src={ex.image} alt={ex.name} layout="fill" objectFit="contain" className="p-2" />
                                ) : (
                                    <FutsalCourt className="w-full h-full p-1" />
                                )}
                             </div>
                             <div className="grid grid-cols-3 gap-px bg-border rounded-md overflow-hidden text-xs text-center">
                                 <div className="bg-background p-1"><span className="font-semibold block">Tiempo</span>{ex.duration} min</div>
                                 <div className="bg-background p-1"><span className="font-semibold block">Jugadores</span>{ex.numberOfPlayers}</div>
                                 <div className="bg-background p-1 truncate" title={ex.consejos || ''}><span className="font-semibold block">Materiales</span>{ex.consejos || 'N/A'}</div>
                             </div>
                         </div>
                         <div className="col-span-2 space-y-2">
                             <h4 className="font-bold bg-muted p-2 rounded-t-md text-center">{ex.name}</h4>
                             <div>
                                 <h5 className="font-semibold text-sm">Descripción</h5>
                                 <p className="text-xs text-muted-foreground mb-2">{ex.description}</p>
                             </div>
                              <div>
                                <h5 className="font-semibold text-sm">Objetivos</h5>
                                <p className="text-xs text-muted-foreground">{ex.objectives}</p>
                             </div>
                         </div>
                    </div>
                ))}
            </>
        );
    }

    return (
        <div className="bg-white text-black w-full max-w-4xl mx-auto rounded-lg shadow-lg overflow-hidden border">
            <div className="p-4 bg-gray-800 text-white grid grid-cols-5 gap-2 items-center text-center">
                <div className="flex items-center gap-2"><Shield className="h-5 w-5" /> <span>Microciclo</span><Input className="w-16 text-center bg-gray-700 text-white" defaultValue="2"/></div>
                <div><span>Sesión</span><Input className="w-16 text-center bg-gray-700 text-white" defaultValue="10"/></div>
                <div><span>Fecha</span><Input className="text-center bg-gray-700 text-white" defaultValue={format(sessionData.date, "dd/MM/yyyy")}/></div>
                <div className="col-span-1"><span>Objetivos</span><Input className="w-20 text-center bg-gray-700 text-white" defaultValue="N/A"/></div>
                <div><span>Jugadores</span><Input className="w-16 text-center bg-gray-700 text-white" defaultValue="12"/></div>
            </div>
             <ScrollArea className="h-[60vh]">
                <PhasePreview title="FASE INICIAL" exercises={getExercisesForPhase('initialExercises')} />
                <PhasePreview title="FASE PRINCIPAL" exercises={getExercisesForPhase('mainExercises')} />
                <PhasePreview title="FASE FINAL" exercises={getExercisesForPhase('finalExercises')} />
             </ScrollArea>
        </div>
    );
}

function ExercisePickerDialog({ allExercises, onSelect, phase, children, disabled }: { allExercises: Exercise[], onSelect: (id: string, phase: Phase) => void, phase: Phase, children: React.ReactNode, disabled?: boolean }) {
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
    
    if (disabled) {
        return <>{children}</>;
    }

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
                    <div className="grid grid-cols-3 gap-4 p-4">
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
                                                <Button size="icon" className="rounded-full h-10 w-10" onClick={() => onSelect(exercise.id, phase)}>
                                                    <PlusCircle className="h-5 w-5" />
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


function ExerciseCard({ exercise, onRemove }: { exercise: Exercise, onRemove: () => void }) {
    return (
        <Card className="w-48 flex-shrink-0 group relative overflow-hidden">
            <div className="relative aspect-video w-full bg-muted">
                {exercise.image ? (
                    <Image
                        src={exercise.image}
                        alt={exercise.name}
                        fill
                        className="object-contain p-2"
                    />
                ) : (
                    <FutsalCourt className="w-full h-full p-1" />
                )}
            </div>
            <div className="p-2 text-center bg-background">
                <p className="font-semibold text-xs leading-tight truncate">{exercise.name}</p>
            </div>
             <Button variant="destructive" size="icon" className="absolute top-1 right-1 h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemove}>
                <Trash2 className="h-3 w-3" />
             </Button>
        </Card>
    )
}

function AddExerciseCard({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-48 h-full flex-shrink-0 flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 transition-colors",
        disabled 
          ? "cursor-not-allowed bg-muted/50 text-muted-foreground/50"
          : "hover:border-primary hover:text-primary"
      )}
    >
      <PlusCircle className="h-8 w-8 mb-2" />
      <span className="text-sm font-medium">Añadir Tarea</span>
    </button>
  );
}


function PhaseSection({ title, phase, allExercises, selectedIds, onExerciseToggle, control, limit }: { title: string, phase: Phase, allExercises: Exercise[], selectedIds: string[], onExerciseToggle: (id: string, phase: Phase) => void, control: any, limit: number }) {

    const selectedExercises = useMemo(() => {
        return allExercises.filter(ex => selectedIds.includes(ex.id));
    }, [allExercises, selectedIds]);

    const atLimit = selectedIds.length >= limit;

    return (
        <div className="space-y-4">
             <h2 className="text-2xl font-bold tracking-tight">{title} <span className="text-muted-foreground text-lg font-normal">({selectedIds.length}/{limit})</span></h2>
             <ScrollArea className="w-full whitespace-nowrap">
                <div className="flex space-x-4 pb-4 h-40">
                    {selectedExercises.map(ex => (
                        <ExerciseCard key={ex.id} exercise={ex} onRemove={() => onExerciseToggle(ex.id, phase)} />
                    ))}

                    {!atLimit && (
                        <ExercisePickerDialog
                            allExercises={allExercises}
                            onSelect={onExerciseToggle}
                            phase={phase}
                        >
                            <AddExerciseCard onClick={() => {}} />
                        </ExercisePickerDialog>
                    )}
                </div>
             </ScrollArea>
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
    const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('basic');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);

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
        const isAdding = !currentIds.includes(exerciseId);

        let limit = Infinity;
        let phaseName = '';
        if (phase === 'initialExercises') {
             limit = 2;
             phaseName = 'Fase Inicial';
        }
        if (phase === 'mainExercises') {
             limit = 4;
             phaseName = 'Fase Principal';
        }
        if (phase === 'finalExercises') {
             limit = 2;
             phaseName = 'Fase Final';
        }

        if (isAdding && currentIds.length >= limit) {
            toast({
                variant: 'destructive',
                title: 'Límite de ejercicios alcanzado',
                description: `No puedes añadir más de ${limit} ejercicios a la ${phaseName}.`,
            });
            return;
        }

        const newIds = isAdding
            ? [...currentIds, exerciseId]
            : currentIds.filter(id => id !== exerciseId);
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

             // For both 'basic' and 'pro', we just store IDs for now.
             // PDF generation logic will fetch full data for 'pro'.
             exercisesData = {
                initial: values.initialExercises,
                main: values.mainExercises,
                final: values.finalExercises,
            };

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
            setIsPreviewOpen(false);
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
                        
                        <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                            <DialogTrigger asChild>
                                 <Button size="lg">
                                    <Eye className="mr-2 h-4 w-4" />
                                    Ver ficha de la sesión
                                </Button>
                            </DialogTrigger>
                           <DialogContent className="max-w-4xl">
                                <DialogHeader>
                                    <DialogTitle>¿Qué tipo de sesión quieres guardar?</DialogTitle>
                                    <DialogDescription>
                                        Elige el formato para tu ficha de sesión. La versión Pro requiere una suscripción.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="py-4 grid grid-cols-2 gap-4">
                                    <div
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 text-center transition-colors space-y-2",
                                            selectedSessionType === 'basic' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                                        )}
                                        onClick={() => setSelectedSessionType('basic')}
                                    >
                                        <h3 className="font-semibold text-lg">Básico</h3>
                                        <div className="relative mx-auto h-48 w-full rounded-md border bg-muted p-2">
                                            <Image
                                                src="https://i.ibb.co/6JnKWtLV/basico.png"
                                                alt="Previsualización de sesión Básica"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                    <div
                                        className={cn(
                                            "cursor-pointer rounded-lg border-2 p-4 text-center transition-colors space-y-2",
                                            selectedSessionType === 'pro' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted'
                                        )}
                                        onClick={() => setSelectedSessionType('pro')}
                                    >
                                        <h3 className="font-semibold text-lg">Pro</h3>
                                        <div className="relative mx-auto h-48 w-full rounded-md border bg-muted p-2">
                                             <Image
                                                src="https://i.ibb.co/P9tS4gB/pro-session-preview.png"
                                                alt="Previsualización de sesión Pro"
                                                fill
                                                className="object-contain"
                                            />
                                        </div>
                                    </div>
                                </div>
                                {selectedSessionType === 'pro' && (
                                     <Dialog>
                                        <DialogTrigger asChild>
                                            <Button variant="link">Ver previsualización del PDF</Button>
                                        </DialogTrigger>
                                        <DialogContent className="max-w-5xl h-[90vh]">
                                           <DialogHeader>
                                                <DialogTitle>Previsualización de Ficha Pro</DialogTitle>
                                           </DialogHeader>
                                           <ProSessionPreview sessionData={watchedValues} exercises={allExercises} />
                                        </DialogContent>
                                    </Dialog>
                                )}
                                <DialogFooter className="sm:justify-end gap-2 pt-4">
                                     <Button onClick={handleSave} disabled={isSubmitting}>
                                        <Save className="mr-2 h-4 w-4"/>
                                        {isSubmitting ? 'Guardando...' : 'Guardar Sesión'}
                                    </Button>
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
                            limit={2}
                        />
                        <PhaseSection
                            title="Fase Principal"
                            phase="mainExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.mainExercises}
                            onExerciseToggle={handleExerciseToggle}
                            control={form.control}
                            limit={4}
                        />
                         <PhaseSection
                            title="Fase Final (Vuelta a la Calma)"
                            phase="finalExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.finalExercises}
                            onExerciseToggle={handleExerciseToggle}
                            control={form.control}
                            limit={2}
                        />
                    </div>
                </form>
            </Form>
        </div>
    );
}

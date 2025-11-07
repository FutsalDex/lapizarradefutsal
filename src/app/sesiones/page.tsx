
'use client';

import { useState, useMemo, useRef } from 'react';
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
import { PlusCircle, Calendar as CalendarIcon, Search, Save, Trash2, BookOpen, Clock, Users, ArrowLeft, Eye, Download, Shield } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { Exercise, mapExercise } from '@/lib/data';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import Image from 'next/image';
import { FutsalCourt } from '@/components/futsal-court';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useDoc } from '@/firebase';

// ====================
// TIPOS Y SCHEMAS
// ====================
const sessionSchema = z.object({
  name: z.string().min(1, 'El número de sesión es requerido.'),
  date: z.date({ required_error: 'La fecha es requerida.' }),
  time: z.string().optional(),
  facility: z.string().optional(),
  microcycle: z.string().optional(),
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

function BasicSessionPreview({ sessionData, exercises }: { sessionData: SessionFormValues, exercises: Exercise[] }) {
    const getExercisesForPhase = (phase: Phase) => {
        const exerciseIds = sessionData[phase] || [];
        return exerciseIds.map(id => exercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
    };

    const PhaseSection = ({ title, phase }: { title: string; phase: Phase }) => {
        const phaseExercises = getExercisesForPhase(phase);
        if (phaseExercises.length === 0) return null;

        return (
            <div className="space-y-2">
                <h3 className="font-bold text-center text-lg bg-gray-200 py-1">{title}</h3>
                <div className="grid grid-cols-2 gap-2">
                    {phaseExercises.map((ex, index) => (
                         <Card key={`${ex.id}-${index}`} className="flex flex-col overflow-hidden">
                             <CardContent className="p-0">
                                <div className="relative aspect-video w-full bg-muted">
                                    {ex.image ? (
                                        <Image
                                            src={ex.image}
                                            alt={ex.name}
                                            fill
                                            className="object-contain"
                                        />
                                    ) : (
                                        <FutsalCourt className="w-full h-full p-1" />
                                    )}
                                </div>
                            </CardContent>
                            <CardFooter className="p-1 bg-muted/50 h-10 flex items-center justify-center">
                               <p className="font-semibold text-[9px] text-center w-full leading-tight">{ex.name}</p>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
        );
    };

    return (
        <div className="bg-white text-black w-[21cm] h-[29.7cm] mx-auto p-4 rounded-lg shadow-lg overflow-hidden border flex flex-col">
             <div className="p-2 bg-gray-100 border-b grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-800">
                {sessionData.name && <div className="font-semibold">Sesión: <span className="font-normal">{sessionData.name}</span></div>}
                {sessionData.date && <div className="font-semibold">Fecha: <span className="font-normal">{format(sessionData.date, 'PPP', { locale: es })}</span></div>}
                {sessionData.time && <div className="font-semibold">Hora: <span className="font-normal">{sessionData.time}</span></div>}
                {sessionData.facility && <div className="font-semibold">Instalación: <span className="font-normal">{sessionData.facility}</span></div>}
            </div>
            <ScrollArea className="flex-grow">
                 <div className="p-4 space-y-4">
                    <PhaseSection title="Fase Inicial" phase="initialExercises" />
                    <PhaseSection title="Fase Principal" phase="mainExercises" />
                    <PhaseSection title="Fase Final" phase="finalExercises" />
                 </div>
            </ScrollArea>
        </div>
    )
}


function ProSessionPreview({ sessionData, exercises }: { sessionData: SessionFormValues, exercises: Exercise[] }) {
    const allSessionExercises = useMemo(() => {
        const initial = (sessionData.initialExercises || []).map(id => exercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
        const main = (sessionData.mainExercises || []).map(id => exercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
        const final = (sessionData.finalExercises || []).map(id => exercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
        return [...initial, ...main, ...final];
    }, [sessionData, exercises]);
    
    const exercisePages = useMemo(() => {
        const pages = [];
        for (let i = 0; i < allSessionExercises.length; i += 3) {
            pages.push(allSessionExercises.slice(i, i + 3));
        }
        return pages;
    }, [allSessionExercises]);


    const ExercisePreview = ({ exercise }: { exercise: Exercise }) => (
         <div className="p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-4">
             <div className="col-span-1 space-y-2">
                 <div className="relative aspect-video bg-muted rounded-md">
                      {exercise.image ? (
                        <Image src={exercise.image} alt={exercise.name} fill className="object-contain p-2" />
                    ) : (
                        <FutsalCourt className="w-full h-full p-1" />
                    )}
                 </div>
                <div className="rounded-md overflow-hidden text-xs text-center border">
                    <div className="grid grid-cols-2 gap-px bg-border">
                        <div className="bg-background p-1"><span className="font-semibold block">Tiempo</span>{exercise.duration} min</div>
                        <div className="bg-background p-1"><span className="font-semibold block">Jugadores</span>{exercise.numberOfPlayers}</div>
                    </div>
                    <div className="bg-background p-1 truncate" title={exercise['Espacio y materiales necesarios'] || ''}>
                        <span className="font-semibold block">Materiales</span>
                        {exercise['Espacio y materiales necesarios'] || 'N/A'}
                    </div>
                </div>
             </div>
             <div className="md:col-span-2 space-y-2">
                 <h4 className="font-bold bg-muted p-2 rounded-t-md text-center">{exercise.name}</h4>
                 <div>
                     <h5 className="font-semibold text-sm">Descripción</h5>
                     <p className="text-xs text-muted-foreground mb-2">{exercise.description}</p>
                 </div>
                  <div>
                    <h5 className="font-semibold text-sm">Objetivos</h5>
                    <p className="text-xs text-muted-foreground">{exercise.objectives}</p>
                 </div>
             </div>
        </div>
    );
    

    return (
        <>
            {exercisePages.map((pageExercises, pageIndex) => (
                 <div key={pageIndex} className="bg-white text-black w-full md:w-[21cm] h-auto md:h-[29.7cm] mx-auto p-6 rounded-lg shadow-lg overflow-hidden border flex flex-col mb-4 print-page">
                    <div className="p-2 bg-gray-800 text-white grid grid-cols-3 gap-4 items-center text-center text-sm">
                        <div className="flex items-center justify-center gap-2"><span>Microciclo:</span><span className="font-bold">{sessionData.microcycle || 'N/A'}</span></div>
                        <div className="flex items-center justify-center gap-2"><span>Sesión:</span><span className="font-bold">{sessionData.name}</span></div>
                        <div className="flex items-center justify-center gap-2"><span>Fecha:</span><span className="font-bold">{format(sessionData.date, "dd/MM/yyyy")}</span></div>
                    </div>
                     <ScrollArea className="flex-grow">
                        {pageExercises.map(ex => <ExercisePreview key={ex.id} exercise={ex} />)}
                     </ScrollArea>
                </div>
            ))}
        </>
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
                                             <Button size="icon" className="rounded-full h-10 w-10" onClick={() => onSelect(exercise.id, phase)}>
                                                <PlusCircle className="h-5 w-5" />
                                            </Button>
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
        <Card className="group relative overflow-hidden flex flex-col justify-center items-center text-center p-2 min-h-[140px]">
            <p className="font-semibold text-sm leading-tight">{exercise.name}</p>
            <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={onRemove}>
                <Trash2 className="h-4 w-4" />
            </Button>
             <div className="absolute bottom-2">
                 <div className="h-8 w-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground">
                    <PlusCircle className="h-5 w-5" />
                </div>
             </div>
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
        "w-full min-h-[140px] flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/50 transition-colors",
        disabled 
          ? "cursor-not-allowed bg-muted/50 text-muted-foreground/50"
          : "hover:border-primary hover:text-primary"
      )}
    >
        <p className="font-semibold text-sm">Añadir Tarea</p>
        <div className="mt-2 h-8 w-8 bg-gray-300 rounded-full flex items-center justify-center text-gray-600">
            <PlusCircle className="h-5 w-5" />
        </div>
    </button>
  );
}


function PhaseSection({ title, phase, allExercises, selectedIds, onExerciseToggle, limit }: { title: string, phase: Phase, allExercises: Exercise[], selectedIds: string[], onExerciseToggle: (id: string, phase: Phase) => void, limit: number }) {

    const selectedExercises = useMemo(() => {
        return selectedIds.map(id => allExercises.find(ex => ex.id === id)).filter(Boolean) as Exercise[];
    }, [allExercises, selectedIds]);

    const atLimit = selectedExercises.length >= limit;

    return (
        <Card className="flex flex-col">
            <CardHeader>
                <CardTitle className="text-xl font-bold tracking-tight">{title} <span className="text-muted-foreground text-base font-normal">({selectedExercises.length}/{limit})</span></CardTitle>
            </CardHeader>
             <CardContent className="flex-grow grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {selectedExercises.map((ex, index) => (
                    <ExerciseCard key={`${ex.id}-${index}`} exercise={ex} onRemove={() => onExerciseToggle(ex.id, phase)} />
                ))}
                {!atLimit &&
                    <ExercisePickerDialog
                        allExercises={allExercises}
                        onSelect={onExerciseToggle}
                        phase={phase}
                    >
                        <AddExerciseCard onClick={() => {}} />
                    </ExercisePickerDialog>
                }
            </CardContent>
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
    const [selectedSessionType, setSelectedSessionType] = useState<SessionType>('basic');
    const [isPreviewOpen, setIsPreviewOpen] = useState(false);
    const [isPdfPreviewOpen, setIsPdfPreviewOpen] = useState(false);
    const pdfPreviewRef = useRef<HTMLDivElement>(null);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<{ subscription?: 'Básico' | 'Pro' }>(userProfileRef);

    const isPro = userProfile?.subscription === 'Pro';

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
            microcycle: '',
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
        } else if (phase === 'mainExercises') {
             limit = 4;
             phaseName = 'Fase Principal';
        } else if (phase === 'finalExercises') {
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

        if (selectedSessionType === 'pro' && !isPro) {
            toast({ variant: 'destructive', title: 'Función Pro', description: 'Necesitas una suscripción Pro para guardar este tipo de sesión.' });
            return;
        }
        
        setIsSubmitting(true);
        try {
            const values = form.getValues();
            
            const exercisesData = {
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
                microcycle: values.microcycle,
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
    
    const handleDownloadPdf = async () => {
        if (selectedSessionType === 'pro' && !isPro) {
            toast({ variant: 'destructive', title: 'Función Pro', description: 'Necesitas una suscripción Pro para descargar este PDF.' });
            return;
        }

        const element = pdfPreviewRef.current;
        if (element) {
            toast({ title: 'Generando PDF...', description: 'Esto puede tardar unos segundos.' });
            const html2pdf = (await import('html2pdf.js')).default;
            const opt = {
                margin: 0,
                filename: `${form.getValues('name') || 'sesion'}.pdf`,
                image: { type: 'jpeg', quality: 0.98 },
                html2canvas: { scale: 2, useCORS: true },
                jsPDF: { unit: 'cm', format: 'a4', orientation: 'portrait' }
            };
            html2pdf().from(element).set(opt).save();
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo encontrar el contenido para generar el PDF.' });
        }
    };

    const watchedValues = form.watch();

    return (
        <div className="container mx-auto px-4 py-8">
            <Form {...form}>
                <form onSubmit={(e) => e.preventDefault()} className="space-y-8">
                    <div className="flex flex-col md:flex-row justify-between md:items-center gap-4 mb-8">
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
                    </div>

                    <Card>
                        <CardHeader><CardTitle>Detalles de la Sesión</CardTitle></CardHeader>
                        <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 items-end">
                            <FormField control={form.control} name="name" render={({ field }) => ( <FormItem><FormLabel>Número de sesión</FormLabel><FormControl><Input placeholder="Ej: 01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="microcycle" render={({ field }) => ( <FormItem><FormLabel>Microciclo</FormLabel><FormControl><Input placeholder="Ej: 3" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="date" render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Fecha</FormLabel><Popover><PopoverTrigger asChild><FormControl><Button variant={'outline'} className={cn('w-full justify-start text-left font-normal', !field.value && 'text-muted-foreground')} >{field.value ? format(field.value, 'PPP', { locale: es }) : <span>Elige una fecha</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" /></Button></FormControl></PopoverTrigger><PopoverContent className="w-auto p-0"><Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus /></PopoverContent></Popover><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="time" render={({ field }) => ( <FormItem><FormLabel>Hora</FormLabel><FormControl><Input type="time" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="facility" render={({ field }) => ( <FormItem><FormLabel>Instalación</FormLabel><FormControl><Input placeholder="Ej: Polideportivo Municipal" {...field} /></FormControl><FormMessage /></FormItem> )} />
                            <FormField control={form.control} name="objectives" render={({ field }) => ( <FormItem className="lg:col-span-5"><FormLabel>Objetivos Principales</FormLabel><FormControl><Textarea placeholder="Define los objetivos clave para este entrenamiento..." {...field} /></FormControl><FormMessage /></FormItem> )} />
                        </CardContent>
                    </Card>

                     <div className="space-y-4">
                        <PhaseSection
                            title="Fase Inicial (Calentamiento)"
                            phase="initialExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.initialExercises}
                            onExerciseToggle={handleExerciseToggle}
                            limit={2}
                        />
                        <PhaseSection
                            title="Fase Principal"
                            phase="mainExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.mainExercises}
                            onExerciseToggle={handleExerciseToggle}
                            limit={4}
                        />
                         <PhaseSection
                            title="Fase Final (Vuelta a la Calma)"
                            phase="finalExercises"
                            allExercises={allExercises}
                            selectedIds={watchedValues.finalExercises}
                            onExerciseToggle={handleExerciseToggle}
                            limit={2}
                        />
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Finalizar y Guardar</CardTitle>
                            <CardDescription>
                                Una vez que hayas añadido todos los ejercicios, puedes previsualizar la ficha de la sesión y guardarla.
                            </CardDescription>
                        </CardHeader>
                        <CardFooter>
                            <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}>
                                <DialogTrigger asChild>
                                    <Button size="lg" className="w-full md:w-auto">
                                        <Eye className="mr-2 h-4 w-4" />
                                        Ver ficha y Guardar Sesión
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
                                                    src="https://i.ibb.co/hJ2DscG7/basico.png"
                                                    alt="Previsualización de sesión Básica"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                        <div
                                            className={cn(
                                                "cursor-pointer rounded-lg border-2 p-4 text-center transition-colors space-y-2",
                                                selectedSessionType === 'pro' ? 'border-primary bg-primary/10' : 'border-border hover:bg-muted',
                                                !isPro && 'cursor-not-allowed opacity-50'
                                            )}
                                            onClick={() => {
                                                if (!isPro) {
                                                    toast({ variant: 'destructive', title: 'Función Pro', description: 'Necesitas una suscripción Pro para seleccionar este formato.' });
                                                    return;
                                                }
                                                setSelectedSessionType('pro')
                                            }}
                                        >
                                            <h3 className="font-semibold text-lg flex items-center justify-center gap-2">
                                                Pro <Shield className="h-4 w-4 text-primary" />
                                            </h3>
                                            <div className="relative mx-auto h-48 w-full rounded-md border bg-muted p-2">
                                                 <Image
                                                    src="https://i.ibb.co/pBKy6D20/pro.png"
                                                    alt="Previsualización de sesión Pro"
                                                    fill
                                                    className="object-contain"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    <DialogFooter className="sm:justify-end gap-2 pt-4">
                                         <Button onClick={handleSave} disabled={isSubmitting || (selectedSessionType === 'pro' && !isPro)}>
                                            <Save className="mr-2 h-4 w-4"/>
                                            {isSubmitting ? 'Guardando...' : 'Guardar Sesión'}
                                        </Button>
                                        <Dialog open={isPdfPreviewOpen} onOpenChange={setIsPdfPreviewOpen}>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" disabled={selectedSessionType === 'pro' && !isPro}>
                                                    <Eye className="mr-2 h-4 w-4" />
                                                    Previsualizar PDF
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="w-[95vw] h-[90vh] max-w-5xl flex flex-col">
                                               <DialogHeader>
                                                    <DialogTitle>Previsualización de Ficha {selectedSessionType === 'pro' ? 'Pro' : 'Básica'}</DialogTitle>
                                               </DialogHeader>
                                               <style>{`
                                                    @media print {
                                                        .print-page {
                                                            page-break-after: always;
                                                        }
                                                    }
                                               `}</style>
                                               <ScrollArea className="flex-grow bg-gray-300 p-4">
                                                    <div ref={pdfPreviewRef}>
                                                        {selectedSessionType === 'pro' ? (
                                                                <ProSessionPreview sessionData={watchedValues} exercises={allExercises} />
                                                        ) : (
                                                                <BasicSessionPreview sessionData={watchedValues} exercises={allExercises} />
                                                        )}
                                                    </div>
                                               </ScrollArea>
                                                <DialogFooter>
                                                    <Button variant="primary" onClick={handleDownloadPdf} disabled={selectedSessionType === 'pro' && !isPro}>
                                                        <Download className="mr-2 h-4 w-4"/>
                                                        Descargar PDF
                                                    </Button>
                                                </DialogFooter>
                                            </DialogContent>
                                        </Dialog>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        </CardFooter>
                    </Card>
                </form>
            </Form>
        </div>
    );
}

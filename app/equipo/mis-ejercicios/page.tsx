
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser, useCollection, useDoc } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, query, where, getDocs, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Upload, List, Trash2, Edit, Book, ArrowLeft } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';


const categories = [
    "Balón parado y remates", "Conducción y regate", "Coordinación, agilidad y velocidad",
    "Finalización", "Pase y control", "Posesión y circulación del balón", 
    "Superioridades e inferioridades numéricas", "Sistema táctico ofensivo",
    "Técnica individual y combinada", "Transiciones (ofensivas y defensivas)",
];
const phases = ["Inicial", "Principal", "Final"];
const ages = [
    "Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior",
];

const exerciseSchema = z.object({
  'Número': z.string().min(1, 'Campo requerido.'),
  'Ejercicio': z.string().min(3, 'Mínimo 3 caracteres.'),
  'Descripción de la tarea': z.string().min(10, 'Mínimo 10 caracteres.'),
  'Objetivos': z.string().min(10, 'Mínimo 10 caracteres.'),
  'Fase': z.enum(phases as [string, ...string[]]),
  'Categoría': z.enum(categories as [string, ...string[]]),
  'Edad': z.array(z.string()).refine(value => value.some(item => item), {
    message: "Debes seleccionar al menos una edad.",
  }),
  'Número de jugadores': z.string().min(1, 'Campo requerido.'),
  'Duración (min)': z.string().min(1, 'Campo requerido.'),
  'Espacio y materiales necesarios': z.string().min(3, 'Mínimo 3 caracteres.'),
  'Variantes': z.string().optional(),
  'Consejos para el entrenador': z.string().optional(),
  'Imagen': z.string().url('Debe ser una URL válida.').optional().or(z.literal('')),
  'Visible': z.boolean().default(true),
  'aiHint': z.string().optional(),
});

type ExerciseFormValues = z.infer<typeof exerciseSchema>;

function AddExerciseForm({ onExerciseAdded, disabled }: { onExerciseAdded: () => void, disabled?: boolean }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      'Número': '', 'Ejercicio': '', 'Descripción de la tarea': '', 'Objetivos': '', 'Fase': 'Principal',
      'Categoría': 'Pase y control', 'Edad': [], 'Número de jugadores': '', 'Duración (min)': '',
      'Espacio y materiales necesarios': '', 'Variantes': '', 'Consejos para el entrenador': '',
      'Imagen': '', 'Visible': true, 'aiHint': '',
    },
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Acceso no autorizado.' });
      return;
    }
    if (disabled) {
      toast({ variant: 'destructive', title: 'Límite alcanzado', description: 'Has alcanzado el límite de subida de ejercicios para este año.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const batch = writeBatch(firestore);
      const exercisesCollection = collection(firestore, 'exercises');
      const newExerciseRef = doc(exercisesCollection);
      
      const publicExerciseData = {
          ...data,
          createdAt: serverTimestamp(),
          userId: user.uid,
      };
      batch.set(newExerciseRef, publicExerciseData);
      
      const userExercisesCollection = collection(firestore, 'userExercises');
      const userExerciseRef = doc(userExercisesCollection);
      
      const userExerciseData = {
          originalExerciseId: newExerciseRef.id,
          userId: user.uid,
          createdAt: serverTimestamp(),
          status: 'Público',
          name: data['Ejercicio'],
          category: data['Categoría'],
          fase: data['Fase'],
      };
      batch.set(userExerciseRef, userExerciseData);

      await batch.commit();
      
      toast({ title: 'Éxito', description: 'Ejercicio añadido a la biblioteca pública y a tu lista personal.' });
      form.reset();
      onExerciseAdded();
    } catch (error) {
      console.error('Error adding exercise:', error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo añadir el ejercicio.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Subir Nuevo Ejercicio</CardTitle>
        <CardDescription>Completa el formulario para añadir un nuevo ejercicio a la biblioteca pública.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField control={form.control} name="Ejercicio" render={({ field }) => ( <FormItem><FormLabel>Nombre del Ejercicio</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="Número" render={({ field }) => ( <FormItem><FormLabel>Número/ID</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="Descripción de la tarea" render={({ field }) => ( <FormItem><FormLabel>Descripción</FormLabel><FormControl><Textarea {...field} rows={4} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="Objetivos" render={({ field }) => ( <FormItem><FormLabel>Objetivos</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField control={form.control} name="Fase" render={({ field }) => ( <FormItem><FormLabel>Fase</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{phases.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="Categoría" render={({ field }) => ( <FormItem><FormLabel>Categoría</FormLabel><Select onValueChange={field.onChange} defaultValue={field.value}><FormControl><SelectTrigger><SelectValue/></SelectTrigger></FormControl><SelectContent>{categories.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
              <FormField control={form.control} name="Duración (min)" render={({ field }) => ( <FormItem><FormLabel>Duración (min)</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
             <FormField control={form.control} name="Edad" render={() => ( <FormItem> <FormLabel>Edades recomendadas</FormLabel> <div className="grid grid-cols-2 md:grid-cols-3 gap-4">{ages.map((item) => (<FormField key={item} control={form.control} name="Edad" render={({ field }) => { return (<FormItem key={item} className="flex flex-row items-start space-x-3 space-y-0"><FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {return checked ? field.onChange([...(field.value || []), item]) : field.onChange(field.value?.filter((value) => value !== item));}} /></FormControl><FormLabel className="font-normal">{item}</FormLabel></FormItem>);}} />))}</div><FormMessage /></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormField control={form.control} name="Número de jugadores" render={({ field }) => ( <FormItem><FormLabel>Nº de Jugadores</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                 <FormField control={form.control} name="Espacio y materiales necesarios" render={({ field }) => ( <FormItem><FormLabel>Espacio y Materiales</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="Variantes" render={({ field }) => ( <FormItem><FormLabel>Variantes (Opcional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField control={form.control} name="Consejos para el entrenador" render={({ field }) => ( <FormItem><FormLabel>Consejos (Opcional)</FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem> )} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField control={form.control} name="Imagen" render={({ field }) => ( <FormItem><FormLabel>URL de la Imagen (Opcional)</FormLabel><FormControl><Input {...field} placeholder="https://ejemplo.com/imagen.jpg" /></FormControl><FormMessage /></FormItem> )} />
                <FormField control={form.control} name="aiHint" render={({ field }) => ( <FormItem><FormLabel>Pista para IA (Opcional)</FormLabel><FormControl><Input {...field} placeholder="ej: futsal drill" /></FormControl><FormMessage /></FormItem> )} />
            </div>
            <FormField control={form.control} name="Visible" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Visible en la biblioteca pública</FormLabel></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting || disabled}>{isSubmitting ? 'Guardando...' : 'Añadir Ejercicio'}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

interface UserExercise {
    id: string;
    originalExerciseId: string;
    name: string;
    category: string;
    fase: string;
    status: string;
}

function MyExercisesList({ refreshKey }: { refreshKey: number }) {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [key, setKey] = useState(0);

    const userExercisesQuery = useMemoFirebase(() => {
        if (!firestore || !user) return null;
        return query(collection(firestore, 'userExercises'), where('userId', '==', user.uid));
    }, [firestore, user, key, refreshKey]);

    const { data: exercises, isLoading } = useCollection<UserExercise>(userExercisesQuery);
    
    const handleDelete = async (exercise: UserExercise) => {
        const batch = writeBatch(firestore);
        
        const userExerciseRef = doc(firestore, 'userExercises', exercise.id);
        batch.delete(userExerciseRef);

        const publicExerciseRef = doc(firestore, 'exercises', exercise.originalExerciseId);
        batch.delete(publicExerciseRef);

        try {
            await batch.commit();
            toast({ title: 'Ejercicio eliminado', description: 'El ejercicio ha sido eliminado de la biblioteca y de tu lista.' });
            setKey(k => k + 1);
        } catch (error) {
            console.error("Error deleting exercise:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el ejercicio.' });
        }
    };


    return (
         <Card>
            <CardHeader>
                <CardTitle>Ejercicios que Has Subido</CardTitle>
                <CardDescription>Aquí puedes ver y gestionar todos los ejercicios que has aportado a la comunidad.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre del Ejercicio</TableHead>
                                <TableHead>Categoría</TableHead>
                                <TableHead>Fase</TableHead>
                                <TableHead>Estado</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array.from({length: 3}).map((_, i) => (
                                    <TableRow key={i}><TableCell colSpan={5}><Skeleton className="h-8 w-full" /></TableCell></TableRow>
                                ))
                            ) : exercises && exercises.length > 0 ? (
                                exercises.map(ex => (
                                    <TableRow key={ex.id}>
                                        <TableCell className="font-medium">{ex.name}</TableCell>
                                        <TableCell>{ex.category}</TableCell>
                                        <TableCell>{ex.fase}</TableCell>
                                        <TableCell>{ex.status}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4" /></Button>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>Esta acción no se puede deshacer. Se eliminará el ejercicio de la biblioteca pública y de tu lista.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDelete(ex)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow><TableCell colSpan={5} className="h-24 text-center">Aún no has subido ningún ejercicio.</TableCell></TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

export default function MyExercisesPage() {
    const { user, isUserLoading } = useUser();
    const firestore = useFirestore();
    const [refreshKey, setRefreshKey] = useState(0);

    const userProfileRef = useMemoFirebase(() => {
        if (!user) return null;
        return doc(firestore, 'users', user.uid);
    }, [firestore, user]);
    const { data: userProfile } = useDoc<{subscriptionStartDate?: {toDate: () => Date}}>(userProfileRef);

    const userExercisesQuery = useMemoFirebase(() => {
        if (!user || !userProfile) return null;
        const startDate = userProfile?.subscriptionStartDate?.toDate() || new Date(0);
        return query(
            collection(firestore, 'userExercises'), 
            where('userId', '==', user.uid),
            where('createdAt', '>=', startDate)
        );
    }, [firestore, user, userProfile, refreshKey]);

    const { data: exercisesThisYear } = useCollection<UserExercise>(userExercisesQuery);
    const uploadedCount = exercisesThisYear?.length ?? 0;
    const hasReachedExerciseLimit = uploadedCount >= 25;

    if (isUserLoading) {
        return <div className="container mx-auto px-4 py-8 text-center">Cargando...</div>;
    }

    if (!user) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-muted-foreground">Debes iniciar sesión para gestionar tus ejercicios.</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                 <Button asChild variant="outline" className="mb-4">
                    <Link href={`/equipo/gestion`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
                <div className="text-center">
                    <Book className="mx-auto h-12 w-12 text-primary mb-4" />
                    <h1 className="text-4xl font-bold font-headline text-primary">Mis Ejercicios</h1>
                    <p className="text-lg text-muted-foreground mt-2">Aporta ejercicios a la comunidad, gestiónalos y gana puntos para tu suscripción.</p>
                </div>
            </div>

            <Tabs defaultValue="list" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto">
                    <TabsTrigger value="upload"><Upload className="mr-2 h-4 w-4"/>Subir Ejercicio</TabsTrigger>
                    <TabsTrigger value="list"><List className="mr-2 h-4 w-4"/>Mis Ejercicios Subidos</TabsTrigger>
                </TabsList>
                <TabsContent value="upload" className="mt-6">
                    <div className="max-w-4xl mx-auto mb-6">
                        <div className="text-sm text-muted-foreground">
                            <p>Ejercicios subidos este año: {uploadedCount} de 25</p>
                            <Progress value={(uploadedCount / 25) * 100} className="w-full mt-1" />
                            {hasReachedExerciseLimit && (
                                <p className="text-destructive font-semibold mt-2">Has alcanzado el límite de subida de ejercicios para este año.</p>
                            )}
                        </div>
                    </div>
                    <AddExerciseForm onExerciseAdded={() => setRefreshKey(k => k + 1)} disabled={hasReachedExerciseLimit} />
                </TabsContent>
                <TabsContent value="list" className="mt-6">
                    <MyExercisesList refreshKey={refreshKey} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

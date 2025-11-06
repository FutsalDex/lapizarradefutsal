
'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, query, where, getDocs, getDoc } from 'firebase/firestore';
import * as XLSX from 'xlsx';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookPlus, FileUp, Download, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


const categories = [
    "Balón parado y remates",
    "Conducción y regate",
    "Coordinación, agilidad y velocidad",
    "Finalización",
    "Pase y control",
    "Posesión y circulación del balón",
    "Superioridades e inferioridades numéricas",
    "Sistema táctico ofensivo",
    "Técnica individual y combinada",
    "Transiciones (ofensivas y defensivas)",
];
const phases = ["Inicial", "Principal", "Final"];
const ages = [
    { value: "Benjamín", label: "Benjamín (8-9 años)" },
    { value: "Alevín", label: "Alevín (10-11 años)" },
    { value: "Infantil", label: "Infantil (12-13 años)" },
    { value: "Cadete", label: "Cadete (14-15 años)" },
    { value: "Juvenil", label: "Juvenil (16-18 años)" },
    { value: "Senior", label: "Senior (+18 años)" },
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

function AddExerciseForm() {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ExerciseFormValues>({
    resolver: zodResolver(exerciseSchema),
    defaultValues: {
      'Número': '',
      'Ejercicio': '',
      'Descripción de la tarea': '',
      'Objetivos': '',
      'Fase': 'Principal',
      'Categoría': 'Pase y control',
      'Edad': [],
      'Número de jugadores': '',
      'Duración (min)': '',
      'Espacio y materiales necesarios': '',
      'Variantes': '',
      'Consejos para el entrenador': '',
      'Imagen': '',
      'Visible': true,
      'aiHint': '',
    },
  });

  const onSubmit = async (data: ExerciseFormValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Acceso no autorizado.' });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'exercises'), {
        ...data,
        createdAt: serverTimestamp(),
        userId: user.uid,
      });
      toast({ title: 'Éxito', description: 'Ejercicio añadido a la biblioteca.' });
      form.reset();
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
        <CardTitle className="flex items-center gap-2"><BookPlus/>Añadir Ejercicio Individual</CardTitle>
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

             <FormField
                control={form.control}
                name="Edad"
                render={() => (
                    <FormItem>
                    <FormLabel>Edades recomendadas</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {ages.map((item) => (
                        <FormField
                            key={item.value}
                            control={form.control}
                            name="Edad"
                            render={({ field }) => {
                            return (
                                <FormItem key={item.value} className="flex flex-row items-start space-x-3 space-y-0">
                                <FormControl>
                                    <Checkbox
                                        checked={field.value?.includes(item.value)}
                                        onCheckedChange={(checked) => {
                                            return checked
                                            ? field.onChange([...(field.value || []), item.value])
                                            : field.onChange(field.value?.filter((value) => value !== item.value));
                                        }}
                                    />
                                </FormControl>
                                <FormLabel className="font-normal">{item.label}</FormLabel>
                                </FormItem>
                            );
                            }}
                        />
                        ))}
                    </div>
                    <FormMessage />
                    </FormItem>
                )}
            />

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

            <FormField control={form.control} name="Visible" render={({ field }) => ( <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm"><div className="space-y-0.5"><FormLabel>Visible en la biblioteca</FormLabel><FormDescription>Si está desactivado, el ejercicio no será visible para los usuarios.</FormDescription></div><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
            
            <div className="flex justify-end">
                <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? 'Guardando...' : 'Añadir Ejercicio'}
                </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function BatchUploadForm() {
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [file, setFile] = useState<File | null>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files) {
            setFile(event.target.files[0]);
        }
    };

    const handleDownloadTemplate = () => {
        const header = [
            "Número", "Ejercicio", "Descripción de la tarea", "Objetivos", "Fase", 
            "Categoría", "Edad", "Número de jugadores", "Duración (min)", 
            "Espacio y materiales necesarios", "Variantes", "Consejos para el entrenador", 
            "Imagen", "Visible", "aiHint"
        ].join(';');
        const exampleRow = [
            "F001", "Rondo de calentamiento", "Un rondo simple 4vs1 para calentar.", "Mejorar el pase y control.", "Inicial", 
            "Pase y control", "Infantil,Cadete", "5", "10", 
            "10x10 metros, 1 balón, 4 conos", "Limitar a 2 toques.", "Fomentar la comunicación.",
            "https://ejemplo.com/img.png", "TRUE", "futsal rondo"
        ].join(';');
        
        const csvContent = "data:text/csv;charset=utf-8," + "\uFEFF" + header + "\n" + exampleRow;
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "plantilla_ejercicios.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!file || !user) {
            toast({ variant: 'destructive', title: 'Error', description: 'Falta el archivo o no estás autenticado.' });
            return;
        }
        setIsSubmitting(true);
        const reader = new FileReader();

        reader.onload = async (e) => {
            try {
                const data = e.target?.result;
                let jsonData: any[] = [];

                if (file.name.endsWith('.csv')) {
                    const text = new TextDecoder("utf-8").decode(data as ArrayBuffer);
                    
                    const lines = text.split(/\r?\n/).filter(line => line.trim() !== '');
                    if (lines.length < 2) {
                        toast({ title: 'Aviso', description: 'El archivo CSV está vacío o solo contiene encabezados.' });
                        setIsSubmitting(false);
                        return;
                    }

                    const rawHeaders = lines[0].split(';');
                    const headers = rawHeaders.map(h => h.trim().replace(/^\uFEFF/, ''));
                    const idColumnVariants = ['Número', 'numero', 'úmero'];
                    const numberHeader = headers.find(h => idColumnVariants.includes(h.trim()));

                    if (!numberHeader) {
                        toast({ variant: 'destructive', title: 'Error de formato', description: 'La columna "Número" es obligatoria y no se encontró.' });
                        setIsSubmitting(false);
                        return;
                    }
                    
                    const dataRows = lines.slice(1);
                    jsonData = dataRows.map(row => {
                        const values = row.split(';');
                        const obj: { [key: string]: any } = {};
                        headers.forEach((header, index) => {
                           if (header) {
                                obj[header] = values[index] || undefined;
                            }
                        });
                        return obj;
                    }).filter(row => row[numberHeader] && String(row[numberHeader]).trim() !== '');


                } else { // Excel file
                    const workbook = XLSX.read(data, { type: 'array' });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];
                    jsonData = XLSX.utils.sheet_to_json(worksheet);
                }

                const idColumnVariants = ['Número', 'numero', 'úmero'];
                let numberHeader = '';
                const fileHeaders = Array.isArray(jsonData) && jsonData.length > 0 ? Object.keys(jsonData[0]) : [];

                for (const variant of idColumnVariants) {
                    const foundHeader = fileHeaders.find(h => h.trim().toLowerCase() === variant.toLowerCase());
                    if (foundHeader) {
                        numberHeader = foundHeader;
                        break;
                    }
                }
                
                if (!numberHeader) {
                    toast({ variant: 'destructive', title: 'Error de formato', description: 'La columna "Número" es obligatoria y no se encontró.' });
                    setIsSubmitting(false);
                    return;
                }
                
                const exercisesToProcess = jsonData.filter(row => row[numberHeader] && String(row[numberHeader]).trim() !== '');

                if (exercisesToProcess.length === 0) {
                    toast({ title: 'Aviso', description: 'No se encontraron ejercicios válidos con un "Número" en el archivo.' });
                    setIsSubmitting(false);
                    return;
                }

                const batch = writeBatch(firestore);
                const exercisesCollection = collection(firestore, 'exercises');
                let updatedCount = 0;
                let createdCount = 0;

                for (const exData of exercisesToProcess) {
                    const exerciseNumber = String(exData[numberHeader]).trim();
                    const q = query(exercisesCollection, where('Número', '==', exerciseNumber));
                    const snapshot = await getDocs(q);
                    
                    const finalData: { [key: string]: any } = {};
                    for (const key in exData) {
                        if (exData[key] !== undefined) {
                            finalData[key] = exData[key];
                        }
                    }

                    const edadValue = finalData.Edad || finalData.edad || '';
                    finalData.Edad = typeof edadValue === 'string' 
                        ? edadValue.split(',').map(e => e.trim().replace(/\s*\(\d+-\d+\s*años\)/, '').replace(/\s*\(\+\d+\s*años\)/, '')) 
                        : [];
                    
                    finalData.Visible = finalData.Visible ? String(finalData.Visible).toUpperCase() === 'TRUE' : true;
                    finalData.userId = user.uid;

                    if (snapshot.empty) {
                        const docRef = doc(exercisesCollection);
                        batch.set(docRef, { ...finalData, createdAt: serverTimestamp() });
                        createdCount++;
                    } else {
                        const docRef = snapshot.docs[0].ref;
                        batch.update(docRef, { ...finalData, updatedAt: serverTimestamp() });
                        updatedCount++;
                    }
                }

                await batch.commit();
                toast({ title: 'Éxito', description: `Proceso completado. ${createdCount} ejercicios creados y ${updatedCount} actualizados.` });
            } catch (error: any) {
                console.error('Error processing file:', error);
                toast({ variant: 'destructive', title: 'Error al procesar el archivo', description: error.message });
            } finally {
                setIsSubmitting(false);
                setFile(null);
                if (document.getElementById('file-upload-input')) {
                    (document.getElementById('file-upload-input') as HTMLInputElement).value = '';
                }
            }
        };

        reader.onerror = () => {
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
            setIsSubmitting(false);
        };
        
        reader.readAsArrayBuffer(file);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileUp/>Subida de Ejercicios en Lote</CardTitle>
                <CardDescription>Sube un archivo CSV o Excel para añadir o actualizar múltiples ejercicios. El campo "Número" se usa como identificador único.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" onClick={handleDownloadTemplate} className="mb-6 w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla CSV
                </Button>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="file-upload-input">Archivo CSV o Excel</Label>
                        <Input id="file-upload-input" type="file" accept=".csv, .xlsx, .xls" onChange={handleFileChange} />
                    </div>
                    <Button type="submit" disabled={!file || isSubmitting} className="w-full">
                        {isSubmitting ? 'Procesando...' : 'Subir y Procesar Archivo'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}

function BatchDeleteCard() {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isDeleting, setIsDeleting] = useState(false);
    const [confirmationText, setConfirmationText] = useState('');

    const handleDeleteAll = async () => {
        setIsDeleting(true);
        try {
            const exercisesCollection = collection(firestore, 'exercises');
            const snapshot = await getDocs(exercisesCollection);
            
            if (snapshot.empty) {
                toast({ title: 'No hay nada que borrar', description: 'La biblioteca de ejercicios ya está vacía.' });
                setIsDeleting(false);
                return;
            }

            const totalDocs = snapshot.size;
            // Firestore allows up to 500 operations per batch
            const batchSize = 500;
            const batches = [];

            for (let i = 0; i < totalDocs; i += batchSize) {
                const batch = writeBatch(firestore);
                const chunk = snapshot.docs.slice(i, i + batchSize);
                chunk.forEach(doc => batch.delete(doc.ref));
                batches.push(batch.commit());
            }

            await Promise.all(batches);

            toast({ title: 'Éxito', description: `Se han eliminado ${totalDocs} ejercicios de la biblioteca.` });
        } catch (error: any) {
            console.error("Error deleting all exercises:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudieron eliminar los ejercicios.' });
        } finally {
            setIsDeleting(false);
            setConfirmationText('');
        }
    };

    return (
        <Card className="border-destructive">
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive"><Trash2/>Zona de Peligro</CardTitle>
                <CardDescription>Acciones destructivas que no se pueden deshacer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div>
                    <Label htmlFor="delete-all-input">Borrar todos los ejercicios</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                        Esta acción eliminará permanentemente todos los ejercicios de la biblioteca. Para confirmar, escribe "BORRAR" en el campo de abajo.
                    </p>
                    <Input 
                        id="delete-all-input"
                        value={confirmationText}
                        onChange={(e) => setConfirmationText(e.target.value)}
                        placeholder='Escribe BORRAR para confirmar'
                    />
                </div>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button 
                            variant="destructive" 
                            className="w-full"
                            disabled={confirmationText !== 'BORRAR' || isDeleting}
                        >
                            {isDeleting ? 'Eliminando...' : 'Eliminar Todos los Ejercicios'}
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es irreversible. Se borrarán todos los ejercicios de la base de datos.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction 
                                onClick={handleDeleteAll}
                                className="bg-destructive hover:bg-destructive/90"
                            >
                                Sí, eliminar todo
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardContent>
        </Card>
    );
}

export default function AdminAddExercisesPage() {
    const { user, isUserLoading } = useUser();
    const isAdmin = user?.email === 'futsaldex@gmail.com';

    if (isUserLoading) {
        return <div className="container mx-auto px-4 py-8 text-center">Cargando...</div>
    }

    if (!isAdmin) {
        return (
            <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
            </div>
        )
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <Button asChild variant="outline" className="mb-4">
                    <Link href={`/admin/ejercicios`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver a Gestión de Ejercicios
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold font-headline text-primary">Alta de Ejercicios</h1>
                <p className="text-lg text-muted-foreground mt-2">Añade nuevos ejercicios a la biblioteca pública, de uno en uno o por lotes.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AddExerciseForm />
                </div>
                <div className="space-y-8">
                    <BatchUploadForm />
                    <BatchDeleteCard />
                </div>
            </div>
        </div>
    );
}

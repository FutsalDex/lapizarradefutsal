'use client';

import { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc, query, where, getDocs } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, BookPlus, FileUp, Download } from 'lucide-react';
import Link from 'next/link';
import { Label } from '@/components/ui/label';


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
    
    const cleanHeader = (header: string) => {
        return header.replace(/[\uFEFF]/g, '').trim().replace(/^"|"$/g, '');
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
            const text = e.target?.result;
            if (typeof text !== 'string') {
                toast({ variant: 'destructive', title: 'Error', description: 'No se pudo leer el archivo.' });
                setIsSubmitting(false);
                return;
            }

            try {
                const rows = text.split('\n').filter(row => row.trim() !== '');
                if (rows.length < 2) {
                     toast({ title: 'Aviso', description: 'El archivo CSV está vacío o solo contiene la cabecera.' });
                     setIsSubmitting(false);
                     return;
                }
                
                const headerRow = rows[0];
                const headers = headerRow.split(';').map(cleanHeader);
                
                const normalizeHeader = (h: string) => h.toLowerCase().replace(/\s/g, '').replace(/[\uFEFF]/g, '').replace(/[^a-z0-9]/gi, '');
                
                const normalizedHeaders = headers.map(normalizeHeader);
                const numeroIndex = normalizedHeaders.findIndex(h => ['numero', 'nmero', 'úmero'].includes(normalizeHeader(h)));

                if (numeroIndex === -1) {
                    toast({ variant: 'destructive', title: 'Error de formato', description: 'La columna "Número" es obligatoria y no se encontró.' });
                    setIsSubmitting(false);
                    return;
                }
                
                const numberHeader = headers[numeroIndex];

                const exercisesFromCSV = rows.slice(1).map(row => {
                    const values = row.split(/;(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(v => v.trim().replace(/^"|"$/g, ''));
                    const exercise: { [key: string]: any } = headers.reduce((obj, header, index) => {
                         if (header) {
                            obj[header] = values[index];
                         }
                        return obj;
                    }, {} as { [key: string]: any });
                    return exercise;
                });
               
                if (exercisesFromCSV.length === 0) {
                    toast({ title: 'Aviso', description: 'El archivo CSV no contiene filas de datos válidas.' });
                    setIsSubmitting(false);
                    return;
                }

                const batch = writeBatch(firestore);
                const exercisesCollection = collection(firestore, 'exercises');
                let updatedCount = 0;
                let createdCount = 0;

                for (const ex of exercisesFromCSV) {
                    const exerciseNumber = ex[numberHeader];
                    if (!exerciseNumber) continue;

                    const edadValue = ex.Edad || ex.edad || '';
                    const edadArray = typeof edadValue === 'string' 
                        ? edadValue.split(',').map(e => e.trim().replace(/\s*\(\d+-\d+\s*años\)/, '').replace(/\s*\(\+\d+\s*años\)/, '')) 
                        : [];

                    const data: { [key: string]: any } = {
                        ...ex,
                        Edad: edadArray,
                        Visible: ex.Visible ? ex.Visible.toUpperCase() === 'TRUE' : true,
                        userId: user.uid,
                    };
                    
                    const finalData: { [key: string]: any } = {};
                    for (const key in data) {
                        if (Object.prototype.hasOwnProperty.call(data, key) && key) {
                             if(data[key] !== undefined) {
                                const cleanKey = key.replace(/^"|"$/g, '').trim();
                                finalData[cleanKey] = data[key];
                             }
                        }
                    }
                    
                    // Use the original header for query `where`
                    const q = query(exercisesCollection, where(numberHeader, '==', exerciseNumber));
                    const snapshot = await getDocs(q);

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
                console.error('Error processing CSV:', error);
                toast({ variant: 'destructive', title: 'Error al procesar el archivo', description: error.message });
            } finally {
                setIsSubmitting(false);
                setFile(null);
                 if (document.getElementById('csv-file')) {
                    (document.getElementById('csv-file') as HTMLInputElement).value = '';
                }
            }
        };

        reader.readAsText(file, 'UTF-8');
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><FileUp/>Subida de Ejercicios en Lote</CardTitle>
                <CardDescription>Sube un archivo CSV (separado por punto y coma) para añadir o actualizar múltiples ejercicios. El campo "Número" se usa como identificador único.</CardDescription>
            </CardHeader>
            <CardContent>
                <Button variant="outline" onClick={handleDownloadTemplate} className="mb-6 w-full">
                    <Download className="mr-2 h-4 w-4" />
                    Descargar Plantilla CSV
                </Button>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <Label htmlFor="csv-file">Archivo CSV</Label>
                        <Input id="csv-file" type="file" accept=".csv" onChange={handleFileChange} />
                    </div>
                    <Button type="submit" disabled={!file || isSubmitting} className="w-full">
                        {isSubmitting ? 'Procesando...' : 'Subir y Procesar Archivo'}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}


export default function AdminExercisesPage() {
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
                    <Link href={`/admin`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel de Admin
                    </Link>
                </Button>
                <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Ejercicios</h1>
                <p className="text-lg text-muted-foreground mt-2">Añade nuevos ejercicios a la biblioteca pública.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <AddExerciseForm />
                </div>
                <div>
                    <BatchUploadForm />
                </div>
            </div>
        </div>
    );
}

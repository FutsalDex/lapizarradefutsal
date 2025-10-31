
'use client';

import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { collection, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Exercise, mapExercise } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Search, Filter, Eye, ArrowLeft, Edit, Trash2 } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { FutsalCourt } from '@/components/futsal-court';
import { useToast } from '@/hooks/use-toast';

export default function AdminExercisesListPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const { toast } = useToast();
  
  const firestore = useFirestore();
  const { user } = useUser();
  const isAdmin = user?.email === 'futsaldex@gmail.com';

  const exercisesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exercises');
  }, [firestore]);

  const { data: rawExercises, isLoading: isLoadingExercises } = useCollection<any>(exercisesCollection);

  const exercises = useMemo(() => {
      if (!rawExercises) return [];
      return rawExercises.map(mapExercise).sort((a,b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);
        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;
        return numA - numB;
      });
  }, [rawExercises]);
  
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    return exercises.filter(exercise => {
      if (!exercise.name) return false;

      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || exercise.category === categoryFilter;
      
      return matchesSearch && matchesCategory;
    });
  }, [exercises, searchTerm, categoryFilter]);

  const handleVisibilityChange = async (exercise: Exercise, isVisible: boolean) => {
    if (!isAdmin || !firestore) return;
    try {
        const exerciseRef = doc(firestore, 'exercises', exercise.id);
        await updateDoc(exerciseRef, { 'Visible': isVisible });
        toast({
            title: 'Visibilidad actualizada',
            description: `El ejercicio "${exercise.name}" ahora es ${isVisible ? 'visible' : 'oculto'}.`,
        });
    } catch (error) {
        console.error("Error updating visibility:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo actualizar la visibilidad del ejercicio.',
        });
    }
  };

  const handleDeleteExercise = async (exercise: Exercise) => {
    if (!isAdmin || !firestore) return;
    try {
        await deleteDoc(doc(firestore, 'exercises', exercise.id));
        toast({
            title: 'Ejercicio eliminado',
            description: `El ejercicio "${exercise.name}" ha sido eliminado.`,
        });
    } catch (error) {
        console.error("Error deleting exercise:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'No se pudo eliminar el ejercicio.',
        });
    }
  };


  const isLoading = isLoadingExercises;
  const categories = useMemo(() => {
    if (!exercises) return [];
    return [...new Set(exercises.map(e => e.category).filter(Boolean))];
  }, [exercises]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-left">
          <Button asChild variant="outline" className="mb-4">
            <Link href={`/admin/ejercicios`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver a Gestión de Ejercicios
            </Link>
          </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Gestionar Biblioteca de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">Activa o desactiva la visibilidad de los ejercicios para los usuarios.</p>
      </div>
      
      <Card>
        <CardHeader>
            <CardTitle>Listado de Todos los Ejercicios</CardTitle>
            <CardDescription>Usa el interruptor para cambiar la visibilidad de un ejercicio en la biblioteca pública.</CardDescription>
            <div className="pt-4 grid grid-cols-1 md:grid-cols-3 gap-4 items-center">
                <div className="relative md:col-span-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input 
                        placeholder="Buscar ejercicio por nombre..." 
                        className="pl-9"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <Select onValueChange={setCategoryFilter} defaultValue="Todas">
                    <SelectTrigger>
                        <Filter className="mr-2 h-4 w-4" />
                        <SelectValue placeholder="Categoría" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Todas">Todas las Categorías</SelectItem>
                        {categories.map(cat => <SelectItem key={cat} value={cat}>{cat}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </CardHeader>
        <CardContent>
            <div className="border rounded-lg overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Número</TableHead>
                            <TableHead className="w-[100px]">Imagen</TableHead>
                            <TableHead>Nombre del Ejercicio</TableHead>
                            <TableHead>Categoría</TableHead>
                            <TableHead className="text-right w-[150px]">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                    <TableCell><Skeleton className="h-10 w-16"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                    <TableCell><Skeleton className="h-5 w-full"/></TableCell>
                                    <TableCell><Skeleton className="h-8 w-full"/></TableCell>
                                </TableRow>
                            ))
                        ) : filteredExercises.length > 0 ? (
                            filteredExercises.map((exercise) => (
                                <TableRow key={exercise.id}>
                                    <TableCell className="font-medium">{exercise.number}</TableCell>
                                    <TableCell>
                                        <div className="relative w-16 h-10 bg-muted rounded-md">
                                             {exercise.image ? (
                                                <Image src={exercise.image} alt={exercise.name} fill className="object-contain"/>
                                             ) : (
                                                <FutsalCourt className="w-full h-full p-1" />
                                             )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-semibold">{exercise.name}</TableCell>
                                    <TableCell><Badge variant="outline">{exercise.category}</Badge></TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            <Switch
                                                checked={exercise.visible}
                                                onCheckedChange={(checked) => handleVisibilityChange(exercise, checked)}
                                                aria-label="Visibilidad del ejercicio"
                                                disabled={!isAdmin}
                                            />
                                            <Button variant="ghost" size="icon" disabled>
                                                <Edit className="h-4 w-4" />
                                            </Button>

                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={!isAdmin}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará permanentemente el ejercicio de la biblioteca.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteExercise(exercise)} className="bg-destructive hover:bg-destructive/90">
                                                            Sí, eliminar
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))
                        ) : (
                             <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No se encontraron ejercicios con los filtros actuales.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

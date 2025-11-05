
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Search, Trash2, Filter } from 'lucide-react';
import Link from 'next/link';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Image from 'next/image';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';


type Exercise = {
  id: number;
  name: string;
  category: string;
  visible: boolean;
  author: string;
};

const exercisesData: Exercise[] = [
    { id: 1, name: 'RONDO CON PASE DIAGONAL', category: 'Pase y control', visible: true, author: 'Otro' },
    { id: 2, name: 'POSESION CON CUATRO PORTERIAS PEQUEÑAS', category: 'Posesión y circulación del balón', visible: true, author: 'Otro' },
    { id: 3, name: 'PARALELA DOBLANDO CON PASE AL PIVOT', category: 'Finalización', visible: true, author: 'Propio' },
    { id: 4, name: 'JUEGO EN CUATRO ZONAS', category: 'Superioridades e inferioridades numéricas', visible: true, author: 'Otro' },
    { id: 5, name: 'CHUTES EN CRUZ CON PARALELA', category: 'Finalización', visible: true, author: 'Propio' },
    { id: 6, name: '2C2 CON REPLIEGUE + 1 COMODIN EXTERIOR', category: 'Transiciones (ofensivas y defensivas)', visible: true, author: 'Otro' },
    { id: 7, name: '2C2 CON REPLIEGUE', category: 'Transiciones (ofensivas y defensivas)', visible: true, author: 'Propio' },
    { id: 8, name: '3C1 DOBLANDO', category: 'Técnica individual y combinada', visible: true, author: 'Otro' },
    { id: 9, name: '3C3 CON 2 COMODINES EXTERIORES', category: 'Superioridades e inferioridades numéricas', visible: true, author: 'Otro' },
    { id: 10, name: 'POSESION EN IGUALDAD CON APOYOS EXTERIORES Y FINALIZACION', category: 'Posesión y circulación del balón', visible: true, author: 'Otro' },
    { id: 11, name: 'CIRCUITO FISICO - REPLIEGUE Y COORDINACION', category: 'Coordinación, agilidad y velocidad', visible: true, author: 'Propio' },
    { id: 13, name: 'RONDO CON REPLIEGUE', category: 'Posesión y circulación del balón', visible: true, author: 'Otro' },
    { id: 14, name: 'SISTEMA 3-1 (ATACAR EL CAMBIO)', category: 'sistema táctico ofensivo', visible: true, author: 'Propio' },
    { id: 15, name: 'FINTA, CONTROL ORIENTADO Y FINALIZACION', category: 'Finalización', visible: true, author: 'Otro' },
    { id: 16, name: '2 RONDOS CON CAMBIO DE RONDO', category: 'Técnica individual y combinada', visible: true, author: 'Otro' },
    { id: 17, name: '1C1 ENTRANDO Y SALIENDO', category: 'Técnica individual y combinada', visible: true, author: 'Propio' },
    { id: 18, name: 'CIRCUITO FISICO - RESISTENCIA Y VELOCIDAD ESPECIFICA', category: 'Coordinación, agilidad y velocidad', visible: true, author: 'Otro' },
    { id: 19, name: 'JUGADA DE CORNER - AMAGO + BLOQUEO', category: 'Balón parado y remates', visible: true, author: 'Otro' },
];

const allCategories = [...new Set(exercisesData.map(ex => ex.category))];

export default function LibraryManagementPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [authorFilter, setAuthorFilter] = useState('Todos');
  const [exercises, setExercises] = useState<Exercise[]>(exercisesData);
  const { toast } = useToast();

  const handleVisibilityChange = (id: number, checked: boolean) => {
    setExercises(prev => 
      prev.map(ex => ex.id === id ? { ...ex, visible: checked } : ex)
    );
     toast({
        title: "Visibilidad actualizada",
        description: `El ejercicio ahora es ${checked ? 'visible' : 'oculto'}.`,
    });
  };

  const handleDeleteExercise = (id: number) => {
    setExercises(prev => prev.filter(ex => ex.id !== id));
    toast({
        variant: "destructive",
        title: "Ejercicio eliminado",
        description: "El ejercicio ha sido eliminado de la biblioteca.",
    });
  };
  
  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = categoryFilter === 'Todas' || exercise.category === categoryFilter;
    const matchesAuthor = 
        authorFilter === 'Todos' || 
        (authorFilter === 'Mis Ejercicios' && exercise.author === 'Propio') ||
        (authorFilter === 'Otros Usuarios' && exercise.author === 'Otro');
    return matchesSearch && matchesCategory && matchesAuthor;
  });

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin/ejercicios">
            <ArrowLeft className="mr-2" />
            Volver a Gestión de Ejercicios
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Gestionar Biblioteca de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Activa o desactiva la visibilidad de los ejercicios para los usuarios.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Todos los Ejercicios</CardTitle>
          <CardDescription>Usa el interruptor para cambiar la visibilidad de un ejercicio en la biblioteca pública.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="relative flex-grow min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                placeholder="Buscar ejercicio por nombre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
             <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Todas las Categorías" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todas">Todas las Categorías</SelectItem>
                    {allCategories.map(cat => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <Select value={authorFilter} onValueChange={setAuthorFilter}>
                <SelectTrigger className="w-full sm:w-[240px]">
                    <SelectValue placeholder="Filtrar por autor" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="Todos">Todos los Autores</SelectItem>
                    <SelectItem value="Mis Ejercicios">Mis Ejercicios</SelectItem>
                    <SelectItem value="Otros Usuarios">Otros Usuarios</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Número</TableHead>
                  <TableHead className="w-24">Imagen</TableHead>
                  <TableHead>Nombre del Ejercicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExercises.map((exercise) => (
                  <TableRow key={exercise.id}>
                    <TableCell className="font-medium">{exercise.id}</TableCell>
                    <TableCell>
                      <Image 
                        src={`https://picsum.photos/seed/ex${exercise.id}/64/48`}
                        alt={exercise.name}
                        width={64}
                        height={48}
                        className="rounded-sm object-cover"
                      />
                    </TableCell>
                    <TableCell>{exercise.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{exercise.category}</Badge>
                    </TableCell>
                    <TableCell className="flex items-center justify-end gap-2">
                      <Switch 
                        checked={exercise.visible} 
                        onCheckedChange={(checked) => handleVisibilityChange(exercise.id, checked)}
                      />
                      <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <Edit className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                              <DialogHeader>
                                  <DialogTitle>Editar Ejercicio</DialogTitle>
                                  <DialogDescription>
                                      Para editar este ejercicio, serás redirigido al formulario de alta.
                                  </DialogDescription>
                              </DialogHeader>
                              <DialogFooter>
                                  <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                                  <Button asChild><Link href="/ejercicios/mis-ejercicios">Ir al Formulario</Link></Button>
                              </DialogFooter>
                          </DialogContent>
                      </Dialog>

                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                           <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción eliminará permanentemente el ejercicio "{exercise.name}". No se puede deshacer.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={() => handleDeleteExercise(exercise.id)}>
                                    Sí, eliminar
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>

                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

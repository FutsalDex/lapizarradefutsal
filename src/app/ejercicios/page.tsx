
"use client";

<<<<<<< HEAD
import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { collection, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Exercise, mapExercise } from '@/lib/data';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Heart, Search, Filter, Eye, ArrowLeft, ArrowRight, User, Star } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { FutsalCourt } from '@/components/futsal-court';
import Image from 'next/image';

interface UserProfileData {
    subscription?: string;
}

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [phaseFilter, setPhaseFilter] = useState('Todas');
  const [categoryFilter, setCategoryFilter] = useState('Todas');
  const [ageFilter, setAgeFilter] = useState('Todas');
  const [currentPage, setCurrentPage] = useState(1);
  const exercisesPerPage = 12;
  
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const exercisesCollection = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'exercises');
  }, [firestore]);
  
  const userProfileRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return doc(firestore, 'users', user.uid);
  }, [firestore, user]);

  const favoritesCollectionRef = useMemoFirebase(() => {
    if (!firestore || !user) return null;
    return collection(firestore, `users/${user.uid}/favorites`);
  }, [firestore, user]);

  const { data: rawExercises, isLoading: isLoadingExercises } = useCollection<any>(exercisesCollection);
  const { data: userProfile, isLoading: isLoadingProfile } = useDoc<UserProfileData>(userProfileRef);
  const { data: favorites, isLoading: isLoadingFavorites } = useCollection(favoritesCollectionRef);

  const exercises = useMemo(() => {
      if (!rawExercises) return [];
      return rawExercises.map(mapExercise);
  }, [rawExercises]);

  const favoriteIds = useMemo(() => new Set(favorites?.map(fav => fav.id)), [favorites]);

  const handleFavoriteToggle = async (exercise: Exercise) => {
    if (!user || !firestore) return;
    const favoriteRef = doc(firestore, `users/${user.uid}/favorites`, exercise.id);

    if (favoriteIds.has(exercise.id)) {
      await deleteDoc(favoriteRef);
    } else {
      await setDoc(favoriteRef, { favorited: true });
    }
  };
  
  const isGuestUser = userProfile?.subscription === 'Invitado';

  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    let processableExercises = exercises.filter(e => e.visible);

    // Si el usuario no está logueado o es anónimo, solo mostramos 12 ejercicios
    if (!user || user.isAnonymous || isGuestUser) {
        return processableExercises.slice(0, 12);
    }

    return processableExercises.filter(exercise => {
      if (!exercise.name) return false;

      const matchesSearch = exercise.name.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === 'Todas' || exercise.category === categoryFilter;
      const matchesPhase = phaseFilter === 'Todas' || exercise.fase === phaseFilter;
      const matchesAge = ageFilter === 'Todas' || (Array.isArray(exercise.edad) && exercise.edad.map(e => String(e).toLowerCase()).includes(ageFilter.toLowerCase()));

      return matchesSearch && matchesCategory && matchesPhase && matchesAge;
    });
  }, [exercises, searchTerm, categoryFilter, phaseFilter, ageFilter, user, isGuestUser]);
  
  const totalPages = Math.ceil(filteredExercises.length / exercisesPerPage);
  const paginatedExercises = useMemo(() => {
      // Para usuarios no registrados, anónimos o invitados, la paginación no aplica ya que solo ven 12
      if (!user || user.isAnonymous || isGuestUser) {
          return filteredExercises;
      }
      const startIndex = (currentPage - 1) * exercisesPerPage;
      const endIndex = startIndex + exercisesPerPage;
      return filteredExercises.slice(startIndex, endIndex);
  }, [filteredExercises, currentPage, exercisesPerPage, user, isGuestUser]);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= totalPages) {
        setCurrentPage(newPage);
    }
  }
  
  const isLoading = isLoadingExercises || isLoadingFavorites || isUserLoading || isLoadingProfile;
=======
import { useState } from 'react';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query } from 'firebase/firestore';
import { db } from '@/firebase/config';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Exercise, favoriteExerciseIdsStore } from '@/lib/data';
import Image from 'next/image';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Search, Eye, Heart } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const ITEMS_PER_PAGE = 12;

export default function EjerciciosPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [faseFilter, setFaseFilter] = useState('Todos');
  const [edadFilter, setEdadFilter] = useState('Todos');
  const [currentPage, setCurrentPage] = useState(1);
  const [favoriteIds, setFavoriteIds] = useState(favoriteExerciseIdsStore);
  const { toast } = useToast();

  const [exercisesSnapshot, loading, error] = useCollection(
    query(collection(db, 'exercises'))
  );

  const exercises = exercisesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Exercise)) || [];

  const handleFavoriteToggle = (exerciseId: string) => {
    const newFavoriteIds = new Set(favoriteIds);
    if (newFavoriteIds.has(exerciseId)) {
      newFavoriteIds.delete(exerciseId);
      toast({
        description: "Ejercicio eliminado de favoritos.",
      });
    } else {
      newFavoriteIds.add(exerciseId);
      toast({
        description: "Ejercicio añadido a favoritos.",
      });
    }
    setFavoriteIds(newFavoriteIds);
    // Actualizar el store simulado
    favoriteExerciseIdsStore.clear();
    newFavoriteIds.forEach(id => favoriteExerciseIdsStore.add(id));
  };

  const allCategories = [...new Set(exercises.map(ex => ex['Categoría']))].sort();
  
  const allEdades = [
      "Benjamín", "Alevín", "Infantil",
      "Cadete", "Juvenil", "Senior"
  ];


  const filteredExercises = exercises.filter(exercise => {
    const matchesSearch = exercise['Ejercicio'].toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (exercise['Descripción de la tarea'] && exercise['Descripción de la tarea'].toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesCategory = categoryFilter === 'Todos' || exercise['Categoría'] === categoryFilter;
    
    let matchesFase = true;
    if (faseFilter !== 'Todos') {
        if (faseFilter === 'Fase Inicial') {
            matchesFase = exercise['Fase'] === 'Calentamiento' || exercise['Fase'] === 'Preparación Física';
        } else if (faseFilter === 'Fase Principal') {
            matchesFase = exercise['Fase'] === 'Principal' || exercise['Fase'] === 'Específico';
        } else if (faseFilter === 'Fase Final') {
            matchesFase = exercise['Fase'] === 'Vuelta a la Calma';
        } else {
            matchesFase = exercise['Fase'] === faseFilter;
        }
    }
    
    const matchesEdad = edadFilter === 'Todos' || (Array.isArray(exercise['Edad']) && exercise['Edad'].includes(edadFilter));
    
    return matchesSearch && matchesCategory && matchesFase && matchesEdad;
  });
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

  const totalPages = Math.ceil(filteredExercises.length / ITEMS_PER_PAGE);
  const paginatedExercises = filteredExercises.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const handlePrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };
  
  const allFases = ["Fase Inicial", "Fase Principal", "Fase Final"];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-left">
        <h1 className="text-4xl font-bold font-headline text-foreground">Biblioteca de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">Explora nuestra colección de ejercicios de futsal. Filtra por nombre, fase, categoría o edad.</p>
      </div>
      
<<<<<<< HEAD
      <div className="mb-6 p-4 bg-card rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-center">
            <div className="relative md:col-span-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Buscar ejercicio por nombre..." 
                className="pl-9"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Select onValueChange={setPhaseFilter} defaultValue="Todas">
              <SelectTrigger>
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Fase" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las Fases</SelectItem>
                <SelectItem value="Inicial">Inicial</SelectItem>
                <SelectItem value="Principal">Principal</SelectItem>
                <SelectItem value="Final">Final</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setCategoryFilter} defaultValue="Todas">
              <SelectTrigger>
                 <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las Categorías</SelectItem>
                <SelectItem value="Balón parado y remates">Balón parado y remates</SelectItem>
                <SelectItem value="Conducción y regate">Conducción y regate</SelectItem>
                <SelectItem value="Coordinación, agilidad y velocidad">Coordinación, agilidad y velocidad</SelectItem>
                <SelectItem value="Finalización">Finalización</SelectItem>
                <SelectItem value="Pase y control">Pase y control</SelectItem>
                <SelectItem value="Posesión y circulación del balón">Posesión y circulación del balón</SelectItem>
                <SelectItem value="Superioridades e inferioridades numéricas">Superioridades e inferioridades numéricas</SelectItem>
                <SelectItem value="Sistema táctico ofensivo">Sistema táctico ofensivo</SelectItem>
                <SelectItem value="Técnica individual y combinada">Técnica individual y combinada</SelectItem>
                <SelectItem value="Transiciones (ofensivas y defensivas)">Transiciones (ofensivas y defensivas)</SelectItem>
              </SelectContent>
            </Select>
            <Select onValueChange={setAgeFilter} defaultValue="Todas">
              <SelectTrigger>
                 <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Edad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todas">Todas las Edades</SelectItem>
                <SelectItem value="benjamín">Benjamín (8-9 años)</SelectItem>
                <SelectItem value="alevín">Alevín (10-11 años)</SelectItem>
                <SelectItem value="infantil">Infantil (12-13 años)</SelectItem>
                <SelectItem value="cadete">Cadete (14-15 años)</SelectItem>
                <SelectItem value="juvenil">Juvenil (16-18 años)</SelectItem>
                <SelectItem value="senior">Senior (+18 años)</SelectItem>
              </SelectContent>
            </Select>
=======
      <div className="mb-8 p-4 bg-card rounded-lg border">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input 
                placeholder="Buscar ejercicio por nombre..." 
                className="pl-10"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>
            <Select onValueChange={value => { setFaseFilter(value); setCurrentPage(1); }} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Fase" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Fases</SelectItem>
                  {allFases.map((fase, index) => <SelectItem key={`${fase}-${index}`} value={fase}>{fase}</SelectItem>)}
                </SelectContent>
            </Select>
            <Select onValueChange={value => { setCategoryFilter(value); setCurrentPage(1); }} defaultValue="Todos">
              <SelectTrigger>
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Todos">Todas las Categorías</SelectItem>
                {allCategories.map((cat, index) => <SelectItem key={`${cat}-${index}`} value={cat}>{cat}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select onValueChange={value => { setEdadFilter(value); setCurrentPage(1); }} defaultValue="Todos">
                <SelectTrigger>
                  <SelectValue placeholder="Edad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Todos">Todas las Edades</SelectItem>
                  {allEdades.map((edad, index) => <SelectItem key={`${edad}-${index}`} value={edad}>{edad}</SelectItem>)}
                </SelectContent>
            </Select>
        </div>
        <div className="text-sm text-muted-foreground mt-4">
          Mostrando {paginatedExercises.length} de {filteredExercises.length} ejercicios. Página {currentPage} de {totalPages}.
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
        </div>
        {!isLoading && user && !user.isAnonymous && !isGuestUser && (
            <p className="text-sm text-muted-foreground mt-4">Mostrando {paginatedExercises.length} de {filteredExercises.length} ejercicios. Página {currentPage} de {totalPages > 0 ? totalPages : 1}.</p>
        )}
      </div>
      
      {isLoading && (
        <>
          <p className="text-sm text-muted-foreground text-center mb-6">Cargando ejercicios...</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm">
                <Skeleton className="aspect-video w-full" />
                <CardContent className="p-4 flex-grow space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                   <Skeleton className="h-4 w-1/2" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-2/3" />
                </CardContent>
                 <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
                  <Skeleton className="h-9 w-24" />
                  <Skeleton className="h-9 w-9 rounded-full" />
                </CardFooter>
              </Card>
            ))}
          </div>
        </>
      )}

<<<<<<< HEAD
      {!isLoading && (
        <>
           {(!user || user.isAnonymous) && (
             <Card className="text-center py-10 my-6 bg-primary/10 border-primary">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">¡Estás viendo una vista previa!</CardTitle>
                    <CardDescription className="max-w-xl mx-auto text-base">Regístrate para acceder a la biblioteca completa con cientos de ejercicios, guardar tus favoritos y mucho más.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild size="lg">
                        <Link href="/acceso">
                            <User className="mr-2 h-5 w-5" />
                            Regístrate Gratis
                        </Link>
                    </Button>
                </CardContent>
            </Card>
          )}
           {user && !user.isAnonymous && isGuestUser && (
              <Card className="text-center py-10 my-6 bg-primary/10 border-primary">
                 <CardHeader>
                    <CardTitle className="text-2xl font-bold text-primary">Desbloquea todo el potencial</CardTitle>
                    <CardDescription className="max-w-xl mx-auto text-base">Suscríbete a un plan para acceder a la biblioteca completa, guardar favoritos y desbloquear todas las funcionalidades.</CardDescription>
                </CardHeader>
                 <CardContent>
                    <Button asChild size="lg">
                    <Link href="/suscripcion">
                        <Star className="mr-2 h-5 w-5" />
                        Ver Planes de Suscripción
                    </Link>
                    </Button>
                </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {paginatedExercises.map((exercise) => (
              <Card key={exercise.id} className="overflow-hidden group flex flex-col border rounded-lg shadow-sm hover:shadow-lg transition-all duration-300 bg-background">
                <div className="relative aspect-video w-full bg-muted">
                    {exercise.image ? (
                        <Image
                            src={exercise.image}
                            alt={`Imagen de ${exercise.name}`}
                            fill
                            className="object-contain"
                            data-ai-hint={exercise.aiHint}
                        />
                    ) : (
                        <FutsalCourt className="absolute inset-0 w-full h-full object-cover p-2" />
                    )}
                </div>
                <CardContent className="p-4 flex-grow flex flex-col">
                  <h3 className="font-bold text-lg leading-tight truncate font-headline text-foreground mb-2">{exercise.name}</h3>
                  <div className="space-y-1.5 text-xs text-muted-foreground flex-grow">
                      <p><span className='font-semibold text-foreground'>Fase:</span> {exercise.fase}</p>
                      <p className="capitalize"><span className='font-semibold text-foreground'>Edad:</span> {Array.isArray(exercise.edad) ? exercise.edad.join(', ') : ''}</p>
                      <p><span className='font-semibold text-foreground'>Duración:</span> {exercise.duration} min</p>
                      <p className="line-clamp-2 pt-2"><span className='font-semibold text-foreground'>Descripción:</span> {exercise.description}</p>
                  </div>
                </CardContent>
                <CardFooter className="p-4 bg-muted/50 flex justify-between items-center">
                    <Button asChild variant="outline" size="sm">
                        <Link href={`/ejercicios/${exercise.id}`}>
                        <Eye className="mr-2 h-4 w-4" />
                        Ver Ficha
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleFavoriteToggle(exercise)} disabled={!user}>
                        <Heart className={cn(
                            "h-5 w-5 transition-colors",
                            favoriteIds.has(exercise.id) 
                            ? "text-red-500 fill-red-500" 
                            : "text-muted-foreground group-hover:text-red-500"
                        )} />
                    </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
           {filteredExercises.length === 0 && paginatedExercises.length === 0 && (
            <div className="text-center py-16 text-muted-foreground col-span-full">
                <p>No se encontraron ejercicios con los filtros seleccionados.</p>
            </div>
          )}
           {totalPages > 1 && user && !user.isAnonymous && !isGuestUser && (
                <div className="flex justify-center items-center gap-4 mt-8">
                    <Button 
                        onClick={() => handlePageChange(currentPage - 1)} 
                        disabled={currentPage === 1}
                        variant="outline"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4"/>
                        Anterior
                    </Button>
                    <span className="text-sm text-muted-foreground">
                        Página {currentPage} de {totalPages}
                    </span>
                    <Button 
                        onClick={() => handlePageChange(currentPage + 1)} 
                        disabled={currentPage === totalPages}
                        variant="outline"
                    >
                        Siguiente
                        <ArrowRight className="ml-2 h-4 w-4"/>
                    </Button>
                </div>
           )}
        </>
=======
      {loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: ITEMS_PER_PAGE }).map((_, index) => (
            <Card key={index} className="flex flex-col">
              <Skeleton className="h-48 w-full" />
              <CardContent className="p-6 flex-grow flex flex-col">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2 mb-4" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-full" />
                <div className="mt-auto pt-4 flex justify-between items-center">
                  <Skeleton className="h-9 w-28" />
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {paginatedExercises.map((exercise) => (
            <Card key={exercise.id} className="overflow-hidden hover:shadow-xl transition-shadow duration-300 flex flex-col">
              <CardHeader className="p-0">
                <div className="relative h-48 w-full">
                  <Image
                    src={exercise['Imagen']}
                    alt={exercise['Ejercicio']}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-contain"
                    data-ai-hint={exercise.imageHint}
                  />
                </div>
              </CardHeader>
              <CardContent className="p-6 flex-grow flex flex-col">
                <CardTitle className="font-headline text-xl truncate mb-2" title={exercise['Ejercicio']}>{exercise['Ejercicio']}</CardTitle>
                
                <div className="space-y-1 text-sm text-muted-foreground mb-4">
                  <p><span className="font-semibold text-foreground">Fase:</span> {exercise['Fase']}</p>
                  <p><span className="font-semibold text-foreground">Edad:</span> {Array.isArray(exercise['Edad']) ? exercise['Edad'].join(', ') : ''}</p>
                  <p><span className="font-semibold text-foreground">Duración:</span> {exercise['Duración (min)']} min</p>
                   <p className="line-clamp-2"><span className="font-semibold text-foreground">Descripción:</span> {exercise['Descripción de la tarea']}</p>
                </div>

                <div className="mt-auto pt-4 flex justify-between items-center">
                   <Button variant="outline" size="sm" asChild>
                      <Link href={`/ejercicios/${exercise.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          Ver Ficha
                      </Link>
                   </Button>
                   <Button variant="ghost" size="icon" onClick={() => handleFavoriteToggle(exercise.id)}>
                      <Heart className={cn("w-6 h-6 text-destructive/50 transition-colors", {
                          "fill-destructive text-destructive": favoriteIds.has(exercise.id)
                      })} />
                   </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {error && <p className="text-center text-destructive py-8">Error: {error.message}</p>}

      {!loading && filteredExercises.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
            <p>No se encontraron ejercicios con los filtros seleccionados.</p>
        </div>
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
      )}
      
      {totalPages > 1 && (
        <div className="flex items-center justify-center mt-8 space-x-2">
            <Button variant="outline" size="icon" onClick={handlePrevPage} disabled={currentPage === 1}>
                <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
                Página {currentPage} de {totalPages}
            </span>
            <Button variant="outline" size="icon" onClick={handleNextPage} disabled={currentPage === totalPages}>
                <ChevronRight className="h-4 w-4" />
            </Button>
        </div>
      )}
    </div>
  );
}

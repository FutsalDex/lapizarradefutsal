'use client';

import React, { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, Timestamp, doc, addDoc, serverTimestamp, updateDoc, deleteDoc, orderBy } from 'firebase/firestore';
import { useCollection, useFirestore, useUser, useDoc } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ArrowLeft, PlusCircle, Trophy, ClipboardList, BarChart2, Eye, Pencil, Trash2, Loader2, Clock } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';


interface Match {
    id: string;
    competition: string;
    createdAt: Timestamp;
    date: Timestamp | Date | string;
    isFinished: boolean;
    localScore: number;
    localTeam: string;
    matchType: string;
    matchday: string;
    teamId: string;
    userId: string;
    visitorScore: number;
    visitorTeam: string;
    convocados?: string[];
}

interface Team {
  id: string;
  name: string;
}

interface Player {
    id: string;
    name: string;
}


function MatchCard({ match, onEdit, onDelete, onConvocatoria }: { match: Match, onEdit: () => void, onDelete: () => void, onConvocatoria: () => void }) {
    const matchDate = new Date(match.date as any);

    return (
        <Card className="flex flex-col hover:shadow-md transition-shadow bg-card">
            <CardContent className="p-4 flex-grow flex flex-col justify-between">
                <div className="text-center">
                    <p className="font-semibold text-lg">{match.localTeam} vs {match.visitorTeam}</p>
                    <p className="text-sm text-muted-foreground">
                        {matchDate.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                    </p>
                </div>
                 <div className="text-5xl font-bold tracking-tight text-center my-4 text-primary">
                    <span>{match.localScore}</span>
                    <span className="mx-2 text-3xl text-muted-foreground">-</span>
                    <span>{match.visitorScore}</span>
                </div>
                <div className='text-center'>
                    <Badge variant="secondary">{match.matchType}</Badge>
                </div>
            </CardContent>
            <CardFooter className="p-2 bg-muted/50 border-t flex justify-around">
                <Button variant="ghost" size="sm" onClick={onConvocatoria}><ClipboardList className="mr-2 h-4 w-4"/>Convocar</Button>
                 <Button asChild variant="ghost" size="icon" disabled>
                    <Link href="#"><Clock className="h-4 w-4" /></Link>
                </Button>
                <Button asChild variant="ghost" size="icon" disabled>
                    <Link href="#"><BarChart2 className="h-4 w-4" /></Link>
                </Button>
                <Button variant="ghost" size="icon" onClick={onEdit}><Pencil className="h-4 w-4" /></Button>
                <Button variant="destructive" size="icon" onClick={onDelete}><Trash2 className="h-4 w-4" /></Button>
            </CardFooter>
        </Card>
    );
}

const matchSchema = z.object({
  id: z.string().optional(),
  localTeam: z.string().min(1, "Equipo local requerido"),
  visitorTeam: z.string().min(1, "Equipo visitante requerido"),
  localScore: z.coerce.number().min(0, "Puntuación no válida").default(0),
  visitorScore: z.coerce.number().min(0, "Puntuación no válida").default(0),
  date: z.string().min(1, "Fecha requerida"),
  matchday: z.string().optional(),
  competition: z.string().optional(),
  matchType: z.string({ required_error: "Tipo de partido requerido"}),
  isFinished: z.boolean().default(true),
});

type MatchFormData = z.infer<typeof matchSchema>;

export default function TeamMatchesPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [filter, setFilter] = useState('Todos');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isConvocatoriaOpen, setIsConvocatoriaOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState<Match | null>(null);

  const form = useForm<MatchFormData>();
  const filterOptions = ["Todos", "Liga", "Copa", "Torneo", "Amistoso"];

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  
  const playersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return collection(firestore, `teams/${teamId}/players`);
  }, [firestore, teamId]);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersCollectionRef);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    let q = query(
      collection(firestore, 'matches'), 
      where('teamId', '==', teamId), 
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
    if (filter !== 'Todos') {
        q = query(q, where('matchType', '==', filter));
    }
    return q;
  }, [firestore, teamId, user, filter]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const isLoading = isLoadingTeam || isLoadingMatches;

  const handleOpenForm = (match?: Match) => {
    setSelectedMatch(match || null);
    if (match) {
        let formattedDate = '';
        if (match.date) {
            const dateObj = (match.date as Timestamp).toDate ? (match.date as Timestamp).toDate() : new Date(match.date as string);
            formattedDate = format(dateObj, "yyyy-MM-dd'T'HH:mm");
        }
        form.reset({
            ...match,
            date: formattedDate,
        });
    } else {
        form.reset({
            localTeam: team?.name || '',
            visitorTeam: '',
            localScore: 0,
            visitorScore: 0,
            date: '',
            matchday: '',
            competition: '',
            isFinished: true,
            matchType: undefined,
        });
    }
    setIsFormOpen(true);
  }
  
  const handleOpenConvocatoria = (match: Match) => {
      setSelectedMatch(match);
      setIsConvocatoriaOpen(true);
  }

  const handleFormSubmit = async (data: MatchFormData) => {
    if (!firestore || !user || !teamId) return;

    const matchData = {
        ...data,
        date: new Date(data.date),
        teamId,
        userId: user.uid,
    };

    try {
        if (selectedMatch?.id) { // Editing existing match
            const matchRef = doc(firestore, 'matches', selectedMatch.id);
            await updateDoc(matchRef, matchData);
            toast({ title: 'Partido actualizado', description: 'Los cambios se han guardado correctamente.' });
        } else { // Creating new match
            await addDoc(collection(firestore, 'matches'), { ...matchData, createdAt: serverTimestamp() });
            toast({ title: 'Partido añadido', description: 'El nuevo partido se ha registrado correctamente.' });
        }
        setIsFormOpen(false);
        setSelectedMatch(null);
    } catch (error) {
        console.error(error);
        const permissionError = new FirestorePermissionError({
            path: selectedMatch?.id ? `matches/${selectedMatch.id}`: 'matches',
            operation: selectedMatch?.id ? 'update' : 'create',
            requestResourceData: matchData,
        });
        errorEmitter.emit('permission-error', permissionError);
    }
  }

  const handleDelete = async (matchId: string) => {
      if (!firestore) return;
      const matchRef = doc(firestore, 'matches', matchId);
      try {
          await deleteDoc(matchRef);
          toast({ title: 'Partido eliminado', variant: 'destructive'});
      } catch (error) {
           const permissionError = new FirestorePermissionError({
                path: matchRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
      }
  }
  
  const handleConvocatoriaSave = async (convocados: string[]) => {
      if (!firestore || !selectedMatch) return;
      
      const matchRef = doc(firestore, 'matches', selectedMatch.id);
      try {
        await updateDoc(matchRef, { convocados });
        toast({ title: 'Convocatoria guardada' });
        setIsConvocatoriaOpen(false);
      } catch(error) {
          const permissionError = new FirestorePermissionError({
                path: matchRef.path,
                operation: 'update',
                requestResourceData: { convocados },
            });
            errorEmitter.emit('permission-error', permissionError);
      }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8 flex-wrap gap-4">
        <h1 className="text-3xl font-bold font-headline text-primary">
            Partidos de {isLoadingTeam ? <Skeleton className="h-8 w-32 inline-block" /> : team?.name}
        </h1>
        <div className="flex gap-2">
            <Button asChild variant="outline">
                <Link href={`/partidos/gestion/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
             <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                <DialogTrigger asChild>
                    <Button onClick={() => handleOpenForm()}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Añadir Partido
                    </Button>
                </DialogTrigger>
                <DialogContent>
                     <DialogHeader>
                        <DialogTitle>{selectedMatch ? 'Editar' : 'Añadir'} Partido</DialogTitle>
                        <DialogDescription>
                            {selectedMatch ? 'Modifica los datos del partido.' : 'Registra un nuevo partido para tu equipo.'}
                        </DialogDescription>
                    </DialogHeader>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
                           <div className="grid grid-cols-2 gap-4">
                                <FormField control={form.control} name="localTeam" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipo Local</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                <FormField control={form.control} name="visitorTeam" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Equipo Visitante</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                           </div>
                           <div className="grid grid-cols-2 gap-4">
                               <FormField control={form.control} name="localScore" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goles Local</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                <FormField control={form.control} name="visitorScore" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Goles Visitante</FormLabel>
                                    <FormControl><Input type="number" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                           </div>
                           <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha y Hora</FormLabel>
                                <FormControl><Input type="datetime-local" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                            )}/>
                            <div className="grid grid-cols-2 gap-4">
                                 <FormField control={form.control} name="matchType" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl><SelectTrigger><SelectValue placeholder="Selecciona..." /></SelectTrigger></FormControl>
                                        <SelectContent>
                                            <SelectItem value="Liga">Liga</SelectItem>
                                            <SelectItem value="Copa">Copa</SelectItem>
                                            <SelectItem value="Torneo">Torneo</SelectItem>
                                            <SelectItem value="Amistoso">Amistoso</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                                <FormField control={form.control} name="competition" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Competición</FormLabel>
                                    <FormControl><Input {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}/>
                            </div>
                            <DialogFooter>
                                <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                                <Button type="submit" disabled={form.formState.isSubmitting}>
                                    {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Guardar Partido
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </DialogContent>
             </Dialog>
        </div>
      </div>
      
       <div className="mb-6 rounded-lg border p-2">
            <div className="flex items-center gap-2">
                {filterOptions.map((option) => (
                    <Button
                        key={option}
                        variant={filter === option ? 'default' : 'ghost'}
                        onClick={() => setFilter(option)}
                        className={cn(
                            "rounded-md px-3 py-1 text-sm font-medium",
                            filter === option ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
                        )}
                    >
                        {option}
                    </Button>
                ))}
            </div>
       </div>


      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
                <Card key={i}>
                    <CardContent className="p-4">
                        <div className="flex flex-col items-center gap-4">
                            <Skeleton className="h-6 w-3/4" />
                            <Skeleton className="h-12 w-1/2" />
                            <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                    </CardContent>
                    <CardFooter className="p-2 h-12 bg-muted/50 border-t"></CardFooter>
                </Card>
            ))}
        </div>
      ) : matches && matches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {matches.map(match => (
            <React.Fragment key={match.id}>
                <MatchCard 
                    match={match} 
                    onEdit={() => handleOpenForm(match)}
                    onDelete={() => {
                        const dialog = document.getElementById(`delete-dialog-trigger-${match.id}`);
                        dialog?.click();
                    }}
                    onConvocatoria={() => handleOpenConvocatoria(match)}
                />
                 <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <button id={`delete-dialog-trigger-${match.id}`} className='hidden' />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                        <AlertDialogTitle>¿Estás seguro de que quieres eliminar el partido?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el partido y todos sus datos.
                        </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => handleDelete(match.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </React.Fragment>
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold mb-2">No hay partidos para &quot;{filter}&quot;</h2>
          <p>No se ha añadido ningún partido que coincida con este filtro.</p>
        </div>
      )}

      <Dialog open={isConvocatoriaOpen} onOpenChange={setIsConvocatoriaOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Convocar Jugadores</DialogTitle>
                <DialogDescription>
                    Selecciona los jugadores convocados para el partido contra {selectedMatch?.visitorTeam}.
                </DialogDescription>
            </DialogHeader>
            {isLoadingPlayers ? <p>Cargando jugadores...</p> : (
                <ConvocatoriaForm 
                    players={players || []} 
                    convocadosIniciales={selectedMatch?.convocados || []}
                    onSave={handleConvocatoriaSave}
                />
            )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ConvocatoriaForm({ players, convocadosIniciales, onSave }: { players: Player[], convocadosIniciales: string[], onSave: (convocados: string[]) => void }) {
    const [convocados, setConvocados] = useState(convocadosIniciales);

    const handleToggle = (playerId: string) => {
        setConvocados(prev => 
            prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
        );
    }
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(convocados);
    }

    return (
        <form onSubmit={handleSubmit}>
            <div className="space-y-2 my-4 max-h-64 overflow-y-auto">
                {players.map(player => (
                    <div key={player.id} className="flex items-center space-x-2">
                        <Checkbox
                            id={`player-${player.id}`}
                            checked={convocados.includes(player.id)}
                            onCheckedChange={() => handleToggle(player.id)}
                        />
                        <label
                            htmlFor={`player-${player.id}`}
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                            {player.name}
                        </label>
                    </div>
                ))}
            </div>
            <DialogFooter>
                 <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                <Button type="submit">Guardar Convocatoria</Button>
            </DialogFooter>
        </form>
    );
}

    
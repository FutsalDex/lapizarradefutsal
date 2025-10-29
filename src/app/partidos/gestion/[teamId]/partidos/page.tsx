'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

import { useDoc, useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc, collection, addDoc, serverTimestamp, where, query, deleteDoc, updateDoc, orderBy } from 'firebase/firestore';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


import { ArrowLeft, Loader2, Users, Check, X, Settings, Trash2, Pencil, Trophy, PlusCircle, ClipboardList, BarChart2, Eye } from 'lucide-react';
import Link from 'next/link';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { cn } from '@/lib/utils';


// Zod Schema for Match Form
const matchSchema = z.object({
  id: z.string().optional(),
  isFinished: z.boolean().default(true),
  matchType: z.string({ required_error: 'Debes seleccionar un tipo de partido.' }),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), { message: "Fecha inválida" }),
  localTeam: z.string().min(1, "El nombre del equipo local es obligatorio."),
  visitorTeam: z.string().min(1, "El nombre del equipo visitante es obligatorio."),
  localScore: z.coerce.number().min(0, "El resultado debe ser positivo."),
  visitorScore: z.coerce.number().min(0, "El resultado debe ser positivo."),
  competition: z.string().optional(),
  matchday: z.string().optional(),
  convocados: z.array(z.string()).optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

interface Team {
  id: string;
  name: string;
}

interface Player {
    id: string;
    name: string;
}

interface Match extends MatchFormData {
  id: string;
  userId: string;
  teamId: string;
}


// MatchCard Component
function MatchCard({ match, onEdit, onDelete, onConmoncar }: { match: Match; onEdit: (match: Match) => void; onDelete: (matchId: string) => void; onConmoncar: (match:Match) => void; }) {
  const matchDate = new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const isDraw = match.localScore === match.visitorScore;
  const localWon = match.localScore > match.visitorScore;

  return (
    <Card className="flex flex-col text-center border">
        <CardContent className="p-6 flex-grow flex flex-col justify-center items-center">
            <h3 className="font-semibold text-lg">{match.localTeam} vs {match.visitorTeam}</h3>
            <p className="text-sm text-muted-foreground mb-4">{matchDate}</p>
            <p className="text-4xl font-bold text-primary my-2">{match.localScore} - {match.visitorScore}</p>
            <Badge variant="secondary">{match.matchType}</Badge>
        </CardContent>
        <CardFooter className="p-2 flex justify-around items-center bg-muted/50">
            <Button variant="ghost" size="sm" onClick={() => onConmoncar(match)}>
                Convocar
            </Button>
            <Separator orientation='vertical' className='h-6'/>
             <Button variant="ghost" size="icon"><BarChart2 className="h-4 w-4" /></Button>
            <Separator orientation='vertical' className='h-6'/>
            <Button variant="ghost" size="icon"><Eye className="h-4 w-4" /></Button>
             <Separator orientation='vertical' className='h-6'/>
            <Button variant="ghost" size="icon" onClick={() => onEdit(match)}><Pencil className="h-4 w-4" /></Button>
             <Separator orientation='vertical' className='h-6'/>
            <AlertDialog>
                <AlertDialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                    <AlertDialogHeader>
                    <AlertDialogTitle>¿Estás seguro de que quieres eliminar el partido?</AlertDialogTitle>
                    <AlertDialogDescription>
                        Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del partido.
                    </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction onClick={() => onDelete(match.id)}>Eliminar</AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </CardFooter>
    </Card>
  );
}


// Main Page Component
export default function TeamMatchesPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [filter, setFilter] = useState<'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso'>('Todos');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [isConvocatoriaDialogOpen, setIsConvocatoriaDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // --- Data Fetching ---
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
    return query(
      collection(firestore, 'matches'),
      where('teamId', '==', teamId),
      where('userId', '==', user.uid),
      orderBy('date', 'desc')
    );
  }, [firestore, teamId, user]);
  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (filter === 'Todos') return matches;
    return matches.filter(match => match.matchType === filter);
  }, [matches, filter]);


  // --- Form Handling ---
  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
  });

  useEffect(() => {
    if (editingMatch) {
      form.reset({
        ...editingMatch,
        date: new Date(editingMatch.date).toISOString().split('T')[0],
      });
    } else {
      form.reset({
        id: undefined,
        isFinished: true,
        matchType: 'Liga',
        date: new Date().toISOString().split('T')[0],
        localTeam: team?.name || '',
        visitorTeam: '',
        localScore: 0,
        visitorScore: 0,
        competition: '',
        matchday: '',
        convocados: [],
      });
    }
  }, [editingMatch, isMatchDialogOpen, team, form]);


  // --- CRUD Operations ---
  const handleMatchSubmit = async (data: MatchFormData) => {
    if (!user || !teamId) return;
    setIsSubmitting(true);

    const matchData = {
      ...data,
      teamId: teamId,
      userId: user.uid,
    };

    try {
      if (editingMatch) {
        // Update
        const matchRef = doc(firestore, 'matches', editingMatch.id);
        await updateDoc(matchRef, matchData);
        toast({ title: 'Partido actualizado', description: 'Los datos del partido se han guardado.' });
      } else {
        // Create
        await addDoc(collection(firestore, 'matches'), { ...matchData, createdAt: serverTimestamp() });
        toast({ title: 'Partido añadido', description: 'El nuevo partido se ha creado correctamente.' });
      }
      setIsMatchDialogOpen(false);
      setEditingMatch(null);
    } catch (error: any) {
      errorEmitter.emit('permission-error', new FirestorePermissionError({
        path: editingMatch ? `matches/${editingMatch.id}` : 'matches',
        operation: editingMatch ? 'update' : 'create',
        requestResourceData: matchData,
      }));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteMatch = async (matchId: string) => {
    const matchRef = doc(firestore, 'matches', matchId);
    try {
      await deleteDoc(matchRef);
      toast({ title: 'Partido eliminado', description: 'El partido ha sido eliminado.', variant: 'destructive' });
    } catch (error) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({ path: matchRef.path, operation: 'delete'}));
    }
  };
  
  const handleEditClick = (match: Match) => {
      setEditingMatch(match);
      setIsMatchDialogOpen(true);
  };

  const handleAddNewClick = () => {
      setEditingMatch(null);
      setIsMatchDialogOpen(true);
  }
  
  const handleConvocatoriaClick = (match: Match) => {
    setEditingMatch(match);
    setIsConvocatoriaDialogOpen(true);
  };

  const handleConvocatoriaSubmit = async () => {
    if (!editingMatch) return;
    setIsSubmitting(true);
    const matchRef = doc(firestore, 'matches', editingMatch.id);
    try {
      const convocadosIds = players?.filter(p => form.getValues(`convocados` as any)?.includes(p.id)).map(p => p.id) || [];
      await updateDoc(matchRef, { convocados: convocadosIds });
      toast({ title: 'Convocatoria guardada', description: 'La lista de jugadores convocados se ha actualizado.' });
      setIsConvocatoriaDialogOpen(false);
    } catch (error) {
       errorEmitter.emit('permission-error', new FirestorePermissionError({ path: matchRef.path, operation: 'update', requestResourceData: {convocados: '...'} }));
    } finally {
        setIsSubmitting(false);
        setEditingMatch(null);
    }
  }
  
  const isLoading = isLoadingTeam || isLoadingMatches || isLoadingPlayers;
  const filterOptions: Array<'Todos' | 'Liga' | 'Copa' | 'Torneo' | 'Amistoso'> = ['Todos', 'Liga', 'Copa', 'Torneo', 'Amistoso'];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-8">
        <div className="flex items-center gap-4">
          <Trophy className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold font-headline text-primary">Partidos de {isLoadingTeam ? <Skeleton className="h-8 w-32 inline-block" /> : team?.name}</h1>
            <p className="text-muted-foreground">Gestiona los partidos, añade nuevos encuentros, edita los existentes o consulta sus estadísticas.</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <Button asChild variant="outline">
              <Link href={`/partidos/gestion/${teamId}`}>
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al Panel
              </Link>
            </Button>
            <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={handleAddNewClick}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Añadir Partido
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleMatchSubmit)}>
                    <DialogHeader>
                      <DialogTitle>{editingMatch ? 'Editar Partido' : 'Añadir Nuevo Partido'}</DialogTitle>
                      <DialogDescription>
                        Rellena los datos del encuentro. Haz clic en guardar cuando hayas terminado.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 grid grid-cols-2 gap-4">
                        <FormField control={form.control} name="matchType" render={({ field }) => (
                            <FormItem className="col-span-2">
                                <FormLabel>Tipo de Partido</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl><SelectTrigger><SelectValue placeholder="Selecciona un tipo" /></SelectTrigger></FormControl>
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
                        <FormField control={form.control} name="date" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Fecha</FormLabel>
                                <FormControl><Input type="date" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="isFinished" render={({ field }) => (
                            <FormItem className="flex items-end pb-2">
                                <div className="flex items-center gap-2">
                                    <FormControl>
                                        <Checkbox checked={field.value} onCheckedChange={field.onChange} id="isFinished" />
                                    </FormControl>
                                    <Label htmlFor="isFinished">Partido finalizado</Label>
                                </div>
                            </FormItem>
                         )}/>
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
                        <FormField control={form.control} name="competition" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Competición</FormLabel>
                                <FormControl><Input placeholder="(Opcional)" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                         <FormField control={form.control} name="matchday" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jornada</FormLabel>
                                <FormControl><Input placeholder="(Opcional)" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild><Button type="button" variant="outline">Cancelar</Button></DialogClose>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Guardar Partido
                      </Button>
                    </DialogFooter>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
        </div>
      </div>
      
      {/* Filters */}
       <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="mb-6">
          <TabsList>
            {filterOptions.map(option => (
              <TabsTrigger key={option} value={option}>{option}</TabsTrigger>
            ))}
          </TabsList>
       </Tabs>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-56" />)}
        </div>
      ) : filteredMatches && filteredMatches.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredMatches.map(match => (
            <MatchCard 
                key={match.id} 
                match={match} 
                onEdit={handleEditClick} 
                onDelete={handleDeleteMatch}
                onConmoncar={handleConvocatoriaClick}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
          <h2 className="text-xl font-semibold">No hay partidos</h2>
          <p>Aún no se han añadido partidos para este filtro. ¡Crea el primero!</p>
        </div>
      )}

      {/* Convocatoria Dialog */}
       <Dialog open={isConvocatoriaDialogOpen} onOpenChange={setIsConvocatoriaDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Convocar Jugadores</DialogTitle>
                <DialogDescription>
                    Selecciona los jugadores convocados para el partido contra {editingMatch?.visitorTeam}.
                </DialogDescription>
            </DialogHeader>
            <div className="py-4 space-y-2">
                 {isLoadingPlayers ? <p>Cargando jugadores...</p> : 
                  players && players.length > 0 ? (
                  <FormField
                    control={form.control}
                    name="convocados"
                    render={() => (
                      <FormItem>
                        {players.map((player) => (
                          <FormField
                            key={player.id}
                            control={form.control}
                            name="convocados"
                            render={({ field }) => {
                              return (
                                <FormItem key={player.id} className="flex flex-row items-start space-x-3 space-y-0">
                                  <FormControl>
                                    <Checkbox
                                      checked={field.value?.includes(player.id)}
                                      onCheckedChange={(checked) => {
                                        return checked
                                          ? field.onChange([...(field.value || []), player.id])
                                          : field.onChange(
                                              field.value?.filter(
                                                (value) => value !== player.id
                                              )
                                            )
                                      }}
                                    />
                                  </FormControl>
                                  <FormLabel className="font-normal">{player.name}</FormLabel>
                                </FormItem>
                              )
                            }}
                          />
                        ))}
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                ) : <p>No hay jugadores en la plantilla.</p>}
            </div>
            <DialogFooter>
                <DialogClose asChild><Button variant="outline">Cancelar</Button></DialogClose>
                <Button onClick={handleConvocatoriaSubmit} disabled={isSubmitting}>
                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Guardar Convocatoria
                </Button>
            </DialogFooter>
        </DialogContent>
    </Dialog>

    </div>
  );
}

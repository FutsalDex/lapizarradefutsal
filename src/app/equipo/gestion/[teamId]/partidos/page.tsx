
'use client';

import { useState, useMemo, useEffect, forwardRef } from 'react';
import { useParams } from 'next/navigation';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDoc, collection, query, where, orderBy, doc, serverTimestamp, updateDoc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  ArrowLeft,
  Trophy,
  PlusCircle,
  Users,
  Eye,
  Trash2,
  Edit,
  BarChart,
  CalendarIcon,
  Save,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// ====================
// TIPOS Y SCHEMAS
// ====================
interface Team {
  id: string;
  name: string;
  ownerId: string;
  competition?: string;
}

interface Player {
  id: string;
  number: string;
  name: string;
}

interface Match {
  id: string;
  visitorTeam: string;
  localTeam: string;
  date: any; // Firestore timestamp or string
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  localScore?: number;
  visitorScore?: number;
  isFinished: boolean;
  squad?: string[];
  competition?: string;
  matchday?: number;
}

const addMatchSchema = (teamName: string) => z.object({
    localTeam: z.string().min(2, 'El nombre del equipo local es requerido.'),
    visitorTeam: z.string().min(2, 'El nombre del equipo visitante es requerido.'),
    date: z.date({ required_error: 'La fecha del partido es requerida.' }),
    matchType: z.enum(['Amistoso', 'Liga', 'Copa', 'Torneo']),
    competition: z.string().optional(),
    matchday: z.string().optional(),
}).refine(data => data.localTeam === teamName || data.visitorTeam === teamName, {
    message: 'Tu equipo debe ser el local o el visitante.',
    path: ['localTeam'],
});
  

type AddMatchValues = z.infer<ReturnType<typeof addMatchSchema>>;

// ====================
// FORMULARIO AÑADIR/EDITAR PARTIDO
// ====================
function MatchFormDialog({
  team,
  isOpen,
  setIsOpen,
  matchToEdit,
  onFinished,
}: {
  team: Team;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  matchToEdit?: Match;
  onFinished: () => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const isEditMode = !!matchToEdit;

  const currentMatchSchema = useMemo(() => addMatchSchema(team.name), [team.name]);

  const form = useForm<AddMatchValues>({
    resolver: zodResolver(currentMatchSchema),
    defaultValues: {
      localTeam: '',
      visitorTeam: '',
      matchType: 'Amistoso',
      competition: team.competition || '',
      matchday: ''
    },
  });

  useEffect(() => {
    if (isEditMode && matchToEdit) {
      form.reset({
        localTeam: matchToEdit.localTeam,
        visitorTeam: matchToEdit.visitorTeam,
        date: matchToEdit.date.toDate ? matchToEdit.date.toDate() : new Date(matchToEdit.date),
        matchType: matchToEdit.matchType,
        competition: matchToEdit.competition || '',
        matchday: matchToEdit.matchday?.toString() || '',
      });
    } else {
      form.reset({
        localTeam: '',
        visitorTeam: '',
        date: undefined,
        matchType: 'Amistoso',
        competition: team.competition || '',
        matchday: ''
      });
    }
  }, [isOpen, isEditMode, matchToEdit, form, team.competition]);


  const matchType = form.watch('matchType');

  const onSubmit = async (values: AddMatchValues) => {
    if (!team || !user) return;
    setIsSubmitting(true);
    try {
      
      const matchData = {
        date: values.date,
        matchType: values.matchType,
        localTeam: values.localTeam,
        visitorTeam: values.visitorTeam,
        competition: values.competition,
        matchday: values.matchday ? Number(values.matchday) : undefined,
      };

      if (isEditMode && matchToEdit) {
        const matchRef = doc(firestore, 'matches', matchToEdit.id);
        await updateDoc(matchRef, matchData);
         toast({
            title: 'Partido actualizado',
            description: `El partido ${values.localTeam} vs ${values.visitorTeam} ha sido modificado.`,
        });
      } else {
        const matchesCollection = collection(firestore, `matches`);
        await addDoc(matchesCollection, {
            ...matchData,
            localScore: 0,
            visitorScore: 0,
            isFinished: false,
            teamId: team.id,
            userId: user.uid,
            createdAt: serverTimestamp(),
        });
        toast({
            title: 'Partido añadido',
            description: `El partido ${values.localTeam} vs ${values.visitorTeam} ha sido creado.`,
        });
      }

      form.reset();
      setIsOpen(false);
      onFinished();

    } catch (error) {
      console.error('Error saving match:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar el partido.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditMode ? 'Editar Partido' : 'Añadir Nuevo Partido'}</DialogTitle>
          <DialogDescription>
            {isEditMode ? 'Modifica los datos del partido.' : 'Introduce los datos básicos del partido. Podrás añadir las estadísticas más tarde.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
             <FormField
                control={form.control}
                name="localTeam"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Equipo Local</FormLabel>
                        <FormControl>
                            <div className="flex gap-2">
                                <Input placeholder="Nombre del equipo" {...field} />
                                <Button type="button" variant="outline" onClick={() => form.setValue('localTeam', team.name)}>Mi Equipo</Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
                />
            <FormField
                control={form.control}
                name="visitorTeam"
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>Equipo Visitante</FormLabel>
                        <FormControl>
                            <div className="flex gap-2">
                                <Input placeholder="Nombre del equipo" {...field} />
                                <Button type="button" variant="outline" onClick={() => form.setValue('visitorTeam', team.name)}>Mi Equipo</Button>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Fecha del partido</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={'outline'}
                          className={cn(
                            'w-full pl-3 text-left font-normal',
                            !field.value && 'text-muted-foreground'
                          )}
                        >
                          {field.value ? (
                            format(field.value, 'PPP', { locale: es })
                          ) : (
                            <span>Elige una fecha</span>
                          )}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date('1990-01-01')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
                control={form.control}
                name="matchType"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                    >
                        <FormControl>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un tipo" />
                        </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                        <SelectItem value="Liga">Liga</SelectItem>
                        <SelectItem value="Copa">Copa</SelectItem>
                        <SelectItem value="Torneo">Torneo</SelectItem>
                        <SelectItem value="Amistoso">Amistoso</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage />
                    </FormItem>
                )}
            />
            {matchType === 'Liga' && (
                <>
                    <FormField
                        control={form.control}
                        name="competition"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Competición</FormLabel>
                                <FormControl>
                                    <Input placeholder="Ej: 1ª División Nacional" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                    <FormField
                        control={form.control}
                        name="matchday"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Jornada</FormLabel>
                                <FormControl>
                                    <Input type="number" placeholder="Ej: 5" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </>
            )}
           
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                <Save className="mr-2 h-4 w-4" />
                {isSubmitting ? 'Guardando...' : (isEditMode ? 'Guardar Cambios' : 'Crear Partido')}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// ====================
// DIÁLOGO CONVOCATORIA
// ====================

const ConvocatoriaDialog = forwardRef<HTMLDivElement, { teamId: string, match: Match, children: React.ReactNode }>(({ teamId, match, children }, ref) => {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>(match.squad || []);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => {
        const numA = parseInt(a.number, 10);
        const numB = parseInt(b.number, 10);

        if (isNaN(numA)) return 1;
        if (isNaN(numB)) return -1;

        return numA - numB;
    });
  }, [players]);

  useEffect(() => {
    setSelectedPlayers(match.squad || []);
  }, [match.squad, isOpen]); // Also reset on open

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers(prev => 
      prev.includes(playerId) ? prev.filter(id => id !== playerId) : [...prev, playerId]
    );
  };
  
  const handleSelectAllToggle = () => {
    if (selectedPlayers.length === sortedPlayers.length) {
      setSelectedPlayers([]);
    } else {
      setSelectedPlayers(sortedPlayers.map(p => p.id));
    }
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    try {
      const matchRef = doc(firestore, 'matches', match.id);
      await updateDoc(matchRef, { squad: selectedPlayers });
      toast({ title: "Convocatoria guardada", description: `Se han guardado ${selectedPlayers.length} jugadores.` });
      setIsOpen(false);
    } catch (error) {
      console.error("Error saving squad:", error);
      toast({ variant: "destructive", title: "Error", description: "No se pudo guardar la convocatoria." });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-md" ref={ref}>
        <DialogHeader>
          <DialogTitle>Convocar Jugadores</DialogTitle>
          <DialogDescription>Selecciona los jugadores convocados para este partido.</DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <div className="flex items-center space-x-3 p-4 border-b">
              <Checkbox
                id="select-all"
                checked={sortedPlayers.length > 0 && selectedPlayers.length === sortedPlayers.length}
                onCheckedChange={handleSelectAllToggle}
                disabled={!sortedPlayers || sortedPlayers.length === 0}
              />
              <label htmlFor="select-all" className="text-sm font-medium leading-none">
                Seleccionar todos
              </label>
          </div>
          <ScrollArea className="h-60 w-full rounded-md">
            <div className="p-4">
              {isLoadingPlayers ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-8 w-full" />)}
                </div>
              ) : sortedPlayers.length > 0 ? (
                sortedPlayers.map(player => (
                  <div key={player.id} className="flex items-center space-x-3 py-2">
                    <Checkbox
                      id={`player-${player.id}`}
                      checked={selectedPlayers.includes(player.id)}
                      onCheckedChange={() => handlePlayerToggle(player.id)}
                    />
                    <label htmlFor={`player-${player.id}`} className="flex-1 text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      <span className="font-bold w-8 inline-block">{player.number}.</span>
                      {player.name}
                    </label>
                  </div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center">No hay jugadores en la plantilla. Añádelos desde la sección "Mi Plantilla".</p>
              )}
            </div>
          </ScrollArea>
        </div>
        <DialogFooter>
          <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
          <Button type="button" onClick={handleSave} disabled={isSubmitting}>
            <Save className="mr-2 h-4 w-4" />
            {isSubmitting ? "Guardando..." : "Guardar Convocatoria"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
});
ConvocatoriaDialog.displayName = 'ConvocatoriaDialog';


// ====================
// TARJETA DE PARTIDO
// ====================
function MatchCard({ match, team, isOwner, onEdit }: { match: Match; team: Team, isOwner: boolean, onEdit: () => void; }) {
  const { id, isFinished, localTeam, visitorTeam, localScore = 0, visitorScore = 0, date, squad } = match;

  const getResultClasses = () => {
    if (!isFinished) return 'text-muted-foreground';

    const isUserTeamLocal = localTeam === team.name;
    const userTeamScore = isUserTeamLocal ? localScore : visitorScore;
    const opponentScore = isUserTeamLocal ? visitorScore : localScore;

    if (userTeamScore === opponentScore) return 'text-muted-foreground';
    return userTeamScore > opponentScore ? 'text-primary' : 'text-destructive';
  };

  const matchTitle = `${match.localTeam} vs ${match.visitorTeam}`;
  const scoreDisplay = isFinished ? `${localScore} - ${visitorScore}` : 'vs';
  
  const formattedDate = () => {
    if (!date) return 'Fecha no disponible';
    const dateObj = date.toDate ? date.toDate() : new Date(date);
    if (isNaN(dateObj.getTime())) {
      return 'Fecha inválida';
    }
    return format(dateObj, 'dd/MM/yyyy', { locale: es });
  };

  const convocadosCount = squad?.length || 0;

  return (
    <Card className="flex flex-col">
      <CardHeader className="text-center">
        <CardTitle className="text-base font-semibold">{matchTitle}</CardTitle>
        <CardDescription>
          {formattedDate()}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center">
        <p className={`text-5xl font-bold ${getResultClasses()}`}>
          {scoreDisplay}
        </p>
        <Badge variant="secondary" className="mt-4">
          {match.matchType}
        </Badge>
      </CardContent>
      <CardFooter className="bg-muted/50 p-2 grid grid-cols-5 gap-1">
        {isOwner ? (
            <ConvocatoriaDialog teamId={team.id} match={match}>
                <Button variant="ghost" size="sm" className={cn("text-xs col-span-2", convocadosCount > 0 && "font-bold text-primary")}>
                    <Users className="mr-1 h-4 w-4" /> 
                    {convocadosCount > 0 ? `${convocadosCount} Jug.` : 'Convocar'}
                </Button>
            </ConvocatoriaDialog>
        ) : (
             <Button variant="ghost" size="sm" className="text-xs col-span-2" disabled>
                <Users className="mr-1 h-4 w-4" /> {convocadosCount > 0 ? `${convocadosCount} Jug.` : 'Convocar'}
             </Button>
        )}
        <Button asChild variant="ghost" size="sm" className="text-xs">
          <Link href={`/equipo/gestion/${team.id}/partidos/${id}`}>
            <BarChart className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="text-xs" disabled={!isFinished}>
          <Link href={`/equipo/gestion/${team.id}/partidos/${id}/resumen`}>
            <Eye className="h-4 w-4" />
          </Link>
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" onClick={onEdit} disabled={!isOwner}>
          <Edit className="h-4 w-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function MatchesPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();
  const [filter, setFilter] = useState('Todos');
  const [isFormOpen, setFormOpen] = useState(false);
  const [matchToEdit, setMatchToEdit] = useState<Match | undefined>(undefined);
  const [key, setKey] = useState(0);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(
        collection(firestore, `matches`), 
        where('teamId', '==', teamId), 
        orderBy('date', 'asc')
    );
  }, [firestore, teamId, key]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (filter === 'Todos') return matches;
    return matches.filter((match) => match.matchType === filter);
  }, [matches, filter]);

  const isOwner = user && team && user.uid === team.ownerId;
  const isLoading = isLoadingTeam || isLoadingMatches;
  
  const handleOpenForm = (match?: Match) => {
    setMatchToEdit(match);
    setFormOpen(true);
  };
  
  const handleFormFinished = () => {
    setKey(k => k + 1); // Force refetch of matches
  };


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64 mb-2" />
        <Skeleton className="h-5 w-80 mb-8" />
        <Skeleton className="h-12 w-full" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Equipo no encontrado</h2>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div>
          <Button asChild variant="outline" className="mb-4">
            <Link href={`/equipo/gestion/${teamId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel del Equipo
            </Link>
          </Button>
          <div className="flex items-center gap-3">
             <Trophy className="h-10 w-10 text-primary" />
             <div>
                <h1 className="text-4xl font-bold font-headline text-primary">
                    Partidos de {team.name}
                </h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Gestiona los partidos, añade nuevos encuentros, edita los existentes o consulta sus estadísticas.
                </p>
             </div>
          </div>
        </div>
        {isOwner && (
            <Button onClick={() => handleOpenForm()}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Partido
            </Button>
        )}
      </div>

       {team && <MatchFormDialog team={team} isOpen={isFormOpen} setIsOpen={setFormOpen} matchToEdit={matchToEdit} onFinished={handleFormFinished} />}

      <Tabs value={filter} onValueChange={setFilter} className="mb-6">
        <TabsList>
          <TabsTrigger value="Todos">Todos</TabsTrigger>
          <TabsTrigger value="Liga">Liga</TabsTrigger>
          <TabsTrigger value="Copa">Copa</TabsTrigger>
          <TabsTrigger value="Torneo">Torneo</TabsTrigger>
          <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMatches.length > 0 ? (
          filteredMatches.map((match) => (
            <MatchCard key={match.id} match={match} team={team} isOwner={!!isOwner} onEdit={() => handleOpenForm(match)}/>
          ))
        ) : (
          <div className="col-span-full text-center py-16 text-muted-foreground">
            <p>No hay partidos que coincidan con el filtro seleccionado.</p>
          </div>
        )}
      </div>
    </div>
  );
}


'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDoc, collection, query, where, orderBy, doc, serverTimestamp } from 'firebase/firestore';
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

interface Match {
  id: string;
  visitorTeam: string;
  localTeam: string;
  date: any; // Firestore timestamp or string
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  localScore?: number;
  visitorScore?: number;
  isFinished: boolean;
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
// FORMULARIO AÑADIR PARTIDO
// ====================
function AddMatchDialog({
  team,
  isOpen,
  setIsOpen,
}: {
  team: Team;
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const matchType = form.watch('matchType');

  useEffect(() => {
    if (matchType === 'Liga' && team.competition) {
        form.setValue('competition', team.competition);
    }
  }, [matchType, team.competition, form]);


  const onSubmit = async (values: AddMatchValues) => {
    if (!team || !user) return;
    setIsSubmitting(true);
    try {
      const matchesCollection = collection(firestore, `matches`);
      
      const matchData = {
        date: values.date,
        matchType: values.matchType,
        localTeam: values.localTeam,
        visitorTeam: values.visitorTeam,
        competition: values.competition,
        matchday: values.matchday ? Number(values.matchday) : undefined,
        localScore: 0,
        visitorScore: 0,
        isFinished: false,
        teamId: team.id,
        userId: user.uid,
        createdAt: serverTimestamp(),
      };

      await addDoc(matchesCollection, matchData);

      toast({
        title: 'Partido añadido',
        description: `El partido ${values.localTeam} vs ${values.visitorTeam} ha sido creado.`,
      });
      form.reset();
      setIsOpen(false);
    } catch (error) {
      console.error('Error adding match:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo añadir el partido.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Partido</DialogTitle>
          <DialogDescription>
            Introduce los datos básicos del partido. Podrás añadir las estadísticas más tarde.
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
                        <div className="flex gap-2">
                           <FormControl>
                                <Input placeholder="Nombre del equipo" {...field} />
                           </FormControl>
                           <Button type="button" variant="outline" onClick={() => form.setValue('localTeam', team.name)}>Mi Equipo</Button>
                        </div>
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
                        <div className="flex gap-2">
                           <FormControl>
                                <Input placeholder="Nombre del equipo" {...field} />
                           </FormControl>
                           <Button type="button" variant="outline" onClick={() => form.setValue('visitorTeam', team.name)}>Mi Equipo</Button>
                        </div>
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
            <div className="grid grid-cols-2 gap-4">
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
            </div>
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
           
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Guardando...' : 'Guardar Partido'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}


// ====================
// TARJETA DE PARTIDO
// ====================
function MatchCard({ match, teamName }: { match: Match; teamName: string }) {
  const { isFinished, localTeam, visitorTeam, localScore = 0, visitorScore = 0, date } = match;

  const getResultClasses = () => {
    if (!isFinished) return 'text-muted-foreground';

    const isUserTeamLocal = localTeam === teamName;
    const userTeamScore = isUserTeamLocal ? localScore : visitorScore;
    const opponentScore = isUserTeamLocal ? visitorScore : localScore;

    if (userTeamScore === opponentScore) return 'text-muted-foreground';
    return userTeamScore > opponentScore ? 'text-green-600' : 'text-red-600';
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
      <CardFooter className="bg-muted/50 p-2 flex justify-around">
        <Button variant="ghost" size="sm" className="text-xs" disabled>
          <Users className="mr-1 h-4 w-4" /> Convocar
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" disabled>
          <BarChart className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" disabled>
          <Eye className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs" disabled>
          <Edit className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive" disabled>
          <Trash2 className="h-4 w-4" />
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
  const [isAddMatchOpen, setAddMatchOpen] = useState(false);

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
  }, [firestore, teamId]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (filter === 'Todos') return matches;
    return matches.filter((match) => match.matchType === filter);
  }, [matches, filter]);

  const isOwner = user && team && user.uid === team.ownerId;
  const isLoading = isLoadingTeam || isLoadingMatches;

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
            <Button onClick={() => setAddMatchOpen(true)}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Añadir Partido
            </Button>
        )}
      </div>

       {team && <AddMatchDialog team={team} isOpen={isAddMatchOpen} setIsOpen={setAddMatchOpen} />}

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
            <MatchCard key={match.id} match={match} teamName={team.name} />
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


'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { addDoc, collection, query, where, orderBy } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc, serverTimestamp } from 'firebase/firestore';
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
}

interface Match {
  id: string;
  visitorTeam: string;
  localTeam: string;
  date: any; // Firestore timestamp
  matchType: 'Amistoso' | 'Liga' | 'Copa' | 'Torneo';
  localScore?: number;
  visitorScore?: number;
  isFinished: boolean;
}

const addMatchSchema = z.object({
    opponent: z.string().min(2, 'El nombre del rival es requerido.'),
    date: z.date({ required_error: 'La fecha del partido es requerida.' }),
    type: z.enum(['Amistoso', 'Liga', 'Copa', 'Torneo']),
    location: z.enum(['Casa', 'Fuera']),
});
  

type AddMatchValues = z.infer<typeof addMatchSchema>;

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

  const form = useForm<AddMatchValues>({
    resolver: zodResolver(addMatchSchema),
    defaultValues: {
      opponent: '',
      type: 'Liga',
      location: 'Casa',
    },
  });

  const onSubmit = async (values: AddMatchValues) => {
    if (!team || !user) return;
    setIsSubmitting(true);
    try {
      const matchesCollection = collection(firestore, `matches`);
      
      const matchData = {
        date: values.date,
        matchType: values.type,
        localTeam: values.location === 'Casa' ? team.name : values.opponent,
        visitorTeam: values.location === 'Casa' ? values.opponent : team.name,
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
        description: `El partido contra ${values.opponent} ha sido creado.`,
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
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Añadir Nuevo Partido</DialogTitle>
          <DialogDescription>
            Introduce los detalles para programar un nuevo encuentro.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="opponent"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rival</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del equipo rival" {...field} />
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
              name="type"
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
              name="location"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Localización</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Juegas en casa o fuera?" />
                      </Trigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="Casa">Casa</SelectItem>
                      <SelectItem value="Fuera">Fuera</SelectItem>
                    </SelectContent>
                  </Select>
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
  const { isFinished, localTeam, visitorTeam, localScore = 0, visitorScore = 0 } = match;

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

  return (
    <Card className="flex flex-col">
      <CardHeader className="text-center">
        <CardTitle className="text-base font-semibold">{matchTitle}</CardTitle>
        <CardDescription>
          {match.date?.toDate ? format(match.date.toDate(), 'dd/MM/yyyy', { locale: es }) : 'Fecha inválida'}
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
        orderBy('date', 'desc')
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

       <AddMatchDialog team={team} isOpen={isAddMatchOpen} setIsOpen={setAddMatchOpen} />

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

    
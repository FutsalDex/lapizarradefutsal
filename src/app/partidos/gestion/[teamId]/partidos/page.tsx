"use client";

import { useEffect, useState, useMemo } from "react";
import { useParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useUser, useFirestore, useCollection, useDoc } from "@/firebase";
import { useMemoFirebase } from "@/firebase/use-memo-firebase";
import {
  collection,
  query,
  where,
  getDocs,
  deleteDoc,
  doc,
  addDoc,
  updateDoc,
  serverTimestamp,
  orderBy,
} from "firebase/firestore";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Trophy,
  PlusCircle,
  Trash2,
  Eye,
  Edit,
  Users,
  Calendar as CalendarIcon,
  Loader2,
  ArrowLeft,
  ClipboardList,
  BarChart2,
  Pencil,
} from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { errorEmitter } from "@/firebase/error-emitter";
import { FirestorePermissionError } from "@/firebase/errors";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";


interface Team {
    id: string;
    name: string;
}

interface Match {
    id: string;
    teamId: string;
    userId: string;
    localTeam: string;
    visitorTeam: string;
    localScore?: number;
    visitorScore?: number;
    date: string; // Stored as ISO string
    matchType: "Liga" | "Copa" | "Torneo" | "Amistoso";
    competition?: string;
    matchday?: string;
    isFinished: boolean;
}

const matchSchema = z.object({
  localTeam: z.string().min(1, "El nombre del equipo local es obligatorio."),
  visitorTeam: z.string().min(1, "El nombre del equipo visitante es obligatorio."),
  localScore: z.coerce.number().optional(),
  visitorScore: z.coerce.number().optional(),
  date: z.date({ required_error: "La fecha del partido es obligatoria." }),
  matchType: z.enum(["Liga", "Copa", "Torneo", "Amistoso"]),
  competition: z.string().optional(),
  matchday: z.string().optional(),
});

type MatchFormData = z.infer<typeof matchSchema>;

function MatchCard({ match, onEdit, onDelete }: { match: Match; onEdit: (match: Match) => void; onDelete: (matchId: string) => void; }) {
  const resultado =
    typeof match.localScore !== 'number' || typeof match.visitorScore !== 'number'
      ? "vs"
      : `${match.localScore} - ${match.visitorScore}`;

  return (
    <Card className="flex flex-col border-gray-200 shadow-md">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold mb-1 text-gray-800">{match.localTeam} vs {match.visitorTeam}</CardTitle>
        <p className="text-sm text-gray-500">
          {format(new Date(match.date), "PPP", { locale: es })}
        </p>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col items-center justify-center">
        <p className="text-4xl font-bold text-primary">{resultado}</p>
        <Badge variant="secondary" className="mt-2">{match.matchType}</Badge>
      </CardContent>
      <CardFooter className="flex justify-center p-2 bg-muted/50">
        <Dialog>
            <DialogTrigger asChild>
                <Button size="sm" variant="ghost">
                    <Users className="mr-2 h-4 w-4" /> Convocar
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convocar Jugadores</DialogTitle>
                    <DialogDescription>
                        Selecciona los jugadores para este partido. (Función en desarrollo)
                    </DialogDescription>
                </DialogHeader>
            </DialogContent>
        </Dialog>
        
        <Separator orientation="vertical" className="h-6" />

        <Button size="sm" variant="ghost">
          <BarChart2 className="mr-2 h-4 w-4" /> Stats
        </Button>
        
        <Separator orientation="vertical" className="h-6" />
        
        <div className="flex">
          <Button onClick={() => onEdit(match)} size="icon" variant="ghost">
            <Pencil className="w-4 h-4" />
          </Button>
          <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button size="icon" variant="ghost" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará el partido permanentemente.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={() => onDelete(match.id)}>Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardFooter>
    </Card>
  );
}

const filterTypes = ["Todos", "Liga", "Copa", "Torneo", "Amistoso"];

export default function PartidosPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [activeFilter, setActiveFilter] = useState("Todos");

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, "teams", teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    return query(
      collection(firestore, "matches"),
      where("teamId", "==", teamId),
      where("userId", "==", user.uid),
      orderBy("date", "desc")
    );
  }, [firestore, teamId, user]);

  const { data: matches, isLoading: isLoadingMatches } = useCollection<Match>(matchesQuery);

  const form = useForm<MatchFormData>({
    resolver: zodResolver(matchSchema),
  });

  useEffect(() => {
    if (editingMatch) {
      form.reset({
        localTeam: editingMatch.localTeam,
        visitorTeam: editingMatch.visitorTeam,
        localScore: editingMatch.localScore,
        visitorScore: editingMatch.visitorScore,
        date: new Date(editingMatch.date),
        matchType: editingMatch.matchType,
        competition: editingMatch.competition,
        matchday: editingMatch.matchday,
      });
    } else {
      form.reset({
        localTeam: team?.name || "",
        visitorTeam: "",
        localScore: undefined,
        visitorScore: undefined,
        date: new Date(),
        matchType: "Liga",
        competition: "",
        matchday: "",
      });
    }
  }, [editingMatch, team, form]);
  

  const handleEditClick = (match: Match) => {
    setEditingMatch(match);
    setIsDialogOpen(true);
  };

  const handleAddNewClick = () => {
    setEditingMatch(null);
    setIsDialogOpen(true);
  };

  const handleDelete = async (matchId: string) => {
    if (!firestore) return;
    const matchRef = doc(firestore, "matches", matchId);
    
    deleteDoc(matchRef)
    .then(() => {
      toast({ title: "Partido eliminado", description: "El partido ha sido eliminado correctamente." });
    })
    .catch(error => {
      const permissionError = new FirestorePermissionError({
          path: matchRef.path,
          operation: 'delete'
      });
      errorEmitter.emit('permission-error', permissionError);
    });
  };

  const onSubmit = async (data: MatchFormData) => {
    if (!firestore || !user || !teamId) return;

    setIsSubmitting(true);

    const matchData = {
      ...data,
      teamId: teamId,
      userId: user.uid,
      date: data.date.toISOString(),
      isFinished: typeof data.localScore === 'number' && typeof data.visitorScore === 'number',
    };
    
    try {
      if (editingMatch) {
        const matchRef = doc(firestore, "matches", editingMatch.id);
        await updateDoc(matchRef, { ...matchData, updatedAt: serverTimestamp() });
        toast({ title: "Partido actualizado", description: "El partido se ha actualizado correctamente." });
      } else {
        await addDoc(collection(firestore, "matches"), { ...matchData, createdAt: serverTimestamp() });
        toast({ title: "Partido añadido", description: "El nuevo partido se ha añadido correctamente." });
      }
      setIsDialogOpen(false);
      setEditingMatch(null);
    } catch(error) {
       const permissionError = new FirestorePermissionError({
            path: editingMatch ? `matches/${editingMatch.id}` : 'matches',
            operation: editingMatch ? 'update' : 'create',
            requestResourceData: matchData,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
        setIsSubmitting(false);
    }
  };

  const filteredMatches = useMemo(() => {
    if (!matches) return [];
    if (activeFilter === "Todos") return matches;
    return matches.filter(m => m.matchType === activeFilter);
  }, [matches, activeFilter]);

  const isLoading = isLoadingTeam || isUserLoading || isLoadingMatches;

  return (
    <div className="container mx-auto px-4 py-8">
       <Button asChild variant="outline" className="mb-4">
         <Link href={`/partidos/gestion/${teamId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Panel del Equipo
         </Link>
      </Button>

      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
            <Trophy className="w-6 h-6 text-primary" />
            <h1 className="text-3xl font-bold text-primary">
                {isLoadingTeam ? <Skeleton className="h-9 w-48" /> : `Partidos de ${team?.name}`}
            </h1>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
           <Button onClick={handleAddNewClick}>
             <PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido
           </Button>
          <DialogContent className="sm:max-w-[625px]">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)}>
                <DialogHeader>
                  <DialogTitle>{editingMatch ? 'Editar Partido' : 'Añadir Nuevo Partido'}</DialogTitle>
                  <DialogDescription>
                    Rellena los detalles del encuentro. Haz clic en guardar cuando hayas terminado.
                  </DialogDescription>
                </DialogHeader>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6">
                   <div className="space-y-4">
                      <FormField control={form.control} name="localTeam" render={({ field }) => (
                          <FormItem><FormLabel>Equipo Local</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="visitorTeam" render={({ field }) => (
                          <FormItem><FormLabel>Equipo Visitante</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                       <FormField control={form.control} name="matchType" render={({ field }) => (
                          <FormItem><FormLabel>Tipo de Partido</FormLabel><FormControl>
                              <select {...field} className="w-full p-2 border rounded-md h-10 bg-background">
                                <option value="Liga">Liga</option>
                                <option value="Copa">Copa</option>
                                <option value="Torneo">Torneo</option>
                                <option value="Amistoso">Amistoso</option>
                              </select>
                          </FormControl><FormMessage /></FormItem>
                        )}/>
                   </div>
                   <div className="space-y-4">
                      <FormField control={form.control} name="localScore" render={({ field }) => (
                          <FormItem><FormLabel>Goles Local</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                      <FormField control={form.control} name="visitorScore" render={({ field }) => (
                          <FormItem><FormLabel>Goles Visitante</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                      )}/>
                       <FormField control={form.control} name="date" render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Fecha del partido</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button variant={"outline"} className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                  {field.value ? format(field.value, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}/>
                   </div>
                </div>

                <DialogFooter>
                  <DialogClose asChild><Button type="button" variant="secondary">Cancelar</Button></DialogClose>
                  <Button type="submit" disabled={isSubmitting}>
                    {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Guardar Partido'}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex flex-wrap items-center gap-2 mb-8 p-2 rounded-lg border bg-card">
        {filterTypes.map((type) => (
          <Button
            key={type}
            onClick={() => setActiveFilter(type)}
            variant={activeFilter === type ? "default" : "ghost"}
          >
            {type}
          </Button>
        ))}
      </div>

      {isLoading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-64" />)}
          </div>
      ) : filteredMatches && filteredMatches.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filteredMatches.map(match => (
              <MatchCard key={match.id} match={match} onEdit={handleEditClick} onDelete={handleDelete} />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 border-2 border-dashed rounded-lg">
            <p className="text-muted-foreground">No hay partidos para el filtro '{activeFilter}'.</p>
          </div>
        )}
    </div>
  );
}

    
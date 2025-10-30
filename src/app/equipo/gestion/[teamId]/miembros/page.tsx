
'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, writeBatch } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, PlusCircle, Trash2, Save } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// ====================
// TIPOS Y SCHEMAS
// ====================

const playerSchema = z.object({
  id: z.string().optional(),
  number: z.string().min(1, 'Requerido'),
  name: z.string().min(3, 'Mín. 3 caracteres'),
  position: z.enum(['Portero', 'Cierre', 'Ala', 'Pívot', 'Ala-Pívot'], {
    required_error: 'Selecciona una posición',
  }),
});

const teamRosterSchema = z.object({
  players: z.array(playerSchema).max(20, 'Máximo 20 jugadores.'),
});

type TeamRosterValues = z.infer<typeof teamRosterSchema>;

interface Player {
  id: string;
  number: string;
  name: string;
  position: 'Portero' | 'Cierre' | 'Ala' | 'Pívot' | 'Ala-Pívot';
}

interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
}

interface UserProfile {
  displayName?: string;
}

// ====================
// COMPONENTES
// ====================

function InfoCard({ team, owner, isLoadingOwner }: { team: Team, owner?: UserProfile | null, isLoadingOwner: boolean }) {
    const InfoField = ({ label, value }: { label: string, value: string }) => (
        <div>
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <div className="mt-1 flex h-10 w-full items-center rounded-md border border-input bg-muted/50 px-3 py-2 text-sm">
                {value || '-'}
            </div>
        </div>
    );
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Equipo</CardTitle>
                <CardDescription>Datos generales del equipo y cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField label="Club" value={team.club || ''} />
                    <InfoField label="Equipo" value={team.name} />
                    <InfoField label="Competición" value={team.competition || ''} />
                </div>
                 <div>
                    <p className="text-sm font-medium text-muted-foreground">Cuerpo Técnico</p>
                    <div className="border rounded-md p-3 mt-1 flex items-center bg-muted/50">
                        <div className="w-5 h-5 border-2 border-muted-foreground/50 rounded-full mr-3"></div>
                       {isLoadingOwner ? (
                         <span className='text-sm'>Cargando entrenador...</span>
                       ) : (
                         <span className='text-sm font-medium'>{owner?.displayName || 'Nombre no disponible'}</span>
                       )}
                       <span className='text-xs text-muted-foreground ml-2'>- Entrenador</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RosterForm({ team, players, isLoadingPlayers }: { team: Team, players: Player[] | null, isLoadingPlayers: boolean }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [removedPlayerIds, setRemovedPlayerIds] = useState<string[]>([]);


  const form = useForm<TeamRosterValues>({
    resolver: zodResolver(teamRosterSchema),
    defaultValues: {
      players: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  });

   useEffect(() => {
    if (players) {
      form.reset({ players: players });
    }
  }, [players, form]);

  const onSubmit = async (values: TeamRosterValues) => {
    setIsSubmitting(true);
    if (!firestore) {
        toast({ variant: 'destructive', title: 'Error', description: 'La base de datos no está disponible.' });
        setIsSubmitting(false);
        return;
    }

    const batch = writeBatch(firestore);
    const teamPlayersRef = collection(firestore, `teams/${team.id}/players`);

    // Delete players that were removed from the UI
    removedPlayerIds.forEach(playerId => {
        if(playerId) { // Only try to delete if it was a saved player
            batch.delete(doc(teamPlayersRef, playerId));
        }
    });

    // Update existing or add new players
    values.players.forEach(player => {
        const playerRef = player.id ? doc(teamPlayersRef, player.id) : doc(teamPlayersRef);
        batch.set(playerRef, {
            name: player.name,
            number: player.number,
            position: player.position,
            // default values for stats
            active: true,
            assists: 0,
            faltas: 0,
            gRec: 0,
            goals: 0,
            minutosJugados: 0,
            pj: 0,
            paradas: 0,
            perdidas: 0,
            recuperaciones: 0,
        }, { merge: true });
    });

    try {
        await batch.commit();
        toast({
            title: 'Plantilla actualizada',
            description: 'Los cambios en tu plantilla se han guardado correctamente.',
        });
        setRemovedPlayerIds([]); // Clear removal list after successful commit
    } catch(e) {
        console.error("Error updating roster:", e);
        toast({
            variant: 'destructive',
            title: 'Error al guardar',
            description: 'No se pudieron guardar los cambios en la plantilla.',
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleRemovePlayer = (index: number) => {
    const player = fields[index];
    if (player.id) { // If player exists in DB, add its ID to the removal queue
        setRemovedPlayerIds(prev => [...prev, player.id!]);
    }
    remove(index);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plantilla del Equipo</CardTitle>
        <CardDescription>
          Introduce los datos de tus jugadores. Máximo 20. Todos los jugadores estarán disponibles para la convocatoria.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="w-full overflow-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Dorsal</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[200px]">Posición</TableHead>
                    <TableHead className="w-[80px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPlayers ? (
                    [...Array(3)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-10 w-full" /></TableCell>
                        </TableRow>
                    ))
                  ) : fields.length > 0 ? (
                    fields.map((field, index) => (
                      <TableRow key={field.id}>
                        <TableCell>
                          <FormField
                            control={form.control}
                            name={`players.${index}.number`}
                            render={({ field }) => (
                                <Input {...field} placeholder="#" className="text-center"/>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                           <FormField
                            control={form.control}
                            name={`players.${index}.name`}
                            render={({ field }) => (
                                <Input {...field} placeholder="Nombre del jugador"/>
                            )}
                          />
                        </TableCell>
                        <TableCell>
                           <FormField
                            control={form.control}
                            name={`players.${index}.position`}
                            render={({ field }) => (
                               <Select onValueChange={field.onChange} defaultValue={field.value}>
                                 <FormControl>
                                   <SelectTrigger>
                                     <SelectValue placeholder="Selecciona..." />
                                   </SelectTrigger>
                                 </FormControl>
                                 <SelectContent>
                                    <SelectItem value="Portero">Portero</SelectItem>
                                    <SelectItem value="Cierre">Cierre</SelectItem>
                                    <SelectItem value="Ala">Ala</SelectItem>
                                    <SelectItem value="Pívot">Pívot</SelectItem>
                                    <SelectItem value="Ala-Pívot">Ala-Pívot</SelectItem>
                                 </SelectContent>
                               </Select>
                            )}
                          />
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="icon" onClick={() => handleRemovePlayer(index)} className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground h-24">
                            No hay jugadores en tu plantilla. ¡Añade el primero!
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-start">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => append({ name: '', number: '', position: 'Ala' })}
                    disabled={fields.length >= 20 || isSubmitting}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Jugador
                </Button>
                <div>
                  {form.formState.errors.players && (
                      <p className="text-sm font-medium text-destructive text-right mb-2">
                          {form.formState.errors.players.message || form.formState.errors.players.root?.message}
                      </p>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                      <Save className="mr-2 h-4 w-4" />
                      {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
                  </Button>
                </div>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function MembersPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const playersRef = useMemoFirebase(() => {
    if(!firestore || !teamId) return null;
    return collection(firestore, `teams/${teamId}/players`);
  }, [firestore, teamId]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);

  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !team?.ownerId) return null;
    return doc(firestore, 'users', team.ownerId);
  }, [firestore, team?.ownerId]);

  const { data: owner, isLoading: isLoadingOwner } = useDoc<UserProfile>(ownerRef);

  const isOwner = user && team && user.uid === team.ownerId;
  const isLoading = isLoadingTeam;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Equipo no encontrado</h2>
        <Button asChild variant="outline">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis equipos
          </Link>
        </Button>
      </div>
    );
  }
  
  if (!isOwner) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
           <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
           <p className="text-muted-foreground mb-4">No tienes permisos para gestionar la plantilla de este equipo.</p>
           <Button asChild variant="outline">
             <Link href="/equipo/gestion">
               <ArrowLeft className="mr-2 h-4 w-4" />
               Volver
             </Link>
           </Button>
        </div>
      );
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" />
            Mi Plantilla
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
            Gestiona la plantilla de tu equipo y sus datos principales.
            </p>
        </div>
        <Button asChild variant="outline">
          <Link href={`/equipo/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
      </div>

       <div className="space-y-8">
         <InfoCard team={team} owner={owner} isLoadingOwner={isLoadingOwner} />
         <RosterForm team={team} players={players} isLoadingPlayers={isLoadingPlayers} />
       </div>
    </div>
  );
}

    

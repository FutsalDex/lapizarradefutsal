
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, writeBatch, query, where, getDocs, getDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, PlusCircle, Trash2, Save, Briefcase } from 'lucide-react';
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
  ownerName?: string;
}

interface TeamMember {
    id: string;
    name: string;
    role: string;
    userId: string;
}

interface UserProfile {
    displayName?: string;
    email: string;
}


// ====================
// COMPONENTES
// ====================

function InfoCard({ team, teamId }: { team: Team, teamId: string }) {
    const firestore = useFirestore();
    const [allStaff, setAllStaff] = useState<TeamMember[]>([]);
    const [isLoadingStaff, setIsLoadingStaff] = useState(true);

    const teamMembersQuery = useMemoFirebase(() => {
        return query(collection(firestore, 'teamMembers'), where('teamId', '==', teamId));
    }, [firestore, teamId]);

    const { data: staffMembers, isLoading: isLoadingMembers } = useCollection<TeamMember>(teamMembersQuery);

    const fetchStaffData = useCallback(async () => {
        if (isLoadingMembers || !team.ownerId) {
            return;
        }

        setIsLoadingStaff(true);
        const combinedStaff: TeamMember[] = staffMembers ? [...staffMembers] : [];
        
        // Ensure owner is included if not already in members
        if (!combinedStaff.some(m => m.userId === team.ownerId)) {
            try {
                const ownerUserRef = doc(firestore, 'users', team.ownerId);
                const userSnap = await getDoc(ownerUserRef);
                
                if (userSnap.exists()) {
                    const userData = userSnap.data() as UserProfile;
                    const ownerMemberDoc = staffMembers?.find(sm => sm.userId === team.ownerId);

                    combinedStaff.push({
                        id: ownerMemberDoc?.id || '', // Not a real doc id if just a user
                        userId: team.ownerId,
                        name: userData.displayName || 'Propietario',
                        role: ownerMemberDoc?.role || 'Propietario',
                    });
                }
            } catch(e) {
                console.error("Error fetching owner profile for InfoCard", e);
            }
        }
        
        // Sort to have owner first
        combinedStaff.sort((a, b) => {
            if (a.userId === team.ownerId) return -1;
            if (b.userId === team.ownerId) return 1;
            return (a.name || '').localeCompare(b.name || '');
        });

        setAllStaff(combinedStaff);
        setIsLoadingStaff(false);

    }, [firestore, team.ownerId, staffMembers, isLoadingMembers]);

    useEffect(() => {
       fetchStaffData();
    }, [staffMembers, fetchStaffData]);

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
                    <p className="text-sm font-medium text-muted-foreground mb-2">Cuerpo Técnico</p>
                    <div className="border rounded-md p-3 bg-muted/50 space-y-2">
                        {isLoadingStaff ? (
                           <Skeleton className="h-5 w-1/2" />
                        ) : (allStaff && allStaff.length > 0) ? (
                            allStaff.map(member => (
                                <div key={member.userId} className="flex items-center">
                                    <Briefcase className="w-4 h-4 mr-3 text-muted-foreground" />
                                    <span className='text-sm font-medium'>{member.name}</span>
                                    <span className='text-xs text-muted-foreground ml-2'>- {member.role}</span>
                                </div>
                            ))
                        ) : (
                            <p className="text-sm text-muted-foreground">No hay cuerpo técnico asignado.</p>
                        )}
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
            <div className="w-full overflow-x-auto border rounded-lg">
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
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
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
         <InfoCard team={team} teamId={teamId} />
         <RosterForm team={team} players={players} isLoadingPlayers={isLoadingPlayers} />
       </div>
    </div>
  );
}

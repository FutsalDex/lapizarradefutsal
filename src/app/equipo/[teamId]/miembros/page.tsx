'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, PlusCircle, Trash2, ShieldCheck, Save } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

// ====================
// TIPOS Y SCHEMAS
// ====================

const playerSchema = z.object({
  number: z.string().min(1, 'Requerido'),
  name: z.string().min(3, 'Mín. 3 caracteres'),
  position: z.string().min(1, 'Requerido'),
});

const teamRosterSchema = z.object({
  players: z.array(playerSchema).max(20, 'Máximo 20 jugadores.'),
});

type TeamRosterValues = z.infer<typeof teamRosterSchema>;

interface Player {
    id: string;
    number: string;
    name: string;
    position: string;
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

function InfoCard({ team, owner }: { team: Team, owner?: UserProfile | null }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Información del Equipo</CardTitle>
                <CardDescription>Datos generales del equipo y cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <Label htmlFor="club">Club</Label>
                        <Input id="club" value={team.club || ''} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="equipo">Equipo</Label>
                        <Input id="equipo" value={team.name} readOnly />
                    </div>
                    <div>
                        <Label htmlFor="competicion">Competición</Label>
                        <Input id="competicion" value={team.competition || ''} readOnly />
                    </div>
                </div>
                 <div>
                    <Label>Cuerpo Técnico</Label>
                    <div className="border rounded-md p-3 mt-1 flex items-center bg-muted/50">
                       <span className='text-sm'>{owner?.displayName || 'Cargando entrenador...'}</span>
                       <span className='text-xs text-muted-foreground ml-2'>- Entrenador</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

function RosterForm({ team, players, isLoadingPlayers }: { team: Team, players: Player[] | null, isLoadingPlayers: boolean }) {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamRosterValues>({
    resolver: zodResolver(teamRosterSchema),
    defaultValues: {
      players: [],
    },
  });

   useEffect(() => {
    if (players) {
        const formattedPlayers = players.map(p => ({
            number: p.number || '',
            name: p.name || '',
            position: p.position || '',
        }));
      form.reset({ players: formattedPlayers });
    }
  }, [players, form.reset]);
  

  const onSubmit = async (values: TeamRosterValues) => {
     toast({
        variant: 'destructive',
        title: 'Funcionalidad no implementada',
        description: 'La edición de jugadores se añadirá próximamente.',
      });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plantilla del Equipo</CardTitle>
        <CardDescription>
          Esta es la plantilla de tu equipo almacenada en la base de datos. La funcionalidad de edición está en desarrollo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[80px]">Dorsal</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[180px]">Posición</TableHead>
                    <TableHead className="w-[80px] text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoadingPlayers ? (
                    [...Array(5)].map((_, i) => (
                        <TableRow key={i}>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                            <TableCell><Skeleton className="h-8 w-full" /></TableCell>
                        </TableRow>
                    ))
                  ) : players && players.length > 0 ? (
                    players.map((player, index) => (
                      <TableRow key={player.id}>
                        <TableCell>
                          <Input value={player.number} readOnly placeholder="#" className="text-center bg-muted/50"/>
                        </TableCell>
                        <TableCell>
                          <Input value={player.name} readOnly placeholder="Nombre del jugador" className="bg-muted/50"/>
                        </TableCell>
                        <TableCell>
                           <Input value={player.position} readOnly placeholder="Posición" className="bg-muted/50"/>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button type="button" variant="ghost" size="icon" disabled className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                            No hay jugadores en este equipo.
                        </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
                <Button 
                    type="button" 
                    variant="outline" 
                    disabled
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Jugador
                </Button>
                <Button type="submit" disabled>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar Plantilla
                </Button>
            </div>
             {form.formState.errors.players && (
                <p className="text-sm font-medium text-destructive">
                    {form.formState.errors.players.message}
                </p>
            )}
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
  const isLoading = isLoadingTeam || isLoadingOwner;

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
         <InfoCard team={team} owner={owner}/>
         <RosterForm team={team} players={players} isLoadingPlayers={isLoadingPlayers} />
       </div>
    </div>
  );
}

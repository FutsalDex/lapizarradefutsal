'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { useDoc, useFirestore, useUser } from '@/firebase';
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
  dorsal: z.string().min(1, 'Requerido'),
  nombre: z.string().min(3, 'Mín. 3 caracteres'),
  posicion: z.string().min(1, 'Requerido'),
});

const teamRosterSchema = z.object({
  players: z.array(playerSchema).max(20, 'Máximo 20 jugadores.'),
});

type TeamRosterValues = z.infer<typeof teamRosterSchema>;

interface Player {
  dorsal: string;
  nombre: string;
  posicion: string;
}

interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
  players?: Player[];
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

function RosterForm({ team }: { team: Team }) {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamRosterValues>({
    resolver: zodResolver(teamRosterSchema),
    defaultValues: {
      players: team.players || [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  });

  useEffect(() => {
    form.reset({ players: team.players || [] });
  }, [team.players, form.reset]);
  

  const onSubmit = async (values: TeamRosterValues) => {
    setIsSubmitting(true);
    const teamRef = doc(firestore, 'teams', team.id);
    try {
      await updateDoc(teamRef, { players: values.players });
      toast({
        title: 'Plantilla guardada',
        description: 'Los datos de los jugadores han sido actualizados.',
      });
    } catch (error) {
      console.error(error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo guardar la plantilla.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                  {fields.map((field, index) => (
                    <TableRow key={field.id}>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`players.${index}.dorsal`}
                          render={({ field }) => (
                            <Input {...field} placeholder="#" className="text-center"/>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`players.${index}.nombre`}
                          render={({ field }) => (
                            <Input {...field} placeholder="Nombre del jugador"/>
                          )}
                        />
                      </TableCell>
                      <TableCell>
                        <FormField
                          control={form.control}
                          name={`players.${index}.posicion`}
                          render={({ field }) => (
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl>
                                <SelectTrigger>
                                    <SelectValue placeholder="Seleccionar" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="Portero">Portero</SelectItem>
                                    <SelectItem value="Cierre">Cierre</SelectItem>
                                    <SelectItem value="Ala">Ala</SelectItem>
                                    <SelectItem value="Pivot">Pívot</SelectItem>
                                    <SelectItem value="Ala-Pivot">Ala-Pívot</SelectItem>
                                    <SelectItem value="Universal">Universal</SelectItem>
                                </SelectContent>
                            </Select>
                          )}
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center">
                <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => append({ dorsal: '', nombre: '', posicion: '' })}
                    disabled={fields.length >= 20 || isSubmitting}
                >
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Jugador
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                    <Save className="mr-2 h-4 w-4" />
                    {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
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

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

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
         <RosterForm team={team} />
       </div>
    </div>
  );
}

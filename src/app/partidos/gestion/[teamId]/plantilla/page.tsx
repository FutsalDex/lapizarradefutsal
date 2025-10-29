'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, doc, writeBatch } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { z } from 'zod';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Trash2, Loader2, Users } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Team {
  id: string;
  name: string;
  ownerId: string;
  club?: string;
  competition?: string;
}

const playerSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(2, 'El nombre es obligatorio.'),
  number: z.coerce.number().min(0, 'El dorsal debe ser positivo.').optional().nullable(),
  position: z.string().optional().nullable(),
  role: z.literal('player'),
  // Add all other stats fields to be preserved
  active: z.boolean().optional(),
  assists: z.number().optional(),
  faltas: z.number().optional(),
  gRec: z.number().optional(),
  goals: z.number().optional(),
  minutosJugados: z.number().optional(),
  paradas: z.number().optional(),
  perdidas: z.number().optional(),
  pj: z.number().optional(),
  recuperaciones: z.number().optional(),
  smvp: z.any().optional(),
  ta: z.number().optional(),
  tirosFuera: z.number().optional(),
  tirosPuerta: z.number().optional(),
  tr: z.number().optional(),
});


const teamFormSchema = z.object({
  players: z.array(playerSchema),
});

type TeamFormData = z.infer<typeof teamFormSchema>;
type PlayerFormData = z.infer<typeof playerSchema>;

export default function TeamRosterPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const playersCollectionRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return collection(firestore, `teams/${teamId}/players`);
  }, [firestore, teamId]);

  const { data: initialPlayers, isLoading: isLoadingPlayers } = useCollection<PlayerFormData>(playersCollectionRef);
  
  const form = useForm<TeamFormData>({
    resolver: zodResolver(teamFormSchema),
    defaultValues: {
      players: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'players',
  });

  useEffect(() => {
    if (initialPlayers) {
      // Ensure all fields have default values to avoid uncontrolled components
      const formattedPlayers = initialPlayers.map(p => ({
        ...p,
        role: 'player' as const,
        number: p.number ?? null,
        position: p.position ?? null,
      }));
      form.reset({ players: formattedPlayers });
    }
  }, [initialPlayers, form]);

  const onSubmit = async (data: TeamFormData) => {
    if (!firestore || !teamId || !user || user.uid !== team?.ownerId) {
      toast({ title: 'Error de permisos', description: 'No tienes permiso para guardar los cambios.', variant: 'destructive' });
      return;
    }
    setIsSubmitting(true);

    try {
      const batch = writeBatch(firestore);
      const playersRef = collection(firestore, `teams/${teamId}/players`);

      // Set of current player IDs in the form
      const currentPlayerIds = new Set(data.players.map(p => p.id).filter(Boolean));

      // Delete players that are no longer in the form
      initialPlayers?.forEach(initialPlayer => {
        if (!currentPlayerIds.has(initialPlayer.id)) {
          const docRef = doc(playersRef, initialPlayer.id);
          batch.delete(docRef);
        }
      });
      
      // Add or update players from the form
      data.players.forEach(player => {
        const docRef = player.id ? doc(playersRef, player.id) : doc(playersRef);
        // Exclude the ID from the data being written
        const { id, ...playerData } = player; 
        batch.set(docRef, playerData, { merge: true });
      });

      await batch.commit();
      toast({ title: '¡Plantilla guardada!', description: 'Los cambios en la plantilla se han guardado correctamente.' });

    } catch (error) {
       console.error("Error saving roster: ", error);
       const permissionError = new FirestorePermissionError({
            path: playersCollectionRef?.path || `teams/${teamId}/players`,
            operation: 'write',
            requestResourceData: data.players,
        });
        errorEmitter.emit('permission-error', permissionError);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isOwner = user?.uid === team?.ownerId;
  const isLoading = isLoadingTeam || isLoadingPlayers;

  if (isLoading && !team) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-between items-center mb-8">
            <div className='flex items-center gap-4'>
                <Users className="w-8 h-8 text-primary" />
                <div>
                    <h1 className="text-3xl font-bold font-headline text-primary">Mi Plantilla</h1>
                    <p className="text-muted-foreground">Gestiona la plantilla de tu equipo y sus datos principales.</p>
                </div>
            </div>
            <Button asChild variant="outline">
              <Link href={`/partidos/gestion/${teamId}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel
              </Link>
            </Button>
          </div>

          <div className="space-y-8">
            <Card>
              <CardHeader>
                <CardTitle>Información del Equipo</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div>
                    <Label>Club</Label>
                    <Input readOnly value={team?.club || ''} />
                  </div>
                   <div>
                    <Label>Equipo</Label>
                    <Input readOnly value={team?.name || ''} />
                  </div>
                   <div>
                    <Label>Competición</Label>
                    <Input readOnly value={team?.competition || ''} />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Plantilla del Equipo</CardTitle>
                <CardDescription>Introduce los datos de tus jugadores. Máximo 20.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flow-root">
                    <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
                        <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
                            <Table>
                              <TableHeader>
                                <TableRow>
                                  <TableHead className='w-[80px]'>Dorsal</TableHead>
                                  <TableHead className='min-w-[150px]'>Nombre</TableHead>
                                  <TableHead className='min-w-[150px]'>Posición</TableHead>
                                  <TableHead className="text-right w-[100px]">Acciones</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {isLoading ? (
                                    <TableRow><TableCell colSpan={4} className="text-center">Cargando jugadores...</TableCell></TableRow>
                                ) : fields.map((field, index) => (
                                  <TableRow key={field.id}>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`players.${index}.number`}
                                        render={({ field }) => <Input type="number" {...field} value={field.value ?? ''} disabled={!isOwner} className="w-16" />}
                                      />
                                    </TableCell>
                                    <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`players.${index}.name`}
                                        render={({ field }) => <Input {...field} disabled={!isOwner} />}
                                      />
                                    </TableCell>
                                     <TableCell>
                                      <FormField
                                        control={form.control}
                                        name={`players.${index}.position`}
                                        render={({ field }) => (
                                           <Select onValueChange={field.onChange} value={field.value ?? ''} disabled={!isOwner}>
                                                <FormControl>
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Seleccionar" />
                                                    </SelectTrigger>
                                                </FormControl>
                                                <SelectContent>
                                                    <SelectItem value="Portero">Portero</SelectItem>
                                                    <SelectItem value="Cierre">Cierre</SelectItem>
                                                    <SelectItem value="Ala">Ala</SelectItem>
                                                    <SelectItem value="Pívot">Pívot</SelectItem>
                                                    <SelectItem value="Ala-Pívot">Ala-Pívot</SelectItem>
                                                    <SelectItem value="Universal">Universal</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        )}
                                      />
                                    </TableCell>
                                    <TableCell className="text-right">
                                      {isOwner && (
                                        <Button variant="ghost" size="icon" type="button" onClick={() => remove(index)}>
                                          <Trash2 className="h-4 w-4" />
                                          <span className="sr-only">Eliminar</span>
                                        </Button>
                                      )}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
                {isOwner && (
                     <div className="mt-6 flex flex-col sm:flex-row items-center gap-4 justify-between">
                         <Button
                            type="button"
                            variant="outline"
                            onClick={() => append({ name: '', role: 'player', number: null, position: null })}
                            disabled={fields.length >= 20}
                            >
                            <UserPlus className="mr-2 h-4 w-4" /> Añadir Jugador
                        </Button>
                         <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Guardar Plantilla
                        </Button>
                    </div>
                )}
                
              </CardContent>
            </Card>
          </div>
        </div>
      </form>
    </Form>
  );
}

    

'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, writeBatch, query, where, getDocs, getDoc, addDoc, deleteDoc, serverTimestamp, arrayUnion } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormMessage, FormLabel } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, PlusCircle, Trash2, Save, Briefcase } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';


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

const staffSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(3, 'Mínimo 3 caracteres.'),
  role: z.string().min(2, 'Mínimo 2 caracteres.'),
  email: z.string().email('Email inválido').optional().or(z.literal('')),
});

const staffFormSchema = z.object({
  staff: z.array(staffSchema),
});


type TeamRosterValues = z.infer<typeof teamRosterSchema>;
type StaffFormValues = z.infer<typeof staffFormSchema>;

interface Player {
  id: string;
  number: string;
  name: string;
  position: 'Portero' | 'Cierre' | 'Ala' | 'Pívot' | 'Ala-Pívot';
}
interface StaffMember {
    id: string;
    name: string;
    role: string;
    email?: string;
    userId?: string;
}

interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
  ownerName?: string;
}

const staffRoles = [
  "Entrenador",
  "2º Entrenador",
  "Delegado",
  "Preparador Físico",
  "Analista Táctico/Scouting",
  "Fisioterapeuta",
  "Médico",
  "Psicólogo",
  "Nutricionista",
];


// ====================
// COMPONENTES
// ====================

function InfoCard({ team }: { team: Team }) {
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
                <CardDescription>Datos generales del equipo y competición.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoField label="Club" value={team.club || ''} />
                    <InfoField label="Equipo" value={team.name} />
                    <InfoField label="Competición" value={team.competition || ''} />
                </div>
            </CardContent>
        </Card>
    );
}

function StaffForm({ team, staff, isLoadingStaff, onStaffUpdated }: { team: Team, staff: StaffMember[] | null, isLoadingStaff: boolean, onStaffUpdated: () => void }) {
    const { toast } = useToast();
    const firestore = useFirestore();
    const { user } = useUser();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [removedStaffIds, setRemovedStaffIds] = useState<string[]>([]);
  
    const form = useForm<StaffFormValues>({
      resolver: zodResolver(staffFormSchema),
      defaultValues: { staff: [] },
    });
  
    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'staff',
    });
  
    useEffect(() => {
      if (staff) {
        form.reset({ staff: staff });
      }
    }, [staff, form]);
  
    const onSubmit = async (values: StaffFormValues) => {
      setIsSubmitting(true);
      const batch = writeBatch(firestore);
      const staffRef = collection(firestore, `teams/${team.id}/staff`);
      const teamRef = doc(firestore, 'teams', team.id);
  
      removedStaffIds.forEach(id => {
        if (id) batch.delete(doc(staffRef, id));
      });
  
      for (const member of values.staff) {
        const memberRef = member.id ? doc(staffRef, member.id) : doc(staffRef);
        const data: Omit<StaffMember, 'id'> = { name: member.name, role: member.role };
        if (member.email) {
          data.email = member.email;

          const usersCollection = collection(firestore, 'users');
          const q = query(usersCollection, where('email', '==', member.email));
          const snapshot = await getDocs(q);

          if (!snapshot.empty) {
            const existingUser = snapshot.docs[0];
            data.userId = existingUser.id;
            batch.update(teamRef, { memberIds: arrayUnion(existingUser.id) });
          } else {
             const invitationsRef = collection(firestore, 'invitations');
             await addDoc(invitationsRef, {
                 inviterId: user?.uid,
                 inviteeEmail: member.email,
                 teamId: team.id,
                 status: 'pending',
                 createdAt: serverTimestamp(),
             });
             toast({ title: 'Invitación enviada', description: `Se ha enviado una invitación a ${member.email} para unirse al equipo.`})
          }
        }
        batch.set(memberRef, data, { merge: true });
      };
  
      try {
        await batch.commit();
        toast({ title: 'Staff actualizado', description: 'Los cambios en tu staff técnico se han guardado.' });
        setRemovedStaffIds([]);
        onStaffUpdated();
      } catch (e) {
        console.error("Error updating staff:", e);
        toast({ variant: 'destructive', title: 'Error al guardar', description: 'No se pudieron guardar los cambios.' });
      } finally {
        setIsSubmitting(false);
      }
    };
  
    const handleRemoveStaff = (index: number) => {
      const staffMember = fields[index];
      if (staffMember.id) {
        setRemovedStaffIds(prev => [...prev, staffMember.id!]);
      }
      remove(index);
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Briefcase/>Staff Técnico</CardTitle>
          <CardDescription>Gestiona los miembros del cuerpo técnico. Si añades un email, se le invitará para que pueda colaborar.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <div className="w-full overflow-x-auto border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[180px]">Nombre</TableHead>
                      <TableHead className="w-[200px]">Rol</TableHead>
                      <TableHead className="w-[280px]">Email</TableHead>
                      <TableHead className="w-[100px] text-right">Acciones</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingStaff ? (
                      <TableRow><TableCell colSpan={4}><Skeleton className="h-10 w-full" /></TableCell></TableRow>
                    ) : fields.length > 0 ? (
                      fields.map((field, index) => (
                        <TableRow key={field.id}>
                          <TableCell>
                            <FormField control={form.control} name={`staff.${index}.name`} render={({ field }) => (<Input {...field} placeholder="Nombre"/>)} />
                          </TableCell>
                          <TableCell>
                             <FormField
                                control={form.control}
                                name={`staff.${index}.role`}
                                render={({ field }) => (
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Selecciona..." />
                                    </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                    {staffRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                    </SelectContent>
                                </Select>
                                )}
                            />
                          </TableCell>
                          <TableCell>
                            <FormField control={form.control} name={`staff.${index}.email`} render={({ field }) => (<Input type="email" {...field} placeholder="email@ejemplo.com"/>)} />
                          </TableCell>
                          <TableCell className="text-right">
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar miembro?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción eliminará al miembro del staff de forma permanente.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemoveStaff(index)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">No hay miembros en el staff.</TableCell></TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
              <div className="flex justify-between items-center">
                <Button type="button" variant="outline" onClick={() => append({ name: '', role: 'Entrenador', email: '' })} disabled={isSubmitting}>
                  <PlusCircle className="mr-2 h-4 w-4" /> Añadir Miembro
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Guardando...' : 'Guardar Staff'}
                </Button>
              </div>
            </form>
          </Form>
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

    removedPlayerIds.forEach(playerId => {
        if(playerId) {
            batch.delete(doc(teamPlayersRef, playerId));
        }
    });

    values.players.forEach(player => {
        const playerRef = player.id ? doc(teamPlayersRef, player.id) : doc(teamPlayersRef);
        batch.set(playerRef, {
            name: player.name,
            number: player.number,
            position: player.position
        }, { merge: true });
    });

    try {
        await batch.commit();
        toast({
            title: 'Plantilla actualizada',
            description: 'Los cambios en tu plantilla se han guardado correctamente.',
        });
        setRemovedPlayerIds([]);
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
    if (player.id) {
        setRemovedPlayerIds(prev => [...prev, player.id!]);
    }
    remove(index);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users/>Jugadores</CardTitle>
        <CardDescription>
          Introduce los datos de tus jugadores. Máximo 20.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="w-full overflow-x-auto border rounded-lg">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[100px]">Dorsal</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead className="w-[200px]">Posición</TableHead>
                    <TableHead className="w-[100px] text-right">Acciones</TableHead>
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
                          <FormField control={form.control} name={`players.${index}.number`} render={({ field }) => ( <Input {...field} placeholder="#" className="text-center"/> )} />
                        </TableCell>
                        <TableCell>
                           <FormField control={form.control} name={`players.${index}.name`} render={({ field }) => ( <Input {...field} placeholder="Nombre del jugador"/> )} />
                        </TableCell>
                         <TableCell>
                          <FormField
                            control={form.control}
                            name={`players.${index}.position`}
                            render={({ field }) => (
                              <Select onValueChange={field.onChange} value={field.value}>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecciona..." />
                                </SelectTrigger>
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
                           <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button type="button" variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Eliminar jugador?</AlertDialogTitle>
                                        <AlertDialogDescription>Esta acción eliminará al jugador de la plantilla de forma permanente.</AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={() => handleRemovePlayer(index)} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground h-24">No hay jugadores en tu plantilla. ¡Añade el primero!</TableCell></TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-start">
                <Button type="button" variant="outline" onClick={() => append({ name: '', number: '', position: 'Ala' })} disabled={fields.length >= 20 || isSubmitting}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Jugador
                </Button>
                <div>
                  {form.formState.errors.players && (
                      <p className="text-sm font-medium text-destructive text-right mb-2">{form.formState.errors.players.message || form.formState.errors.players.root?.message}</p>
                  )}
                  <Button type="submit" disabled={isSubmitting}>
                      <Save className="mr-2 h-4 w-4" /> {isSubmitting ? 'Guardando...' : 'Guardar Plantilla'}
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
export default function RosterPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();
  const [refreshKey, setRefreshKey] = useState(0);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const staffRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/staff`), [firestore, teamId, refreshKey]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  const { data: staff, isLoading: isLoadingStaff } = useCollection<StaffMember>(staffRef);

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
  if (!team) return null;
  
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
            <Button asChild variant="outline" className="mb-4">
                <Link href={`/equipo/gestion/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
            <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
            <Users className="mr-3 h-10 w-10" />
            Mi Plantilla
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
            Gestiona la plantilla de tu equipo, tanto jugadores como cuerpo técnico.
            </p>
        </div>
      </div>

       <div className="space-y-8">
         <InfoCard team={team} />
         <StaffForm team={team} staff={staff} isLoadingStaff={isLoadingStaff} onStaffUpdated={() => setRefreshKey(k => k + 1)} />
         <RosterForm team={team} players={players} isLoadingPlayers={isLoadingPlayers} />
       </div>
    </div>
  );
}

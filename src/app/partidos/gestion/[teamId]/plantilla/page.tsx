
'use client';

import { useMemo, useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, documentId, addDoc, setDoc, getDocs } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  ownerId: string;
}

interface TeamMemberDoc {
  id: string; // This is the userId (document ID)
  role: 'player' | 'coach';
  dorsal?: number;
  posicion?: string;
}

interface UserProfile {
    id: string;
    displayName?: string;
    email: string;
}

// Combined type for easy rendering
type RosterPlayer = UserProfile & Omit<TeamMemberDoc, 'id'>;


const getInitials = (displayName?: string, email?: string) => {
    if (displayName) {
        const names = displayName.split(' ');
        if (names.length > 1) {
            return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
        }
        return displayName.substring(0, 2).toUpperCase();
    }
    return (email?.charAt(0) || '').toUpperCase();
}

const addPlayerSchema = z.object({
  name: z.string().min(3, 'Introduce un nombre válido.'),
  dorsal: z.coerce.number().min(0, 'El dorsal no puede ser negativo.').optional(),
  posicion: z.string().optional(),
});


function AddPlayerDialog({ team }: { team: Team | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const params = useParams();
    const { teamId } = params;


    const form = useForm<z.infer<typeof addPlayerSchema>>({
        resolver: zodResolver(addPlayerSchema),
        defaultValues: { name: '', dorsal: undefined, posicion: '' },
    });

    const onSubmit = async (values: z.infer<typeof addPlayerSchema>) => {
        if (!firestore || !team || typeof teamId !== 'string') {
            toast({ title: 'Error', description: 'No se ha podido añadir al jugador. Inténtalo de nuevo.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        
        // 1. Check if user with this name exists in the 'users' collection
        const usersRef = collection(firestore, 'users');
        const userQuery = query(usersRef, where('displayName', '==', values.name));
        
        getDocs(userQuery).then(async (userSnapshot) => {
            if (userSnapshot.empty) {
                toast({ title: 'Usuario no encontrado', description: 'No existe ningún usuario con ese nombre en la plataforma.', variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }

            if (userSnapshot.size > 1) {
                toast({ title: 'Múltiples usuarios encontrados', description: 'Existen varios usuarios con ese nombre. Por favor, sé más específico o contacta al administrador.', variant: 'destructive' });
                setIsSubmitting(false);
                return;
            }

            const invitedUserDoc = userSnapshot.docs[0];
            const invitedUserId = invitedUserDoc.id;

            // 2. Add the user to the team's 'members' subcollection
            const memberRef = doc(firestore, 'teams', teamId, 'members', invitedUserId);
            const memberData = {
                role: 'player',
                dorsal: values.dorsal ?? null,
                posicion: values.posicion ?? null,
            };
            
            setDoc(memberRef, memberData)
              .then(() => {
                  toast({ title: '¡Jugador añadido!', description: `${invitedUserDoc.data().displayName} ha sido añadido a la plantilla.` });
                  form.reset({ name: '', dorsal: undefined, posicion: ''});
                  setOpen(false);
              })
              .catch((error) => {
                  const permissionError = new FirestorePermissionError({
                      path: memberRef.path,
                      operation: 'create', // or 'update' if overwriting is intended
                      requestResourceData: memberData,
                  });
                  errorEmitter.emit('permission-error', permissionError);
              })
              .finally(() => {
                  setIsSubmitting(false);
              });

        }).catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: usersRef.path,
                operation: 'list', // getDocs is a 'list' operation on the collection
            });
            errorEmitter.emit('permission-error', permissionError);
            setIsSubmitting(false);
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Dar de alta jugador
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dar de alta a un nuevo jugador</DialogTitle>
                    <DialogDescription>
                        Introduce los datos del jugador para añadirlo a tu equipo '{team?.name}'. El usuario ya debe tener una cuenta en la aplicación.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del jugador</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre Apellido" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="dorsal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dorsal</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 10" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="posicion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Posición</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Cierre" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Añadiendo...' : 'Añadir Jugador a la Plantilla'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Roster({ memberIds }: { memberIds: string[] }) {
    const firestore = useFirestore();
    const params = useParams();
    const teamId = params.teamId as string;
    
    const membersQuery = useMemoFirebase(() => {
        if (!firestore || memberIds.length === 0) return null;
        // Firestore 'in' queries are limited to 30 items.
        return query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0, 30)));
    }, [firestore, memberIds]);

    const teamMembersSubcollectionRef = useMemoFirebase(() => {
        if (!firestore || !teamId) return null;
        return collection(firestore, 'teams', teamId, 'members');
    }, [firestore, teamId]);


    const { data: teamMembersProfiles, isLoading: isLoadingProfiles } = useCollection<UserProfile>(membersQuery);
    const { data: teamMembersDocs, isLoading: isLoadingDocs } = useCollection<TeamMemberDoc>(teamMembersSubcollectionRef);


    const roster: RosterPlayer[] = useMemo(() => {
        if (!teamMembersDocs || !teamMembersProfiles) return [];

        const profilesMap = new Map(teamMembersProfiles.map(p => [p.id, p]));

        return teamMembersDocs.map(memberDoc => {
            const profile = profilesMap.get(memberDoc.id);
            if (!profile) return null;

            return {
                ...profile,
                ...memberDoc,
            };
        }).filter((p): p is RosterPlayer => p !== null);

    }, [teamMembersDocs, teamMembersProfiles]);

    const isLoading = isLoadingDocs || (memberIds.length > 0 && isLoadingProfiles);

    if (isLoading) {
         return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className='flex-grow space-y-2'>
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (roster.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="font-semibold">Aún no hay miembros en este equipo.</p>
                <p className="text-sm mt-1">Usa el botón "Dar de alta jugador" para añadir a tu primer miembro.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Dorsal</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead className="text-right">Email</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {roster.map((player) => (
                    <TableRow key={player.id}>
                        <TableCell className="font-medium text-center">{player.dorsal ?? '-'}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(player.displayName, player.email)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{player.displayName || 'Usuario sin nombre'}</span>
                            </div>
                        </TableCell>
                        <TableCell>{player.posicion ?? '-'}</TableCell>
                        <TableCell className="text-right text-muted-foreground">{player.email}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function TeamRosterPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const membersSubcollectionRef = useMemoFirebase(() => {
      if(!firestore || !teamId) return null;
      return collection(firestore, 'teams', teamId, 'members');
  }, [firestore, teamId]);
  const { data: teamMembersDocs, isLoading: isLoadingMembers } = useCollection<TeamMemberDoc>(membersSubcollectionRef);

  const memberIds = useMemo(() => teamMembersDocs?.map(member => member.id) || [], [teamMembersDocs]);
  
  const isOwner = user?.uid === team?.ownerId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/partidos/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
        {isLoadingTeam ? <Skeleton className='h-10 w-1/2' /> : <h1 className="text-4xl font-bold font-headline text-primary">Plantilla de {team?.name}</h1>}
        <p className="text-lg text-muted-foreground mt-2">Visualiza y gestiona los miembros de tu equipo.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    {isLoadingMembers ? <Skeleton className="h-4 w-32 mt-1" /> : `${teamMembersDocs?.length ?? 0} jugadores en la plantilla.`}
                </CardDescription>
            </div>
            {isOwner && <AddPlayerDialog team={team} />}
        </CardHeader>
        <CardContent>
           {isLoadingMembers 
                ? <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-4 p-4">
                            <Skeleton className="h-8 w-8 rounded-full" />
                            <Skeleton className="h-4 flex-grow" />
                        </div>
                    ))}
                  </div>
                : <Roster memberIds={memberIds} />
           }
        </CardContent>
      </Card>
    </div>
  );
}

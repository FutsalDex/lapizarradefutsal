'use client';

import { useState, useMemo, FC, ReactNode } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, where, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Users, Check, X, Settings, Trash2, Pencil } from 'lucide-react';
import Link from 'next/link';
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
} from "@/components/ui/alert-dialog"
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';
import { Skeleton } from '@/components/ui/skeleton';

const teamSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  club: z.string().optional(),
  competition: z.string().optional(),
});

type TeamFormInputs = z.infer<typeof teamSchema>;

interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
}

interface TeamInvitation {
    id: string;
    teamId: string;
    teamName: string;
    userId: string;
    invitedByUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
}

function TeamList() {
    const firestore = useFirestore();
    const { user } = useUser(); // No need for isAuthLoading here, AuthGuard handles it
    const { toast } = useToast();

    // These queries are now safe because this component only renders when user exists.
    const ownedTeamsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'teams'), where('ownerId', '==', user.uid));
    }, [firestore, user]);

    const acceptedInvitationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'teamInvitations'), where('userId', '==', user.uid), where('status', '==', 'accepted'));
    }, [firestore, user]);

    const { data: ownedTeams, isLoading: isLoadingOwned } = useCollection<Team>(ownedTeamsQuery);
    const { data: acceptedInvitations, isLoading: isLoadingInvites } = useCollection<TeamInvitation>(acceptedInvitationsQuery);
    
    const memberTeamIds = useMemo(() => {
        if (!acceptedInvitations) return [];
        return acceptedInvitations.map(inv => inv.teamId);
    }, [acceptedInvitations]);

    const canFetchMemberTeams = !isLoadingInvites && memberTeamIds.length > 0;

    const memberTeamsQuery = useMemoFirebase(() => {
        if (!firestore || !canFetchMemberTeams) return null;
        // Use slice to adhere to 'in' query limit of 30
        return query(collection(firestore, 'teams'), where('__name__', 'in', memberTeamIds.slice(0, 30)));
    }, [firestore, canFetchMemberTeams, memberTeamIds]);

    const { data: memberTeams, isLoading: isLoadingMemberTeams } = useCollection<Team>(memberTeamsQuery);
    
    const allTeams = useMemo(() => {
        const teamsMap = new Map<string, Team>();
        (ownedTeams || []).forEach(team => teamsMap.set(team.id, team));
        (memberTeams || []).forEach(team => teamsMap.set(team.id, team));
        return Array.from(teamsMap.values());
    }, [ownedTeams, memberTeams]);
    
    const isLoading = isLoadingOwned || isLoadingInvites || (canFetchMemberTeams && isLoadingMemberTeams);

    const handleDeleteTeam = async (teamId: string) => {
        if (!firestore) return;
        const teamRef = doc(firestore, 'teams', teamId);
        
        deleteDoc(teamRef)
        .then(() => {
            toast({
                title: "Equipo eliminado",
                description: "El equipo ha sido eliminado correctamente."
            });
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: teamRef.path,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    if (isLoading) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
            </div>
        );
    }
    
    if (allTeams.length === 0) {
        return (
            <p className="text-center text-muted-foreground py-4">
                No administras ni perteneces a ningún equipo.
            </p>
        );
    }

    return (
      <div className="space-y-3">
        {allTeams.map((team) => (
          <div key={team.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-lg border">
              <div className='mb-4 sm:mb-0'>
                <p className="font-semibold text-lg">{team.name}</p>
                <p className="text-sm text-muted-foreground">
                  {team.club} {team.competition && `(${team.competition})`}
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <Button asChild>
                    <Link href={`/partidos/gestion/${team.id}`}>
                        <Settings className="mr-2 h-4 w-4" /> Gestionar
                    </Link>
                </Button>
                {team.ownerId === user?.uid && (
                  <>
                    <Button variant="ghost" size="icon">
                        <Pencil className="h-4 w-4" />
                        <span className="sr-only">Editar</span>
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" size="icon">
                                <Trash2 className="h-4 w-4" />
                                <span className="sr-only">Eliminar</span>
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminará permanentemente el equipo y todos sus datos asociados.
                            </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>Eliminar</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                  </>
                )}
              </div>
            </div>
        ))}
      </div>
    )
}

function CreateTeamForm() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<TeamFormInputs>({
        resolver: zodResolver(teamSchema),
        defaultValues: { name: '', club: '', competition: '' },
    });

    const teamsCollectionRef = useMemoFirebase(() => {
        if (!firestore) return null;
        return collection(firestore, 'teams');
    }, [firestore]);

    const handleCreateTeam: SubmitHandler<TeamFormInputs> = async (data) => {
        if (!user || !teamsCollectionRef) return; // Guard
        setIsSubmitting(true);

        const teamData = {
            ...data,
            ownerId: user.uid,
            createdAt: serverTimestamp(),
        };

        addDoc(teamsCollectionRef, teamData)
        .then(() => {
            toast({
                title: '¡Equipo creado!',
                description: `El equipo "${data.name}" ha sido creado correctamente.`,
            });
            form.reset();
        })
        .catch((error) => {
            const permissionError = new FirestorePermissionError({
                path: teamsCollectionRef.path,
                operation: 'create',
                requestResourceData: teamData,
            });
            errorEmitter.emit('permission-error', permissionError);
        })
        .finally(() => {
            setIsSubmitting(false);
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center">
                    <PlusCircle className="mr-2" /> Crear Nuevo Equipo
                </CardTitle>
                <CardDescription>Añade un nuevo equipo para empezar a gestionarlo.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleCreateTeam)} className="space-y-4">
                        <FormField control={form.control} name="name" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Nombre del Equipo</FormLabel>
                                <FormControl><Input placeholder="Ej: Cadete B" {...field} /></FormControl>
                                <FormMessage />
                            </FormItem>
                        )}/>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="club" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Club (Opcional)</FormLabel>
                                    <FormControl><Input placeholder="Ej: CD Don Antonio" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                            <FormField control={form.control} name="competition" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Competición (Opcional)</FormLabel>
                                    <FormControl><Input placeholder="Ej: 2ª Andaluza" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}/>
                        </div>
                        <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                            {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear Equipo'}
                        </Button>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}

function PendingInvitations() {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();

    const userInvitationsQuery = useMemoFirebase(() => {
        if (!user || !firestore) return null;
        return query(collection(firestore, 'teamInvitations'), where('userId', '==', user.uid), where('status', '==', 'pending'));
    }, [firestore, user]);

    const { data: invitations, isLoading: isLoadingInvitations } = useCollection<TeamInvitation>(userInvitationsQuery);

    const handleInvitation = async (invitationId: string, accept: boolean) => {
        if (!firestore) return;
        const invitationRef = doc(firestore, 'teamInvitations', invitationId);
        const newStatus = { status: accept ? 'accepted' : 'rejected' };
        
        updateDoc(invitationRef, newStatus)
        .then(() => {
            toast({ title: accept ? '¡Invitación aceptada!' : 'Invitación rechazada' });
        })
        .catch(error => {
            const permissionError = new FirestorePermissionError({
                path: invitationRef.path,
                operation: 'update',
                requestResourceData: newStatus,
            });
            errorEmitter.emit('permission-error', permissionError);
        });
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle>Invitaciones Pendientes</CardTitle>
                <CardDescription>Equipos a los que has sido invitado a unirte.</CardDescription>
            </CardHeader>
            <CardContent>
                {isLoadingInvitations ? (
                    <p className="text-muted-foreground">Cargando invitaciones...</p>
                ) : invitations && invitations.length > 0 ? (
                    <div className="space-y-3">
                        {invitations.map((inv) => (
                            <div key={inv.id} className="flex items-center justify-between p-3 rounded-lg border">
                                <div>
                                    <p className="font-semibold">{inv.teamName}</p>
                                    <p className="text-sm text-muted-foreground">Has sido invitado a unirte a este equipo.</p>
                                </div>
                                <div className="flex gap-2">
                                    <Button size="icon" variant="outline" onClick={() => handleInvitation(inv.id, true)}><Check className="h-4 w-4 text-green-500" /></Button>
                                    <Button size="icon" variant="outline" onClick={() => handleInvitation(inv.id, false)}><X className="h-4 w-4 text-red-500" /></Button>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-center text-muted-foreground py-4">No tienes invitaciones pendientes.</p>
                )}
            </CardContent>
        </Card>
    );
}

// AuthGuard component to protect content
const AuthGuard: FC<{ children: ReactNode }> = ({ children }) => {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
             <div className="space-y-8">
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        );
    }

    if (!user) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Acceso Requerido</CardTitle>
                    <CardDescription>Debes iniciar sesión para gestionar tus equipos.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/acceso">Iniciar Sesión</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
};


export default function GestionEquiposPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <AuthGuard>
            <CreateTeamForm />

            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center">
                    <Users className="mr-2" /> Mis Equipos
                    </CardTitle>
                    <CardDescription>Equipos que administras o de los que eres miembro.</CardDescription>
                </CardHeader>
                <CardContent>
                    <TeamList />
                </CardContent>
            </Card>

            <PendingInvitations />
        </AuthGuard>
      </div>
    </div>
  );
}

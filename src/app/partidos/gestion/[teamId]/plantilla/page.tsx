'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, documentId, addDoc, serverTimestamp, getDocs } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
}

interface TeamMemberDoc {
  id: string; // This is the userId (document ID)
  role?: string;
}

interface UserProfile {
    id: string;
    displayName?: string;
    email: string;
}

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

const invitationSchema = z.object({
  email: z.string().email('Introduce un correo electrónico válido.'),
});

// Child component to handle the form and invitation logic
function InvitePlayerDialog({ team }: { team: Team | null }) {
    const { user } = useUser();
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const params = useParams();
    const { teamId } = params;


    const form = useForm<z.infer<typeof invitationSchema>>({
        resolver: zodResolver(invitationSchema),
        defaultValues: { email: '' },
    });

    const onSubmit = async (values: z.infer<typeof invitationSchema>) => {
        if (!user || !firestore || !team || typeof teamId !== 'string') {
            toast({ title: 'Error', description: 'No se ha podido enviar la invitación. Inténtalo de nuevo.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            // 1. Check if user with this email exists
            const usersRef = collection(firestore, 'users');
            const userQuery = query(usersRef, where('email', '==', values.email));
            const userSnapshot = await getDocs(userQuery);

            if (userSnapshot.empty) {
                toast({ title: 'Usuario no encontrado', description: 'No existe ningún usuario con ese correo electrónico.', variant: 'destructive' });
                return;
            }
            const invitedUser = userSnapshot.docs[0];
            const invitedUserId = invitedUser.id;

            // 2. Check if an invitation already exists
            const invitationsRef = collection(firestore, 'teamInvitations');
            const invitationQuery = query(invitationsRef, where('teamId', '==', teamId), where('userId', '==', invitedUserId));
            const invitationSnapshot = await getDocs(invitationQuery);

            if (!invitationSnapshot.empty) {
                toast({ title: 'Invitación ya enviada', description: 'Este usuario ya ha sido invitado a este equipo.', variant: 'destructive' });
                return;
            }

            // 3. Create the invitation
            await addDoc(invitationsRef, {
                teamId: teamId,
                teamName: team.name,
                userId: invitedUserId,
                status: 'pending',
                invitedByUserId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({ title: '¡Invitación enviada!', description: `Se ha enviado una invitación a ${values.email}.` });
            form.reset();
            setOpen(false);

        } catch (error) {
            console.error("Error sending invitation:", error);
            toast({ title: 'Error', description: 'Ha ocurrido un problema al enviar la invitación.', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
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
                    <DialogTitle>Invitar a un nuevo jugador</DialogTitle>
                    <DialogDescription>
                        Introduce el correo electrónico del usuario para invitarlo a tu equipo '{team?.name}'. El usuario ya debe tener una cuenta en la aplicación.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Correo electrónico del jugador</FormLabel>
                                <FormControl>
                                    <Input placeholder="jugador@ejemplo.com" {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                        />
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}


// Child component to fetch and render member profiles once IDs are available
function TeamRoster({ memberIds }: { memberIds: string[] }) {
    const firestore = useFirestore();

    const membersQuery = useMemoFirebase(() => {
        if (!firestore || memberIds.length === 0) return null;
        return query(collection(firestore, 'users'), where(documentId(), 'in', memberIds.slice(0,30)));
    }, [firestore, memberIds]);

    const { data: teamMembers, isLoading: isLoadingMembers } = useCollection<UserProfile>(membersQuery);
    
    if (isLoadingMembers) {
        return (
            <div className="space-y-4">
                {[...Array(memberIds.length || 3)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                            <Skeleton className="h-10 w-10 rounded-full" />
                            <div>
                                <Skeleton className="h-5 w-28 mb-1" />
                                <Skeleton className="h-4 w-36" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (teamMembers && teamMembers.length > 0) {
        return (
             <div className="divide-y">
                {teamMembers.map((member) => (
                    <div key={member.id} className="flex items-center justify-between py-3">
                        <div className="flex items-center gap-4">
                        <Avatar>
                            <AvatarFallback>{getInitials(member.displayName, member.email)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-medium">{member.displayName || member.email || 'Usuario sin nombre'}</p>
                            <p className="text-sm text-muted-foreground">{member.email}</p>
                        </div>
                        </div>
                        <Button variant="ghost" size="sm">Gestionar</Button>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <p className="text-muted-foreground text-center py-8">No se encontraron perfiles para los miembros del equipo.</p>
    );
}


export default function TeamRosterPage() {
  const params = useParams();
  const { teamId } = params;
  const firestore = useFirestore();

  // 1. Get Team Info
  const teamRef = useMemoFirebase(() => {
    if (!firestore || typeof teamId !== 'string') return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  // 2. Get member document IDs from the 'members' subcollection
  const membersSubcollectionRef = useMemoFirebase(() => {
      if(!firestore || typeof teamId !== 'string') return null;
      return collection(firestore, 'teams', teamId, 'members');
  }, [firestore, teamId]);
  const { data: teamMembersDocs, isLoading: isLoadingMembersSubcollection } = useCollection<TeamMemberDoc>(membersSubcollectionRef);
  
  // 3. Extract the IDs from the documents
  const memberIds = useMemo(() => {
    if (!teamMembersDocs) return [];
    // The user ID is the ID of the document in the 'members' subcollection
    return teamMembersDocs.map(memberDoc => memberDoc.id);
  }, [teamMembersDocs]);

  const isLoading = isLoadingTeam || isLoadingMembersSubcollection;

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
                    {isLoading ? <Skeleton className="h-4 w-32 mt-1" /> : `${memberIds.length} jugadores en la plantilla.`}
                </CardDescription>
            </div>
            <InvitePlayerDialog team={team} />
        </CardHeader>
        <CardContent>
            {isLoading && (
                <div className="space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center justify-between py-3">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-10 w-10 rounded-full" />
                                <div>
                                    <Skeleton className="h-5 w-28 mb-1" />
                                    <Skeleton className="h-4 w-36" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            {!isLoading && memberIds.length > 0 && <TeamRoster memberIds={memberIds} />}
            {!isLoading && memberIds.length === 0 && (
                <p className="text-muted-foreground text-center py-8">Aún no hay miembros en este equipo. ¡Invita a tu primer jugador!</p>
            )}
        </CardContent>
      </Card>
    </div>
  );
}

    
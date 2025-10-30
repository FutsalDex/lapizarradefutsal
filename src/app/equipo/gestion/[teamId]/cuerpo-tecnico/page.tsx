
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, writeBatch, query, where, addDoc, serverTimestamp, getDocs, updateDoc, deleteDoc, arrayRemove } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';


import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHeader, TableRow, TableHead } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Users, ArrowLeft, PlusCircle, Trash2, Save, Briefcase, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// ====================
// TIPOS Y SCHEMAS
// ====================

interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
  memberIds?: string[];
}

interface TeamMember extends UserProfile {
    role: string;
    invitationId?: string;
    status?: 'pending' | 'accepted' | 'rejected';
}

interface UserProfile {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
}

const staffRoles = [
  'Entrenador',
  '2º Entrenador',
  'Delegado',
  'Preparador Físico',
  'Analista Táctico/Scouting',
  'Fisioterapeuta',
  'Médico',
  'Psicólogo',
  'Nutricionista',
];

const addMemberSchema = z.object({
  email: z.string().email('Introduce un email válido.'),
  role: z.enum(staffRoles as [string, ...string[]], {
    required_error: 'Debes seleccionar un rol.',
  }),
});

type AddMemberValues = z.infer<typeof addMemberSchema>;

// ====================
// COMPONENTES
// ====================

function AddMemberDialog({ team, onInvitationSent }: { team: Team, onInvitationSent: () => void }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { email: '', role: 'Entrenador' },
  });

  const onSubmit = async (values: AddMemberValues) => {
    setIsSubmitting(true);
    
    // 1. Check if user exists in 'users' collection
    const usersRef = collection(firestore, 'users');
    const userQuery = query(usersRef, where('email', '==', values.email));
    const userSnapshot = await getDocs(userQuery);

    if (userSnapshot.empty) {
      toast({ variant: 'destructive', title: 'Usuario no encontrado', description: `No hay ningún usuario registrado con el email ${values.email}.` });
      setIsSubmitting(false);
      return;
    }
    
    const invitedUser = userSnapshot.docs[0].data();

    // 2. Check for existing invitation (pending or accepted)
    const invitationsRef = collection(firestore, 'invitations');
    const invitationQuery = query(invitationsRef, 
      where('teamId', '==', team.id), 
      where('invitedUserEmail', '==', values.email),
      where('status', 'in', ['pending', 'accepted'])
    );
    const invitationSnapshot = await getDocs(invitationQuery);

    if (!invitationSnapshot.empty) {
      toast({ variant: 'destructive', title: 'Invitación ya existente', description: 'Este usuario ya ha sido invitado o ya es miembro del equipo.' });
      setIsSubmitting(false);
      return;
    }
    
    // 3. Create invitation
    const invitationData = {
      teamId: team.id,
      teamName: team.name,
      invitedUserEmail: values.email,
      name: invitedUser.displayName || 'Usuario sin nombre',
      role: values.role,
      status: 'pending',
      createdAt: serverTimestamp(),
    };

    addDoc(invitationsRef, invitationData)
      .then(() => {
        toast({ title: 'Invitación enviada', description: `Se ha enviado una invitación a ${values.email}.` });
        onInvitationSent(); // Callback to refetch data
        setIsOpen(false);
        form.reset();
      })
      .catch((error) => {
        console.error("Original Firebase Error:", error);
        const contextualError = new FirestorePermissionError({
          operation: 'create',
          path: 'invitations', // This is a collection path for addDoc
          requestResourceData: invitationData,
        });
        errorEmitter.emit('permission-error', contextualError);
      })
      .finally(() => {
        setIsSubmitting(false);
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <UserPlus className="mr-2 h-4 w-4" />
          Añadir nuevo miembro
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invitar a un Miembro del Cuerpo Técnico</DialogTitle>
          <DialogDescription>
            El usuario debe estar registrado en la plataforma. Recibirá una notificación para unirse a tu equipo.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del usuario</FormLabel>
                  <FormControl>
                    <Input placeholder="email@ejemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Rol en el equipo</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {staffRoles.map(role => (
                        <SelectItem key={role} value={role}>{role}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TeamStaffTable({ members, owner, team, isOwner, onDataChange }: { members: TeamMember[], owner: TeamMember, team: Team, isOwner: boolean, onDataChange: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleRoleChange = async (invitationId: string, newRole: string) => {
        try {
            const invitationRef = doc(firestore, 'invitations', invitationId);
            await updateDoc(invitationRef, { role: newRole });
            toast({ title: 'Rol actualizado', description: 'El rol del miembro ha sido actualizado.'});
            onDataChange();
        } catch (error) {
            console.error('Error updating role:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
        }
    };
    
    const handleRemoveMember = async (member: TeamMember) => {
        if (!member.invitationId) return;

        try {
            const batch = writeBatch(firestore);

            const invitationRef = doc(firestore, 'invitations', member.invitationId);
            batch.delete(invitationRef);

            if (member.status === 'accepted') {
                const teamRef = doc(firestore, 'teams', team.id);
                const userSnapshot = await getDocs(query(collection(firestore, 'users'), where('email', '==', member.email)));
                if (!userSnapshot.empty) {
                    const userId = userSnapshot.docs[0].id;
                    batch.update(teamRef, { memberIds: arrayRemove(userId) });
                }
            }

            await batch.commit();
            toast({ title: 'Miembro eliminado', description: 'El usuario ha sido eliminado del equipo.'});
            onDataChange();

        } catch (error) {
            console.error('Error removing member:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al miembro.' });
        }
    };

    const allMembers = [owner, ...members];

    return (
        <Card>
            <CardHeader>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    Lista de usuarios con acceso a este equipo. Desde aquí puedes enviar invitaciones o eliminar miembros.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-auto border rounded-lg">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[220px]">Rol</TableHead>
                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {allMembers.length > 0 ? (
                                allMembers.map((member) => (
                                    <TableRow key={member.email}>
                                        <TableCell className="font-medium">{member.displayName || 'N/A'}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            {member.role === 'Propietario' ? (
                                                <Input value="Propietario" disabled />
                                            ) : member.status === 'pending' ? (
                                                <div className="text-sm text-muted-foreground italic">Invitación pendiente</div>
                                            ) : (
                                                <Select 
                                                    defaultValue={member.role}
                                                    onValueChange={(newRole) => handleRoleChange(member.invitationId!, newRole)}
                                                    disabled={!isOwner}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {staffRoles.map(role => (
                                                            <SelectItem key={role} value={role}>{role}</SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.role !== 'Propietario' && isOwner && (
                                                 <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                        <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            Esta acción no se puede deshacer. Se eliminará al miembro del equipo y se revocará su acceso.
                                                        </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleRemoveMember(member)}>
                                                            Eliminar
                                                        </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="h-24 text-center text-muted-foreground">
                                        Aún no has añadido ningún miembro al cuerpo técnico.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function StaffPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();
  const [key, setKey] = useState(0); // Used to force refetch
  const [memberUsers, setMemberUsers] = useState<UserProfile[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(true);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId, key]);

  const invitationsRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(collection(firestore, 'invitations'), where('teamId', '==', teamId));
  }, [firestore, teamId, key]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  const { data: invitations, isLoading: isLoadingInvitations } = useCollection(invitationsRef);
  
  const ownerRef = useMemoFirebase(() => {
    if (!firestore || !team?.ownerId) return null;
    return doc(firestore, 'users', team.ownerId);
  }, [firestore, team?.ownerId, key]);

  const { data: ownerData, isLoading: isLoadingOwner } = useDoc<UserProfile>(ownerRef);

  const fetchMemberUsers = useCallback(async () => {
    if (!firestore || !invitations) {
      setIsLoadingMembers(false);
      return;
    }
    
    const acceptedMemberEmails = invitations
      .filter(inv => inv.status === 'accepted')
      .map(inv => inv.invitedUserEmail);
      
    if (acceptedMemberEmails.length === 0) {
      setMemberUsers([]);
      setIsLoadingMembers(false);
      return;
    }
    
    setIsLoadingMembers(true);
    try {
      if (acceptedMemberEmails.length > 0) {
        const q = query(collection(firestore, 'users'), where('email', 'in', acceptedMemberEmails));
        const snapshot = await getDocs(q);
        const usersData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as UserProfile));
        setMemberUsers(usersData);
      } else {
        setMemberUsers([]);
      }
    } catch (error) {
      console.error("Error fetching member users:", error);
      setMemberUsers([]);
    } finally {
      setIsLoadingMembers(false);
    }
  }, [firestore, invitations]);

  useEffect(() => {
    if (!isLoadingInvitations && invitations) {
      fetchMemberUsers();
    }
  }, [invitations, isLoadingInvitations, fetchMemberUsers]);

  const teamMembers = useMemo(() => {
    if (!invitations) return [];
    
    return invitations.map(inv => {
      const userData = memberUsers?.find(u => u.email === inv.invitedUserEmail);
      return {
        id: userData?.id || '',
        displayName: inv.name || userData?.displayName,
        email: inv.invitedUserEmail,
        photoURL: userData?.photoURL,
        role: inv.role,
        invitationId: inv.id,
        status: inv.status,
      }
    }).filter(member => member.email !== ownerData?.email);
  }, [invitations, memberUsers, ownerData]);


  const owner: TeamMember | null = ownerData ? {
      ...ownerData,
      role: 'Propietario',
  } : null;

  const isOwner = user && team && user.uid === team.ownerId;
  const isLoading = isLoadingTeam || isLoadingInvitations || isLoadingOwner || isLoadingMembers;

  const handleDataChange = () => {
    setKey(prev => prev + 1); // Increment key to trigger refetch
  };

  if (isLoading && !team) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-64" />
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
  
  if (!user || (user.uid !== team.ownerId && !team.memberIds?.includes(user.uid))) {
    return (
        <div className="container mx-auto px-4 py-8 text-center">
           <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
           <p className="text-muted-foreground mb-4">No tienes permisos para gestionar el cuerpo técnico de este equipo.</p>
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
                <Briefcase className="mr-3 h-10 w-10" />
                Cuerpo Técnico
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
                Gestiona los miembros del equipo, sus roles y sus accesos.
            </p>
        </div>
        <div className="flex items-center gap-4">
          <Button asChild variant="outline">
            <Link href={`/equipo/gestion/${teamId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Panel
            </Link>
          </Button>
          {isOwner && <AddMemberDialog team={team} onInvitationSent={handleDataChange} />}
        </div>
      </div>

       <div className="space-y-8">
         {isLoading ? (
            <Skeleton className="h-96 w-full" />
         ) : owner && (
            <TeamStaffTable members={teamMembers} owner={owner} team={team} isOwner={!!isOwner} onDataChange={handleDataChange} />
         )}
       </div>
    </div>
  );
}

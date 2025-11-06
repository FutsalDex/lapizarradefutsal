
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, writeBatch, query, where, addDoc, serverTimestamp, getDocs, updateDoc, deleteDoc, arrayUnion, getDoc, arrayRemove, setDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

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
  ownerName?: string;
  memberIds?: string[];
}

interface TeamMember {
    id: string; // Document ID from teamMembers collection
    userId: string;
    name: string;
    email: string;
    role: string;
    teamId: string;
}

interface UserProfile {
  id: string;
  displayName?: string;
  email: string;
  photoURL?: string;
  subscription?: 'Básico' | 'Pro' | 'Invitado';
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
    
    const usersRef = collection(firestore, 'users');
    const userQuery = query(usersRef, where('email', '==', values.email));
    
    try {
        const userSnapshot = await getDocs(userQuery);

        if (userSnapshot.empty) {
          toast({ variant: 'destructive', title: 'Usuario no encontrado', description: `No hay ningún usuario registrado con el email ${values.email}.` });
          setIsSubmitting(false);
          return;
        }
        
        const invitedUserDoc = userSnapshot.docs[0];
        const invitedUserId = invitedUserDoc.id;
        const invitedUserData = invitedUserDoc.data();

        const teamMembersRef = collection(firestore, 'teamMembers');
        const memberQuery = query(teamMembersRef, 
          where('teamId', '==', team.id), 
          where('userId', '==', invitedUserId)
        );
        const memberSnapshot = await getDocs(memberQuery);

        if (!memberSnapshot.empty) {
          toast({ variant: 'destructive', title: 'Miembro ya existente', description: 'Este usuario ya es miembro del equipo.' });
          setIsSubmitting(false);
          return;
        }
        
        const batch = writeBatch(firestore);
        
        const newMemberRef = doc(collection(firestore, 'teamMembers'));
        batch.set(newMemberRef, {
            teamId: team.id,
            userId: invitedUserId,
            email: values.email,
            name: invitedUserData.displayName || 'Usuario sin nombre',
            role: values.role,
            createdAt: serverTimestamp(),
        });
        
        const teamRef = doc(firestore, 'teams', team.id);
        batch.update(teamRef, {
            memberIds: arrayUnion(invitedUserId)
        });
        
        await batch.commit();

        toast({ title: 'Miembro añadido', description: `${values.email} ha sido añadido al equipo.` });
        onInvitationSent();
        setIsOpen(false);
        form.reset();
          
    } catch (error) {
        console.error("Error adding member:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo añadir al miembro.' });
    } finally {
        setIsSubmitting(false);
    }
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
          <DialogTitle>Añadir Miembro al Cuerpo Técnico</DialogTitle>
          <DialogDescription>
            El usuario debe estar registrado en la plataforma para poder ser añadido.
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
                {isSubmitting ? 'Añadiendo...' : 'Añadir Miembro'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

function TeamStaffTable({ members, team, isOwner, onDataChange }: { members: TeamMember[], team: Team, isOwner: boolean, onDataChange: () => void }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const user = useUser();

    const handleRoleChange = async (member: TeamMember, newRole: string) => {
        try {
            if (member.userId === team.ownerId) {
                // It's the owner. Check if a teamMember doc exists, if not create one.
                const membersRef = collection(firestore, 'teamMembers');
                const q = query(membersRef, where("teamId", "==", team.id), where("userId", "==", member.userId));
                const snapshot = await getDocs(q);

                if (snapshot.empty) {
                    // Create a new document for the owner as a team member
                    await addDoc(membersRef, {
                        teamId: team.id,
                        userId: member.userId,
                        email: member.email,
                        name: member.name,
                        role: newRole,
                        createdAt: serverTimestamp(),
                    });
                } else {
                    // Update existing document
                    const docId = snapshot.docs[0].id;
                    await updateDoc(doc(firestore, 'teamMembers', docId), { role: newRole });
                }
            } else {
                // It's a regular member, just update their doc
                const memberRef = doc(firestore, 'teamMembers', member.id);
                await updateDoc(memberRef, { role: newRole });
            }
            toast({ title: 'Rol actualizado', description: 'El rol del miembro ha sido actualizado.'});
            onDataChange();
        } catch (error) {
            console.error('Error updating role:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo actualizar el rol.' });
        }
    };
    
    const handleRemoveMember = async (member: TeamMember) => {
        if (!member.id) return;

        try {
            const batch = writeBatch(firestore);

            const memberRef = doc(firestore, 'teamMembers', member.id);
            batch.delete(memberRef);

            const teamRef = doc(firestore, 'teams', team.id);
            batch.update(teamRef, { memberIds: arrayRemove(member.userId) });

            await batch.commit();
            toast({ title: 'Miembro eliminado', description: 'El usuario ha sido eliminado del equipo.'});
            onDataChange();

        } catch (error) {
            console.error('Error removing member:', error);
            toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar al miembro.' });
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    Lista de usuarios con acceso a este equipo.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="w-full overflow-x-auto border rounded-lg">
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
                            {members.length > 0 ? (
                                members.map((member) => (
                                    <TableRow key={member.userId}>
                                        <TableCell className="font-medium">{member.name || 'N/A'}</TableCell>
                                        <TableCell>{member.email}</TableCell>
                                        <TableCell>
                                            <Select 
                                                defaultValue={member.role}
                                                onValueChange={(newRole) => handleRoleChange(member, newRole)}
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
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {member.userId !== team.ownerId && isOwner && (
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
  const [key, setKey] = useState(0); 
  const [ownerProfile, setOwnerProfile] = useState<TeamMember | null>(null);
  const [isLoadingOwner, setIsLoadingOwner] = useState(true);

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);

  const { data: userProfileData } = useDoc<UserProfile>(userProfileRef);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId, key]);

  const teamMembersQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(collection(firestore, 'teamMembers'), where('teamId', '==', teamId));
  }, [firestore, teamId, key]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  const { data: teamMembers, isLoading: isLoadingMembers } = useCollection<TeamMember>(teamMembersQuery);

  const fetchOwnerProfile = useCallback(async () => {
    if (!firestore || !team?.ownerId) {
        setIsLoadingOwner(false);
        return;
    };

    setIsLoadingOwner(true);
    try {
        const ownerInMembersList = teamMembers?.find(m => m.userId === team.ownerId);

        if (ownerInMembersList) {
             setOwnerProfile(ownerInMembersList);
        } else {
            const userRef = doc(firestore, 'users', team.ownerId);
            const userSnap = await getDoc(userRef);
            if (userSnap.exists()) {
                const userData = userSnap.data() as UserProfile;
                setOwnerProfile({
                    id: '', // No document ID in teamMembers
                    userId: team.ownerId,
                    name: userData.displayName || 'Propietario',
                    email: userData.email,
                    role: 'Propietario',
                    teamId: team.id
                });
            }
        }
    } catch (error) {
        console.error("Error fetching owner profile:", error);
    } finally {
        setIsLoadingOwner(false);
    }
  }, [firestore, team, teamMembers]);


  useEffect(() => {
    if (team) {
        fetchOwnerProfile();
    }
  }, [team, teamMembers, fetchOwnerProfile]);
  
  const allMembers = useMemo(() => {
    const combined = [...(teamMembers || [])];

    if (ownerProfile && !combined.some(m => m.userId === ownerProfile.userId)) {
      combined.push(ownerProfile);
    }
    
    // Sort so owner is always first
    return combined.sort((a, b) => {
        if (a.userId === team?.ownerId) return -1;
        if (b.userId === team?.ownerId) return 1;
        return (a.name || '').localeCompare(b.name || '');
    });
  }, [teamMembers, ownerProfile, team?.ownerId]);

  const isOwner = user && team && user.uid === team.ownerId;
  const isProPlan = userProfileData?.subscription === 'Pro';
  const isLoading = isLoadingTeam || isLoadingMembers || isLoadingOwner;

  const handleDataChange = () => {
    setKey(prev => prev + 1);
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

  if (!team && !isLoading) {
    return null;
  }
  
  if (!user || (user.uid !== team?.ownerId && !team?.memberIds?.includes(user.uid))) {
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

  if (!team) return null;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-8 gap-4">
        <div>
            <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
                <Briefcase className="mr-3 h-10 w-10" />
                Cuerpo Técnico
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
                Gestiona los miembros del equipo, sus roles y sus accesos.
            </p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline">
            <Link href={`/equipo/gestion/${teamId}`}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver
            </Link>
          </Button>
          {isOwner && isProPlan && <AddMemberDialog team={team} onInvitationSent={handleDataChange} />}
        </div>
      </div>

       <div className="space-y-8">
         {isLoading ? (
            <Skeleton className="h-96 w-full" />
         ) : (
            <TeamStaffTable members={allMembers} team={team} isOwner={!!isOwner} onDataChange={handleDataChange} />
         )}
         {isOwner && !isProPlan && (
            <Card className="border-primary">
                <CardHeader>
                    <CardTitle>Función Pro</CardTitle>
                    <CardDescription>
                        Para añadir miembros a tu cuerpo técnico, necesitas una suscripción al Plan Pro.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Button asChild>
                        <Link href="/suscripcion">
                            Ver Planes de Suscripción
                        </Link>
                    </Button>
                </CardContent>
            </Card>
         )}
       </div>
    </div>
  );
}

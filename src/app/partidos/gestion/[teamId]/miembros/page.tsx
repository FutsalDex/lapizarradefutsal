'use client';

import { useState, useMemo, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc, collection, addDoc, serverTimestamp, where, query, deleteDoc, updateDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
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
} from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, UserPlus, Trash2, Loader2, UserCog } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

interface Team {
  id: string;
  name: string;
  ownerId: string;
}

interface TeamInvitation {
    id: string;
    userId: string; // ID of the invited user
    email: string; // email of the invited user
    name: string; // name of the invited user
    role: string;
    status: 'pending' | 'accepted' | 'rejected';
}

interface UserProfile {
    id: string;
    email: string;
    displayName?: string;
}

interface TeamMember {
  id: string; 
  name: string;
  email: string;
  role: string;
  invitationId?: string; 
}

const staffInvitationSchema = z.object({
    email: z.string().email('Introduce un email válido.'),
    name: z.string().min(2, 'El nombre es requerido'),
    role: z.string({ required_error: 'Debes seleccionar un rol.' }),
});

type StaffInvitationForm = z.infer<typeof staffInvitationSchema>;


export default function TeamMembersPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    // 1. Get Team Info
    const teamRef = useMemoFirebase(() => {
        if (!firestore || !teamId) return null;
        return doc(firestore, 'teams', teamId);
    }, [firestore, teamId]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

    // Get owner's user profile to display their name
    const ownerProfileRef = useMemoFirebase(() => {
        if (!firestore || !team?.ownerId) return null;
        return doc(firestore, 'users', team.ownerId);
    }, [firestore, team?.ownerId]);
    const { data: ownerProfile, isLoading: isLoadingOwnerProfile } = useDoc<UserProfile>(ownerProfileRef);

    // 2. Get accepted invitations for this team
    const invitationsQuery = useMemoFirebase(() => {
        if (!firestore || !teamId) return null;
        return query(collection(firestore, 'teamInvitations'), where('teamId', '==', teamId), where('status', '==', 'accepted'));
    }, [firestore, teamId]);

    const { data: invitations, isLoading: isLoadingInvitations } = useCollection<TeamInvitation>(invitationsQuery);
    
    // 3. Combine data to create the final members list
    const staffMembers = useMemo<TeamMember[]>(() => {
        if (!team) return [];

        const membersMap = new Map<string, TeamMember>();
        
        // Add owner
        if (ownerProfile) {
             membersMap.set(ownerProfile.id, {
                id: ownerProfile.id,
                name: ownerProfile.displayName || ownerProfile.email || 'Propietario',
                email: ownerProfile.email || 'N/A',
                role: 'Propietario',
            });
        }
        
        // Add accepted members from invitations
        (invitations || []).forEach(inv => {
            if (!membersMap.has(inv.userId)) {
                 membersMap.set(inv.userId, {
                    id: inv.userId,
                    name: inv.name || inv.email,
                    email: inv.email,
                    role: inv.role,
                    invitationId: inv.id,
                });
            }
        });
        return Array.from(membersMap.values());
    }, [team, invitations, ownerProfile]);
    
    const form = useForm<StaffInvitationForm>({
        resolver: zodResolver(staffInvitationSchema),
        defaultValues: { email: '', name: '' },
    });

    const onSubmit = async (data: StaffInvitationForm) => {
        if (!firestore || !user || !team) return;
        setIsSubmitting(true);
        
        const invitationData = {
            teamId: team.id,
            teamName: team.name,
            userId: "TBD_BY_FUNCTION", // This will be resolved by a cloud function based on email
            email: data.email, 
            name: data.name,
            role: data.role,
            status: 'pending',
            invitedByUserId: user.uid,
            createdAt: serverTimestamp(),
        };

        addDoc(collection(firestore, 'teamInvitations'), invitationData)
        .then(() => {
            toast({
                title: 'Invitación enviada',
                description: `Se ha enviado una invitación a ${data.name}.`
            });
            form.reset();
            setIsDialogOpen(false);
        }).catch((error) => {
             const permissionError = new FirestorePermissionError({
                path: 'teamInvitations',
                operation: 'create',
                requestResourceData: invitationData,
            });
            errorEmitter.emit('permission-error', permissionError);
        }).finally(() => {
            setIsSubmitting(false);
        });
    };
    
    const handleDeleteMember = async (member: TeamMember) => {
        if (!firestore || !member.invitationId) {
             toast({ title: 'Error', description: 'No se puede eliminar al propietario o el miembro no tiene una invitación asociada.', variant: 'destructive'});
             return;
        }
        
        const invitationRef = doc(firestore, 'teamInvitations', member.invitationId);
        
        deleteDoc(invitationRef)
            .then(() => {
                toast({ title: 'Miembro eliminado', description: `${member.name} ha sido eliminado del equipo.`});
            })
            .catch((error) => {
                 const permissionError = new FirestorePermissionError({
                    path: invitationRef.path,
                    operation: 'delete',
                });
                errorEmitter.emit('permission-error', permissionError);
            });
    }

    const handleRoleChange = async (memberId: string, newRole: string) => {
         const member = staffMembers.find(m => m.id === memberId);
         if (!firestore || !member?.invitationId) return;

         const invitationRef = doc(firestore, 'teamInvitations', member.invitationId);
         updateDoc(invitationRef, { role: newRole })
            .then(() => {
                toast({ title: 'Rol actualizado', description: `El rol de ${member.name} ahora es ${newRole}.`})
            })
            .catch(error => {
                const permissionError = new FirestorePermissionError({
                    path: invitationRef.path,
                    operation: 'update',
                    requestResourceData: { role: newRole }
                });
                errorEmitter.emit('permission-error', permissionError);
            })
    }

    const isLoading = isLoadingTeam || isLoadingInvitations || isLoadingOwnerProfile;

    if (isLoading && !team) {
        return (
             <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }
    
    const isOwner = user?.uid === team?.ownerId;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="flex justify-between items-center mb-8">
                <div className='flex items-center gap-4'>
                    <UserCog className="w-8 h-8 text-primary" />
                    <div>
                        <h1 className="text-3xl font-bold font-headline text-primary">Miembros del Equipo</h1>
                        <p className="text-muted-foreground">Gestiona los roles y accesos del cuerpo técnico.</p>
                    </div>
                </div>
                <Button asChild variant="outline">
                    <Link href={`/partidos/gestion/${teamId}`}>
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Volver al Panel
                    </Link>
                </Button>
            </div>
            
            <Card>
                <CardHeader className="flex flex-row justify-between items-center">
                    <div>
                        <CardTitle>Cuerpo Técnico</CardTitle>
                        <CardDescription>Desde aquí puedes invitar, eliminar y cambiar el rol de los miembros.</CardDescription>
                    </div>
                     <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <AlertDialogTrigger asChild>
                            <Button disabled={!isOwner}>
                                <UserPlus className="mr-2 h-4 w-4" />
                                Añadir nuevo miembro
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <Form {...form}>
                                <form onSubmit={form.handleSubmit(onSubmit)}>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>Invitar nuevo miembro al cuerpo técnico</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Introduce los datos del usuario a invitar.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    
                                    <div className="py-4 space-y-4">
                                         <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre</FormLabel>
                                                <FormControl><Input placeholder="Nombre del miembro" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="email" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Email</FormLabel>
                                                <FormControl><Input type="email" placeholder="email@ejemplo.com" {...field} /></FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                        <FormField control={form.control} name="role" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Rol</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Selecciona un rol" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="Entrenador">Entrenador</SelectItem>
                                                        <SelectItem value="2º Entrenador">2º Entrenador</SelectItem>
                                                        <SelectItem value="Delegado">Delegado</SelectItem>
                                                        <SelectItem value="Preparador Físico">Preparador Físico</SelectItem>
                                                        <SelectItem value="Analista">Analista Táctico/Scouting</SelectItem>
                                                        <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                                                        <SelectItem value="Médico">Médico</SelectItem>
                                                        <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                                                        <SelectItem value="Nutricionista">Nutricionista</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}/>
                                    </div>

                                    <AlertDialogFooter>
                                        <AlertDialogCancel type="button">Cancelar</AlertDialogCancel>
                                        <Button type="submit" disabled={isSubmitting}>
                                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                            Crear Invitación
                                        </Button>
                                    </AlertDialogFooter>
                                </form>
                            </Form>
                        </AlertDialogContent>
                    </AlertDialog>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead>Rol</TableHead>
                                <TableHead className="text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        <p className="text-muted-foreground">Cargando miembros...</p>
                                    </TableCell>
                                </TableRow>
                            ) : staffMembers.length > 0 ? (
                                staffMembers.map((member) => (
                                    <TableRow key={member.id}>
                                        <TableCell className="font-medium">{member.name}</TableCell>
                                        <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                        <TableCell>
                                             <Select 
                                                defaultValue={member.role} 
                                                disabled={member.role === 'Propietario' || !isOwner}
                                                onValueChange={(newRole) => handleRoleChange(member.id, newRole)}
                                             >
                                                <SelectTrigger className="w-[180px]">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="Propietario">Propietario</SelectItem>
                                                    <SelectItem value="Entrenador">Entrenador</SelectItem>
                                                    <SelectItem value="2º Entrenador">2º Entrenador</SelectItem>
                                                    <SelectItem value="Delegado">Delegado</SelectItem>
                                                    <SelectItem value="Preparador Físico">Preparador Físico</SelectItem>
                                                    <SelectItem value="Analista">Analista Táctico/Scouting</SelectItem>
                                                    <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                                                    <SelectItem value="Médico">Médico</SelectItem>
                                                    <SelectItem value="Psicólogo">Psicólogo</SelectItem>
                                                    <SelectItem value="Nutricionista">Nutricionista</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {isOwner && member.role !== 'Propietario' && (
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Se eliminará a {member.name} del cuerpo técnico. Esta acción revocará su acceso.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteMember(member)}>Eliminar</AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center">
                                        <p className="text-muted-foreground">No hay miembros en el cuerpo técnico.</p>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

    
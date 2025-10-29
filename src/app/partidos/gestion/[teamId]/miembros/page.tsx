
'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { doc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
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

interface Team {
  id: string;
  name: string;
  ownerId: string;
}

const staffInvitationSchema = z.object({
    name: z.string().min(2, 'El nombre es obligatorio.'),
    email: z.string().email('Introduce un email válido.'),
    role: z.string({ required_error: 'Debes seleccionar un rol.' }),
});

type StaffInvitationForm = z.infer<typeof staffInvitationSchema>;

// Mock data, this should come from Firestore later
const staffMembers = [
    { id: '1', name: 'Francisco', email: 'futsaldex@gmail.com', role: 'Propietario' }
];

export default function TeamMembersPage() {
    const params = useParams();
    const teamId = params.teamId as string;
    const firestore = useFirestore();
    const { user } = useUser();
    const { toast } = useToast();
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    const teamRef = useMemoFirebase(() => {
        if (!firestore || !teamId) return null;
        return doc(firestore, 'teams', teamId);
    }, [firestore, teamId]);
    const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

    const form = useForm<StaffInvitationForm>({
        resolver: zodResolver(staffInvitationSchema),
        defaultValues: {
            name: '',
            email: '',
        },
    });

    const onSubmit = async (data: StaffInvitationForm) => {
        if (!firestore || !user || !team) return;
        setIsSubmitting(true);
        
        try {
            // This is a simplified version. A real implementation would need to check
            // if the user exists, handle sending emails, and create a secure token.
            // For now, we'll just add to a 'teamInvitations' collection.
            await addDoc(collection(firestore, 'teamInvitations'), {
                teamId: team.id,
                teamName: team.name,
                invitedUserEmail: data.email,
                invitedUserName: data.name,
                role: data.role,
                status: 'pending',
                invitedByUserId: user.uid,
                createdAt: serverTimestamp(),
            });

            toast({
                title: 'Invitación enviada',
                description: `Se ha enviado una invitación a ${data.name} para unirse como ${data.role}.`
            });
            form.reset();
            setIsDialogOpen(false);
        } catch (error) {
            console.error("Error creating invitation:", error);
            toast({
                title: 'Error',
                description: 'No se pudo crear la invitación.',
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoadingTeam) {
        return (
             <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full" />
            </div>
        )
    }

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
                            <Button>
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
                                            Introduce los datos del nuevo miembro. Se generará una invitación para que se una.
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    
                                    <div className="py-4 space-y-4">
                                        <FormField control={form.control} name="name" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Nombre y Apellidos</FormLabel>
                                                <FormControl><Input placeholder="Nombre completo" {...field} /></FormControl>
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
                            {staffMembers.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell className="font-medium">{member.name}</TableCell>
                                    <TableCell className="text-muted-foreground">{member.email}</TableCell>
                                    <TableCell>
                                         <Select defaultValue={member.role} disabled={member.role === 'Propietario'}>
                                            <SelectTrigger className="w-[180px]">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Propietario">Propietario</SelectItem>
                                                <SelectItem value="Entrenador">Entrenador</SelectItem>
                                                <SelectItem value="2º Entrenador">2º Entrenador</SelectItem>
                                                <SelectItem value="Delegado">Delegado</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        {member.role !== 'Propietario' && (
                                            <Button variant="ghost" size="icon">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}

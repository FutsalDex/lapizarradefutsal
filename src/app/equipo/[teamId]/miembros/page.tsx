'use client';

import { useState, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  query,
  where,
  addDoc,
  doc,
  deleteDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import {
  Mail,
  UserPlus,
  Trash2,
  ArrowLeft,
  ShieldCheck,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
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
} from '@/components/ui/alert-dialog';

// ====================
// TIPOS DE DATOS
// ====================
const inviteSchema = z.object({
  email: z.string().email('El correo electrónico no es válido.'),
  role: z.enum(['technical_staff', 'player'], {
    required_error: 'Debes seleccionar un rol.',
  }),
});

type InviteValues = z.infer<typeof inviteSchema>;

interface Team {
  id: string;
  name: string;
  ownerId: string;
  memberIds?: string[];
}

interface TeamInvitation {
  id: string;
  invitedUserEmail: string;
  role: 'technical_staff' | 'player';
  status: 'pending' | 'accepted' | 'rejected';
  teamId: string;
}

interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  photoURL?: string;
}

// ====================
// COMPONENTES
// ====================

function InviteMemberForm({ team }: { team: Team }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<InviteValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: { email: '', role: 'player' },
  });

  const onSubmit = async (values: InviteValues) => {
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'invitations'), {
        teamId: team.id,
        teamName: team.name,
        invitedUserEmail: values.email.toLowerCase(),
        role: values.role,
        status: 'pending',
        createdAt: serverTimestamp(),
      });
      toast({
        title: 'Invitación enviada',
        description: `Se ha invitado a ${values.email} a unirse al equipo.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error enviando invitación:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo enviar la invitación.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <UserPlus className="mr-2 h-5 w-5" />
          Invitar Miembro
        </CardTitle>
        <CardDescription>
          Envía una invitación para unirse a tu equipo.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email del Miembro</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="email"
                        placeholder="ejemplo@email.com"
                        {...field}
                        className="pl-9"
                      />
                    </div>
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
                  <FormLabel>Rol</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecciona un rol" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="technical_staff">Cuerpo Técnico</SelectItem>
                      <SelectItem value="player">Jugador</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Enviando...' : 'Enviar Invitación'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function PendingInvitations({ teamId }: { teamId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const pendingInvitationsQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(
      collection(firestore, 'invitations'),
      where('teamId', '==', teamId),
      where('status', '==', 'pending')
    );
  }, [firestore, teamId]);

  const { data: invitations, isLoading } =
    useCollection<TeamInvitation>(pendingInvitationsQuery);

  const handleDelete = async (invitationId: string) => {
    try {
      await deleteDoc(doc(firestore, 'invitations', invitationId));
      toast({ title: 'Invitación eliminada correctamente' });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo eliminar la invitación.',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invitaciones Pendientes</CardTitle>
        <CardDescription>
          Invitaciones que todavía no han sido aceptadas.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-16 w-full" />}
        {!isLoading && (!invitations || invitations.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            No hay invitaciones pendientes.
          </p>
        )}
        {!isLoading && invitations && invitations.length > 0 && (
          <ul className="space-y-3">
            {invitations.map((invitation) => (
              <li
                key={invitation.id}
                className="flex items-center justify-between rounded-lg border p-3"
              >
                <div>
                  <p className="font-semibold">{invitation.invitedUserEmail}</p>
                  <p className="text-sm text-muted-foreground">
                    {invitation.role === 'technical_staff'
                      ? 'Cuerpo Técnico'
                      : 'Jugador'}
                  </p>
                </div>
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción no se puede deshacer y eliminará la
                        invitación permanentemente.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleDelete(invitation.id)}
                        className="bg-destructive hover:bg-destructive/90"
                      >
                        Eliminar
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

function RosterTable({ memberIds }: { memberIds: string[] }) {
  const firestore = useFirestore();

  const membersQuery = useMemoFirebase(() => {
    if (!firestore || memberIds.length === 0) return null;
    // Firestore 'in' query is limited to 30 items
    return query(
      collection(firestore, 'users'),
      where('__name__', 'in', memberIds.slice(0, 30))
    );
  }, [firestore, memberIds]);

  const { data: members, isLoading } = useCollection<UserProfile>(membersQuery);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          Plantilla del Equipo
        </CardTitle>
        <CardDescription>
          Miembros actuales que han aceptado la invitación.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && <Skeleton className="h-40 w-full" />}
        {!isLoading && (!members || members.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-8">
            La plantilla está vacía. ¡Invita a miembros para empezar!
          </p>
        )}
        {!isLoading && members && members.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Email</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-medium">
                    {member.displayName}
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
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

  const isOwner = user && team && user.uid === team.ownerId;
  const isLoading = isLoadingTeam;

  const memberIds = useMemo(() => {
      const ids = new Set<string>();
      if(team?.ownerId) ids.add(team.ownerId);
      if(team?.memberIds) team.memberIds.forEach(id => ids.add(id));
      return Array.from(ids);
  }, [team]);


  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-8">
        <Skeleton className="h-8 w-48" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            <Skeleton className="h-64 w-full" />
          </div>
          <div className="lg:col-span-1 space-y-4">
            <Skeleton className="h-48 w-full" />
             <Skeleton className="h-64 w-full" />
          </div>
        </div>
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
  
  const canManage = isOwner; // || team.memberIds?.includes(user?.uid) etc.

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/equipo/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel del Equipo
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
          <ShieldCheck className="mr-3 h-10 w-10" />
          Gestionar Plantilla: {team.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Visualiza la plantilla, invita nuevos miembros y gestiona las invitaciones pendientes.
        </p>
      </div>

       {!canManage && (
         <Card className="text-center py-16 max-w-lg mx-auto">
            <CardHeader>
                <CardTitle>Acceso Denegado</CardTitle>
                <CardDescription>No tienes permisos para gestionar la plantilla de este equipo.</CardDescription>
            </CardHeader>
         </Card>
      )}

      {canManage && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="lg:col-span-2">
              <RosterTable memberIds={memberIds} />
            </div>
            <div className="lg:col-span-1 space-y-8">
              {isOwner && <InviteMemberForm team={team} />}
              <PendingInvitations teamId={teamId} />
            </div>
        </div>
      )}
    </div>
  );
}

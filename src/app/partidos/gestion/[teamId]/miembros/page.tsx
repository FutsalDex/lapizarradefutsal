'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  collection,
  query,
  where,
  doc,
  setDoc,
} from 'firebase/firestore';
import {
  useCollection,
  useDoc,
  useFirestore,
  useUser,
} from '@/firebase';
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
import { useToast } from '@/hooks/use-toast';
import { Mail, UserPlus, Trash2, ArrowLeft, ShieldCheck } from 'lucide-react';
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
} from "@/components/ui/alert-dialog";


// ==================== VALIDACIÓN DEL FORMULARIO ====================

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
}

interface TeamInvitation {
  id: string;
  invitedUserEmail: string;
  role: 'technical_staff' | 'player';
  status: 'pending' | 'accepted' | 'rejected';
}


// ==================== FORMULARIO PARA ENVIAR INVITACIONES ====================

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
      const invitationId = `${values.email.toLowerCase()}_${team.id}`.replace(/[^a-zA-Z0-9_@.]/g, "_");

      await setDoc(doc(firestore, 'invitations', invitationId), {
        teamId: team.id,
        teamName: team.name,
        invitedUserEmail: values.email.toLowerCase(),
        role: values.role,
        status: 'pending',
        createdAt: new Date().toISOString(),
      });

      toast({
        title: 'Invitación enviada',
        description: `Se ha invitado a ${values.email} a unirse al equipo.`,
      });
      form.reset();
    } catch (error) {
      console.error("Error sending invitation:", error);
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
          Envía una invitación por correo electrónico para unirse a tu equipo.
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
                      <Input type="email" placeholder="ejemplo@email.com" {...field} className="pl-9" />
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


// ==================== LISTADO DE MIEMBROS ====================

function MembersList({ teamId }: { teamId: string }) {
  const firestore = useFirestore();
  const { toast } = useToast();

  const invitationsQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(
      collection(firestore, 'invitations'),
      where('teamId', '==', teamId),
      where('status', 'in', ['pending', 'accepted'])
    );
  }, [firestore, teamId]);

  const { data: invitations, isLoading } = useCollection<TeamInvitation>(invitationsQuery);

  const getStatusChip = (status: TeamInvitation['status']) => {
    switch (status) {
      case 'pending': return <span className="text-xs font-medium text-yellow-600 bg-yellow-100 px-2 py-1 rounded-full">Pendiente</span>;
      case 'accepted': return <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">Aceptado</span>;
      default: return null;
    }
  };

  const getRoleText = (role: TeamInvitation['role']) => {
    return role === 'technical_staff' ? 'Cuerpo Técnico' : 'Jugador';
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Miembros del Equipo</CardTitle>
        <CardDescription>Lista de miembros y estado de sus invitaciones.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
          </div>
        )}
        {!isLoading && (!invitations || invitations.length === 0) && (
          <p className="text-sm text-muted-foreground text-center py-4">
            Aún no has invitado a nadie a tu equipo.
          </p>
        )}
        {!isLoading && invitations && invitations.length > 0 && (
          <ul className="space-y-3">
            {invitations.map(invitation => (
              <li key={invitation.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="font-semibold">{invitation.invitedUserEmail}</p>
                  <p className="text-sm text-muted-foreground">{getRoleText(invitation.role)}</p>
                </div>
                <div className="flex items-center gap-4">
                  {getStatusChip(invitation.status)}
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
                          Esta acción no se puede deshacer. Se eliminará la invitación y si el usuario la había aceptado, se le revocará el acceso.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={() => toast({ title: "Funcionalidad no implementada" })} className="bg-destructive hover:bg-destructive/90">
                          Eliminar
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}


// ==================== PÁGINA PRINCIPAL ====================

export default function MembersPage() {
  const params = useParams();
  const router = useRouter();
  const teamId = typeof params.teamId === 'string' ? params.teamId : undefined;
  const firestore = useFirestore();
  const { user, isLoading: isLoadingUser } = useUser();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);

  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  if (isLoadingUser || isLoadingTeam) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <p>Cargando sesión y datos del equipo...</p>
      </div>
    );
  }

  if (!user) {
    router.push('/acceso');
    return null;
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

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a Mis Equipos
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
          <ShieldCheck className="mr-3 h-10 w-10" />
          Gestionar: {team.name}
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Invita y gestiona los miembros de tu equipo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
        <div className="md:col-span-2">
          {teamId && <MembersList teamId={teamId} />}
        </div>
        <div className="md:col-span-1">
          <InviteMemberForm team={team} />
        </div>
      </div>
    </div>
  );
}


'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, PlusCircle, ArrowRight, Eye } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

// Schema for the team creation form
const createTeamSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  club: z.string().optional(),
  season: z.string().optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;

interface Team {
  id: string;
  name: string;
  club?: string;
  season?: string;
  ownerId: string;
}

interface TeamInvitation {
  id: string;
  teamId: string;
  teamName: string;
  invitedUserEmail: string;
  status: 'pending' | 'accepted' | 'rejected';
}

function CreateTeamForm() {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', club: '', season: '' },
  });

  const onSubmit = async (values: CreateTeamValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un equipo.' });
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'teams'), {
        name: values.name,
        club: values.club,
        season: values.season,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Éxito', description: 'Equipo creado correctamente.' });
      form.reset();
    } catch (error) {
      console.error("Error creating team:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo crear el equipo.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><PlusCircle className="mr-2 h-5 w-5" />Crear Nuevo Equipo</CardTitle>
        <CardDescription>Añade un nuevo equipo para empezar a gestionarlo.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nombre del Equipo</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: Futsal Kings" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="club"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Club (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: City Futsal Club" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="season"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temporada (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 2024-2025" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Creando...' : 'Crear Equipo'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function TeamList() {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const ownedTeamsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'teams'), where('ownerId', '==', user.uid));
  }, [firestore, user]);

  const acceptedInvitationsQuery = useMemoFirebase(() => {
    if (!user || !user.email || !firestore) return null;
    return query(
      collection(firestore, 'invitations'),
      where('invitedUserEmail', '==', user.email),
      where('status', '==', 'accepted')
    );
  }, [firestore, user]);

  const { data: ownedTeams, isLoading: isLoadingOwned } = useCollection<Team>(ownedTeamsQuery);
  const { data: acceptedInvitations, isLoading: isLoadingInvites } = useCollection<TeamInvitation>(acceptedInvitationsQuery);
  
  const memberTeamIds = useMemo(() => {
    return acceptedInvitations ? acceptedInvitations.map(inv => inv.teamId) : [];
  }, [acceptedInvitations]);

  const canFetchMemberTeams = !isLoadingInvites && memberTeamIds.length > 0;

  const memberTeamsQuery = useMemoFirebase(() => {
    if (!firestore || !canFetchMemberTeams) return null;
    return query(collection(firestore, 'teams'), where('__name__', 'in', memberTeamIds));
  }, [firestore, canFetchMemberTeams, memberTeamIds]);

  const { data: memberTeams, isLoading: isLoadingMember } = useCollection<Team>(memberTeamsQuery);
  
  const isLoading = isAuthLoading || isLoadingOwned || isLoadingInvites || (canFetchMemberTeams && isLoadingMember);
  
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center"><Users className="mr-2 h-5 w-5" />Mis Equipos</CardTitle>
        <CardDescription>Equipos que gestionas o en los que participas.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
             <Skeleton className="h-10 w-full" />
             <Skeleton className="h-10 w-full" />
          </div>
        ) : (
          <div className="space-y-4">
            {(!ownedTeams || ownedTeams.length === 0) && (!memberTeams || memberTeams.length === 0) && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No has creado ningún equipo ni perteneces a ninguno.
              </p>
            )}
            <div className="space-y-2">
                {ownedTeams && ownedTeams.map(team => (
                  <TeamListItem key={team.id} team={team} isOwner />
                ))}
                {memberTeams && memberTeams.map(team => (
                  <TeamListItem key={team.id} team={team} />
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


function TeamListItem({ team, isOwner = false }: { team: Team, isOwner?: boolean }) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-3 hover:bg-muted/50 transition-colors">
            <div>
                <h4 className="font-semibold">{team.name}</h4>
                <p className="text-sm text-muted-foreground">
                    {isOwner ? 'Propietario' : 'Miembro del cuerpo técnico'}
                </p>
            </div>
            <Button asChild variant="ghost" size="sm">
                <Link href={`/equipo/gestion/${team.id}/miembros`}>
                    Gestionar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

export default function GestionPage() {
    const { user, isUserLoading } = useUser();

  if (isUserLoading) {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                <h1 className="text-4xl font-bold font-headline text-primary flex items-center justify-center">
                    <Shield className="mr-3 h-10 w-10" />
                    Gestión de Equipos
                </h1>
                <p className="text-lg text-muted-foreground mt-2">Crea equipos, gestiona tu plantilla y prepara tus partidos.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="md:col-span-2">
                <Skeleton className="h-64 w-full" />
                </div>
                <div className="md:col-span-1">
                <Skeleton className="h-48 w-full" />
                </div>
            </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8 text-center">
                 <h1 className="text-4xl font-bold font-headline text-primary flex items-center justify-center">
                    <Shield className="mr-3 h-10 w-10" />
                    Gestión de Equipos
                </h1>
                <p className="text-lg text-muted-foreground mt-2">Crea equipos, gestiona tu plantilla y prepara tus partidos.</p>
            </div>
            <Card className="text-center py-16 max-w-lg mx-auto">
                <CardHeader>
                <CardTitle>Acceso Requerido</CardTitle>
                <CardDescription>Debes iniciar sesión para gestionar tus equipos.</CardDescription>
                </CardHeader>
                <CardContent>
                <Button asChild>
                    <Link href="/acceso">
                    <Eye className="mr-2 h-4 w-4" />
                    Iniciar Sesión o Registrarse
                    </Link>
                </Button>
                </CardContent>
            </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center justify-center">
            <Shield className="mr-3 h-10 w-10" />
            Gestión de Equipos
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Crea equipos, gestiona tu plantilla y prepara tus partidos.</p>
      </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-2">
              <TeamList />
            </div>
            <div className="md:col-span-1">
              <CreateTeamForm />
            </div>
        </div>
    </div>
  );
}

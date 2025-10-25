'use client';

import { useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth, useCollection, useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp, where, query, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, PlusCircle, Users, Check, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';

// Esquema de validación para el formulario de creación de equipo
const teamSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  club: z.string().optional(),
  season: z.string().optional(),
});

type TeamFormInputs = z.infer<typeof teamSchema>;

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
    userId: string;
    invitedByUserId: string;
    status: 'pending' | 'accepted' | 'rejected';
}


export default function GestionEquiposPage() {
  const { user } = useUser();
  const firestore = useFirestore();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<TeamFormInputs>({
    resolver: zodResolver(teamSchema),
    defaultValues: { name: '', club: '', season: '' },
  });

  // Query para obtener los equipos creados por el usuario
  const teamsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teams');
  }, [firestore]);

  const userTeamsQuery = useMemoFirebase(() => {
    if (!teamsCollectionRef || !user) return null;
    return query(teamsCollectionRef, where('ownerId', '==', user.uid));
  }, [teamsCollectionRef, user]);

  const { data: userTeams, isLoading: isLoadingTeams } = useCollection<Team>(userTeamsQuery);
  
  // Query para obtener las invitaciones pendientes del usuario
  const invitationsCollectionRef = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'teamInvitations');
  }, [firestore]);

  const userInvitationsQuery = useMemoFirebase(() => {
    if (!invitationsCollectionRef || !user) return null;
    return query(invitationsCollectionRef, where('userId', '==', user.uid), where('status', '==', 'pending'));
  }, [invitationsCollectionRef, user]);

  const { data: invitations, isLoading: isLoadingInvitations } = useCollection<TeamInvitation>(userInvitationsQuery);


  const handleCreateTeam: SubmitHandler<TeamFormInputs> = async (data) => {
    if (!user || !teamsCollectionRef) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Debes iniciar sesión para crear un equipo.',
      });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(teamsCollectionRef, {
        ...data,
        ownerId: user.uid,
        createdAt: serverTimestamp(),
      });
      toast({
        title: '¡Equipo creado!',
        description: `El equipo "${data.name}" ha sido creado correctamente.`,
      });
      form.reset();
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        variant: 'destructive',
        title: 'Error al crear el equipo',
        description: 'Ha ocurrido un problema. Por favor, inténtalo de nuevo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInvitation = async (invitationId: string, accept: boolean) => {
    if (!firestore) return;
    const invitationRef = doc(firestore, 'teamInvitations', invitationId);
    try {
        if (accept) {
            await updateDoc(invitationRef, { status: 'accepted' });
            // Aquí podríamos añadir al usuario a una subcolección 'members' del equipo si quisiéramos
            toast({ title: '¡Invitación aceptada!' });
        } else {
            await updateDoc(invitationRef, { status: 'rejected' });
            toast({ title: 'Invitación rechazada', variant: 'destructive' });
        }
    } catch (error) {
        console.error("Error handling invitation", error);
        toast({ title: 'Error al procesar la invitación', variant: 'destructive'});
    }
  }


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Formulario para Crear Equipo */}
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
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del Equipo</FormLabel>
                      <FormControl>
                        <Input placeholder="Ej: Furia Roja FS" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                   <FormField
                    control={form.control}
                    name="club"
                    render={({ field }) => (
                        <FormItem>
                        <FormLabel>Club (Opcional)</FormLabel>
                        <FormControl>
                            <Input placeholder="Ej: Club Deportivo Local" {...field} />
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
                </div>
                <Button type="submit" disabled={isSubmitting} className="w-full md:w-auto">
                  {isSubmitting ? <Loader2 className="animate-spin" /> : 'Crear Equipo'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>

        {/* Listado de "Mis Equipos" */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2" /> Mis Equipos
            </CardTitle>
            <CardDescription>Equipos que has creado y administras.</CardDescription>
          </CardHeader>
          <CardContent>
            {isLoadingTeams ? (
              <p className="text-muted-foreground">Cargando equipos...</p>
            ) : userTeams && userTeams.length > 0 ? (
              <div className="space-y-3">
                {userTeams.map((team) => (
                  <Link key={team.id} href={`/partidos/gestion/${team.id}`} passHref>
                    <div className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent transition-colors cursor-pointer">
                      <div>
                        <p className="font-semibold">{team.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {team.club} {team.season && `(${team.season})`}
                        </p>
                      </div>
                      <ArrowRight className="h-5 w-5 text-muted-foreground" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                Aún no has creado ningún equipo.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Listado de "Invitaciones" */}
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
                            <Button size="icon" variant="outline" onClick={() => handleInvitation(inv.id, true)}>
                                <Check className="h-4 w-4 text-green-500" />
                            </Button>
                             <Button size="icon" variant="outline" onClick={() => handleInvitation(inv.id, false)}>
                                <X className="h-4 w-4 text-red-500" />
                            </Button>
                        </div>
                    </div>
                ))}
              </div>
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No tienes invitaciones pendientes.
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

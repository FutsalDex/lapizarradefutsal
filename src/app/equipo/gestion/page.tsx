'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, where, addDoc, serverTimestamp, or, writeBatch, doc } from 'firebase/firestore';
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
  memberIds?: string[];
}


function CreateTeamForm({ onTeamCreated }: { onTeamCreated: () => void }) {
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
        const batch = writeBatch(firestore);

        // 1. Create the team document
        const teamRef = doc(collection(firestore, 'teams'));
        batch.set(teamRef, {
            name: values.name,
            club: values.club,
            season: values.season,
            ownerId: user.uid,
            ownerName: user.displayName,
            createdAt: serverTimestamp(),
            memberIds: [user.uid] // Automatically add owner as a member
        });
        
        await batch.commit();

        toast({ title: 'Éxito', description: 'Equipo creado correctamente.' });
        form.reset();
        onTeamCreated(); // Callback to trigger list refresh
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

function TeamList({ refreshKey }: { refreshKey: number }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const teamsQuery = useMemoFirebase(() => {
    if (!firestore || !user?.uid) return null;
    
    // Query for teams where the user is a member OR the owner
    return query(
      collection(firestore, 'teams'),
      or(
        where('memberIds', 'array-contains', user.uid),
        where('ownerId', '==', user.uid)
      )
    );
  }, [firestore, user?.uid, refreshKey]);

  const { data: allTeams, isLoading: isLoadingTeams } = useCollection<Team>(teamsQuery);
  
  const isLoading = isAuthLoading || isLoadingTeams;
  
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
            {!allTeams || allTeams.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                No has creado ningún equipo ni perteneces a ninguno.
              </p>
            ) : (
              <div className="space-y-2">
                  {allTeams.map(team => (
                    <TeamListItem key={team.id} team={team} isOwner={team.ownerId === user?.uid} />
                  ))}
              </div>
            )}
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
                <Link href={`/equipo/gestion/${team.id}`}>
                    Gestionar <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
            </Button>
        </div>
    )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="md:col-span-2">
                    <Skeleton className="h-64 w-full" />
                </div>
                <div className="md:col-span-1">
                    <Skeleton className="h-48 w-full" />
                </div>
            </div>
        );
    }

    if (!user) {
        return (
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
        );
    }

    return <>{children}</>;
}


export default function GestionPage() {
  const [key, setKey] = useState(0);
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center justify-center">
            <Shield className="mr-3 h-10 w-10" />
            Gestión de Equipos
        </h1>
        <p className="text-lg text-muted-foreground mt-2">Crea equipos, gestiona tu plantilla y prepara tus partidos.</p>
      </div>
      <AuthGuard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="md:col-span-2">
              <TeamList refreshKey={key} />
            </div>
            <div className="md:col-span-1">
              <CreateTeamForm onTeamCreated={() => setKey(k => k + 1)} />
            </div>
        </div>
      </AuthGuard>
    </div>
  );
}

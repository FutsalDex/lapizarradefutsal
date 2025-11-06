
'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, where, addDoc, serverTimestamp, or, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useCollection, useDoc, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, PlusCircle, Settings, UserCog, Edit, Trash2, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface Team {
  id: string;
  name: string;
  club?: string;
  competition?: string;
  ownerId: string;
  memberIds?: string[];
}

interface UserProfile {
  subscription?: 'Básico' | 'Pro' | 'Invitado';
}

const createTeamSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres.'),
  club: z.string().optional(),
  competition: z.string().optional(),
});

type CreateTeamValues = z.infer<typeof createTeamSchema>;


function CreateTeamForm({ onTeamCreated, disabled, disabledReason }: { onTeamCreated: () => void, disabled: boolean, disabledReason: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<CreateTeamValues>({
    resolver: zodResolver(createTeamSchema),
    defaultValues: { name: '', club: '', competition: '' },
  });

  const onSubmit = async (values: CreateTeamValues) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'Debes iniciar sesión para crear un equipo.' });
      return;
    }
    if (disabled) {
        toast({ variant: 'destructive', title: 'Límite alcanzado', description: disabledReason });
        return;
    }

    setIsSubmitting(true);
    try {
      const teamRef = await addDoc(collection(firestore, 'teams'), {
        ...values,
        ownerId: user.uid,
        ownerName: user.displayName || user.email,
        memberIds: [user.uid],
        createdAt: serverTimestamp(),
      });
      
      toast({
        title: 'Éxito',
        description: 'Equipo creado correctamente.',
      });
      form.reset();
      onTeamCreated(); // Callback to refresh the list
    } catch (error) {
      console.error('Error creating team:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'No se pudo crear el equipo.',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" />
          Crear Nuevo Equipo
        </CardTitle>
        <CardDescription>
          Añade un nuevo equipo para empezar a gestionarlo.
        </CardDescription>
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
              name="competition"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Competición (Opcional)</FormLabel>
                  <FormControl>
                    <Input placeholder="Ej: 1ª División Nacional" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting || disabled} className="w-full">
              {isSubmitting ? 'Creando...' : 'Crear Equipo'}
            </Button>
            {disabled && <p className="text-xs text-center text-destructive mt-2">{disabledReason}</p>}
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}


function OwnedTeamList({ refreshKey, onOwnedTeamsLoaded }: { refreshKey: number, onOwnedTeamsLoaded: (count: number) => void }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const ownedTeamsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'teams'), where('ownerId', '==', user.uid));
  }, [firestore, user, refreshKey]);

  const { data: ownedTeams, isLoading: isLoadingOwned } = useCollection<Team>(ownedTeamsQuery);
  const isLoading = isAuthLoading || isLoadingOwned;

  useMemo(() => {
    if (ownedTeams) {
        onOwnedTeamsLoaded(ownedTeams.length);
    }
  }, [ownedTeams, onOwnedTeamsLoaded]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><Users/>Mis Equipos</CardTitle>
        <CardDescription className='text-xs'>Lista de equipos que administras como propietario.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-20 w-full" /> : 
          <div className="space-y-4">
            {ownedTeams && ownedTeams.length > 0 ? (
              ownedTeams.map(team => <TeamListItem key={team.id} team={team} isOwner />)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No has creado ningún equipo.</p>
            )}
          </div>
        }
      </CardContent>
    </Card>
  )
}

function SharedTeamList({ refreshKey }: { refreshKey: number }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const sharedTeamsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(
      collection(firestore, 'teams'),
      where('memberIds', 'array-contains', user.uid),
      where('ownerId', '!=', user.uid)
    );
  }, [firestore, user, refreshKey]);

  const { data: sharedTeams, isLoading: isLoadingShared } = useCollection<Team>(sharedTeamsQuery);
  const isLoading = isAuthLoading || isLoadingShared;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base"><UserCog/>Equipos Compartidos</CardTitle>
        <CardDescription className='text-xs'>Equipos a los que has sido invitado como miembro del cuerpo técnico.</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? <Skeleton className="h-20 w-full" /> : 
          <div className="space-y-4">
            {sharedTeams && sharedTeams.length > 0 ? (
              sharedTeams.map(team => <TeamListItem key={team.id} team={team} />)
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No eres miembro de ningún equipo.</p>
            )}
          </div>
        }
      </CardContent>
    </Card>
  );
}


function TeamListItem({ team, isOwner = false }: { team: Team, isOwner?: boolean }) {
    const { toast } = useToast();
    const firestore = useFirestore();

    const handleDelete = async () => {
        try {
            await deleteDoc(doc(firestore, "teams", team.id));
            toast({ title: "Equipo eliminado", description: `El equipo "${team.name}" ha sido eliminado.` });
            // This won't auto-refresh, parent component needs a refreshKey strategy
        } catch (error) {
            console.error("Error deleting team:", error);
            toast({ variant: "destructive", title: "Error", description: "No se pudo eliminar el equipo." });
        }
    }

    return (
        <div className="rounded-lg border bg-background p-4">
            <div className="flex items-center justify-between">
                <div>
                    <h4 className="font-semibold">{team.name}</h4>
                    <p className="text-sm text-muted-foreground">{team.club || 'Sin club'}</p>
                </div>
                <div className="flex items-center gap-2">
                     <Button asChild>
                        <Link href={`/equipo/gestion/${team.id}`}>
                           <Settings className="mr-2 h-4 w-4" /> Gestionar
                        </Link>
                    </Button>
                    {isOwner && (
                        <>
                           <Button variant="ghost" size="icon" disabled><Edit className="h-4 w-4"/></Button>
                            <AlertDialog>
                                <AlertDialogTrigger asChild>
                                    <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4"/></Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                    <AlertDialogHeader>
                                        <AlertDialogTitle>¿Estás seguro de que quieres eliminar el equipo?</AlertDialogTitle>
                                        <AlertDialogDescription>
                                            Esta acción no se puede deshacer. Se eliminará permanentemente el equipo y todos sus datos asociados (jugadores, partidos, etc.).
                                        </AlertDialogDescription>
                                    </AlertDialogHeader>
                                    <AlertDialogFooter>
                                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                        <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                                    </AlertDialogFooter>
                                </AlertDialogContent>
                            </AlertDialog>
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="md:col-span-2 space-y-8"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
                <div className="md:col-span-1"><Skeleton className="h-64 w-full" /></div>
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
                        <Link href="/acceso">Acceder</Link>
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return <>{children}</>;
}


export default function GestionEquiposPage() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [ownedTeamsCount, setOwnedTeamsCount] = useState(0);
  const { user } = useUser();
  const firestore = useFirestore();

  const userProfileRef = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return doc(firestore, 'users', user.uid);
  }, [user, firestore]);
    
  const { data: userProfile } = useDoc<UserProfile>(userProfileRef);

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };
  
  const { isCreationDisabled, disabledReason } = useMemo(() => {
    const plan = userProfile?.subscription;
    if (plan === 'Invitado') {
        return { isCreationDisabled: true, disabledReason: 'Necesitas un plan de suscripción para crear equipos.'};
    }
    if (plan === 'Básico' && ownedTeamsCount >= 1) {
        return { isCreationDisabled: true, disabledReason: 'El Plan Básico permite solo 1 equipo.'};
    }
    if (plan === 'Pro' && ownedTeamsCount >= 3) {
        return { isCreationDisabled: true, disabledReason: 'El Plan Pro permite hasta 3 equipos.'};
    }
    return { isCreationDisabled: false, disabledReason: ''};
  }, [userProfile, ownedTeamsCount]);


  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <Button asChild variant="outline" className="mb-4">
                <Link href={`/equipo/gestion`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel
                </Link>
            </Button>
            <div className="flex items-center gap-3">
                <div className="bg-primary/10 text-primary rounded-full p-3 border border-primary/20">
                    <Shield className="h-6 w-6" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Gestión de Equipos</h1>
                    <p className="text-muted-foreground mt-1">Crea y administra tus equipos. Invita a tu cuerpo técnico para colaborar.</p>
                </div>
            </div>
        </div>
      <AuthGuard>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-7xl mx-auto">
            <div className="md:col-span-2 space-y-8">
                <OwnedTeamList refreshKey={refreshKey} onOwnedTeamsLoaded={setOwnedTeamsCount}/>
                <SharedTeamList refreshKey={refreshKey} />
            </div>
             <div className="md:col-span-1">
                <CreateTeamForm onTeamCreated={handleRefresh} disabled={isCreationDisabled} disabledReason={disabledReason}/>
             </div>
        </div>
      </AuthGuard>
    </div>
  );
}


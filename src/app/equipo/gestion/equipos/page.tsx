'use client';

import { useState, useMemo } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { collection, query, where, addDoc, serverTimestamp, or, writeBatch, doc, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Shield, Users, PlusCircle, Settings, UserCog, Edit, Trash2 } from 'lucide-react';
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


function OwnedTeamList({ refreshKey }: { refreshKey: number }) {
  const { user, isUserLoading: isAuthLoading } = useUser();
  const firestore = useFirestore();

  const ownedTeamsQuery = useMemoFirebase(() => {
    if (!user || !firestore) return null;
    return query(collection(firestore, 'teams'), where('ownerId', '==', user.uid));
  }, [firestore, user, refreshKey]);

  const { data: ownedTeams, isLoading: isLoadingOwned } = useCollection<Team>(ownedTeamsQuery);
  const isLoading = isAuthLoading || isLoadingOwned;

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
                {!isOwner && (
                    <Button asChild>
                        <Link href={`/equipo/gestion/${team.id}`}>
                            <Settings className="mr-2 h-4 w-4" /> Gestionar Equipo
                        </Link>
                    </Button>
                )}
            </div>
            {isOwner && (
                <div className="mt-4 pt-4 border-t flex items-center justify-end gap-2">
                    <Button asChild>
                        <Link href={`/equipo/gestion/${team.id}`}>
                           <Settings className="mr-2" /> Gestionar
                        </Link>
                    </Button>
                    <Button asChild variant="outline">
                         <Link href={`/equipo/gestion/${team.id}/cuerpo-tecnico`}>
                            <Users className="mr-2" /> Miembros
                        </Link>
                    </Button>
                    <Button variant="ghost" size="icon" disabled><Edit /></Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 /></Button>
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
                </div>
            )}
        </div>
    )
}

function AuthGuard({ children }: { children: React.ReactNode }) {
    const { user, isUserLoading } = useUser();

    if (isUserLoading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                <div className="md:col-span-1"><Skeleton className="h-64 w-full" /></div>
                <div className="md:col-span-2 space-y-8"><Skeleton className="h-48 w-full" /><Skeleton className="h-48 w-full" /></div>
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
  const [key, setKey] = useState(0);
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="mb-8">
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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1">
               {/* The form was here, but it's handled by the new match page now */}
            </div>
            <div className="lg:col-span-2 space-y-8">
              <OwnedTeamList refreshKey={key} />
              <SharedTeamList refreshKey={key} />
            </div>
        </div>
      </AuthGuard>
    </div>
  );
}

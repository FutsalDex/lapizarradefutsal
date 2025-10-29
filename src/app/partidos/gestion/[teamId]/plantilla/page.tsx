
'use client';

import { useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where, doc, documentId, setDoc, addDoc, getDocs, serverTimestamp } from 'firebase/firestore';
import { useDoc, useFirestore, useCollection, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { errorEmitter } from '@/firebase/error-emitter';
import { FirestorePermissionError } from '@/firebase/errors';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, UserPlus, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';

interface Team {
  id: string;
  name: string;
  ownerId: string;
}

interface Player {
  id: string; // This is the document ID from the 'players' subcollection
  name: string;
  role: 'player' | 'coach';
  dorsal?: number;
  posicion?: string;
}

const getInitials = (name?: string) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length > 1) {
        return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
}

const addPlayerSchema = z.object({
  name: z.string().min(2, 'El nombre es obligatorio.'),
  dorsal: z.coerce.number().min(0, 'El dorsal no puede ser negativo.').optional(),
  posicion: z.string().optional(),
});


function AddPlayerDialog({ team }: { team: Team | null }) {
    const firestore = useFirestore();
    const { toast } = useToast();
    const [open, setOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const params = useParams();
    const { teamId } = params;

    const form = useForm<z.infer<typeof addPlayerSchema>>({
        resolver: zodResolver(addPlayerSchema),
        defaultValues: { name: '', dorsal: undefined, posicion: '' },
    });

    const onSubmit = async (values: z.infer<typeof addPlayerSchema>) => {
        if (!firestore || !team || typeof teamId !== 'string') {
            toast({ title: 'Error', description: 'No se ha podido añadir al jugador. Inténtalo de nuevo.', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        
        const playersRef = collection(firestore, 'teams', teamId, 'players');
        const playerData = {
            name: values.name,
            role: 'player',
            dorsal: values.dorsal ?? null,
            posicion: values.posicion ?? null,
        };
        
        addDoc(playersRef, playerData)
            .then(() => {
                toast({ title: '¡Jugador añadido!', description: `${values.name} ha sido añadido a la plantilla.` });
                form.reset();
                setOpen(false);
            })
            .catch((error) => {
                const permissionError = new FirestorePermissionError({
                    path: playersRef.path,
                    operation: 'create',
                    requestResourceData: playerData,
                });
                errorEmitter.emit('permission-error', permissionError);
            })
            .finally(() => {
                setIsSubmitting(false);
            });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button>
                    <UserPlus className="mr-2 h-4 w-4" /> Dar de alta jugador
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Dar de alta a un nuevo jugador</DialogTitle>
                    <DialogDescription>
                        Añade un nuevo miembro a tu equipo '{team?.name}'.
                    </DialogDescription>
                </DialogHeader>
                 <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Nombre del jugador</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nombre completo" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <div className="grid grid-cols-2 gap-4">
                           <FormField
                                control={form.control}
                                name="dorsal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Dorsal (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input type="number" placeholder="Ej: 10" {...field} value={field.value ?? ''} onChange={field.onChange} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                             <FormField
                                control={form.control}
                                name="posicion"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Posición (Opcional)</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Ej: Cierre" {...field} value={field.value ?? ''} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>
                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isSubmitting ? 'Añadiendo...' : 'Añadir Jugador a la Plantilla'}
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}

function Roster() {
    const firestore = useFirestore();
    const params = useParams();
    const teamId = params.teamId as string;
    
    const teamPlayersSubcollectionRef = useMemoFirebase(() => {
        if (!firestore || !teamId) return null;
        return collection(firestore, 'teams', teamId, 'players');
    }, [firestore, teamId]);

    const { data: roster, isLoading: isLoadingRoster } = useCollection<Player>(teamPlayersSubcollectionRef);

    if (isLoadingRoster) {
         return (
            <div className="space-y-2">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="flex items-center space-x-4 p-4">
                        <Skeleton className="h-8 w-8 rounded-full" />
                        <div className='flex-grow space-y-2'>
                           <Skeleton className="h-4 w-3/4" />
                           <Skeleton className="h-4 w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        );
    }
    
    if (!roster || roster.length === 0) {
        return (
            <div className="text-center py-16 text-muted-foreground border-2 border-dashed rounded-lg">
                <p className="font-semibold">Aún no hay miembros en este equipo.</p>
                <p className="text-sm mt-1">Usa el botón "Dar de alta jugador" para añadir a tu primer miembro.</p>
            </div>
        );
    }

    return (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead className="w-[80px]">Dorsal</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Posición</TableHead>
                    <TableHead>Rol</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {roster.map((player) => (
                    <TableRow key={player.id}>
                        <TableCell className="font-medium text-center">{player.dorsal ?? '-'}</TableCell>
                        <TableCell>
                            <div className="flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                    <AvatarFallback>{getInitials(player.name)}</AvatarFallback>
                                </Avatar>
                                <span className="font-medium">{player.name || 'Usuario sin nombre'}</span>
                            </div>
                        </TableCell>
                        <TableCell>{player.posicion ?? '-'}</TableCell>
                        <TableCell className="text-muted-foreground capitalize">{player.role}</TableCell>
                    </TableRow>
                ))}
            </TableBody>
        </Table>
    );
}

export default function TeamRosterPage() {
  const params = useParams();
  const teamId = params.teamId as string;
  const firestore = useFirestore();
  const { user } = useUser();

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return doc(firestore, 'teams', teamId);
  }, [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);
  
  const isOwner = user?.uid === team?.ownerId;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/partidos/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel
          </Link>
        </Button>
        {isLoadingTeam ? <Skeleton className='h-10 w-1/2' /> : <h1 className="text-4xl font-bold font-headline text-primary">Plantilla de {team?.name}</h1>}
        <p className="text-lg text-muted-foreground mt-2">Visualiza y gestiona los miembros de tu equipo.</p>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Miembros del Equipo</CardTitle>
                <CardDescription>
                    {isLoadingTeam ? <Skeleton className="h-4 w-32 mt-1" /> : `Gestiona la plantilla de tu equipo.`}
                </CardDescription>
            </div>
            {isOwner && <AddPlayerDialog team={team} />}
        </CardHeader>
        <CardContent>
           <Roster />
        </CardContent>
      </Card>
    </div>
  );
}


'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, increment, writeBatch, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, CheckCircle, Clock, Gift, ThumbsUp, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


interface Invitation {
  id: string;
  inviterId: string;
  inviterEmail: string;
  inviteeEmail: string;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: { toDate: () => Date };
}

interface UserProfile {
  id: string;
  email: string;
  subscription: 'Invitado' | 'Básico' | 'Pro';
}

function InvitationRow({ invitation, allUsers, onApprove, onDelete, isProcessing }: { invitation: Invitation, allUsers: UserProfile[], onApprove: (invitation: Invitation, invitee: UserProfile) => void, onDelete: (invitationId: string) => void, isProcessing: boolean }) {
    const invitee = useMemo(() => {
    if (!allUsers || !invitation.inviteeEmail) return null;
    const inviteeEmailLower = invitation.inviteeEmail.toLowerCase();
    return allUsers.find(u => u.email && u.email.toLowerCase() === inviteeEmailLower) || null;
  }, [allUsers, invitation.inviteeEmail]);

    const isInviteeRegistered = !!invitee;

    const canApprove = invitation.status === 'pending' && isInviteeRegistered;

    return (
        <TableRow>
            <TableCell>{invitation.inviterEmail}</TableCell>
            <TableCell>{invitation.inviteeEmail}</TableCell>
            <TableCell>{format(invitation.createdAt.toDate(), 'dd/MM/yyyy')}</TableCell>
            <TableCell>
                {invitee ? (
                    <Badge variant={invitee.subscription === 'Básico' || invitee.subscription === 'Pro' ? 'default' : 'secondary'}>{invitee.subscription}</Badge>
                ) : (
                    <Badge variant="outline">No Registrado</Badge>
                )}
            </TableCell>
             <TableCell>
                <Badge variant={invitation.status === 'completed' ? 'default' : invitation.status === 'pending' ? 'secondary' : 'destructive'}>
                    {invitation.status}
                </Badge>
            </TableCell>
            <TableCell className="text-right flex items-center justify-end">
                <Button 
                    size="sm"
                    onClick={() => invitee && onApprove(invitation, invitee)}
                    disabled={!canApprove || isProcessing}
                >
                    {isProcessing ? 'Procesando...' : <><ThumbsUp className="mr-2 h-4 w-4" /> Aprobar</>}
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" disabled={isProcessing}>
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción es irreversible y eliminará la invitación permanentemente.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => onDelete(invitation.id)} className="bg-destructive hover:bg-destructive/90">
                                Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </TableCell>
        </TableRow>
    );
}

export default function AdminInvitationsPage() {
  const firestore = useFirestore();
  const { user: adminUser, isUserLoading: isAuthLoading } = useUser();
  const isAdmin = adminUser?.email === 'futsaldex@gmail.com';
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [key, setKey] = useState(0); // To force re-fetch
  const [filter, setFilter] = useState<'pending' | 'completed' | 'all'>('pending');

  const invitationsQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    const baseQuery = collection(firestore, 'invitations');
    if (filter === 'all') return baseQuery;
    return query(baseQuery, where('status', '==', filter));
  }, [firestore, isAdmin, key, filter]);

  const usersQuery = useMemoFirebase(() => {
    if (!firestore || !isAdmin) return null;
    return collection(firestore, 'users');
  }, [firestore, isAdmin]);

  const { data: invitations, isLoading: isLoadingInvites } = useCollection<Invitation>(invitationsQuery);
  const { data: allUsers, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersQuery);

  const sortedInvitations = useMemo(() => {
    if (!invitations) return [];
    return [...invitations].sort((a, b) => b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime());
  }, [invitations]);


  const handleApprove = async (invitation: Invitation, invitee: UserProfile) => {
    setIsProcessing(true);
    try {
        const batch = writeBatch(firestore);

        // Update invitation status
        const invitationRef = doc(firestore, 'invitations', invitation.id);
        batch.update(invitationRef, { status: 'completed', completedAt: serverTimestamp() });

        // Add points to inviter
        const inviterRef = doc(firestore, 'users', invitation.inviterId);
        batch.update(inviterRef, { points: increment(25) });

        await batch.commit();
        
        toast({ title: "Invitación Aprobada", description: `Se han añadido 25 puntos a ${invitation.inviterEmail}.` });
        setKey(k => k + 1); // Refresh data
    } catch (error) {
        console.error("Error approving invitation:", error);
        toast({ variant: "destructive", title: "Error", description: "No se pudo aprobar la invitación." });
    } finally {
        setIsProcessing(false);
    }
  };
  
  const handleDelete = async (invitationId: string) => {
    setIsProcessing(true);
    try {
        await deleteDoc(doc(firestore, 'invitations', invitationId));
        toast({ title: 'Invitación eliminada' });
        setKey(k => k + 1);
    } catch (error) {
        console.error("Error deleting invitation:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar la invitación.' });
    } finally {
        setIsProcessing(false);
    }
  };

  const isLoading = isAuthLoading || isLoadingInvites || isLoadingUsers;

  if (isAuthLoading) {
    return <div className="container mx-auto px-4 py-8 text-center"><p>Cargando...</p></div>;
  }

  if (!isAdmin) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
        <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/admin`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel de Admin
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Invitaciones</h1>
        <p className="text-lg text-muted-foreground mt-2">Revisa, aprueba y gestiona las invitaciones del programa de fidelización.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Invitaciones</CardTitle>
          <CardDescription>
            Aprueba las invitaciones cuando el invitado se haya registrado para dar puntos al invitador.
          </CardDescription>
          <Tabs value={filter} onValueChange={(value) => setFilter(value as any)} className="pt-4">
             <TabsList>
                <TabsTrigger value="pending"><Clock className="mr-2 h-4 w-4"/>Pendientes</TabsTrigger>
                <TabsTrigger value="completed"><CheckCircle className="mr-2 h-4 w-4"/>Completadas</TabsTrigger>
                <TabsTrigger value="all">Todas</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Email del Invitador</TableHead>
                  <TableHead>Email del Invitado</TableHead>
                  <TableHead>Fecha Invitación</TableHead>
                  <TableHead>Plan del Invitado</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  [...Array(5)].map((_, i) => (
                    <TableRow key={i}>
                      <TableCell colSpan={6}><Skeleton className="h-8 w-full" /></TableCell>
                    </TableRow>
                  ))
                ) : sortedInvitations.length > 0 ? (
                  sortedInvitations.map(invitation => (
                    <InvitationRow
                      key={invitation.id}
                      invitation={invitation}
                      allUsers={allUsers || []}
                      onApprove={handleApprove}
                      onDelete={handleDelete}
                      isProcessing={isProcessing}
                    />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center h-24">
                      No hay invitaciones en esta categoría.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

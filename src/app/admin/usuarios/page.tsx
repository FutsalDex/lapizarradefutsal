'use client';

import { useState, useMemo } from 'react';
import { collection, doc, updateDoc, serverTimestamp, deleteDoc } from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { FirestorePermissionError, errorEmitter } from '@/firebase';


interface UserProfile {
  id: string;
  displayName?: string;
  email: string;
  subscription?: 'Invitado' | 'Básico' | 'Pro';
  subscriptionEndDate?: { toDate: () => Date };
}

function ManageSubscriptionDialog({ user, onSubscriptionUpdated }: { user: UserProfile, onSubscriptionUpdated: () => void }) {
    const [isOpen, setIsOpen] = useState(false);
    const [plan, setPlan] = useState<'Básico' | 'Pro' | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const firestore = useFirestore();
    const { toast } = useToast();

    const handleActivate = async () => {
        if (!plan) {
            toast({ variant: 'destructive', title: 'Error', description: 'Debes seleccionar un plan.' });
            return;
        }
        setIsSubmitting(true);
        const userRef = doc(firestore, 'users', user.id);
        const startDate = new Date();
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 1);

        const updateData = {
            subscription: plan,
            subscriptionStartDate: serverTimestamp(),
            subscriptionEndDate: endDate,
        };

        try {
            await updateDoc(userRef, updateData);
            
            toast({ title: 'Suscripción Activada', description: `El plan ${plan} ha sido activado para ${user.email}.` });
            onSubscriptionUpdated();
            setIsOpen(false);
        } catch (error) {
            console.error("Error activating subscription:", error);
            const contextualError = new FirestorePermissionError({
                path: userRef.path,
                operation: 'update',
                requestResourceData: updateData
            });
            errorEmitter.emit('permission-error', contextualError);
            toast({ variant: 'destructive', title: 'Error de Permisos', description: 'No tienes permiso para actualizar la suscripción.' });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Gestionar Suscripción</DialogTitle>
                    <DialogDescription>Activa un plan anual para {user.email}.</DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <Select onValueChange={(value) => setPlan(value as any)} value={plan}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecciona un plan..." />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Básico">Plan Básico</SelectItem>
                            <SelectItem value="Pro">Plan Pro</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsOpen(false)}>Cancelar</Button>
                    <Button onClick={handleActivate} disabled={!plan || isSubmitting}>
                        {isSubmitting ? 'Activando...' : 'Activar Suscripción por 1 Año'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

export default function AdminUsersPage() {
    const firestore = useFirestore();
    const { user: adminUser, isUserLoading: isAuthLoading } = useUser();
    const isAdmin = adminUser?.email === 'futsaldex@gmail.com';
    const [searchTerm, setSearchTerm] = useState('');
    const [key, setKey] = useState(0);
    const { toast } = useToast();

    const usersCollectionRef = useMemoFirebase(() => {
        if (!firestore || !isAdmin) return null;
        return collection(firestore, 'users');
    }, [firestore, isAdmin, key]);

    const { data: users, isLoading: isLoadingUsers } = useCollection<UserProfile>(usersCollectionRef);

    const filteredUsers = useMemo(() => {
        if (!users) return [];
        return users.filter(u =>
            (u.displayName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
            (u.email?.toLowerCase() || '').includes(searchTerm.toLowerCase())
        );
    }, [users, searchTerm]);
    
    const isLoading = isAuthLoading || isLoadingUsers;

    const handleDeleteUser = async (userToDelete: UserProfile) => {
        if (!isAdmin) {
            toast({ variant: "destructive", title: "Acción no permitida." });
            return;
        }
        try {
            await deleteDoc(doc(firestore, "users", userToDelete.id));
            toast({ title: "Usuario eliminado", description: `El usuario ${userToDelete.email} ha sido eliminado.` });
            setKey(k => k + 1); // Refresh the list
        } catch (error) {
            const contextualError = new FirestorePermissionError({
                path: `users/${userToDelete.id}`,
                operation: 'delete',
            });
            errorEmitter.emit('permission-error', contextualError);
        }
    };

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
                <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Usuarios</h1>
                <p className="text-lg text-muted-foreground mt-2">Lista de todos los usuarios de la plataforma y gestión de suscripciones.</p>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Todos los Usuarios</CardTitle>
                    <CardDescription>
                        {isLoadingUsers ? <Skeleton className="h-4 w-32 mt-1" /> : `${users?.length ?? 0} usuarios en total.`}
                    </CardDescription>
                    <div className="pt-4">
                         <Input 
                            placeholder="Buscar por nombre o email..." 
                            className="max-w-sm"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                         />
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead>Email</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead>Fin Suscripción</TableHead>
                                    <TableHead className="text-right">Acciones</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-full" /></TableCell>
                                    </TableRow>
                                )) : filteredUsers.map(user => {
                                    const endDate = user.subscriptionEndDate?.toDate();
                                    return (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.displayName || '-'}</TableCell>
                                            <TableCell className="text-muted-foreground">{user.email}</TableCell>
                                            <TableCell><Badge variant={user.subscription === 'Invitado' ? 'secondary' : 'default'}>{user.subscription || 'Invitado'}</Badge></TableCell>
                                            <TableCell>{endDate ? format(endDate, 'dd/MM/yyyy') : '-'}</TableCell>
                                            <TableCell className="text-right flex justify-end items-center">
                                                <ManageSubscriptionDialog user={user} onSubscriptionUpdated={() => setKey(k => k + 1)} />
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
                                                                Esta acción no se puede deshacer. Se eliminará el perfil del usuario de la base de datos, pero no se eliminará su cuenta de autenticación de Firebase.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                            <AlertDialogAction onClick={() => handleDeleteUser(user)} className="bg-destructive hover:bg-destructive/90">
                                                                Sí, eliminar
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

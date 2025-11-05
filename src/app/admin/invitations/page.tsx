
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, ThumbsUp, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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

type InvitationStatus = 'Pendiente' | 'Completada' | 'Aprobada';

type Invitation = {
  id: number;
  inviterEmail: string;
  invitedEmail: string;
  invitationDate: string;
  invitedPlan: string;
  status: InvitationStatus;
};

const allInvitationsData: Invitation[] = [
    { id: 1, inviterEmail: 'futsaldex@gmail.com', invitedEmail: 'mixel_75@hotmail.com', invitationDate: '04/11/2025', invitedPlan: 'Pro', status: 'Completada' },
    { id: 2, inviterEmail: 'futsaldex@gmail.com', invitedEmail: 'ruperto@gmail.com', invitationDate: '04/11/2025', invitedPlan: 'No Registrado', status: 'Completada' },
    { id: 3, inviterEmail: 'futsaldex@gmail.com', invitedEmail: 'hgdf@gjj.com', invitationDate: '03/11/2025', invitedPlan: 'No Registrado', status: 'Completada' },
];


export default function InvitationsPage() {
  const [activeTab, setActiveTab] = useState('Completada');
  const [invitations, setInvitations] = useState<Invitation[]>(allInvitationsData);
  
  const filteredInvitations = invitations.filter(invitation => {
    if (activeTab === 'Todas') return true;
    if (activeTab === 'Pendiente') return invitation.status === 'Pendiente';
    if (activeTab === 'Completada') return invitation.status === 'Completada' || invitation.status === 'Aprobada';
    if (activeTab === 'Aprobada') return invitation.status === 'Aprobada';
    return false;
  });

  const handleApprove = (id: number) => {
    setInvitations(invitations.map(inv => inv.id === id ? { ...inv, status: 'Aprobada' } : inv));
  };

  const handleDelete = (id: number) => {
    setInvitations(invitations.filter(inv => inv.id !== id));
  };
  
  const getBadgeVariant = (status: InvitationStatus) => {
    switch (status) {
      case 'Completada':
        return 'secondary';
      case 'Aprobada':
        return 'default';
      case 'Pendiente':
        return 'destructive';
      default:
        return 'outline';
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/admin">
            <ArrowLeft className="mr-2" />
            Volver al Panel de Admin
          </Link>
        </Button>
      </div>

      <div className="mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Invitaciones</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Revisa, aprueba y gestiona las invitaciones del programa de fidelización.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Listado de Invitaciones</CardTitle>
          <CardDescription>
            Aprueba las invitaciones cuando el invitado se haya registrado para dar puntos al invitador.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="Pendiente">Pendientes</TabsTrigger>
              <TabsTrigger value="Completada">Completadas y Aprobadas</TabsTrigger>
              <TabsTrigger value="Todas">Todas</TabsTrigger>
            </TabsList>
            <div className="border rounded-lg mt-4">
                <Table>
                <TableHeader>
                    <TableRow>
                    <TableHead>Email del Invitador</TableHead>
                    <TableHead>Email del Invitado</TableHead>
                    <TableHead>Fecha Invitación</TableHead>
                    <TableHead>Plan del invitado</TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead>Acciones</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {filteredInvitations.length > 0 ? (
                        filteredInvitations.map((invitation) => (
                            <TableRow key={invitation.id}>
                                <TableCell>{invitation.inviterEmail}</TableCell>
                                <TableCell>{invitation.invitedEmail}</TableCell>
                                <TableCell>{invitation.invitationDate}</TableCell>
                                <TableCell>
                                    {invitation.invitedPlan === 'No Registrado' ? (
                                        <span className="text-muted-foreground">{invitation.invitedPlan}</span>
                                    ) : (
                                        <Badge>{invitation.invitedPlan}</Badge>
                                    )}
                                </TableCell>
                                <TableCell>
                                    <Badge variant={getBadgeVariant(invitation.status)}
                                           className={cn({
                                               'bg-green-100 text-green-800': invitation.status === 'Completada',
                                               'bg-blue-100 text-blue-800': invitation.status === 'Aprobada',
                                           })}>
                                        {invitation.status}
                                    </Badge>
                                </TableCell>
                                <TableCell className="flex items-center gap-2">
                                     <Button variant="outline" size="sm" onClick={() => handleApprove(invitation.id)} disabled={invitation.status === 'Aprobada'}>
                                        <ThumbsUp className="mr-2" /> 
                                        {invitation.status === 'Aprobada' ? 'Aprobada' : 'Aprobar'}
                                    </Button>
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
                                                    Esta acción eliminará permanentemente la invitación de {invitation.invitedEmail}. No se puede deshacer.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDelete(invitation.id)}>
                                                    Sí, eliminar
                                                </AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                                No hay invitaciones en esta categoría.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

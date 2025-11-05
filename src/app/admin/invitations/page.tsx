
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

// Future data structure
// type Invitation = {
//   inviterEmail: string;
//   invitedEmail: string;
//   invitationDate: string;
//   invitedPlan: string;
//   status: 'Pendiente' | 'Completada';
// };

export default function InvitationsPage() {
  const [activeTab, setActiveTab] = useState('Pendientes');
  
  // const invitations: Invitation[] = [];

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
              <TabsTrigger value="Pendientes">Pendientes</TabsTrigger>
              <TabsTrigger value="Completadas">Completadas</TabsTrigger>
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
                    <TableRow>
                        <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
                            No hay invitaciones en esta categoría.
                        </TableCell>
                    </TableRow>
                </TableBody>
                </Table>
            </div>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

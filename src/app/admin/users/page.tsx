
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Trash2 } from 'lucide-react';
import Link from 'next/link';

const usersData = [
  { name: 'Michel', email: 'mixel_75@hotmail.com', plan: 'Pro', endDate: '04/11/2026' },
  { name: '-', email: 'rauldrup10@hotmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'dani.ruiz46@gmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'vroldan0@iesnumancia.cat', plan: 'Pro', endDate: '03/11/2026' },
  { name: '-', email: 'chocoanton1964@gmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'josemr_63@hotmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'ibautista2005@gmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'isaac.tarrason@gmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'juanfranro70@gmail.com', plan: 'Pro', endDate: '01/10/2026' },
  { name: '-', email: 'rauldrup10@hotmail.com', plan: 'Pro', endDate: '01/10/2026' },
];

export default function GestionUsuariosPage() {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredUsers = usersData.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Usuarios</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Lista de todos los usuarios de la plataforma y gestión de suscripciones.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Usuarios</CardTitle>
          <CardDescription>{usersData.length} usuarios en total.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-4">
            <Input
              placeholder="Buscar por nombre o email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Fin Suscripción</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.email}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>
                      <Badge>{user.plan}</Badge>
                    </TableCell>
                    <TableCell>{user.endDate}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="icon">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

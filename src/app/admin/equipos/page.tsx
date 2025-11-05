
"use client";

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

type Team = {
  teamName: string;
  club: string;
  season: string;
  ownerEmail: string;
};

const teamsData: Team[] = [
    { teamName: 'Cadete A', club: 'Rapid santa coloma', season: '-', ownerEmail: 'rauldrup10@gmail.com' },
    { teamName: 'Cadete A', club: 'Rapid Santa coloma', season: '-', ownerEmail: 'rauldrup10@hotmail.com' },
    { teamName: 'Juvenil', club: 'Fs tapias', season: '-', ownerEmail: 'josemr_63@hotmail.com' },
    { teamName: 'Cadete A', club: 'F.S. Rapid Santa Coloma', season: '-', ownerEmail: 'isaac.tarrason@gmail.com' },
    { teamName: 'CADETE B', club: 'RAPID SANTA COLOMA', season: '-', ownerEmail: 'juanfranro70@gmail.com' },
    { teamName: 'Víctor', club: 'VICTOR FC', season: '-', ownerEmail: 'victorroldan2911@gmail.com' },
    { teamName: 'Infantil A', club: 'Rapid Santa Coloma', season: '-', ownerEmail: 'dani.ruiz46@gmail.com' },
    { teamName: 'Infantil a', club: 'Rapid', season: '-', ownerEmail: 'test06@gmail.com' },
    { teamName: 'Cadete B', club: 'CD DON ANTONIO', season: '-', ownerEmail: 'froldan73@gmail.com' },
    { teamName: 'JUVENIL B', club: 'F.S. RAPID SANTA COLOMA', season: '-', ownerEmail: 'vroldan0@iesnumancia.cat' },
    { teamName: 'Senior', club: 'Fundació Terrassa', season: '-', ownerEmail: 'fernandosaezcamacho@gmail.com' },
    { teamName: 'Alevín A', club: 'FS Ràpid Santa Coloma', season: '-', ownerEmail: 'ibautista2005@gmail.com' },
    { teamName: 'Juvenil B', club: 'FS Ràpid Santa Coloma', season: '-', ownerEmail: 'futsaldex@gmail.com' },
];

export default function TeamsPage() {
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
        <h1 className="text-4xl font-bold font-headline text-primary">Gestión de Equipos</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Lista de todos los equipos creados en la plataforma.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todos los Equipos</CardTitle>
          <CardDescription>{teamsData.length} equipos en total.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Equipo</TableHead>
                  <TableHead>Club</TableHead>
                  <TableHead>Temporada</TableHead>
                  <TableHead>Propietario (Email)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teamsData.map((team, index) => (
                  <TableRow key={`${team.ownerEmail}-${index}`}>
                    <TableCell className="font-medium">{team.teamName}</TableCell>
                    <TableCell>{team.club}</TableCell>
                    <TableCell>{team.season}</TableCell>
                    <TableCell>{team.ownerEmail}</TableCell>
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

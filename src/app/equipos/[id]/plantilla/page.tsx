
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Briefcase, Trash2, Users } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';

const players = [
    { dorsal: '7', nombre: 'Hugo', posicion: 'Pívot' },
    { dorsal: '9', nombre: 'Marc Romera', posicion: 'Ala' },
    { dorsal: '12', nombre: 'Marc Muñoz', posicion: 'Ala' },
]

export default function PlantillaPage() {
    const params = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-full">
                    <Users className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold font-headline">Mi Plantilla</h1>
                    <p className="text-lg text-muted-foreground mt-1">Gestiona la plantilla de tu equipo y sus datos principales.</p>
                </div>
            </div>
            <Button variant="outline" asChild>
                <Link href={`/equipos/${params.id}`}>
                    <ArrowLeft className="mr-2" />
                    Volver al Panel
                </Link>
            </Button>
      </div>
      

      <div className="space-y-8">
        <Card>
            <CardHeader>
                <CardTitle>Información del Equipo</CardTitle>
                <CardDescription>Datos generales del equipo y cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Club</Label>
                        <Input value="FS Ràpid Santa Coloma" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Equipo</Label>
                        <Input value="Juvenil B" disabled />
                    </div>
                    <div className="space-y-2">
                        <Label>Competición</Label>
                        <Input value="TERCERA DIVISION - GRUPO 5" disabled />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Cuerpo Técnico</Label>
                    <div className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                            <div>
                                <p className="font-semibold">Administrador</p>
                                <p className="text-sm text-muted-foreground">Entrenador</p>
                            </div>
                        </div>
                         <div className="flex items-center gap-3">
                            <Briefcase className="w-5 h-5 text-muted-foreground" />
                             <div>
                                <p className="font-semibold">Michel</p>
                                <p className="text-sm text-muted-foreground">Delegado</p>
                            </div>
                        </div>
                    </div>
                 </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle>Plantilla del Equipo</CardTitle>
                <CardDescription>Introduce los datos de tus jugadores. Máximo 20. Todos los jugadores estarán disponibles para la convocatoria.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Dorsal</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-[200px]">Posición</TableHead>
                                <TableHead className="w-[100px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {players.map((player, index) => (
                                <TableRow key={index}>
                                    <TableCell>
                                        <Input defaultValue={player.dorsal} className="w-16 text-center" />
                                    </TableCell>
                                    <TableCell>
                                        <Input defaultValue={player.nombre} />
                                    </TableCell>
                                    <TableCell>
                                        <Select defaultValue={player.posicion}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Seleccionar" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Portero">Portero</SelectItem>
                                                <SelectItem value="Cierre">Cierre</SelectItem>
                                                <SelectItem value="Ala">Ala</SelectItem>
                                                <SelectItem value="Pívot">Pívot</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon">
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
      </div>
    </div>
  );
}

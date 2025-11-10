
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Briefcase, Trash2, Users, PlusCircle, Save, Edit } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';

const initialPlayers = [
    { dorsal: '7', nombre: 'Hugo', posicion: 'Pívot' },
    { dorsal: '9', nombre: 'Marc Romera', posicion: 'Ala' },
    { dorsal: '12', nombre: 'Marc Muñoz', posicion: 'Ala' },
];

type Player = {
    dorsal: string;
    nombre: string;
    posicion: string;
};

const initialStaff = [
    { id: 1, name: 'Francisco', role: 'Entrenador', email: 'futsaldex@gmail.com' },
    { id: 2, name: 'Juan Pérez', role: 'Delegado', email: 'juan.perez@example.com' }
];

type StaffMember = {
    id: number;
    name: string;
    role: string;
    email: string;
};


export default function PlantillaPage() {
    const params = useParams();
    const [players, setPlayers] = useState<Player[]>(initialPlayers);
    const [staff, setStaff] = useState<StaffMember[]>(initialStaff);

    const handleAddPlayer = () => {
        if (players.length < 20) {
            setPlayers([...players, { dorsal: '', nombre: '', posicion: 'Ala' }]);
        }
    };

    const handleRemovePlayer = (index: number) => {
        const newPlayers = [...players];
        newPlayers.splice(index, 1);
        setPlayers(newPlayers);
    };

    const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
        const newPlayers = [...players];
        newPlayers[index][field] = value;
        setPlayers(newPlayers);
    };

    const handleAddStaffMember = () => {
        setStaff([...staff, { id: Date.now(), name: '', role: 'Asistente', email: '' }]);
    };

    const handleRemoveStaffMember = (id: number) => {
        setStaff(staff.filter(member => member.id !== id));
    };

    const handleStaffChange = (id: number, field: keyof Omit<StaffMember, 'id'>, value: string) => {
        setStaff(staff.map(member => 
            member.id === id ? { ...member, [field]: value } : member
        ));
    };

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
                <CardDescription>Datos generales del equipo.</CardDescription>
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
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Staff Técnico</CardTitle>
                <CardDescription>Gestiona a los miembros del cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-[180px]">Rol</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[120px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member) => (
                                <TableRow key={member.id}>
                                    <TableCell>
                                        <Input 
                                            value={member.name}
                                            onChange={(e) => handleStaffChange(member.id, 'name', e.target.value)}
                                            placeholder="Nombre"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => handleStaffChange(member.id, 'role', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Rol"/>
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Entrenador">Entrenador</SelectItem>
                                                <SelectItem value="Segundo Entrenador">Segundo Entrenador</SelectItem>
                                                <SelectItem value="Delegado">Delegado</SelectItem>
                                                <SelectItem value="Asistente">Asistente</SelectItem>
                                                <SelectItem value="Fisioterapeuta">Fisioterapeuta</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            type="email"
                                            value={member.email}
                                            onChange={(e) => handleStaffChange(member.id, 'email', e.target.value)}
                                            placeholder="Email"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                         <Button variant="ghost" size="icon">
                                            <Edit className="w-5 h-5 text-muted-foreground" />
                                        </Button>
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStaffMember(member.id)}>
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleAddStaffMember}>
                    <PlusCircle className="mr-2" />
                    Añadir Miembro
                </Button>
                <Button>
                    <Save className="mr-2" />
                    Guardar Staff
                </Button>
            </CardFooter>
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
                                        <Input 
                                            value={player.dorsal} 
                                            onChange={(e) => handlePlayerChange(index, 'dorsal', e.target.value)}
                                            className="w-16 text-center" 
                                            placeholder="#"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Input 
                                            value={player.nombre} 
                                            onChange={(e) => handlePlayerChange(index, 'nombre', e.target.value)}
                                            placeholder="Nombre del jugador"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select 
                                            value={player.posicion}
                                            onValueChange={(value) => handlePlayerChange(index, 'posicion', value)}
                                        >
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
                                        <Button variant="ghost" size="icon" onClick={() => handleRemovePlayer(index)}>
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleAddPlayer}>
                    <PlusCircle className="mr-2" />
                    Añadir Jugador
                </Button>
                <Button>
                    <Save className="mr-2" />
                    Guardar Plantilla
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}

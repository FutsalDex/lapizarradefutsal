
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Briefcase, Trash2, UserPlus } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";


const staff = [
    { nombre: 'Administrador', email: 'futsaldex@gmail.com', rol: 'Entrenador' },
    { nombre: 'Michel', email: 'mixel_75@hotmail.com', rol: 'Delegado' },
]

const roles = [
    "Entrenador",
    "2º Entrenador",
    "Delegado",
    "Preparador Físico",
    "Analista Táctico/Scouting",
    "Fisioterapeuta",
    "Médico",
    "Psicólogo",
    "Nutricionista",
];

export default function TecnicosPage() {
    const params = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-start mb-8">
            <div className="flex items-center gap-4">
                <div className="bg-muted p-3 rounded-full">
                    <Briefcase className="w-8 h-8 text-primary" />
                </div>
                <div>
                    <h1 className="text-4xl font-bold font-headline">Cuerpo Técnico</h1>
                    <p className="text-lg text-muted-foreground mt-1">Gestiona los miembros del equipo, sus roles y sus accesos.</p>
                </div>
            </div>
            <div className="flex gap-2">
                 <Button variant="outline" asChild>
                    <Link href={`/equipos/${params.id}`}>
                        <ArrowLeft className="mr-2" />
                        Volver
                    </Link>
                </Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>
                        <UserPlus className="mr-2" />
                        Añadir nuevo miembro
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Añadir Miembro al Cuerpo Técnico</DialogTitle>
                      <DialogDescription>
                        El usuario debe estar registrado en la plataforma para poder ser añadido.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">Email del usuario</Label>
                        <Input id="email" type="email" placeholder="email@ejemplo.com" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="role">Rol en el equipo</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar rol" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map(role => (
                                <SelectItem key={role} value={role}>{role}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit">Añadir</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
            </div>
      </div>
      

      <Card>
        <CardHeader>
            <CardTitle>Miembros del Equipo</CardTitle>
            <CardDescription>Lista de usuarios con acceso a este equipo.</CardDescription>
        </CardHeader>
        <CardContent>
            <div className="overflow-x-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Nombre</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead className="w-[200px]">Rol</TableHead>
                            <TableHead className="w-[100px] text-right">Acciones</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {staff.map((member, index) => (
                            <TableRow key={index}>
                                <TableCell className="font-medium">{member.nombre}</TableCell>
                                <TableCell>{member.email}</TableCell>
                                <TableCell>
                                    <Select defaultValue={member.rol}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Seleccionar rol" />
                                        </SelectTrigger>
                                        <SelectContent>
                                           {roles.map(role => (
                                                <SelectItem key={role} value={role}>{role}</SelectItem>
                                            ))}
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
  );
}

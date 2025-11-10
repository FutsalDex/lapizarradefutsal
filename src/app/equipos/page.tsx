
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, PlusCircle, Settings, Shield, Trash2, Users, Save } from "lucide-react";
import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Team = {
  id: string;
  name: string;
  club: string;
};

const initialTeams: Team[] = [
    { id: '1', name: 'Juvenil B', club: 'FS Ràpid Santa Coloma' }
];


export default function EquiposPage() {
  const [teams, setTeams] = useState<Team[]>(initialTeams);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', club: '', season: '', competition: '' });

  const handleAddTeam = () => {
    if (!newTeam.name || !newTeam.club) return;
    
    const newTeamData: Team = {
      id: String(Date.now()),
      name: newTeam.name,
      club: newTeam.club,
    };
    
    setTeams(prev => [...prev, newTeamData]);
    setIsAddDialogOpen(false);
    setNewTeam({ name: '', club: '', season: '', competition: '' });
  };

  const handleDeleteTeam = (teamId: string) => {
    setTeams(prev => prev.filter(team => team.id !== teamId));
  };


  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" asChild>
          <Link href="/panel">
            <ArrowLeft className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2" />
                    Añadir Equipo
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Equipo</DialogTitle>
                    <DialogDescription>Introduce los datos para crear un nuevo equipo.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="team-name">Nombre del Equipo</Label>
                        <Input id="team-name" placeholder="Ej: Juvenil B" value={newTeam.name} onChange={(e) => setNewTeam({...newTeam, name: e.target.value})} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="club-name">Club</Label>
                        <Input id="club-name" placeholder="Ej: FS Ràpid Santa Coloma" value={newTeam.club} onChange={(e) => setNewTeam({...newTeam, club: e.target.value})}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="season">Temporada</Label>
                        <Input id="season" placeholder="Ej: 2024/2025" value={newTeam.season} onChange={(e) => setNewTeam({...newTeam, season: e.target.value})}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="competition">Competición</Label>
                        <Input id="competition" placeholder="Ej: Liga Nacional Juvenil" value={newTeam.competition} onChange={(e) => setNewTeam({...newTeam, competition: e.target.value})}/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddTeam}><Save className="mr-2"/>Guardar Equipo</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-muted p-3 rounded-full">
            <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
            <h1 className="text-4xl font-bold font-headline">Gestión de Equipos</h1>
            <p className="text-lg text-muted-foreground mt-1">Crea y administra tus equipos. Invita a tu cuerpo técnico para colaborar.</p>
        </div>
      </div>
      

      <div className="space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Mis Equipos</CardTitle>
              </div>
              <CardDescription>Lista de equipos que administras como propietario.</CardDescription>
            </CardHeader>
            <CardContent>
                {teams.length > 0 ? (
                    <div className="space-y-4">
                        {teams.map(team => (
                             <div key={team.id} className="border rounded-lg p-4 flex items-center justify-between">
                                <div>
                                <p className="font-bold text-lg">{team.name}</p>
                                <p className="text-sm text-muted-foreground">{team.club}</p>
                                </div>
                                <div className="flex items-center gap-2">
                                <Button size="sm" asChild>
                                    <Link href={`/equipos/${team.id}`}>
                                    <Settings className="mr-2" />
                                    Gestionar
                                    </Link>
                                </Button>
                                <Button variant="ghost" size="icon">
                                    <Edit className="w-4 h-4" />
                                </Button>
                                <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este equipo?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                Esta acción es permanente y no se puede deshacer. Se borrarán todos los datos asociados al equipo.
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleDeleteTeam(team.id)}>Sí, eliminar</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No has creado ningún equipo todavía.</p>
                        <p>Haz clic en "Añadir Equipo" para empezar.</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

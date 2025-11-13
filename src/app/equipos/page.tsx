
"use client";

import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useCollection } from "react-firebase-hooks/firestore";
import { collection, query, where, addDoc, deleteDoc, doc } from "firebase/firestore";
import { auth, db } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, PlusCircle, Settings, Shield, Trash2, Users, Save, Loader2 } from "lucide-react";
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
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Team = {
  id: string;
  name: string;
  club: string;
  competition?: string;
  ownerId: string;
};

export default function EquiposPage() {
  const [user, loadingUser] = useAuthState(auth);
  const { toast } = useToast();

  const teamsQuery = user ? query(collection(db, "teams"), where("ownerId", "==", user.uid)) : null;
  const [teamsSnapshot, loadingTeams, errorTeams] = useCollection(teamsQuery);

  const teams = teamsSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Team)) || [];
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', club: '', season: '', competition: '' });
  const [isSubmitting, setIsSubmitting] = useState(false);


  const handleAddTeam = async () => {
    if (!newTeam.name || !newTeam.club || !user) {
        toast({
            variant: "destructive",
            title: "Error",
            description: "El nombre del equipo y el club son obligatorios.",
        });
        return;
    }
    
    setIsSubmitting(true);
    try {
        await addDoc(collection(db, "teams"), {
            name: newTeam.name,
            club: newTeam.club,
            competition: newTeam.competition,
            ownerId: user.uid,
            createdAt: new Date(),
        });
        toast({
            title: "Equipo añadido",
            description: `El equipo "${newTeam.name}" ha sido creado.`,
        });
        setIsAddDialogOpen(false);
        setNewTeam({ name: '', club: '', season: '', competition: '' });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al crear el equipo",
            description: error.message,
        });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async (teamId: string) => {
    try {
        await deleteDoc(doc(db, "teams", teamId));
        toast({
            variant: "destructive",
            title: "Equipo eliminado",
            description: "El equipo y sus datos asociados han sido eliminados.",
        });
    } catch (error: any) {
        toast({
            variant: "destructive",
            title: "Error al eliminar el equipo",
            description: error.message,
        });
    }
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
                        <Input id="team-name" placeholder="Ej: Juvenil B" value={newTeam.name} onChange={(e) => setNewTeam({...newTeam, name: e.target.value})} disabled={isSubmitting}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="club-name">Club</Label>
                        <Input id="club-name" placeholder="Ej: FS Ràpid Santa Coloma" value={newTeam.club} onChange={(e) => setNewTeam({...newTeam, club: e.target.value})} disabled={isSubmitting}/>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="competition">Competición</Label>
                        <Input id="competition" placeholder="Ej: Liga Nacional Juvenil" value={newTeam.competition} onChange={(e) => setNewTeam({...newTeam, competition: e.target.value})} disabled={isSubmitting}/>
                    </div>
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="outline" disabled={isSubmitting}>Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleAddTeam} disabled={isSubmitting}>
                        {isSubmitting ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2"/>}
                        Guardar Equipo
                    </Button>
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
                {(loadingUser || loadingTeams) && (
                    <div className="space-y-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                )}

                {!(loadingUser || loadingTeams) && teams.length > 0 ? (
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
                ) : null}

                {!(loadingUser || loadingTeams) && teams.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                        <p>No has creado ningún equipo todavía.</p>
                        <p>Haz clic en "Añadir Equipo" para empezar.</p>
                    </div>
                )}

                {errorTeams && (
                    <div className="text-center py-8 text-destructive">
                        <p>Error al cargar los equipos: {errorTeams.message}</p>
                    </div>
                )}
            </CardContent>
          </Card>
        </div>
    </div>
  );
}

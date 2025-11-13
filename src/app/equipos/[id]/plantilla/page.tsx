
"use client";

import { useState, useEffect } from "react";
import { useCollection, useDocumentData } from "react-firebase-hooks/firestore";
import { collection, doc, writeBatch } from "firebase/firestore";
import { db } from "@/firebase/config";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Trash2, Users, PlusCircle, Save, Loader2 } from "lucide-react";
import Link from "next/link";
import { useParams } from 'next/navigation';
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";

type Player = {
    id?: string;
    dorsal: string;
    nombre: string;
    posicion: string;
};

type StaffMember = {
    id?: string;
    name: string;
    role: string;
    email: string;
};


export default function PlantillaPage() {
    const params = useParams();
    const teamId = params.id as string;
    const { toast } = useToast();

    // Fetch team data
    const [team, loadingTeam] = useDocumentData(doc(db, "teams", teamId));

    // Fetch players subcollection
    const [playersSnapshot, loadingPlayers] = useCollection(collection(db, "teams", teamId, "players"));
    const initialPlayers = playersSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)) || [];

    // Fetch staff subcollection
    const [staffSnapshot, loadingStaff] = useCollection(collection(db, "teams", teamId, "staff"));
    const initialStaff = staffSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember)) || [];

    const [players, setPlayers] = useState<Player[]>([]);
    const [staff, setStaff] = useState<StaffMember[]>([]);
    const [isSavingPlayers, setIsSavingPlayers] = useState(false);
    const [isSavingStaff, setIsSavingStaff] = useState(false);

    useEffect(() => {
        if (!loadingPlayers && playersSnapshot) {
            setPlayers(playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)));
        }
    }, [playersSnapshot, loadingPlayers]);

    useEffect(() => {
        if (!loadingStaff && staffSnapshot) {
            setStaff(staffSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as StaffMember)));
        }
    }, [staffSnapshot, loadingStaff]);


    const handleAddPlayer = () => {
        if (players.length < 20) {
            setPlayers([...players, { dorsal: '', nombre: '', posicion: 'Ala' }]);
        } else {
            toast({
                variant: 'destructive',
                title: "Límite alcanzado",
                description: "No puedes añadir más de 20 jugadores."
            });
        }
    };

    const handleRemovePlayer = (index: number) => {
        const playerToRemove = players[index];
        const newPlayers = players.filter((_, i) => i !== index);
        setPlayers(newPlayers);

        // If the player has an ID, it means it's in the DB and should be deleted on save
        // For now, we just remove from local state. The save function will handle the diff.
    };

    const handlePlayerChange = (index: number, field: keyof Player, value: string) => {
        const newPlayers = [...players];
        newPlayers[index] = { ...newPlayers[index], [field]: value };
        setPlayers(newPlayers);
    };

    const handleSavePlayers = async () => {
        setIsSavingPlayers(true);
        try {
            const batch = writeBatch(db);
            const playersCollection = collection(db, "teams", teamId, "players");

            // Delete players that are no longer in the local state but exist in Firestore
            initialPlayers.forEach(initialPlayer => {
                if (initialPlayer.id && !players.find(p => p.id === initialPlayer.id)) {
                    batch.delete(doc(playersCollection, initialPlayer.id));
                }
            });

            // Add or update players
            for (const player of players) {
                const { id, ...playerData } = player;
                if (id) {
                    // Update existing player
                    batch.update(doc(playersCollection, id), playerData);
                } else {
                    // Add new player - let Firestore generate ID
                    batch.set(doc(collection(db, "teams", teamId, "players")), playerData);
                }
            }
            
            await batch.commit();
            toast({ title: "Plantilla guardada", description: "Los cambios en la plantilla han sido guardados." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsSavingPlayers(false);
        }
    };


    const handleAddStaffMember = () => {
        setStaff([...staff, { name: '', role: 'Asistente', email: '' }]);
    };

    const handleRemoveStaffMember = (index: number) => {
        setStaff(staff.filter((_, i) => i !== index));
    };

    const handleStaffChange = (index: number, field: keyof Omit<StaffMember, 'id'>, value: string) => {
        const newStaff = [...staff];
        newStaff[index] = { ...newStaff[index], [field]: value };
        setStaff(newStaff);
    };

    const handleSaveStaff = async () => {
        setIsSavingStaff(true);
        try {
            const batch = writeBatch(db);
            const staffCollection = collection(db, "teams", teamId, "staff");

            // Delete staff that are no longer in local state
            initialStaff.forEach(initialMember => {
                if (initialMember.id && !staff.find(s => s.id === initialMember.id)) {
                    batch.delete(doc(staffCollection, initialMember.id));
                }
            });
            
            // Add or update staff
            for (const member of staff) {
                const { id, ...staffData } = member;
                if (id) {
                    batch.update(doc(staffCollection, id), staffData);
                } else {
                    batch.set(doc(collection(db, "teams", teamId, "staff")), staffData);
                }
            }

            await batch.commit();
            toast({ title: "Staff guardado", description: "Los cambios en el cuerpo técnico han sido guardados." });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        } finally {
            setIsSavingStaff(false);
        }
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
            <CardContent>
            {loadingTeam ? <Skeleton className="h-24 w-full" /> : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label>Club</Label>
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {team?.club || ''}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Equipo</Label>
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                           {team?.name || ''}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label>Competición</Label>
                        <div className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                            {team?.competition || ''}
                        </div>
                    </div>
                </div>
            )}
            </CardContent>
        </Card>

         <Card>
            <CardHeader>
                <CardTitle>Staff Técnico</CardTitle>
                <CardDescription>Gestiona a los miembros del cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent>
                {loadingStaff ? <Skeleton className="h-24 w-full" /> : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="w-[180px]">Rol</TableHead>
                                <TableHead>Email</TableHead>
                                <TableHead className="w-[80px] text-right">Acciones</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {staff.map((member, index) => (
                                <TableRow key={member.id || index}>
                                    <TableCell>
                                        <Input 
                                            value={member.name}
                                            onChange={(e) => handleStaffChange(index, 'name', e.target.value)}
                                            placeholder="Nombre"
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Select
                                            value={member.role}
                                            onValueChange={(value) => handleStaffChange(index, 'role', value)}
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
                                            onChange={(e) => handleStaffChange(index, 'email', e.target.value)}
                                            placeholder="Email"
                                        />
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button variant="ghost" size="icon" onClick={() => handleRemoveStaffMember(index)}>
                                            <Trash2 className="w-5 h-5 text-destructive" />
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleAddStaffMember}>
                    <PlusCircle className="mr-2" />
                    Añadir Miembro
                </Button>
                <Button onClick={handleSaveStaff} disabled={isSavingStaff}>
                   {isSavingStaff ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />}
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
                {loadingPlayers ? <Skeleton className="h-40 w-full" /> : (
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
                                <TableRow key={player.id || index}>
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
                                                <SelectItem value="Universal">Universal</SelectItem>
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
                )}
            </CardContent>
            <CardFooter className="flex justify-between">
                <Button variant="outline" onClick={handleAddPlayer}>
                    <PlusCircle className="mr-2" />
                    Añadir Jugador
                </Button>
                <Button onClick={handleSavePlayers} disabled={isSavingPlayers}>
                    {isSavingPlayers ? <Loader2 className="mr-2 animate-spin"/> : <Save className="mr-2" />}
                    Guardar Plantilla
                </Button>
            </CardFooter>
        </Card>
      </div>
    </div>
  );
}


"use client";

import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useCollection } from 'react-firebase-hooks/firestore';
import { collection, query, where, doc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { auth, db } from '@/firebase/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ArrowLeft, Users, BarChart, Eye, Edit, Trophy, Save, Calendar as CalendarIcon, Trash2, Clock, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
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
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

type Match = {
    id: string;
    localTeam: string;
    visitorTeam: string;
    date: string; // ISO string
    competition: string;
    localScore: number;
    visitorScore: number;
    status: 'scheduled' | 'finished' | 'live';
    playersCalled?: number;
    teamId?: string;
    userId?: string;
    squad?: string[];
};

const getResultColor = (localScore: number, visitorScore: number, localTeamName: string, visitorTeamName: string, myTeamName: string): string => {
    const isDraw = localScore === visitorScore;
    if (isDraw) return 'text-muted-foreground';

    if (myTeamName.trim() === localTeamName.trim()) {
        return localScore > visitorScore ? 'text-primary' : 'text-destructive';
    } else if (myTeamName.trim() === visitorTeamName.trim()) {
        return visitorScore > localScore ? 'text-primary' : 'text-destructive';
    }
    
    return 'text-foreground';
};


export default function PartidosPage() {
    const teamName = "Juvenil B";
    const { toast } = useToast();
    const [user, loadingAuth] = useAuthState(auth);

    const matchesQuery = user ? query(collection(db, "matches"), where("userId", "==", user.uid)) : null;
    const [matchesSnapshot, loadingMatches, errorMatches] = useCollection(matchesQuery);

    const matches = matchesSnapshot?.docs.map(doc => ({ id: doc.id, ...doc.data() } as Match)).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) || [];

    const [playersSnapshot, loadingPlayers] = useCollection(user ? query(collection(db, `teams/vfR0cLrsj4r5DSYxUac1/players`)) : null);
    const teamPlayers = playersSnapshot?.docs.map(doc => ({ id: doc.id, name: doc.data().name, number: doc.data().number })) || [];
    
    const [isAddDialogOpen, setIsAddDialogOpen] = React.useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [isConvocatoriaOpen, setIsConvocatoriaOpen] = React.useState(false);
    
    const [editingMatch, setEditingMatch] = React.useState<any>(null);
    const [matchForConvocatoria, setMatchForConvocatoria] = React.useState<Match | null>(null);
    
    const [newMatch, setNewMatch] = React.useState({
        localTeam: '',
        visitorTeam: '',
        date: undefined as Date | undefined,
        time: '',
        type: 'Amistoso',
        competition: '',
        round: ''
    });

    const [selectedPlayers, setSelectedPlayers] = React.useState<Record<string, boolean>>({});

    const handleOpenConvocatoriaDialog = (match: Match) => {
        setMatchForConvocatoria(match);
        const initialSelection: Record<string, boolean> = {};
        if (match.squad) {
            match.squad.forEach(playerId => {
                initialSelection[playerId] = true;
            });
        }
        setSelectedPlayers(initialSelection);
        setIsConvocatoriaOpen(true);
    };
    
    const handleSaveConvocatoria = async () => {
        if (!matchForConvocatoria) return;
        
        const squad = Object.keys(selectedPlayers).filter(id => selectedPlayers[id]);

        try {
            await updateDoc(doc(db, "matches", matchForConvocatoria.id), {
                squad: squad,
                playersCalled: `${squad.length} Jug.`
            });
            toast({ title: "Convocatoria guardada" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
        
        setIsConvocatoriaOpen(false);
        setMatchForConvocatoria(null);
    };

    const handleSelectAll = (checked: boolean) => {
        const newSelectedPlayers: Record<string, boolean> = {};
        if (checked) {
            teamPlayers.forEach(player => {
                newSelectedPlayers[player.id] = true;
            });
        }
        setSelectedPlayers(newSelectedPlayers);
    };

    const handlePlayerSelect = (playerId: string, checked: boolean) => {
        setSelectedPlayers(prev => ({ ...prev, [playerId]: checked }));
    };

    const handleOpenEditDialog = (match: Match) => {
        const date = new Date(match.date);
        setEditingMatch({
            ...match,
            date: date,
            time: format(date, "HH:mm"),
            type: ['Liga', 'Copa', 'Torneo', 'Amistoso'].includes(match.competition) ? match.competition : 'Liga',
        });
        setIsEditDialogOpen(true);
    };
    
    const handleEditFormChange = (field: string, value: any) => {
        setEditingMatch((prev: any) => ({ ...prev, [field]: value }));
    };

    const handleNewMatchChange = (field: string, value: any) => {
        setNewMatch((prev) => ({ ...prev, [field]: value }));
    };

    const handleCreateMatch = async () => {
        if (!newMatch.localTeam || !newMatch.visitorTeam || !newMatch.date || !user) return;

        const [hours, minutes] = newMatch.time.split(':').map(Number);
        const matchDate = new Date(newMatch.date);
        matchDate.setHours(hours, minutes);

        const newMatchData = {
            localTeam: newMatch.localTeam,
            visitorTeam: newMatch.visitorTeam,
            date: matchDate.toISOString(),
            competition: newMatch.type === 'Liga' ? newMatch.competition || 'Liga' : newMatch.type,
            round: newMatch.round,
            localScore: 0,
            visitorScore: 0,
            status: 'scheduled' as const,
            isFinished: false,
            userId: user.uid,
            teamId: 'vfR0cLrsj4r5DSYxUac1', // Hardcoded for now
            squad: [],
            events: [],
            playerStats: {},
            opponentStats: {},
        };

        try {
            await addDoc(collection(db, "matches"), newMatchData);
            toast({ title: "Partido creado", description: "El nuevo partido ha sido añadido." });
            setIsAddDialogOpen(false);
            setNewMatch({ localTeam: '', visitorTeam: '', date: undefined, time: '', type: 'Amistoso', competition: '', round: '' });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
    };
    
    const handleSaveChanges = async () => {
        if (!editingMatch) return;
        
        const [hours, minutes] = editingMatch.time.split(':').map(Number);
        const matchDate = new Date(editingMatch.date);
        matchDate.setHours(hours, minutes);
    
        try {
            await updateDoc(doc(db, "matches", editingMatch.id), {
                localTeam: editingMatch.localTeam,
                visitorTeam: editingMatch.visitorTeam,
                date: matchDate.toISOString(),
                competition: editingMatch.type === 'Liga' ? editingMatch.competition : editingMatch.type,
            });
            toast({ title: "Cambios guardados" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error", description: error.message });
        }
        
        setIsEditDialogOpen(false);
        setEditingMatch(null);
    };

    const handleDeleteMatch = async (matchId: string) => {
        try {
            await deleteDoc(doc(db, "matches", matchId));
            toast({ variant: 'destructive', title: "Partido eliminado" });
        } catch (error: any) {
            toast({ variant: 'destructive', title: "Error al eliminar", description: error.message });
        }
    };

    const selectedCount = Object.values(selectedPlayers).filter(Boolean).length;
    const allSelected = teamPlayers.length > 0 && selectedCount === teamPlayers.length;

    const renderMatchCard = (match: Match) => (
        <Card key={match.id} className="transition-all hover:shadow-md flex flex-col">
            <CardContent className="p-6 text-center flex-grow">
                <p className="font-semibold truncate">{match.localTeam} vs {match.visitorTeam}</p>
                <p className="text-sm text-muted-foreground mb-4">{format(parseISO(match.date), 'dd/MM/yyyy HH:mm')}</p>
                <p className={`text-5xl font-bold mb-4 ${getResultColor(match.localScore, match.visitorScore, match.localTeam, match.visitorTeam, teamName)}`}>{match.localScore} - {match.visitorScore}</p>
                <Badge variant="secondary">{match.competition}</Badge>
            </CardContent>
            <CardFooter className="bg-muted/50 p-3 flex justify-around">
                <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenConvocatoriaDialog(match)}>
                    <Users className="mr-1" /> {match.squad ? `${match.squad.length} Jug.` : 'Convocar'}
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Link href={`/partidos/${match.id}/estadisticas`}>
                        <BarChart />
                    </Link>
                </Button>
                <Button asChild variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                    <Link href={`/partidos/${match.id}`}>
                        <Eye />
                    </Link>
                </Button>
                <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEditDialog(match)}>
                    <Edit />
                </Button>
                <AlertDialog>
                    <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                            <Trash2 />
                        </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro de que quieres eliminar este partido?</AlertDialogTitle>
                            <AlertDialogDescription>
                                Esta acción no se puede deshacer. Se eliminarán permanentemente los datos del partido, incluidas las estadísticas.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={() => handleDeleteMatch(match.id)}>Eliminar</AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </CardFooter>
        </Card>
    );

    const isLoading = loadingAuth || loadingMatches || loadingPlayers;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className='flex items-center gap-4'>
             <Button variant="outline" asChild>
                <Link href="/equipos/1">
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel del Equipo
                </Link>
            </Button>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
                <Button>
                    <PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Añadir Nuevo Partido</DialogTitle>
                    <DialogDescription>Introduce los datos básicos del partido. Podrás añadir las estadísticas más tarde.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="local-team-add">Equipo Local</Label>
                        <div className="flex gap-2">
                            <Input id="local-team-add" placeholder="Nombre del equipo" value={newMatch.localTeam} onChange={(e) => handleNewMatchChange('localTeam', e.target.value)} />
                            <Button variant="outline" onClick={() => handleNewMatchChange('localTeam', teamName)}>Mi Equipo</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitor-team-add">Equipo Visitante</Label>
                         <div className="flex gap-2">
                            <Input id="visitor-team-add" placeholder="Nombre del equipo" value={newMatch.visitorTeam} onChange={(e) => handleNewMatchChange('visitorTeam', e.target.value)} />
                            <Button variant="outline" onClick={() => handleNewMatchChange('visitorTeam', teamName)}>Mi Equipo</Button>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha del partido</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !newMatch.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {newMatch.date ? format(newMatch.date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={newMatch.date}
                                        onSelect={(date) => handleNewMatchChange('date', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                         <div className="space-y-2">
                            <Label htmlFor="time-add">Hora</Label>
                            <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="time-add" type="time" className="pl-10" value={newMatch.time} onChange={(e) => handleNewMatchChange('time', e.target.value)} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type-add">Tipo</Label>
                        <Select value={newMatch.type} onValueChange={(value) => handleNewMatchChange('type', value)}>
                            <SelectTrigger id="type-add">
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Liga">Liga</SelectItem>
                                <SelectItem value="Copa">Copa</SelectItem>
                                <SelectItem value="Torneo">Torneo</SelectItem>
                                <SelectItem value="Amistoso">Amistoso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                     {newMatch.type === 'Liga' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="competition-add">Competición</Label>
                                <Input 
                                    id="competition-add" 
                                    placeholder="Nombre de la competición"
                                    value={newMatch.competition}
                                    onChange={(e) => handleNewMatchChange('competition', e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="round-add">Jornada</Label>
                                <Input 
                                    id="round-add" 
                                    type="number" 
                                    placeholder="Número de jornada"
                                    value={newMatch.round}
                                    onChange={(e) => handleNewMatchChange('round', e.target.value)} 
                                />
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <DialogClose asChild>
                        <Button variant="ghost">Cancelar</Button>
                    </DialogClose>
                    <Button onClick={handleCreateMatch}><Save className="mr-2" /> Crear Partido</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      </div>
      
       <div className='mb-8'>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Partidos de {teamName}</h1>
          </div>
          <p className="text-lg text-muted-foreground">Gestiona los partidos, añade nuevos encuentros, edita los existentes o consulta sus estadísticas.</p>
        </div>

        {isLoading ? (
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({length: 6}).map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
            </div>
        ) : errorMatches ? (
            <p className="text-destructive">Error: {errorMatches.message}</p>
        ) : (
            <Tabs defaultValue="Todos">
                <TabsList className="mb-8">
                <TabsTrigger value="Todos">Todos</TabsTrigger>
                <TabsTrigger value="Liga">Liga</TabsTrigger>
                <TabsTrigger value="Copa">Copa</TabsTrigger>
                <TabsTrigger value="Torneo">Torneo</TabsTrigger>
                <TabsTrigger value="Amistoso">Amistoso</TabsTrigger>
                </TabsList>
                
                <TabsContent value="Todos">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.map(renderMatchCard)}
                    </div>
                </TabsContent>
                <TabsContent value="Liga">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.filter(m => m.competition.includes('Liga')).map(renderMatchCard)}
                    </div>
                </TabsContent>
                <TabsContent value="Copa">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.filter(m => m.competition.includes('Copa')).length > 0 ? (
                            matches.filter(m => m.competition.includes('Copa')).map(renderMatchCard)
                        ) : <p className="text-center text-muted-foreground col-span-3">No hay partidos de copa para mostrar.</p>}
                    </div>
                </TabsContent>
                <TabsContent value="Torneo">
                     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.filter(m => m.competition.includes('Torneo')).length > 0 ? (
                            matches.filter(m => m.competition.includes('Torneo')).map(renderMatchCard)
                        ) : <p className="text-center text-muted-foreground col-span-3">No hay partidos de torneo para mostrar.</p>}
                    </div>
                </TabsContent>
                <TabsContent value="Amistoso">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {matches.filter(m => m.competition === 'Amistoso').length > 0 ? (
                             matches.filter(m => m.competition === 'Amistoso').map(renderMatchCard)
                        ): <p className="text-center text-muted-foreground col-span-3">No hay partidos amistosos para mostrar.</p>}
                    </div>
                </TabsContent>
            </Tabs>
        )}
      
      <Dialog open={isConvocatoriaOpen} onOpenChange={setIsConvocatoriaOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Convocar Jugadores</DialogTitle>
                    <DialogDescription>
                        Selecciona un máximo de 12 jugadores para el partido. ({selectedCount}/12)
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                    <div className="flex items-center space-x-2">
                        <Checkbox 
                            id="select-all"
                            checked={allSelected}
                            onCheckedChange={(checked) => handleSelectAll(checked as boolean)}
                        />
                        <Label htmlFor="select-all" className="font-semibold">
                            Seleccionar Todos
                        </Label>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        {teamPlayers.map(player => (
                            <div key={player.id} className="flex items-center space-x-2">
                                <Checkbox 
                                    id={`player-${player.id}`} 
                                    checked={!!selectedPlayers[player.id]}
                                    onCheckedChange={(checked) => handlePlayerSelect(player.id, checked as boolean)}
                                    disabled={selectedCount >= 12 && !selectedPlayers[player.id]}
                                />
                                <Label htmlFor={`player-${player.id}`} className="flex items-center gap-2 text-sm font-normal">
                                    <span className="font-bold w-6 text-right">({player.number})</span>
                                    <span>{player.name}</span>
                                </Label>
                            </div>
                        ))}
                    </div>
                </div>
                <DialogFooter>
                    <Button onClick={handleSaveConvocatoria}><Save className="mr-2" /> Guardar Convocatoria</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>

      {editingMatch && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Editar Partido</DialogTitle>
                    <DialogDescription>Modifica los datos del partido.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="local-team">Equipo Local</Label>
                        <div className="flex gap-2">
                            <Input 
                                id="local-team" 
                                value={editingMatch.localTeam} 
                                onChange={(e) => handleEditFormChange('localTeam', e.target.value)} 
                            />
                            <Button variant="outline" onClick={() => handleEditFormChange('localTeam', teamName)}>Mi Equipo</Button>
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="visitor-team">Equipo Visitante</Label>
                         <div className="flex gap-2">
                            <Input 
                                id="visitor-team" 
                                value={editingMatch.visitorTeam} 
                                onChange={(e) => handleEditFormChange('visitorTeam', e.target.value)} 
                            />
                            <Button variant="outline" onClick={() => handleEditFormChange('visitorTeam', teamName)}>Mi Equipo</Button>
                        </div>
                    </div>
                     <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Fecha del partido</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button
                                        variant={"outline"}
                                        className={cn(
                                        "w-full justify-start text-left font-normal",
                                        !editingMatch.date && "text-muted-foreground"
                                        )}
                                    >
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {editingMatch.date ? format(editingMatch.date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0">
                                    <Calendar
                                        mode="single"
                                        selected={editingMatch.date}
                                        onSelect={(date) => handleEditFormChange('date', date)}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="time-edit">Hora</Label>
                             <div className="relative">
                                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input id="time-edit" type="time" className="pl-10" value={editingMatch.time} onChange={(e) => handleEditFormChange('time', e.target.value)} />
                            </div>
                        </div>
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="type">Tipo</Label>
                        <Select 
                            value={editingMatch.type}
                            onValueChange={(value) => handleEditFormChange('type', value)}
                        >
                            <SelectTrigger id="type">
                                <SelectValue placeholder="Seleccionar tipo" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Liga">Liga</SelectItem>
                                <SelectItem value="Copa">Copa</SelectItem>
                                <SelectItem value="Torneo">Torneo</SelectItem>
                                <SelectItem value="Amistoso">Amistoso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    {editingMatch.type === 'Liga' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="competition">Competición</Label>
                                <Input 
                                    id="competition" 
                                    value={editingMatch.competition}
                                    onChange={(e) => handleEditFormChange('competition', e.target.value)} 
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="round">Jornada</Label>
                                <Input 
                                    id="round" 
                                    type="number" 
                                    value={editingMatch.round}
                                    onChange={(e) => handleEditFormChange('round', e.target.value)} 
                                />
                            </div>
                        </>
                    )}
                </div>
                <DialogFooter>
                    <Button variant="ghost" onClick={() => setIsEditDialogOpen(false)}>Cancelar</Button>
                    <Button onClick={handleSaveChanges}><Save className="mr-2" /> Guardar Cambios</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
      )}

    </div>
  );
}

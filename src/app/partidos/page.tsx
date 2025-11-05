
"use client";

import { matches as initialMatches, Match } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ArrowLeft, Users, BarChart, Eye, Edit, Trophy, Save, Calendar as CalendarIcon } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import React from 'react';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const initialPlayers = [
    { dorsal: '7', nombre: 'Hugo', posicion: 'Pívot' },
    { dorsal: '9', nombre: 'Marc Romera', posicion: 'Ala' },
    { dorsal: '12', nombre: 'Marc Muñoz', posicion: 'Ala' },
    { dorsal: '1', nombre: 'Alex', posicion: 'Portero' },
    { dorsal: '10', nombre: 'Juan', posicion: 'Cierre' },
    { dorsal: '11', nombre: 'Pedro', posicion: 'Ala' },
];

const getResultColor = (score: string, teamName: string, opponent: string): string => {
    const [teamAScore, teamBScore] = score.split(' - ').map(Number);
    const opponentNameParts = opponent.split(' vs ');
    const teamA_name = opponentNameParts[0];
    
    const isDraw = teamAScore === teamBScore;

    if (isDraw) return 'text-accent-foreground';

    if (teamA_name === teamName) { // We are team A (local)
        if (teamAScore > teamBScore) return 'text-primary'; // Win
        return 'text-destructive'; // Loss
    } else { // We are team B (visitor)
        if (teamBScore > teamAScore) return 'text-primary'; // Win
        return 'text-destructive'; // Loss
    }
};


export default function PartidosPage() {
    const teamName = "Juvenil B";
    const [selectedPlayers, setSelectedPlayers] = React.useState<Record<string, boolean>>({});
    
    const [isEditDialogOpen, setIsEditDialogOpen] = React.useState(false);
    const [editingMatch, setEditingMatch] = React.useState<any>(null);
    const [matches, setMatches] = React.useState<Match[]>(initialMatches);


    const handleSelectAll = (checked: boolean) => {
        const newSelectedPlayers: Record<string, boolean> = {};
        if (checked) {
            initialPlayers.forEach(player => {
                newSelectedPlayers[player.dorsal] = true;
            });
        }
        setSelectedPlayers(newSelectedPlayers);
    };

    const handlePlayerSelect = (playerId: string, checked: boolean) => {
        setSelectedPlayers(prev => ({
            ...prev,
            [playerId]: checked
        }));
    };

    const handleOpenEditDialog = (match: Match) => {
        const [localTeam, visitorTeam] = match.opponent.split(' vs ');
        setEditingMatch({
            ...match,
            localTeam,
            visitorTeam,
            date: new Date(match.date),
            type: match.competition,
            round: '1', // Placeholder
        });
        setIsEditDialogOpen(true);
    };
    
    const handleEditFormChange = (field: string, value: any) => {
        setEditingMatch((prev: any) => ({ ...prev, [field]: value }));
    };
    
    const handleSaveChanges = () => {
        if (!editingMatch) return;
    
        setMatches(prevMatches =>
          prevMatches.map(match =>
            match.id === editingMatch.id
              ? {
                  ...match,
                  opponent: `${editingMatch.localTeam} vs ${editingMatch.visitorTeam}`,
                  date: editingMatch.date.toISOString(),
                  competition: editingMatch.type,
                  // Any other fields to update
                }
              : match
          )
        );
        setIsEditDialogOpen(false);
        setEditingMatch(null);
    };

    const allSelected = initialPlayers.length > 0 && initialPlayers.every(p => selectedPlayers[p.dorsal]);
    const selectedCount = Object.values(selectedPlayers).filter(Boolean).length;


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
        <Button asChild>
          <Link href="/partidos/crear">
            <PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido
          </Link>
        </Button>
      </div>
      
       <div className='mb-8'>
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-8 h-8 text-primary" />
            <h1 className="text-4xl font-bold font-headline">Partidos de {teamName}</h1>
          </div>
          <p className="text-lg text-muted-foreground">Gestiona los partidos, añade nuevos encuentros, edita los existentes o consulta sus estadísticas.</p>
        </div>

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
                {matches.map((match) => (
                <Card key={match.id} className="transition-all hover:shadow-md flex flex-col">
                    <CardContent className="p-6 text-center flex-grow">
                        <p className="font-semibold">{match.opponent}</p>
                        <p className="text-sm text-muted-foreground mb-4">{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                        <p className={`text-5xl font-bold mb-4 ${getResultColor(match.score, teamName, match.opponent)}`}>{match.score}</p>
                        <Badge variant="secondary">{match.competition}</Badge>
                    </CardContent>
                    <CardFooter className="bg-muted/50 p-3 flex justify-around">
                        {match.playersCalled ? (
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <Users className="mr-1" /> {match.playersCalled}
                            </Button>
                        ) : (
                             <Dialog>
                                <DialogTrigger asChild>
                                    <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                        <Users className="mr-1" /> Convocar
                                    </Button>
                                </DialogTrigger>
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
                                            {initialPlayers.map(player => (
                                                <div key={player.dorsal} className="flex items-center space-x-2">
                                                    <Checkbox 
                                                        id={`player-${player.dorsal}`} 
                                                        checked={!!selectedPlayers[player.dorsal]}
                                                        onCheckedChange={(checked) => handlePlayerSelect(player.dorsal, checked as boolean)}
                                                        disabled={selectedCount >= 12 && !selectedPlayers[player.dorsal]}
                                                    />
                                                    <Label htmlFor={`player-${player.dorsal}`} className="flex items-center gap-2 text-sm font-normal">
                                                        <span className="font-bold w-6 text-right">({player.dorsal})</span>
                                                        <span>{player.nombre}</span>
                                                    </Label>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                    <DialogFooter>
                                        <Button><Save className="mr-2" /> Guardar Convocatoria</Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                        )}

                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <BarChart />
                        </Button>
                         <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                            <Eye />
                        </Button>
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEditDialog(match)}>
                            <Edit />
                        </Button>
                    </CardFooter>
                </Card>
                ))}
            </div>
        </TabsContent>
        {/* You can add more TabsContent for each category */}
        <TabsContent value="Liga">
             <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.filter(m => m.competition === 'Liga').map((match) => (
                    <Card key={match.id} className="transition-all hover:shadow-md flex flex-col">
                        <CardContent className="p-6 text-center flex-grow">
                            <p className="font-semibold">{match.opponent}</p>
                            <p className="text-sm text-muted-foreground mb-4">{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            <p className={`text-5xl font-bold mb-4 ${getResultColor(match.score, teamName, match.opponent)}`}>{match.score}</p>
                            <Badge variant="secondary">{match.competition}</Badge>
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-3 flex justify-around">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <Users className="mr-1" /> {match.playersCalled || 'Convocar'}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><BarChart /></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Eye /></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEditDialog(match)}><Edit /></Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </TabsContent>
         <TabsContent value="Copa">
            <p className="text-center text-muted-foreground">No hay partidos de copa para mostrar.</p>
        </TabsContent>
         <TabsContent value="Torneo">
            <p className="text-center text-muted-foreground">No hay partidos de torneo para mostrar.</p>
        </TabsContent>
         <TabsContent value="Amistoso">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {matches.filter(m => m.competition === 'Amistoso').map((match) => (
                    <Card key={match.id} className="transition-all hover:shadow-md flex flex-col">
                        <CardContent className="p-6 text-center flex-grow">
                            <p className="font-semibold">{match.opponent}</p>
                            <p className="text-sm text-muted-foreground mb-4">{new Date(match.date).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                            <p className={`text-5xl font-bold mb-4 ${getResultColor(match.score, teamName, match.opponent)}`}>{match.score}</p>
                            <Badge variant="secondary">{match.competition}</Badge>
                        </CardContent>
                        <CardFooter className="bg-muted/50 p-3 flex justify-around">
                            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                                <Users className="mr-1" /> {match.playersCalled || 'Convocar'}
                            </Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><BarChart /></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Eye /></Button>
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" onClick={() => handleOpenEditDialog(match)}><Edit /></Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </TabsContent>
      </Tabs>
      
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

    
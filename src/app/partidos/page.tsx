
"use client";

import { matches } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, ArrowLeft, Users, BarChart, Eye, Edit, Trophy, Save } from 'lucide-react';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';

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
    const isTeamAWinner = teamAScore > teamBScore;
    const isDraw = teamAScore === teamBScore;

    if (isDraw) return 'text-accent';

    if (opponent.includes(teamName)) { // teamName is teamB
        if (teamBScore > teamAScore) return 'text-primary'; // Win
        if (teamBScore < teamAScore) return 'text-destructive'; // Loss
    } else { // teamName is teamA
        if (teamAScore > teamBScore) return 'text-primary'; // Win
        if (teamAScore < teamBScore) return 'text-destructive'; // Loss
    }
    return 'text-muted-foreground';
};


export default function PartidosPage() {
    const teamName = "Juvenil B";

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
                                            Selecciona un máximo de 12 jugadores para el partido.
                                        </DialogDescription>
                                    </DialogHeader>
                                    <div className="grid grid-cols-2 gap-4 py-4">
                                        {initialPlayers.map(player => (
                                            <div key={player.dorsal} className="flex items-center space-x-2">
                                                <Checkbox id={`player-${player.dorsal}`} />
                                                <Label htmlFor={`player-${player.dorsal}`} className="flex items-center gap-2 text-sm font-normal">
                                                    <span className="font-bold w-6 text-right">({player.dorsal})</span>
                                                    <span>{player.nombre}</span>
                                                </Label>
                                            </div>
                                        ))}
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
                        <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
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
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Edit /></Button>
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
                            <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground"><Edit /></Button>
                        </CardFooter>
                    </Card>
                ))}
            </div>
        </TabsContent>

      </Tabs>
    </div>
  );
}

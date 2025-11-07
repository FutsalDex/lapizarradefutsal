
'use client';

import { useState } from 'react';
import { useFirestore, useUser } from '@/firebase';
import { doc, collection, getDocs, writeBatch, query, where, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, PlaySquare, Users, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';


interface Player {
    id: string;
    name: string;
    number: string;
}

function UpdatePlayerTimesScript() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [matchId, setMatchId] = useState('');
  const [playerData, setPlayerData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState(false);
  const [teamPlayers, setTeamPlayers] = useState<Player[]>([]);

  const parseTimeToSeconds = (minutes: string, seconds: string): number => {
    const mins = parseInt(minutes, 10);
    const secs = parseInt(seconds, 10);
    if (isNaN(mins) || isNaN(secs)) return 0;
    return mins * 60 + secs;
  };

  const handleFetchPlayers = async () => {
      if (!matchId) {
          toast({ variant: 'destructive', title: 'Error', description: 'Por favor, introduce un ID de partido.' });
          return;
      }
      setIsLoadingPlayers(true);
      setTeamPlayers([]);
      try {
          const matchRef = doc(firestore, 'matches', matchId);
          const matchSnap = await getDoc(matchRef);
          if (!matchSnap.exists()) {
              throw new Error('No se encontró el partido con el ID proporcionado.');
          }
          const teamId = matchSnap.data()?.teamId;
          if (!teamId) {
              throw new Error('El partido no tiene un teamId asociado.');
          }

          const playersSnapshot = await getDocs(collection(firestore, `teams/${teamId}/players`));
          const players = playersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Player)).sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
          setTeamPlayers(players);
          if(players.length === 0) {
            toast({ title: 'Aviso', description: 'No se encontraron jugadores para este equipo.' });
          }
      } catch (error: any) {
          console.error('Error fetching players:', error);
          toast({ variant: 'destructive', title: 'Error al cargar jugadores', description: error.message });
      } finally {
          setIsLoadingPlayers(false);
      }
  };

  const handleUpdate = async () => {
    if (!matchId || !playerData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa todos los campos.' });
      return;
    }

    setIsSubmitting(true);
    try {
      const matchRef = doc(firestore, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) {
        throw new Error('No se encontró el partido con el ID proporcionado.');
      }
      const teamId = matchSnap.data()?.teamId;
      if (!teamId) {
        throw new Error('El partido no tiene un teamId asociado.');
      }
      
      const playersSnapshot = await getDocs(collection(firestore, `teams/${teamId}/players`));
      const playersMap = new Map(playersSnapshot.docs.map(doc => [doc.data().number.toString(), doc.id]));

      const lines = playerData.trim().split(/[\n,]/).filter(Boolean);
      const updates = new Map<string, number>();
      
      const timeRegex = /(.+?):(\d{1,2}):(\d{2})/;

      lines.forEach(line => {
        const match = line.trim().match(timeRegex);
        if (match) {
          const [, playerIdentifier, minutes, seconds] = match;
          const playerId = playersMap.get(playerIdentifier.trim());
          
          if (playerId) {
            updates.set(playerId, parseTimeToSeconds(minutes, seconds));
          } else {
             console.warn(`Jugador con dorsal no encontrado en la plantilla: "${playerIdentifier.trim()}"`);
          }
        } else {
            console.warn(`Formato de línea incorrecto: "${line.trim()}"`);
        }
      });

      if (updates.size === 0) {
        throw new Error('No se encontraron jugadores coincidentes para actualizar.');
      }
      
      const batch = writeBatch(firestore);
      const playerStats1H: { [key: string]: any } = {};
      const playerStats2H: { [key: string]: any } = {};

      updates.forEach((seconds, playerId) => {
        playerStats1H[playerId] = { minutesPlayed: seconds };
        playerStats2H[playerId] = { minutesPlayed: 0 };
      });
      
      batch.update(matchRef, { 
        'playerStats.1H': playerStats1H,
        'playerStats.2H': playerStats2H,
      });
      
      await batch.commit();

      toast({ title: 'Éxito', description: 'Tiempos de juego actualizados correctamente.' });
      setMatchId('');
      setPlayerData('');
      setTeamPlayers([]);
    } catch (error: any) {
      console.error('Error updating player times:', error);
      toast({ variant: 'destructive', title: 'Error', description: `No se pudieron actualizar los tiempos: ${error.message}` });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><PlaySquare/>Actualizar Tiempos de Jugadores</CardTitle>
        <CardDescription>
          Introduce el ID de un partido para ver su plantilla. Luego, pega la lista de jugadores con sus tiempos en formato `Dorsal:MM:SS`.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label htmlFor="matchId">ID del Partido</Label>
          <div className="flex gap-2">
            <Input 
                id="matchId"
                value={matchId}
                onChange={(e) => setMatchId(e.target.value)}
                placeholder="Ej: 7YuZhJ6yniEaAX4EmppW"
            />
            <Button onClick={handleFetchPlayers} disabled={isLoadingPlayers || !matchId} variant="outline">
                {isLoadingPlayers ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Users className="mr-2 h-4 w-4" />}
                Cargar Jugadores
            </Button>
          </div>
        </div>
        
        {teamPlayers.length > 0 && (
            <div className="rounded-md border max-h-60 overflow-y-auto">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[80px]">Dorsal</TableHead>
                            <TableHead>Nombre</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {teamPlayers.map(player => (
                            <TableRow key={player.id}>
                                <TableCell className="font-mono text-center">{player.number}</TableCell>
                                <TableCell>{player.name}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>
        )}

        <div>
          <Label htmlFor="playerData">Datos de Jugadores y Tiempos</Label>
          <Textarea
            id="playerData"
            value={playerData}
            onChange={(e) => setPlayerData(e.target.value)}
            placeholder="1:25:00, 2:22:41, 5:19:56, ..."
            rows={12}
          />
        </div>
        <Button onClick={handleUpdate} disabled={isSubmitting} className="w-full">
          {isSubmitting ? 'Actualizando...' : 'Actualizar Tiempos'}
        </Button>
      </CardContent>
    </Card>
  );
}


export default function AdminScriptsPage() {
    const { user } = useUser();
    const isAdmin = user?.email === 'futsaldex@gmail.com';

    if (!isAdmin) {
        return (
             <div className="container mx-auto px-4 py-8 text-center">
                <h1 className="text-2xl font-bold mb-4">Acceso Denegado</h1>
                <p className="text-muted-foreground">No tienes permisos para acceder a esta sección.</p>
            </div>
        )
    }
    
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
            <Link href={`/admin`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Volver al Panel de Admin
            </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary">Scripts de Mantenimiento</h1>
        <p className="text-lg text-muted-foreground mt-2">
            Herramientas para realizar operaciones específicas en la base de datos. Usar con precaución.
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <UpdatePlayerTimesScript />
      </div>
    </div>
  );
}


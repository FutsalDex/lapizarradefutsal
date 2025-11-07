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
import { ArrowLeft, PlaySquare } from 'lucide-react';
import Link from 'next/link';

function UpdatePlayerTimesScript() {
  const firestore = useFirestore();
  const { toast } = useToast();
  const [matchId, setMatchId] = useState('');
  const [playerData, setPlayerData] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const parseTimeToSeconds = (minutes: string, seconds: string): number => {
    const mins = parseInt(minutes, 10);
    const secs = parseInt(seconds, 10);
    if (isNaN(mins) || isNaN(secs)) return 0;
    return mins * 60 + secs;
  };

  const handleUpdate = async () => {
    if (!matchId || !playerData) {
      toast({ variant: 'destructive', title: 'Error', description: 'Por favor, completa todos los campos.' });
      return;
    }

    setIsSubmitting(true);
    try {
      // 1. Obtener el teamId desde el documento del partido
      const matchRef = doc(firestore, 'matches', matchId);
      const matchSnap = await getDoc(matchRef);
      if (!matchSnap.exists()) {
        throw new Error('No se encontró el partido con el ID proporcionado.');
      }
      const teamId = matchSnap.data()?.teamId;
      if (!teamId) {
        throw new Error('El partido no tiene un teamId asociado.');
      }
      
      // 2. Obtener todos los jugadores del equipo
      const playersSnapshot = await getDocs(collection(firestore, `teams/${teamId}/players`));
      const playersMap = new Map(playersSnapshot.docs.map(doc => [doc.data().name.trim(), doc.id]));

      // 3. Parsear los datos introducidos
      const lines = playerData.trim().split(/[\n,]/).filter(Boolean);
      const updates = new Map<string, number>();

      const timeRegex = /(.+?):(\d{1,2}):(\d{2})/;

      lines.forEach(line => {
        const match = line.trim().match(timeRegex);
        if (match) {
          const [, name, minutes, seconds] = match;
          const trimmedName = name.trim();
          const playerId = playersMap.get(trimmedName);
          
          if (playerId) {
            updates.set(playerId, parseTimeToSeconds(minutes, seconds));
          } else {
             console.warn(`Jugador no encontrado en la plantilla: "${trimmedName}"`);
          }
        } else {
            console.warn(`Formato de línea incorrecto: "${line.trim()}"`);
        }
      });


      if (updates.size === 0) {
        throw new Error('No se encontraron jugadores coincidentes para actualizar.');
      }
      
      // 4. Crear el batch de actualización
      const batch = writeBatch(firestore);
      const playerStats1H: { [key: string]: any } = {};
      const playerStats2H: { [key: string]: any } = {};

      updates.forEach((seconds, playerId) => {
        // Asignamos todo a la primera parte como solución temporal/general
        playerStats1H[playerId] = { minutesPlayed: seconds };
        playerStats2H[playerId] = { minutesPlayed: 0 };
      });
      
      batch.update(matchRef, { 
        'playerStats.1H': playerStats1H,
        'playerStats.2H': playerStats2H, // Aseguramos que la 2H exista
      });
      
      await batch.commit();

      toast({ title: 'Éxito', description: 'Tiempos de juego actualizados correctamente.' });
      setMatchId('');
      setPlayerData('');
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
          Pega el ID del partido y la lista de jugadores con sus tiempos para actualizarlos en la base de datos.
          El formato debe ser: `Nombre del Jugador:mm:ss`, uno por línea o separados por comas.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="matchId">ID del Partido</Label>
          <Input 
            id="matchId"
            value={matchId}
            onChange={(e) => setMatchId(e.target.value)}
            placeholder="Ej: 7YuZhJ6yniEaAX4EmppW"
          />
        </div>
        <div>
          <Label htmlFor="playerData">Datos de Jugadores y Tiempos</Label>
          <Textarea
            id="playerData"
            value={playerData}
            onChange={(e) => setPlayerData(e.target.value)}
            placeholder="Manel:25:00, Marc Montoro:22:41, ..."
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

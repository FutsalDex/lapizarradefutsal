'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { collection, query, where } from 'firebase/firestore';
import { useCollection, useFirestore } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ArrowLeft, ClipboardList } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, subDays } from 'date-fns';

interface Player {
    id: string;
    name: string;
}

interface AttendanceRecord {
    [playerId: string]: boolean;
}

interface AttendanceByDate {
    [date: string]: AttendanceRecord;
}


export default function AttendancePage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { toast } = useToast();

  const [attendance, setAttendance] = useState<AttendanceByDate>({});

  const playersQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(collection(firestore, 'players'), where('teamId', '==', teamId));
  }, [firestore, teamId]);

  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersQuery);

  const trainingDates = Array.from({ length: 5 }).map((_, i) => format(subDays(new Date(), i * 2), 'yyyy-MM-dd'));

  const handleAttendanceChange = (playerId: string, date: string, isPresent: boolean) => {
      setAttendance(prev => ({
          ...prev,
          [date]: {
              ...prev[date],
              [playerId]: isPresent
          }
      }));
  };

  const handleSaveChanges = () => {
      // Here you would typically save the 'attendance' state to Firestore
      // For this example, we'll just show a toast notification.
      console.log('Guardando asistencias:', attendance);
      toast({
          title: 'Asistencias guardadas',
          description: 'Los cambios en las asistencias se han guardado (simulación).'
      })
  }

  const isLoading = isLoadingPlayers;

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/equipo/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel del Equipo
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
          <ClipboardList className="mr-3 h-10 w-10" />
          Control de Asistencia
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Registra la asistencia de tus jugadores a los entrenamientos.
        </p>
      </div>

      <Card>
        <CardHeader>
            <CardTitle>Registro de Asistencias</CardTitle>
            <CardDescription>Marca la casilla si el jugador asistió al entrenamiento.</CardDescription>
        </CardHeader>
        <CardContent>
            {isLoading && <Skeleton className="h-80 w-full" />}
            {!isLoading && (!players || players.length === 0) ? (
                <p className="text-center text-muted-foreground py-10">No hay jugadores en la plantilla para registrar asistencias.</p>
            ) : (
                <div className="overflow-x-auto">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="sticky left-0 bg-card">Jugador</TableHead>
                                {trainingDates.map(date => (
                                    <TableHead key={date} className="text-center whitespace-nowrap">
                                        {format(new Date(date), 'dd/MM')}
                                    </TableHead>
                                ))}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {players?.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell className="font-medium sticky left-0 bg-card">{player.name}</TableCell>
                                    {trainingDates.map(date => (
                                        <TableCell key={date} className="text-center">
                                            <Checkbox
                                                checked={attendance[date]?.[player.id] ?? false}
                                                onCheckedChange={(checked) => handleAttendanceChange(player.id, date, !!checked)}
                                            />
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
            )}
        </CardContent>
      </Card>
      
      {!isLoading && players && players.length > 0 && (
         <div className="mt-6 flex justify-end">
            <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </div>
      )}
    </div>
  );
}

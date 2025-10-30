'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { doc, collection, setDoc, getDoc, deleteDoc } from 'firebase/firestore';
import { useDoc, useFirestore, useUser, useCollection } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserCheck, ArrowLeft, CalendarIcon, Save, Trash2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';


// ====================
// TIPOS
// ====================
interface Team {
  id: string;
  name: string;
  ownerId: string;
}

interface Player {
  id: string;
  number: string;
  name: string;
}

type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado' | 'Lesionado';


// ====================
// PÁGINA PRINCIPAL
// ====================
export default function AttendancePage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [existingRecordDays, setExistingRecordDays] = useState<Date[]>([]);


  const teamRef = useMemoFirebase(() => doc(firestore, `teams/${teamId}`), [firestore, teamId]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const playersRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/players`), [firestore, teamId]);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  const attendanceCollectionRef = useMemoFirebase(() => collection(firestore, `teams/${teamId}/attendance`), [firestore, teamId]);
  const { data: attendanceRecords } = useCollection(attendanceCollectionRef);

  useEffect(() => {
    if (attendanceRecords) {
        const dates = attendanceRecords.map(rec => parseISO(rec.id));
        setExistingRecordDays(dates);
    }
  }, [attendanceRecords]);


  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
  }, [players]);

  const dateId = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const fetchAttendanceRecord = useCallback(async (date: Date | undefined) => {
    if (!date || !firestore) return;
    setIsLoadingRecord(true);
    const recordId = format(date, 'yyyy-MM-dd');
    const recordRef = doc(firestore, `teams/${teamId}/attendance`, recordId);
    
    try {
      const docSnap = await getDoc(recordRef);
      if (docSnap.exists()) {
        setPlayerStatuses(docSnap.data().playerStatus || {});
      } else {
        // Set all to 'Presente' if no record exists
        const initialStatuses = sortedPlayers.reduce((acc, player) => {
            acc[player.id] = 'Presente';
            return acc;
        }, {} as Record<string, AttendanceStatus>);
        setPlayerStatuses(initialStatuses);
      }
    } catch(error) {
      console.error("Error fetching attendance record:", error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo cargar el registro de asistencia.' });
    } finally {
        setIsLoadingRecord(false);
    }
  }, [firestore, teamId, toast, sortedPlayers]);


  useEffect(() => {
    // Fetch record for the selected date or set defaults
    if (sortedPlayers.length > 0) {
        fetchAttendanceRecord(selectedDate);
    }
  }, [selectedDate, sortedPlayers, fetchAttendanceRecord]);


  const handleStatusChange = (playerId: string, status: AttendanceStatus) => {
    setPlayerStatuses(prev => ({ ...prev, [playerId]: status }));
  };

  const handleSave = async () => {
    if (!dateId || !user) return;
    setIsSubmitting(true);
    const recordRef = doc(firestore, `teams/${teamId}/attendance`, dateId);
    
    try {
        await setDoc(recordRef, {
            date: dateId,
            teamId,
            userId: user.uid,
            playerStatus: playerStatuses
        });
        toast({ title: 'Asistencia Guardada', description: `Se ha guardado el registro para el día ${format(selectedDate!, 'PPP', { locale: es })}.`});
        setExistingRecordDays(prev => [...prev, selectedDate!]);
    } catch (error) {
        console.error("Error saving attendance:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo guardar la asistencia.' });
    } finally {
        setIsSubmitting(false);
    }
  };
  
  const handleDelete = async () => {
    if (!dateId) return;
    setIsSubmitting(true);
    const recordRef = doc(firestore, `teams/${teamId}/attendance`, dateId);
    try {
        await deleteDoc(recordRef);
        toast({ title: 'Registro Eliminado', description: `Se ha eliminado la asistencia para el día ${format(selectedDate!, 'PPP', { locale: es })}.`});
        setExistingRecordDays(prev => prev.filter(d => format(d, 'yyyy-MM-dd') !== dateId));
        fetchAttendanceRecord(selectedDate); // Refetch to reset to defaults
    } catch(error) {
        console.error("Error deleting attendance:", error);
        toast({ variant: 'destructive', title: 'Error', description: 'No se pudo eliminar el registro.' });
    } finally {
        setIsSubmitting(false);
    }
  };

  const handleClear = () => {
    if (!players) return;
    const initialStatuses = players.reduce((acc, player) => {
        acc[player.id] = 'Presente';
        return acc;
    }, {} as Record<string, AttendanceStatus>);
    setPlayerStatuses(initialStatuses);
  };
  
  const hasExistingRecord = dateId ? existingRecordDays.some(d => format(d, 'yyyy-MM-dd') === dateId) : false;

  const isLoading = isLoadingTeam || isLoadingPlayers;

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 space-y-6">
        <Skeleton className="h-10 w-80" />
        <Skeleton className="h-6 w-full max-w-lg" />
        <Card>
            <CardContent className="p-6">
                <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-12 w-full" />
                </div>
            </CardContent>
        </Card>
      </div>
    );
  }

  if (!team) {
    return <div className="container text-center py-10">Equipo no encontrado.</div>;
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
            <Button asChild variant="outline" className="mb-4">
                <Link href={`/equipo/gestion/${teamId}`}>
                    <ArrowLeft className="mr-2 h-4 w-4" />
                    Volver al Panel del Equipo
                </Link>
            </Button>
            <h1 className="text-4xl font-bold font-headline text-primary">
                Registro de Asistencia: {team.name}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
                Selecciona una fecha y marca el estado de cada jugador. Los días enmarcados ya tienen un registro.
            </p>
        </div>

        <Card>
            <CardContent className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <Label htmlFor="training-date" className="font-semibold">Fecha del entrenamiento:</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                            <Button
                                id="training-date"
                                variant={'outline'}
                                className={cn('w-[280px] justify-start text-left font-normal', !selectedDate && 'text-muted-foreground')}
                            >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : <span>Elige una fecha</span>}
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                initialFocus
                                locale={es}
                                modifiers={{ registered: existingRecordDays }}
                                modifiersStyles={{ registered: { fontWeight: 'bold', border: '2px solid currentColor' } }}
                            />
                        </PopoverContent>
                    </Popover>
                </div>

                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[100px]">Dorsal</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-right">Asistencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoadingRecord ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-full" /></TableCell>
                                    </TableRow>
                                ))
                            ) : sortedPlayers.length > 0 ? (
                                sortedPlayers.map(player => (
                                    <TableRow key={player.id}>
                                        <TableCell className="font-medium">{player.number}</TableCell>
                                        <TableCell>{player.name}</TableCell>
                                        <TableCell className="text-right">
                                            <RadioGroup
                                                value={playerStatuses[player.id] || 'Presente'}
                                                onValueChange={(value) => handleStatusChange(player.id, value as AttendanceStatus)}
                                                className="flex justify-end gap-4"
                                            >
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Presente" id={`${player.id}-presente`} />
                                                    <Label htmlFor={`${player.id}-presente`}>Presente</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Ausente" id={`${player.id}-ausente`} />
                                                    <Label htmlFor={`${player.id}-ausente`}>Ausente</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Justificado" id={`${player.id}-justificado`} />
                                                    <Label htmlFor={`${player.id}-justificado`}>Justificado</Label>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <RadioGroupItem value="Lesionado" id={`${player.id}-lesionado`} />
                                                    <Label htmlFor={`${player.id}-lesionado`}>Lesionado</Label>
                                                </div>
                                            </RadioGroup>
                                        </TableCell>
                                    </TableRow>
                                ))
                            ) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-muted-foreground">
                                        No hay jugadores en la plantilla. Añádelos desde la sección "Mi Plantilla".
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </div>
                 <div className="flex justify-end gap-2">
                    <Button variant="outline" onClick={handleClear} disabled={isSubmitting}>
                        <RotateCcw className="mr-2 h-4 w-4" />
                        Limpiar Registros
                    </Button>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <Button variant="destructive" disabled={isSubmitting || !hasExistingRecord}>
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar Registro
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                            <AlertDialogDescription>
                            Esta acción no se puede deshacer. Se eliminará permanentemente el registro de asistencia para el día seleccionado.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancelar</AlertDialogCancel>
                            <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">
                            Eliminar
                            </AlertDialogAction>
                        </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>

                    <Button onClick={handleSave} disabled={isSubmitting}>
                        <Save className="mr-2 h-4 w-4" />
                        {isSubmitting ? 'Guardando...' : 'Guardar Asistencia'}
                    </Button>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}

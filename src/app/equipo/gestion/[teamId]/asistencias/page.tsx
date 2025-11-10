
'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
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
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { UserCheck, ArrowLeft, CalendarIcon, Save, Trash2, RotateCcw, History } from 'lucide-react';
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

interface AttendanceRecord {
    id: string; // YYYY-MM-DD
    playerStatus?: Record<string, AttendanceStatus>;
}

type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado' | 'Lesionado';


// ====================
// COMPONENTES DE LA PÁGINA
// ====================

function DailyAttendanceRegistry({ team, teamId, players, attendanceRecords, setExistingRecordDays, existingRecordDays }: { team: Team, teamId: string, players: Player[], attendanceRecords: AttendanceRecord[], setExistingRecordDays: (dates: Date[]) => void, existingRecordDays: Date[] }) {
  const firestore = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [playerStatuses, setPlayerStatuses] = useState<Record<string, AttendanceStatus>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingRecord, setIsLoadingRecord] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  const sortedPlayers = useMemo(() => {
    if (!players) return [];
    return [...players].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
  }, [players]);

  const dateId = selectedDate ? format(selectedDate, 'yyyy-MM-dd') : null;

  const fetchAttendanceRecord = useCallback(async (date: Date | undefined) => {
    if (!date || !firestore || !sortedPlayers || sortedPlayers.length === 0) return;
    setIsLoadingRecord(true);
    const recordId = format(date, 'yyyy-MM-dd');
    const recordRef = doc(firestore, `teams/${teamId}/attendance`, recordId);
    
    try {
      const docSnap = await getDoc(recordRef);
      if (docSnap.exists()) {
        setPlayerStatuses(docSnap.data().playerStatus || {});
      } else {
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
    fetchAttendanceRecord(selectedDate);
  }, [selectedDate, fetchAttendanceRecord]);


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
        if (!existingRecordDays.some(d => format(d, 'yyyy-MM-dd') === dateId)) {
            setExistingRecordDays([...existingRecordDays, selectedDate!]);
        }
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
        setExistingRecordDays(existingRecordDays.filter(d => format(d, 'yyyy-MM-dd') !== dateId));
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

  return (
    <Card>
        <CardContent className="p-6 space-y-6">
            <div className="flex items-center gap-4">
                <Label htmlFor="training-date" className="font-semibold">Fecha del entrenamiento:</Label>
                <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
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
                            onSelect={(date) => {
                                setSelectedDate(date);
                                setIsCalendarOpen(false);
                            }}
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
  )
}

function AttendanceHistoryTable({ players, attendanceRecords }: { players: Player[], attendanceRecords: AttendanceRecord[] }) {
    
    const sortedPlayers = useMemo(() => {
        if (!players) return [];
        return [...players].sort((a, b) => parseInt(a.number, 10) - parseInt(b.number, 10));
    }, [players]);

    const historyData = useMemo(() => {
        const totalSessions = attendanceRecords.length;
        if (totalSessions === 0) return [];

        return sortedPlayers.map(player => {
            const stats = {
                'Presente': 0,
                'Ausente': 0,
                'Justificado': 0,
                'Lesionado': 0
            };

            attendanceRecords.forEach(record => {
                if (record.playerStatus) {
                    const status = record.playerStatus[player.id];
                    if (status) {
                        stats[status]++;
                    }
                }
            });

            const attendancePercentage = totalSessions > 0 ? (stats['Presente'] / totalSessions) * 100 : 0;

            return {
                ...player,
                stats,
                totalSessions,
                attendancePercentage
            };
        });
    }, [sortedPlayers, attendanceRecords]);

    if (attendanceRecords.length === 0) {
        return (
            <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                    No hay registros de asistencia para mostrar el historial.
                </CardContent>
            </Card>
        )
    }
    
    return (
        <Card>
             <CardHeader>
                <div className='flex items-center gap-2'>
                    <History className="h-5 w-5"/>
                    <CardTitle>Historial de Asistencia</CardTitle>
                </div>
                <CardDescription>Resumen de la asistencia de los jugadores a todos los entrenamientos registrados.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[50px]">#</TableHead>
                                <TableHead>Nombre</TableHead>
                                <TableHead className="text-center">P</TableHead>
                                <TableHead className="text-center">A</TableHead>
                                <TableHead className="text-center">J</TableHead>
                                <TableHead className="text-center">L</TableHead>
                                <TableHead className="text-center">Total</TableHead>
                                <TableHead className="w-[200px] text-center">% Asistencia</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {historyData.map(data => (
                                <TableRow key={data.id}>
                                    <TableCell className="font-medium">{data.number}</TableCell>
                                    <TableCell>{data.name}</TableCell>
                                    <TableCell className="text-center">{data.stats['Presente']}</TableCell>
                                    <TableCell className="text-center">{data.stats['Ausente']}</TableCell>
                                    <TableCell className="text-center">{data.stats['Justificado']}</TableCell>
                                    <TableCell className="text-center">{data.stats['Lesionado']}</TableCell>
                                    <TableCell className="text-center font-bold">{data.totalSessions}</TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <Progress value={data.attendancePercentage} className="w-[70%]" />
                                            <span className="text-xs text-muted-foreground font-semibold">{Math.round(data.attendancePercentage)}%</span>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </div>
                <div className="text-xs text-muted-foreground mt-4 grid grid-cols-2 gap-x-4">
                    <span><b>P:</b> Presente</span>
                    <span><b>A:</b> Ausente</span>
                    <span><b>J:</b> Ausencia Justificada</span>
                    <span><b>L:</b> Lesionado</span>
                    <p className='col-span-2 mt-2'>* El % de asistencia se calcula como: (Presente / Sesiones Totales) * 100.</p>
                </div>
            </CardContent>
        </Card>
    );
}

// ====================
// PÁGINA PRINCIPAL
// ====================
export default function AttendancePage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();

  const [existingRecordDays, setExistingRecordDays] = useState<Date[]>([]);

  const teamRef = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    return doc(firestore, `teams/${teamId}`);
  }, [firestore, teamId, user]);
  const { data: team, isLoading: isLoadingTeam } = useDoc<Team>(teamRef);

  const playersRef = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    return collection(firestore, `teams/${teamId}/players`);
  }, [firestore, teamId, user]);
  const { data: players, isLoading: isLoadingPlayers } = useCollection<Player>(playersRef);
  
  const attendanceCollectionRef = useMemoFirebase(() => {
    if (!firestore || !teamId || !user) return null;
    return collection(firestore, `teams/${teamId}/attendance`);
  }, [firestore, teamId, user]);
  const { data: attendanceRecords, isLoading: isLoadingAttendance } = useCollection<AttendanceRecord>(attendanceCollectionRef);

  useEffect(() => {
    if (attendanceRecords) {
        const dates = attendanceRecords.map(rec => parseISO(rec.id));
        setExistingRecordDays(dates);
    }
  }, [attendanceRecords]);

  const isLoading = isUserLoading || isLoadingTeam || isLoadingPlayers || isLoadingAttendance;

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

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Acceso Denegado</h2>
        <p className="text-muted-foreground mb-4">Debes iniciar sesión para gestionar la asistencia.</p>
        <Button asChild variant="outline">
          <Link href="/acceso">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Acceder
          </Link>
        </Button>
      </div>
    );
  }

  if (!team) {
    return (
      <div className="container mx-auto px-4 py-8 text-center">
        <h2 className="text-2xl font-bold mb-4">Equipo no encontrado</h2>
        <p className="text-muted-foreground mb-4">No se pudo encontrar el equipo. Vuelve a intentarlo.</p>
         <Button asChild variant="outline">
          <Link href="/equipo/gestion">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis equipos
          </Link>
        </Button>
      </div>
    );
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
                Control de Asistencia: {team.name}
            </h1>
            <p className="text-lg text-muted-foreground mt-2">
                Selecciona una fecha y marca el estado de cada jugador. Los días enmarcados ya tienen un registro.
            </p>
        </div>

        <Tabs defaultValue="registry" className="w-full">
            <TabsList className='grid w-full grid-cols-2'>
                <TabsTrigger value="registry">Registro Diario</TabsTrigger>
                <TabsTrigger value="history">Historial de Asistencia</TabsTrigger>
            </TabsList>
            <TabsContent value="registry" className='mt-6'>
                <DailyAttendanceRegistry 
                    team={team}
                    teamId={teamId}
                    players={players || []}
                    attendanceRecords={attendanceRecords || []}
                    setExistingRecordDays={setExistingRecordDays}
                    existingRecordDays={existingRecordDays}
                />
            </TabsContent>
            <TabsContent value="history" className='mt-6'>
                <AttendanceHistoryTable players={players || []} attendanceRecords={attendanceRecords || []} />
            </TabsContent>
        </Tabs>
    </div>
  );
}

"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { ArrowLeft, Calendar as CalendarIcon, Save, Trash2, RotateCcw, CalendarCheck2, History } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from '@/components/ui/progress';


type AttendanceStatus = 'presente' | 'ausente' | 'justificado' | 'lesionado';

type PlayerAttendance = {
  id: number;
  dorsal: string;
  nombre: string;
  status: AttendanceStatus;
};

const initialPlayers = [
    { id: 1, dorsal: '1', nombre: 'Manel', status: 'presente' as AttendanceStatus },
    { id: 2, dorsal: '2', nombre: 'Marc Montoro', status: 'presente' as AttendanceStatus },
    { id: 5, dorsal: '5', nombre: 'Dani', status: 'presente' as AttendanceStatus },
    { id: 6, dorsal: '6', nombre: 'Adam', status: 'presente' as AttendanceStatus },
    { id: 7, dorsal: '7', nombre: 'Hugo', status: 'presente' as AttendanceStatus },
    { id: 8, dorsal: '8', nombre: 'Victor', status: 'presente' as AttendanceStatus },
    { id: 9, dorsal: '9', nombre: 'Marc Romera', status: 'presente' as AttendanceStatus },
    { id: 10, dorsal: '10', nombre: 'Iker Rando', status: 'presente' as AttendanceStatus },
    { id: 11, dorsal: '11', nombre: 'Roger', status: 'presente' as AttendanceStatus },
    { id: 12, dorsal: '12', nombre: 'Marc Muñoz', status: 'presente' as AttendanceStatus },
    { id: 15, dorsal: '15', nombre: 'Lucas', status: 'presente' as AttendanceStatus },
    { id: 16, dorsal: '16', nombre: 'Salva', status: 'presente' as AttendanceStatus },
];

const attendanceHistory = [
    { dorsal: '1', nombre: 'Manel', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '2', nombre: 'Marc Montoro', p: 14, a: 0, j: 3, l: 1, total: 18 },
    { dorsal: '5', nombre: 'Dani', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '6', nombre: 'Adam', p: 17, a: 0, j: 1, l: 0, total: 18 },
    { dorsal: '7', nombre: 'Hugo', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '8', nombre: 'Victor', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '9', nombre: 'Marc Romera', p: 16, a: 0, j: 2, l: 0, total: 18 },
    { dorsal: '10', nombre: 'Iker Rando', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '11', nombre: 'Roger', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '12', nombre: 'Marc Muñoz', p: 17, a: 0, j: 1, l: 0, total: 18 },
    { dorsal: '15', nombre: 'Lucas', p: 18, a: 0, j: 0, l: 0, total: 18 },
    { dorsal: '16', nombre: 'Salva', p: 17, a: 0, j: 1, l: 0, total: 18 },
];

export default function AsistenciaPage() {
  const params = useParams();
  const teamName = "Juvenil B";
  const [date, setDate] = useState<Date>(new Date('2025-11-05T00:00:00'));
  const [attendance, setAttendance] = useState<PlayerAttendance[]>(initialPlayers);

  const handleStatusChange = (playerId: number, status: AttendanceStatus) => {
    setAttendance(prev =>
      prev.map(player =>
        player.id === playerId ? { ...player, status } : player
      )
    );
  };
  
  const clearRecords = () => {
    setAttendance(initialPlayers.map(p => ({ ...p, status: 'presente' })));
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-start mb-8">
        <div className="flex items-center gap-4">
            <div className="bg-muted p-3 rounded-full">
                <CalendarCheck2 className="w-8 h-8 text-primary" />
            </div>
            <div>
                <h1 className="text-4xl font-bold font-headline">Control de Asistencia: {teamName}</h1>
                <p className="text-lg text-muted-foreground mt-1">
                    Selecciona una fecha y marca el estado de cada jugador. Los días enmarcados ya tienen un registro.
                </p>
            </div>
        </div>
        <Button variant="outline" asChild>
            <Link href={`/equipos/${params.id}`}>
                <ArrowLeft className="mr-2" />
                Volver al Panel del Equipo
            </Link>
        </Button>
      </div>

      <Tabs defaultValue="registro" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="registro">Registro Diario</TabsTrigger>
            <TabsTrigger value="historial">Historial de Asistencia</TabsTrigger>
        </TabsList>
        <TabsContent value="registro">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-4">
                        <Label htmlFor="training-date" className="text-sm font-medium">Fecha del entrenamiento:</Label>
                        <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                    variant={"outline"}
                                    className={cn(
                                    "w-[280px] justify-start text-left font-normal",
                                    !date && "text-muted-foreground"
                                    )}
                                >
                                    <CalendarIcon className="mr-2 h-4 w-4" />
                                    {date ? format(date, "PPP", { locale: es }) : <span>Elige una fecha</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                    mode="single"
                                    selected={date}
                                    onSelect={setDate}
                                    initialFocus
                                    // You can add logic to highlight days with records
                                />
                            </PopoverContent>
                        </Popover>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[100px]">Dorsal</TableHead>
                                    <TableHead>Nombre</TableHead>
                                    <TableHead className="text-right">Asistencia</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {attendance.map(player => (
                                <TableRow key={player.id}>
                                    <TableCell className="font-medium">{player.dorsal}</TableCell>
                                    <TableCell>{player.nombre}</TableCell>
                                    <TableCell className="text-right">
                                        <RadioGroup
                                            defaultValue={player.status}
                                            className="flex justify-end gap-4"
                                            onValueChange={(value) => handleStatusChange(player.id, value as AttendanceStatus)}
                                        >
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="presente" id={`presente-${player.id}`} />
                                                <Label htmlFor={`presente-${player.id}`}>Presente</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="ausente" id={`ausente-${player.id}`} />
                                                <Label htmlFor={`ausente-${player.id}`}>Ausente</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="justificado" id={`justificado-${player.id}`} />
                                                <Label htmlFor={`justificado-${player.id}`}>Justificado</Label>
                                            </div>
                                            <div className="flex items-center space-x-2">
                                                <RadioGroupItem value="lesionado" id={`lesionado-${player.id}`} />
                                                <Label htmlFor={`lesionado-${player.id}`}>Lesionado</Label>
                                            </div>
                                        </RadioGroup>
                                    </TableCell>
                                </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2">
                    <Button variant="outline" onClick={clearRecords}>
                        <RotateCcw className="mr-2" /> Limpiar Registros
                    </Button>
                    <Button variant="destructive">
                        <Trash2 className="mr-2" /> Eliminar Registro
                    </Button>
                    <Button>
                        <Save className="mr-2" /> Guardar Asistencia
                    </Button>
                </CardFooter>
            </Card>
        </TabsContent>
        <TabsContent value="historial">
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-3">
                        <History className="w-5 h-5 text-primary"/>
                        <CardTitle>Historial de Asistencia</CardTitle>
                    </div>
                    <CardDescription>Resumen de la asistencia de los jugadores a todos los entrenamientos registrados.</CardDescription>
                </CardHeader>
                <CardContent>
                   <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[80px]">#</TableHead>
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
                                {attendanceHistory.map(player => {
                                    const percentage = player.total > 0 ? Math.round((player.p / player.total) * 100) : 0;
                                    return (
                                        <TableRow key={player.dorsal}>
                                            <TableCell className="font-medium">{player.dorsal}</TableCell>
                                            <TableCell>{player.nombre}</TableCell>
                                            <TableCell className="text-center">{player.p}</TableCell>
                                            <TableCell className="text-center">{player.a}</TableCell>
                                            <TableCell className="text-center">{player.j}</TableCell>
                                            <TableCell className="text-center">{player.l}</TableCell>
                                            <TableCell className="text-center font-bold">{player.total}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Progress value={percentage} className="w-2/3" />
                                                    <span className="text-sm text-muted-foreground w-1/3 text-right">{percentage}%</span>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    )
                                })}
                            </TableBody>
                        </Table>
                    </div>
                </CardContent>
                 <CardFooter>
                    <div className="text-xs text-muted-foreground space-y-1">
                        <div className="flex gap-4">
                            <p><span className="font-semibold">P:</span> Presente</p>
                            <p><span className="font-semibold">A:</span> Ausente</p>
                            <p><span className="font-semibold">J:</span> Ausencia Justificada</p>
                            <p><span className="font-semibold">L:</span> Lesionado</p>
                        </div>
                        <p>* El % de asistencia se calcula como: (Presente / Sesiones Totales) * 100.</p>
                    </div>
                </CardFooter>
            </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

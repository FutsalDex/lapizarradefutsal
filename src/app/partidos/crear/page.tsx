
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import React from "react";


export default function CrearPartidoPage() {
    const [date, setDate] = React.useState<Date>();

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
        <div className="mb-8">
            <Button variant="outline" asChild>
                <Link href="/partidos">
                    <ArrowLeft className="mr-2" />
                    Volver a Partidos
                </Link>
            </Button>
        </div>
      
        <Card>
            <CardHeader>
                <CardTitle className="font-headline text-2xl">Añadir Nuevo Partido</CardTitle>
                <CardDescription>Registra la información del encuentro.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="opponent">Rival</Label>
                    <Input id="opponent" placeholder="Nombre del equipo rival" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="location">Local / Visitante</Label>
                         <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="local">Local</SelectItem>
                                <SelectItem value="visitor">Visitante</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="competition">Competición</Label>
                        <Select>
                            <SelectTrigger>
                                <SelectValue placeholder="Seleccionar" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="liga">Liga</SelectItem>
                                <SelectItem value="copa">Copa</SelectItem>
                                <SelectItem value="torneo">Torneo</SelectItem>
                                <SelectItem value="amistoso">Amistoso</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                    <Label>Fecha</Label>
                    <Popover>
                        <PopoverTrigger asChild>
                        <Button
                            variant={"outline"}
                            className={cn(
                            "w-full justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, "PPP", { locale: es }) : <span>Selecciona una fecha</span>}
                        </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0">
                        <Calendar
                            mode="single"
                            selected={date}
                            onSelect={setDate}
                            initialFocus
                        />
                        </PopoverContent>
                    </Popover>
                    </div>
                    <div className="space-y-2">
                    <Label htmlFor="time">Hora</Label>
                    <div className="relative">
                        <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input id="time" type="time" className="pl-10" />
                    </div>
                    </div>
                </div>

                <div className="flex justify-end">
                    <Button>
                        <Save className="mr-2" />
                        Guardar Partido
                    </Button>
                </div>

            </CardContent>
        </Card>
    </div>
  );
}

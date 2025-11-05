
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, List, BookOpen, Save, PlusCircle, X } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";


const SubirEjercicioForm = ({ onCancel }: { onCancel: () => void }) => {
    const edades = ["Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior"];
    return (
        <Card className="max-w-4xl mx-auto mt-8">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Subir Nuevo Ejercicio</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <CardDescription>Rellena todos los campos posibles para que la comunidad entienda perfectamente el ejercicio.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="nombre-ejercicio">Nombre del Ejercicio</Label>
                        <Input id="nombre-ejercicio" placeholder="Ej: Rondo 4 vs 1" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="id-ejercicio">Número/ID</Label>
                        <Input id="id-ejercicio" placeholder="Ej: 001" />
                    </div>
                </div>
                <div className="space-y-2">
                    <Label htmlFor="descripcion">Descripción</Label>
                    <Textarea id="descripcion" placeholder="Explica en qué consiste el ejercicio..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="objetivos">Objetivos</Label>
                    <Textarea id="objetivos" placeholder="¿Qué se busca mejorar con este ejercicio?" />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="fase">Fase</Label>
                        <Select>
                            <SelectTrigger id="fase">
                                <SelectValue placeholder="Seleccionar fase" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Calentamiento">Calentamiento</SelectItem>
                                <SelectItem value="Principal">Principal</SelectItem>
                                <SelectItem value="Vuelta a la Calma">Vuelta a la Calma</SelectItem>
                                <SelectItem value="Preparación Física">Preparación Física</SelectItem>
                                <SelectItem value="Específico">Específico</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="categoria">Categoría</Label>
                        <Select>
                            <SelectTrigger id="categoria">
                                <SelectValue placeholder="Seleccionar categoría" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Técnica">Técnica</SelectItem>
                                <SelectItem value="Táctica">Táctica</SelectItem>
                                <SelectItem value="Físico">Físico</SelectItem>
                                <SelectItem value="Porteros">Porteros</SelectItem>
                                <SelectItem value="Pase y control">Pase y control</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="duracion">Duración (min)</Label>
                        <Input id="duracion" type="number" placeholder="Ej: 15" />
                    </div>
                </div>

                <div className="space-y-3">
                    <Label>Edades recomendadas</Label>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {edades.map(edad => (
                            <div key={edad} className="flex items-center space-x-2">
                                <Checkbox id={edad.toLowerCase()} />
                                <Label htmlFor={edad.toLowerCase()} className="font-normal">{edad}</Label>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <Label htmlFor="jugadores">Nº de Jugadores</Label>
                        <Input id="jugadores" placeholder="Ej: 5+" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="materiales">Espacio y Materiales</Label>
                        <Input id="materiales" placeholder="Ej: Medio campo, 5 conos, 1 balón" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="variantes">Variantes (Opcional)</Label>
                    <Textarea id="variantes" placeholder="Añade posibles variaciones para aumentar o disminuir la dificultad..." />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="consejos">Consejos (Opcional)</Label>
                    <Textarea id="consejos" placeholder="Ofrece consejos para la correcta ejecución del ejercicio..." />
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <Label htmlFor="image-url">URL de la Imagen (Opcional)</Label>
                            <Input id="image-url" placeholder="https://ejemplo.com/imagen.jpg" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="ia-hint">Pista para IA (Opcional)</Label>
                            <Input id="ia-hint" placeholder="ej: futsal drill" />
                        </div>
                    </div>
                    <div className="flex items-start justify-between rounded-lg border p-4">
                        <div className="space-y-1.5">
                            <Label htmlFor="visibility-switch" className="text-sm">
                                Visible en la biblioteca pública
                            </Label>
                            <p className="text-xs text-muted-foreground">
                                Si está activado, el ejercicio pasará a revisión del administrador antes de ser público y sumar puntos.
                            </p>
                        </div>
                        <Switch id="visibility-switch" defaultChecked />
                    </div>
                </div>

                <div className="flex justify-end pt-4">
                    <Button>
                        <PlusCircle className="mr-2" />
                        Añadir Ejercicio
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
};


export default function MisEjerciciosPage() {
    const [view, setView] = useState('list'); // 'list' or 'upload'

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/panel">
            <ArrowLeft className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full inline-flex">
                <BookOpen className="w-8 h-8 text-primary" />
            </div>
        </div>
        <h1 className="text-4xl font-bold font-headline">Mis Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Aporta ejercicios a la comunidad, gestiónalos y gana puntos para tu suscripción.
        </p>
      </div>

      <div className="flex justify-center gap-4 mb-8">
        <Button variant={view === 'upload' ? 'secondary' : 'outline'} onClick={() => setView('upload')}>
          <Upload className="mr-2" />
          Subir Ejercicio
        </Button>
        <Button variant={view === 'list' ? 'secondary' : 'default'} onClick={() => setView('list')}>
          <List className="mr-2" />
          Mis Ejercicios Subidos
        </Button>
      </div>

      {view === 'list' && (
        <Card>
          <CardHeader>
            <CardTitle>Ejercicios que has subido</CardTitle>
            <CardDescription>
              Aquí puedes ver y gestionar todos los ejercicios que has aportado a la comunidad.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre del Ejercicio</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Fase</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground h-24">
                    Aún no has subido ningún ejercicio.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {view === 'upload' && <SubirEjercicioForm onCancel={() => setView('list')} />}
    </div>
  );
}

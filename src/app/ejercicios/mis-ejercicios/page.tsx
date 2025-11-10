
"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, List, BookOpen, PlusCircle, X, Save } from "lucide-react";
import Link from "next/link";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";


const SubirEjercicioForm = ({ onCancel }: { onCancel: () => void }) => {
    const edades = [
        { id: "benjamin", label: "Benjamín (8-9 años)"},
        { id: "alevin", label: "Alevín (10-11 años)"},
        { id: "infantil", label: "Infantil (12-13 años)"},
        { id: "cadete", label: "Cadete (14-15 años)"},
        { id: "juvenil", label: "Juvenil (16-18 años)"},
        { id: "senior", label: "Senior (+18 años)"},
    ];

    const categorias = [
        "Finalización",
        "Técnica individual y combinada",
        "Pase y control",
        "Transiciones (ofensivas y defensivas)",
        "Coordinación, agilidad y velocidad",
        "Defensa (individual, colectiva y táctica)",
        "Conducción y regate",
        "Toma de decisiones y visión de juego",
        "Posesión y circulación del balón",
        "Superioridades e inferioridades numéricas",
        "Portero y trabajo específico",
        "Balón parado y remates",
        "Contraataques y ataque rápido",
        "Desmarques y movilidad",
        "Juego reducido y condicionado",
        "Calentamiento y activación",
    ];

    return (
        <Card className="max-w-4xl mx-auto mt-8">
            <CardHeader>
                <div className="flex justify-between items-center">
                    <CardTitle>Añadir Ejercicio Individual</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCancel}>
                        <X className="w-5 h-5" />
                    </Button>
                </div>
                <CardDescription>Completa el formulario para añadir un nuevo ejercicio a la biblioteca pública.</CardDescription>
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
                                {categorias.map(cat => (
                                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                                ))}
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                        {edades.map(edad => (
                            <div key={edad.id} className="flex items-center space-x-2">
                                <Checkbox id={edad.id} />
                                <Label htmlFor={edad.id} className="font-normal text-sm">{edad.label}</Label>
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
                                Si está desactivado, el ejercicio no será visible para los usuarios.
                            </p>
                        </div>
                        <Switch id="visibility-switch" />
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
          <Link href="/admin/ejercicios">
            <ArrowLeft className="mr-2" />
            Volver a Gestión de Ejercicios
          </Link>
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full inline-flex">
                <Upload className="w-8 h-8 text-primary" />
            </div>
        </div>
        <h1 className="text-4xl font-bold font-headline">Alta de Ejercicios</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Añade nuevos ejercicios a la biblioteca pública, de uno en uno o por lotes.
        </p>
      </div>

       {view === 'list' && (
         <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="flex flex-col text-center items-center justify-center p-8">
                <CardHeader>
                    <div className="bg-muted rounded-lg w-14 h-14 flex items-center justify-center mb-4 mx-auto">
                        <PlusCircle className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Añadir Ejercicio Individual</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Completa el formulario para añadir un nuevo ejercicio a la biblioteca pública.</p>
                </CardContent>
                <Button onClick={() => setView('upload')}>
                    Acceder
                </Button>
            </Card>
            <Card className="flex flex-col text-center items-center justify-center p-8">
                <CardHeader>
                     <div className="bg-muted rounded-lg w-14 h-14 flex items-center justify-center mb-4 mx-auto">
                        <Upload className="w-8 h-8 text-primary" />
                    </div>
                    <CardTitle>Subida de Ejercicios en Lote</CardTitle>
                </CardHeader>
                <CardContent>
                     <p className="text-muted-foreground">Sube un archivo CSV o Excel para añadir o actualizar múltiples ejercicios.</p>
                </CardContent>
                <Button>
                    Subir Archivo
                </Button>
            </Card>
         </div>
       )}
      

      {view === 'upload' && <SubirEjercicioForm onCancel={() => setView('list')} />}
    </div>
  );
}

    

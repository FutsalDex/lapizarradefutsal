
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, BookOpen, Upload, Paperclip, Image as ImageIcon, Video, Save } from "lucide-react";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";

export default function SubirEjercicioPage() {
    const edades = ["Benjamín", "Alevín", "Infantil", "Cadete", "Juvenil", "Senior"];
  return (
    <div className="container mx-auto px-4 py-8">
       <div className="mb-6">
        <Button variant="outline" asChild>
          <Link href="/ejercicios/mis-ejercicios">
            <ArrowLeft className="mr-2" />
            Volver a Mis Ejercicios
          </Link>
        </Button>
      </div>

      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
            <div className="bg-muted p-3 rounded-full inline-flex">
                <Upload className="w-8 h-8 text-primary" />
            </div>
        </div>
        <h1 className="text-4xl font-bold font-headline">Subir Nuevo Ejercicio</h1>
        <p className="text-lg text-muted-foreground mt-2">
          Completa el formulario para añadir un nuevo ejercicio a la biblioteca pública.
        </p>
      </div>

      <Card className="max-w-4xl mx-auto">
        <CardHeader>
            <CardTitle>Información del Ejercicio</CardTitle>
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

            <div className="space-y-3">
                <Label>Archivos Adjuntos</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button variant="outline">
                        <Paperclip className="mr-2" /> Adjuntar Pizarra
                    </Button>
                    <Button variant="outline">
                        <Video className="mr-2" /> Adjuntar Vídeo (URL)
                    </Button>
                     <Button variant="outline">
                        <ImageIcon className="mr-2" /> Adjuntar Imagen
                    </Button>
                </div>
            </div>
            
            <div className="flex justify-end gap-4 pt-4">
                <Button variant="outline">Guardar Borrador</Button>
                <Button>
                    <Save className="mr-2" />
                    Enviar a Revisión
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}

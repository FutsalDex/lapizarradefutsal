"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Edit, PlusCircle, Settings, Shield, Trash2, Users } from "lucide-react";
import Link from "next/link";

export default function EquiposPage() {
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

      <div className="flex items-center gap-4 mb-8">
        <div className="bg-muted p-3 rounded-full">
            <Shield className="w-8 h-8 text-primary" />
        </div>
        <div>
            <h1 className="text-4xl font-bold font-headline">Gestión de Equipos</h1>
            <p className="text-lg text-muted-foreground mt-1">Crea y administra tus equipos. Invita a tu cuerpo técnico para colaborar.</p>
        </div>
      </div>
      

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Columna Izquierda: Mis Equipos y Equipos Compartidos */}
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Mis Equipos</CardTitle>
              </div>
              <CardDescription>Lista de equipos que administras como propietario.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Equipo de ejemplo */}
              <div className="border rounded-lg p-4 flex items-center justify-between">
                <div>
                  <p className="font-bold text-lg">Juvenil B</p>
                  <p className="text-sm text-muted-foreground">FS Ràpid Santa Coloma</p>
                </div>
                <div className="flex items-center gap-2">
                  <Button size="sm">
                    <Settings className="mr-2" />
                    Gestionar
                  </Button>
                  <Button variant="ghost" size="icon">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
               <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-primary" />
                <CardTitle>Equipos Compartidos</CardTitle>
              </div>
              <CardDescription>Equipos a los que has sido invitado como miembro del cuerpo técnico.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-muted-foreground py-8">
                No eres miembro de ningún equipo.
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Derecha: Crear Nuevo Equipo */}
        <div className="lg:col-span-1">
          <Card className="sticky top-24">
            <CardHeader>
               <div className="flex items-center gap-3">
                    <PlusCircle className="w-5 h-5 text-primary" />
                    <CardTitle>Crear Nuevo Equipo</CardTitle>
               </div>
              <CardDescription>Añade un nuevo equipo para empezar a gestionarlo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="team-name">Nombre del Equipo</Label>
                <Input id="team-name" placeholder="Ej: Futsal Kings" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="club">Club (Opcional)</Label>
                <Input id="club" placeholder="Ej: City Futsal Club" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="competition">Competición (Opcional)</Label>
                <Input id="competition" placeholder="Ej: 1ª División Nacional" />
              </div>
              <Button className="w-full">Crear Equipo</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

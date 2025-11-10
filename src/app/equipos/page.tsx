
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Edit, PlusCircle, Settings, Shield, Trash2, Users } from "lucide-react";
import Link from "next/link";

export default function EquiposPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <Button variant="outline" asChild>
          <Link href="/panel">
            <ArrowLeft className="mr-2" />
            Volver al Panel
          </Link>
        </Button>
        <Button>
            <PlusCircle className="mr-2" />
            Añadir Equipo
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
      

      <div className="space-y-8">
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
                  <Button size="sm" asChild>
                    <Link href="/equipos/1">
                      <Settings className="mr-2" />
                      Gestionar
                    </Link>
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
        </div>
    </div>
  );
}

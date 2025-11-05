
"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Upload, List, BookOpen } from "lucide-react";
import Link from "next/link";

export default function MisEjerciciosPage() {
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
        <Button variant="outline">
          <Upload className="mr-2" />
          Subir Ejercicio
        </Button>
        <Button>
          <List className="mr-2" />
          Mis Ejercicios Subidos
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ejercicios que Has Subido</CardTitle>
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
    </div>
  );
}

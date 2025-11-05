"use client";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Save } from "lucide-react";

export default function PerfilPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Mi Perfil</h1>
        <p className="text-lg text-muted-foreground mt-2">Gestiona tu información personal y la configuración de tu cuenta.</p>
      </div>

      <Tabs defaultValue="personal" className="max-w-4xl mx-auto">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="personal">Datos Personales</TabsTrigger>
          <TabsTrigger value="seguridad">Seguridad</TabsTrigger>
        </TabsList>
        <TabsContent value="personal">
          <Card>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="md:col-span-1 flex flex-col items-center space-y-4">
                  <h3 className="font-semibold text-lg text-foreground">Foto de Perfil</h3>
                  <Avatar className="h-32 w-32">
                    <AvatarImage src="https://picsum.photos/seed/avatar/200/200" alt="Avatar" />
                    <AvatarFallback>
                        <User className="w-16 h-16"/>
                    </AvatarFallback>
                  </Avatar>
                  <Button variant="outline">
                    <Camera className="mr-2 h-4 w-4" />
                    Cambiar Foto
                  </Button>
                </div>
                <div className="md:col-span-2 space-y-6">
                    <h3 className="font-semibold text-lg text-foreground">Información de la Cuenta</h3>
                     <p className="text-sm text-muted-foreground">Estos datos son visibles para otros miembros de tus equipos.</p>
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input id="nombre" defaultValue="Francisco" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" defaultValue="futsaldex@gmail.com" disabled />
                    <p className="text-xs text-muted-foreground">No puedes cambiar tu dirección de correo electrónico.</p>
                  </div>
                   <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="suscripcion">Suscripción</Label>
                            <Input id="suscripcion" defaultValue="Pro" disabled />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="fin-suscripcion">Fin de la Suscripción</Label>
                            <Input id="fin-suscripcion" defaultValue="1 de octubre de 2026" disabled />
                        </div>
                   </div>
                  <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Guardar Cambios
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="seguridad">
          <Card>
            <CardHeader>
              <CardTitle>Seguridad</CardTitle>
              <CardDescription>
                Cambia tu contraseña y gestiona la seguridad de tu cuenta.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current-password">Contraseña Actual</Label>
                <Input id="current-password" type="password" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-password">Nueva Contraseña</Label>
                <Input id="new-password" type="password" />
              </div>
               <div className="flex justify-end">
                    <Button>
                      <Save className="mr-2 h-4 w-4" />
                      Cambiar Contraseña
                    </Button>
                  </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

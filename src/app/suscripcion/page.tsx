
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FileText, Users, Star, Euro, Calendar, Gift } from "lucide-react";

export default function SuscripcionPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline text-primary">Programa de Fidelización</h1>
        <p className="text-lg text-muted-foreground mt-2 max-w-3xl mx-auto">
          Tu esfuerzo y colaboración tienen recompensa. Aporta ejercicios a la comunidad (10 puntos por ejercicio y/o invita a tus amigos a unirse (25 puntos si se suscriben) y canjea tus puntos por meses gratis de suscripción.
        </p>
      </div>

      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ejercicios subidos</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">0</div>
              <p className="text-xs text-muted-foreground">0 puntos ganados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Amigos suscritos</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">3</div>
              <p className="text-xs text-muted-foreground">75 puntos ganados</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Puntos acumulados</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">75</div>
              <p className="text-xs text-muted-foreground">¡Sigue sumando!</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ahorro en renovación</CardTitle>
              <Euro className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">2.50 €</div>
              <p className="text-xs text-muted-foreground">Basado en el plan Pro</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Mi Plan</CardTitle>
               <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">Pro</div>
              <p className="text-xs text-muted-foreground">Vence el 01/10/2026</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Próxima Renovación</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">01/10/2026</div>
              <p className="text-xs text-muted-foreground">Pro</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Gift className="w-6 h-6 text-primary" />
              <CardTitle className="font-headline text-2xl">Invita a tus Amigos</CardTitle>
            </div>
             <p className="text-muted-foreground pt-2">Gana 25 puntos si se suscriben a un plan de pago. Introduce su email para generar un mensaje de WhatsApp con el enlace de invitación.</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4">
              <Input type="email" placeholder="Email del amigo" className="flex-grow" />
              <Button className="w-full sm:w-auto">Invitar por WhatsApp</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

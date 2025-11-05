
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Send } from "lucide-react";
import Link from "next/link";

const basicFeatures = [
  "Acceso a la biblioteca de ejercicios",
  "Crear sesiones de entrenamiento",
  "Gestión de 1 equipo",
  "Marcador rápido",
  "Guardar mis ejercicios favoritos",
  "Descargar sesiones en PDF",
];

const proFeatures = [
  "Todo lo del plan Básico",
  "Gestión de hasta 3 equipos",
  "Añadir miembros al cuerpo técnico",
  "Estadísticas avanzadas",
  "Descargar sesiones a PDF Pro",
];

export default function PlanesPage() {
  return (
    <div className="container mx-auto px-4 py-12 sm:py-16">
      <div className="text-center mb-12">
        <h1 className="text-4xl md:text-5xl font-bold font-headline text-primary">Planes de Suscripción</h1>
        <p className="text-lg text-muted-foreground mt-4 max-w-2xl mx-auto">
          Elige el plan que mejor se adapte a tus necesidades como entrenador.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        <Card className="flex flex-col border-2 rounded-lg shadow-lg">
          <CardHeader className="pb-4">
            <CardTitle className="font-headline text-2xl text-foreground">Plan Básico</CardTitle>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">19.95€</span>
              <span className="text-muted-foreground ml-1">/año</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {basicFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>

        <Card className="flex flex-col border-2 rounded-lg shadow-lg border-primary">
          <CardHeader className="pb-4">
            <CardTitle className="font-headline text-2xl text-foreground">Pro</CardTitle>
            <div className="flex items-baseline">
              <span className="text-4xl font-bold">39.95€</span>
              <span className="text-muted-foreground ml-1">/año</span>
            </div>
          </CardHeader>
          <CardContent className="flex-grow">
            <ul className="space-y-3">
              {proFeatures.map((feature, index) => (
                <li key={index} className="flex items-center">
                  <Check className="h-5 w-5 text-primary mr-2" />
                  <span className="text-muted-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </CardContent>
          <CardFooter>
          </CardFooter>
        </Card>
      </div>

      <div className="max-w-4xl mx-auto mt-16">
        <div className="flex items-center gap-2 mb-2">
            <Send className="w-5 h-5 text-foreground" />
            <h2 className="text-2xl font-bold font-headline">Instrucciones de Pago</h2>
        </div>
        <p className="text-muted-foreground mb-6">
          Para activar o renovar tu suscripción, sigue estos sencillos pasos.
        </p>
        <div className="space-y-6">
          <div>
            <p className="font-medium mb-2">1. Envía tu pago por Bizum al:</p>
            <div className="bg-muted p-4 rounded-lg text-center">
              <p className="text-2xl font-bold text-primary tracking-widest">607 820 029</p>
            </div>
          </div>
          <div>
            <p className="font-medium mb-2">2. Usa el siguiente concepto en el pago:</p>
            <div className="bg-muted p-4 rounded-lg">
              <p className="font-mono">LaPizarra (futsaldex@gmail.com)</p>
              <p className="text-xs text-muted-foreground mt-1">Ejemplo: LaPizarra (entrenadordefutsal@gmail.com)</p>
            </div>
          </div>
        </div>
        <p className="text-muted-foreground mt-6 text-sm text-center">
          Tu cuenta se activará o renovará en un plazo máximo de 24 horas. Recibirás un correo de confirmación. ¡Gracias por tu confianza!
        </p>
      </div>
    </div>
  );
}

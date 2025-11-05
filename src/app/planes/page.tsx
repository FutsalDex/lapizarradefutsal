
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight } from "lucide-react";
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
            <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
              <Link href="#">
                Suscribirse a Básico <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
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
            <Button asChild className="w-full bg-primary text-white hover:bg-primary/90">
              <Link href="#">
                Suscribirse a Pro <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}

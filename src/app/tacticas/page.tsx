import { TacticsBoard } from "@/components/tactics-board";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";


export default function TacticasPage() {
  return (
    <div className="container mx-auto px-4 py-8">
        <Button asChild variant="outline" className="mb-8">
          <Link href="/partidos">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel de Equipo
          </Link>
        </Button>
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold font-headline">Pizarra Táctica</h1>
        <p className="text-lg text-muted-foreground mt-2">Diseña tus jugadas, formaciones y estrategias.</p>
      </div>
      <TacticsBoard />
    </div>
  );
}

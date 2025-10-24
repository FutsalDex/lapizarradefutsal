import { matches } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, BarChart2, Target, Users, Percent } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const getResultVariant = (result: 'Victoria' | 'Derrota' | 'Empate') => {
  switch (result) {
    case 'Victoria':
      return 'default';
    case 'Derrota':
      return 'destructive';
    case 'Empate':
      return 'secondary';
  }
};

export default function PartidosPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
        <div className='text-center md:text-left'>
          <h1 className="text-4xl font-bold font-headline">Seguimiento de Partidos</h1>
          <p className="text-lg text-muted-foreground mt-2">Analiza el rendimiento de tu equipo partido a partido.</p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="mt-4 md:mt-0 w-full md:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" /> Añadir Partido
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Añadir Nuevo Partido</DialogTitle>
              <DialogDescription>
                Registra los datos del último encuentro.
              </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="opponent" className="text-right">
                  Rival
                </Label>
                <Input id="opponent" className="col-span-3" />
              </div>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="score" className="text-right">
                  Resultado
                </Label>
                <Input id="score" placeholder="Ej: 5 - 3" className="col-span-3" />
              </div>
            </div>
            <Button type="submit" className="w-full">Guardar Partido</Button>
          </DialogContent>
        </Dialog>
      </div>

      <div className="space-y-6">
        {matches.map((match) => (
          <Card key={match.id} className="transition-all hover:shadow-md">
            <CardHeader className="flex flex-col md:flex-row justify-between">
              <div>
                <CardTitle className="font-headline text-xl mb-1">Contra {match.opponent}</CardTitle>
                <CardDescription>{new Date(match.date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</CardDescription>
              </div>
              <div className="flex items-center gap-4 mt-4 md:mt-0">
                <span className="text-2xl font-bold">{match.score}</span>
                <Badge variant={getResultVariant(match.result)} className="text-sm">{match.result}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                  <Target className="h-6 w-6 text-primary mb-1"/>
                  <span className="font-bold text-lg">{match.stats.goals}</span>
                  <span className="text-xs text-muted-foreground">Goles</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                  <Users className="h-6 w-6 text-primary mb-1"/>
                  <span className="font-bold text-lg">{match.stats.assists}</span>
                  <span className="text-xs text-muted-foreground">Asistencias</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                  <BarChart2 className="h-6 w-6 text-primary mb-1"/>
                  <span className="font-bold text-lg">{match.stats.shots}</span>
                  <span className="text-xs text-muted-foreground">Tiros</span>
                </div>
                <div className="flex flex-col items-center p-2 rounded-lg bg-muted/50">
                  <Percent className="h-6 w-6 text-primary mb-1"/>
                  <span className="font-bold text-lg">{match.stats.possession}%</span>
                  <span className="text-xs text-muted-foreground">Posesión</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

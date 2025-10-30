'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  addDoc,
  collection,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore';
import { useCollection, useFirestore, useUser } from '@/firebase';
import { useMemoFirebase } from '@/firebase/use-memo-firebase';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Calendar, PlusCircle, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { format } from 'date-fns';

const matchSchema = z.object({
  visitorTeam: z.string().min(1, 'El nombre del rival es obligatorio.'),
  date: z.string().min(1, 'La fecha es obligatoria.'),
  matchType: z.string().min(1, 'El tipo de partido es obligatorio.'),
});

type MatchValues = z.infer<typeof matchSchema>;

interface Match {
  id: string;
  visitorTeam: string;
  date: string;
  matchType: string;
  localScore?: number;
  visitorScore?: number;
  isFinished: boolean;
}

function AddMatchForm({ teamId }: { teamId: string }) {
  const { toast } = useToast();
  const firestore = useFirestore();
  const { user } = useUser();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<MatchValues>({
    resolver: zodResolver(matchSchema),
    defaultValues: { visitorTeam: '', date: '', matchType: 'Amistoso' },
  });

  const onSubmit = async (values: MatchValues) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await addDoc(collection(firestore, 'matches'), {
        ...values,
        teamId,
        userId: user.uid,
        isFinished: false,
        createdAt: serverTimestamp(),
      });
      toast({ title: 'Partido añadido', description: 'El partido ha sido programado.' });
      form.reset();
    } catch (error) {
      console.error(error);
      toast({ variant: 'destructive', title: 'Error', description: 'No se pudo añadir el partido.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <PlusCircle className="mr-2 h-5 w-5" />
          Programar Nuevo Partido
        </CardTitle>
        <CardDescription>Añade un nuevo partido a tu calendario.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="visitorTeam"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Equipo Rival</FormLabel>
                  <FormControl>
                    <Input placeholder="Nombre del rival" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="date"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Fecha y Hora</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <FormField
              control={form.control}
              name="matchType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Partido</FormLabel>
                  <FormControl>
                     <Input placeholder="Amistoso, Liga, Copa..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting ? 'Programando...' : 'Programar Partido'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function MatchesList({ teamId }: { teamId: string }) {
  const firestore = useFirestore();
  const matchesQuery = useMemoFirebase(() => {
    if (!firestore || !teamId) return null;
    return query(collection(firestore, 'matches'), where('teamId', '==', teamId));
  }, [firestore, teamId]);

  const { data: matches, isLoading } = useCollection<Match>(matchesQuery);
  
  const upcomingMatches = matches?.filter(m => !m.isFinished) ?? [];
  const finishedMatches = matches?.filter(m => m.isFinished) ?? [];

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  return (
    <div className="space-y-8">
      <Card>
        <CardHeader>
          <CardTitle>Próximos Partidos</CardTitle>
        </CardHeader>
        <CardContent>
          {upcomingMatches.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">No hay partidos programados.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Rival</TableHead>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Competición</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {upcomingMatches.map(match => (
                  <TableRow key={match.id}>
                    <TableCell className="font-medium">{match.visitorTeam}</TableCell>
                    <TableCell>{format(new Date(match.date), "dd/MM/yyyy 'a las' HH:mm")}</TableCell>
                    <TableCell>{match.matchType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resultados Anteriores</CardTitle>
        </CardHeader>
        <CardContent>
           {finishedMatches.length === 0 ? (
             <p className="text-sm text-muted-foreground text-center py-4">No hay partidos finalizados.</p>
          ) : (
            <Table>
              <TableHeader>
                 <TableRow>
                  <TableHead>Rival</TableHead>
                  <TableHead>Resultado</TableHead>
                  <TableHead>Competición</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {finishedMatches.map(match => (
                   <TableRow key={match.id}>
                    <TableCell className="font-medium">{match.visitorTeam}</TableCell>
                    <TableCell>{match.localScore} - {match.visitorScore}</TableCell>
                    <TableCell>{match.matchType}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
           )}
        </CardContent>
      </Card>
    </div>
  );
}


export default function MatchesPage() {
  const params = useParams();
  const teamId = typeof params.teamId === 'string' ? params.teamId : '';

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <Button asChild variant="outline" className="mb-4">
          <Link href={`/equipo/gestion/${teamId}`}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver al Panel del Equipo
          </Link>
        </Button>
        <h1 className="text-4xl font-bold font-headline text-primary flex items-center">
          <Calendar className="mr-3 h-10 w-10" />
          Mis Partidos
        </h1>
        <p className="text-lg text-muted-foreground mt-2">
          Organiza el calendario de partidos de tu equipo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
        <div className="lg:col-span-2">
            <MatchesList teamId={teamId} />
        </div>
        <div className="lg:col-span-1">
            <AddMatchForm teamId={teamId} />
        </div>
      </div>
    </div>
  );
}

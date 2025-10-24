import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClipboardList, Presentation, Share2, Lightbulb } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import placeholderImages from '@/lib/placeholder-images.json';

const features = [
  {
    icon: <ClipboardList className="h-8 w-8 text-primary" />,
    title: 'Biblioteca de Ejercicios',
    description: 'Accede a una amplia gama de ejercicios de futsal para todos los niveles.',
    link: '/ejercicios',
  },
  {
    icon: <Presentation className="h-8 w-8 text-primary" />,
    title: 'Creador de Sesiones',
    description: 'Diseña y planifica tus entrenamientos de forma rápida e intuitiva.',
    link: '/sesiones',
  },
  {
    icon: <Share2 className="h-8 w-8 text-primary" />,
    title: 'Pizarra Táctica',
    description: 'Visualiza y comparte tus estrategias y formaciones con tu equipo.',
    link: '/tacticas',
  },
  {
    icon: <Lightbulb className="h-8 w-8 text-primary" />,
    title: 'Sugerencias con IA',
    description: 'Recibe recomendaciones de ejercicios basadas en el rendimiento de tu equipo.',
    link: '/ia-sugerencias',
  },
];

const heroImage = placeholderImages.placeholderImages.find(p => p.id === "hero");

export default function Home() {
  return (
    <div className="flex flex-col">
      <section className="relative w-full h-[60vh] md:h-[70vh] flex items-center justify-center text-center text-white bg-gray-800">
        {heroImage && (
          <Image
            src={heroImage.imageUrl}
            alt={heroImage.description}
            fill
            className="object-cover opacity-30"
            priority
            data-ai-hint={heroImage.imageHint}
          />
        )}
        <div className="relative z-10 p-4">
          <h1 className="font-headline text-4xl md:text-6xl lg:text-7xl font-bold tracking-tighter mb-4 text-shadow-lg">
            La Pizarra del Entrenador de Futsal
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-neutral-200 mb-8">
            Tu asistente digital para planificar, analizar y mejorar el rendimiento de tu equipo.
          </p>
          <Button asChild size="lg" className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold">
            <Link href="/ejercicios">Empezar Ahora</Link>
          </Button>
        </div>
      </section>

      <section id="features" className="w-full py-12 md:py-24 lg:py-32 bg-background">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center mb-12">
            <div className="inline-block rounded-lg bg-muted px-3 py-1 text-sm">
              Características Principales
            </div>
            <h2 className="text-3xl font-headline font-bold tracking-tighter sm:text-5xl">
              Todo lo que necesitas en un solo lugar
            </h2>
            <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
              Desde la planificación de entrenamientos hasta el análisis de partidos, LaPizarra te cubre.
            </p>
          </div>
          <div className="mx-auto grid items-start gap-8 sm:max-w-4xl sm:grid-cols-2 md:gap-12 lg:max-w-5xl lg:grid-cols-4">
            {features.map((feature) => (
              <Card key={feature.title} className="hover:shadow-lg transition-shadow duration-300">
                <CardHeader className="flex flex-col items-center text-center">
                  <div className="mb-4 rounded-full bg-accent/20 p-4">
                    {feature.icon}
                  </div>
                  <CardTitle className="font-headline text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="text-muted-foreground">{feature.description}</p>
                  <Button variant="link" asChild className="mt-4 text-primary">
                    <Link href={feature.link}>
                      Ir a {feature.title.split(' ')[0]}
                    </Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

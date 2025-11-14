
"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";


export default function PlayerStatsPage() {
    const params = useParams();
    const teamId = params.id as string;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-6">
                <Button variant="outline" asChild>
                <Link href={`/equipos/${teamId}/estadisticas`}>
                    <ArrowLeft className="mr-2" />
                    Volver a Estadísticas
                </Link>
                </Button>
            </div>
            <h1 className="text-3xl font-bold mb-6">Estadísticas de Jugadores</h1>
            <p className="text-muted-foreground">Próximamente...</p>
        </div>
    );
}


'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function ObsoleteEquiposPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/equipo/gestion');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p>Redirigiendo...</p>
    </div>
  );
}

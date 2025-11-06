
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

/**
 * This page is obsolete and now redirects to the correct team management page.
 */
export default function ObsoleteGestionPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/equipo/gestion/equipos');
  }, [router]);

  return (
    <div className="container mx-auto px-4 py-8 text-center">
      <p>Redirigiendo a la nueva página de gestión de equipos...</p>
    </div>
  );
}

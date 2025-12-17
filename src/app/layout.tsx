
import type { Metadata } from 'next';
<<<<<<< HEAD
import { Space_Grotesk, Inter } from 'next/font/google';
=======
import { Inter } from 'next/font/google';
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
import './globals.css';
import { cn } from '@/lib/utils';
import { Header } from '@/components/layout/header';
import { Toaster } from "@/components/ui/toaster"
import { FirebaseClientProvider } from '@/firebase/client-provider';

const fontHeadline = Inter({
  subsets: ['latin'],
  variable: '--font-headline',
  weight: '700',
});

const fontBody = Inter({
  subsets: ['latin'],
  variable: '--font-body',
});


export const metadata: Metadata = {
  title: 'LaPizarra',
  description: 'Tu compañero definitivo para el entrenamiento de fútbol sala.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={cn('antialiased', fontHeadline.variable, fontBody.variable)}>
        <FirebaseClientProvider>
          <div className="flex min-h-screen w-full flex-col">
            <Header />
            <main className="flex-1">{children}</main>
          </div>
          <Toaster />
        </FirebaseClientProvider>
      </body>
    </html>
  );
}

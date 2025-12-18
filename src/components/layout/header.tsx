
'use client';
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, BookOpen, PenSquare, Star, LayoutDashboard, UserCog, Gift, Users, User, LogOut, LogIn } from "lucide-react";
import { useUser } from "@/firebase/use-auth-user";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import Link from "next/link";
import { Logo } from "./logo";
import { AdminBadges } from "./admin-badges";

export function Header() {
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };
  
  const isAdmin = user && user.email === 'futsaldex@gmail.com';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" className="mr-2 px-0 text-base hover:bg-transparent focus-visible:bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 md:hidden">
              <Menu className="h-6 w-6" />
              <span className="sr-only">Menú</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="pr-0">
            <SheetClose asChild>
              <Link href="/" className="flex items-center gap-2 mb-4">
                <Logo />
                <SheetTitle>La Pizarra</SheetTitle>
              </Link>
            </SheetClose>
            <div className="my-4 flex flex-col space-y-1">
              <SheetClose asChild><Button asChild variant="ghost" className="w-full justify-start"><Link href="/ejercicios"><BookOpen className="mr-2 h-4 w-4" /> Ejercicios</Link></Button></SheetClose>
              <SheetClose asChild><Button asChild variant="ghost" className="w-full justify-start"><Link href="/equipo/gestion"><LayoutDashboard className="mr-2 h-4 w-4" /> Mi Equipo</Link></Button></SheetClose>
              <SheetClose asChild><Button asChild variant="ghost" className="w-full justify-start"><Link href="/favoritos"><Star className="mr-2 h-4 w-4" /> Favoritos</Link></Button></SheetClose>
              {isAdmin && <SheetClose asChild><Button asChild variant="ghost" className="w-full justify-start"><Link href="/admin"><UserCog className="mr-2 h-4 w-4" /> Admin</Link></Button></SheetClose>}
            </div>
          </SheetContent>
        </Sheet>
        
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-start">
          <Link href="/" className="flex items-center gap-2">
            <Logo />
            <h1 className="text-xl font-bold hidden sm:inline-block">LaPizarra</h1>
          </Link>
          <nav className="hidden md:flex items-center space-x-2">
            <Button variant="ghost" asChild><Link href="/ejercicios">Ejercicios</Link></Button>
            <Button variant="ghost" asChild><Link href="/equipo/gestion">Mi Equipo</Link></Button>
            <Button variant="ghost" asChild><Link href="/favoritos">Favoritos</Link></Button>
             <Button variant="ghost" asChild><Link href="/planes">Planes</Link></Button>
          </nav>
        </div>
        
        <div className="flex items-center space-x-1">
          {isUserLoading ? (
            <div className="w-10 h-10 bg-muted rounded-full animate-pulse" />
          ) : user ? (
            <>
              {isAdmin && <AdminBadges />}
              <Button asChild variant="ghost" className="h-10 w-10 rounded-full"><Link href="/perfil"><User /></Link></Button>
              <Button variant="ghost" size="sm" onClick={handleSignOut}><LogOut className="h-4 w-4" /></Button>
            </>
          ) : (
            <Button asChild>
              <Link href="/acceso"><LogIn className="mr-2 h-4 w-4" /> Acceder</Link>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}


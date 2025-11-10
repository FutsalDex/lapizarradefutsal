
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, User, Star, BookOpen, Edit, Heart, Shield, LogOut, Gift, Users as UsersIcon } from "lucide-react";
import { useUser } from "@/firebase/use-auth-user";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Logo } from './logo';
import { AdminBadges } from "./admin-badges";


const navLinks = [
  { href: "/ejercicios", label: "Ver ejercicios", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/sesiones", label: "Crear Sesión", icon: <Edit className="h-4 w-4" /> },
  { href: "/favoritos", label: "Favoritos", icon: <Heart className="h-4 w-4" /> },
  { href: "/equipo/gestion", label: "Mi Panel", icon: <Shield className="h-4 w-4" /> },
];

const adminLink = { href: "/admin", label: "Panel Admin", icon: <Shield className="h-4 w-4" /> };


export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleSignOut = () => {
    signOut(auth);
  };
  
  const isAdmin = user?.email === 'futsaldex@gmail.com';
  const allNavLinks = isAdmin ? [...navLinks.filter(l => l.href !== '/admin'), adminLink] : navLinks;

  const renderUserAuthDesktop = () => {
    if (isUserLoading || !isMounted) {
      return <div className="h-10 w-10 animate-pulse rounded-full bg-primary-foreground/20" />;
    }
    if (user) {
      return (
        <div className="flex items-center gap-2">
          {isAdmin && <AdminBadges />}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar className="h-9 w-9 border-2 border-primary-foreground/50">
                  <AvatarImage src={user.photoURL || undefined} alt={user.displayName || user.email || 'Avatar'} />
                  <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0) || 'U'}</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium leading-none">{user.displayName || 'Usuario'}</p>
                  <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                  <Link href="/perfil">
                      <User className="mr-2 h-4 w-4" />
                      <span>Mi Perfil</span>
                  </Link>
              </DropdownMenuItem>
               <DropdownMenuItem asChild>
                  <Link href="/suscripcion">
                      <Star className="mr-2 h-4 w-4" />
                      <span>Suscripción y Puntos</span>
                  </Link>
              </DropdownMenuItem>
                <DropdownMenuItem asChild>
                    <Link href="/planes">
                        <Star className="mr-2 h-4 w-4" />
                        <span>Ver Planes</span>
                    </Link>
                </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Cerrar Sesión</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    }
    return (
       <div className="flex items-center gap-2">
        <Button asChild variant="ghost" className="hover:bg-primary-foreground/10 text-primary-foreground">
            <Link href="/acceso">
            Acceder
            </Link>
        </Button>
        <Button asChild className="bg-primary-foreground text-primary hover:bg-primary-foreground/90">
            <Link href="/planes">
            Suscríbete
            </Link>
        </Button>
      </div>
    );
  };
  
  if (!isMounted) {
     return (
        <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
            <div className="container flex h-16 items-center">
                <Link href="/" className="mr-6 flex items-center space-x-2">
                    <span className="font-bold text-lg sm:inline-block font-headline">
                    LaPizarra
                    </span>
                </Link>
                <div className="flex-1" />
            </div>
        </header>
     );
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg sm:inline-block font-headline">
              LaPizarra
            </span>
          </Link>
          <nav className="flex items-center space-x-1 text-sm font-light">
            {allNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-black/10",
                  pathname.startsWith(link.href) && link.href !== "/"
                    ? "bg-black/10 font-semibold"
                    : "text-primary-foreground"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between md:hidden">
           <Link href="/" className="flex items-center space-x-2">
            <Logo />
            <span className="font-bold font-headline text-lg">
              LaPizarra
            </span>
          </Link>
          <div className="flex items-center gap-2">
            {isUserLoading ? (
              <div className="h-10 w-10 animate-pulse rounded-full bg-primary-foreground/10" />
            ) : user ? (
                <>
                {isAdmin && <AdminBadges />}
               <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                         <Avatar className="h-9 w-9">
                            <AvatarImage src={user.photoURL || undefined} alt={user.displayName || 'Avatar'} />
                            <AvatarFallback>{user.displayName?.charAt(0) || user.email?.charAt(0)}</AvatarFallback>
                        </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>{user.displayName || user.email || 'Mi Cuenta'}</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild><Link href="/perfil"><User className="mr-2 h-4 w-4" />Mi Perfil</Link></DropdownMenuItem>
                    <DropdownMenuItem asChild><Link href="/suscripcion"><Star className="mr-2 h-4 w-4" />Suscripción y Puntos</Link></DropdownMenuItem>
                     <DropdownMenuItem asChild><Link href="/planes"><Star className="mr-2 h-4 w-4" />Ver Planes</Link></DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}><LogOut className="mr-2 h-4 w-4"/>Cerrar Sesión</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                </>
            ) : null }
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Abrir menú</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="right">
                <SheetTitle className="sr-only">Menú</SheetTitle>
                <nav className="grid gap-4 text-base font-medium mt-8">
                  {allNavLinks.map((link) => (
                    <SheetClose asChild key={link.href}>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                         pathname.startsWith(link.href) && link.href !== "/"
                          ? "text-primary bg-muted"
                          : "text-muted-foreground"
                        )}
                      >
                        {link.icon}
                        {link.label}
                      </Link>
                    </SheetClose>
                  ))}
                  {!isUserLoading && !user && (
                    <SheetClose asChild>
                      <Link
                        href="/acceso"
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                          pathname === "/acceso"
                            ? "text-primary bg-muted"
                            : "text-muted-foreground"
                        )}
                      >
                        <User className="mr-2 h-4 w-4" />
                        Acceder
                      </Link>
                    </SheetClose>
                  )}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>

        <div className="hidden md:flex flex-1 justify-end items-center gap-2">
          {renderUserAuthDesktop()}
        </div>
      </div>
    </header>
  );
}

    

"use client";

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
import { Menu, UserCircle, BookOpen, Edit, Users, Heart, Shield, Share2, Lightbulb } from "lucide-react";
import { useUser, useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: "/ejercicios", label: "Ver ejercicios", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/sesiones", label: "Crear Sesión", icon: <Edit className="h-4 w-4" /> },
  { href: "/partidos", label: "Mi Equipo", icon: <Users className="h-4 w-4" /> },
  { href: "/favoritos", label: "Favoritos", icon: <Heart className="h-4 w-4" /> },
  { href: "/admin", label: "Panel Admin", icon: <Shield className="h-4 w-4" /> },
  { href: "/tacticas", label: "Tácticas", icon: <Share2 className="h-4 w-4" /> },
  { href: "/ia-sugerencias", label: "Sugerencias IA", icon: <Lightbulb className="h-4 w-4" /> },
];

export function Header() {
  const pathname = usePathname();
  const { user, isUserLoading } = useUser();
  const auth = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground shadow-sm">
      <div className="container flex h-16 items-center">
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
            <span className="font-bold text-lg sm:inline-block font-headline">
              LaPizarra
            </span>
          </Link>
          <nav className="flex items-center space-x-1 text-xs font-light">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-primary-foreground/10",
                  pathname === link.href
                    ? "bg-primary-foreground/20 font-semibold"
                    : "text-primary-foreground/80"
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
            <span className="font-bold font-headline text-lg">
              LaPizarra
            </span>
          </Link>
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
                {navLinks.map((link) => (
                  <SheetClose asChild key={link.href}>
                    <Link
                      href={link.href}
                      className={cn(
                        "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                       pathname === link.href
                        ? "text-primary bg-muted"
                        : "text-muted-foreground"
                      )}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  </SheetClose>
                ))}
                {!user && (
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
                      <UserCircle className="h-4 w-4" />
                      Acceder
                    </Link>
                  </SheetClose>
                )}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex flex-1 justify-end items-center gap-2">
          {isUserLoading ? (
             <div className="h-8 w-24 animate-pulse rounded-md bg-primary-foreground/10" />
          ) : user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10">
                    <UserCircle className="h-6 w-6" />
                    <span className="sr-only">Perfil de usuario</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>{user.displayName || user.email || 'Mi Cuenta'}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>Cerrar Sesión</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
               <Button asChild variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 hover:bg-primary-foreground/20 text-primary-foreground">
                <Link href="/acceso">
                  <UserCircle className="mr-2 h-4 w-4" />
                  Acceder
                </Link>
              </Button>
            )
          }
        </div>
      </div>
    </header>
  );
}

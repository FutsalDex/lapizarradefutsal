"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, UserCircle, BookOpen, Edit, Users, Heart, Shield, Share2, Lightbulb } from "lucide-react";

const navLinks = [
  { href: "/ejercicios", label: "Ejercicios", icon: <BookOpen className="h-4 w-4" /> },
  { href: "/sesiones", label: "Sesiones", icon: <Edit className="h-4 w-4" /> },
  { href: "/partidos", label: "Partidos", icon: <Users className="h-4 w-4" /> },
  { href: "/tacticas", label: "Tácticas", icon: <Share2 className="h-4 w-4" /> },
  { href: "/ia-sugerencias", label: "Sugerencias IA", icon: <Lightbulb className="h-4 w-4" /> },
];

export function Header() {
  const pathname = usePathname();

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
                    ? "bg-primary-foreground/20"
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
              <nav className="grid gap-4 text-base font-medium mt-8">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-primary",
                       pathname === link.href
                        ? "text-primary"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>

        <div className="hidden md:flex flex-1 justify-end">
           <Button variant="ghost" size="icon" className="rounded-full hover:bg-primary-foreground/10 focus-visible:bg-primary-foreground/10">
            <UserCircle className="h-6 w-6" />
            <span className="sr-only">Perfil de usuario</span>
          </Button>
        </div>
      </div>
    </header>
  );
}

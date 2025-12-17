
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
<<<<<<< HEAD
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, User, Star, BookOpen, Edit, Heart, Shield, LogOut, Gift, Users as UsersIcon } from "lucide-react";
import { useUser } from "@/firebase/use-auth-user";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";
=======
  SheetClose,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, BookOpen, PenSquare, Star, LayoutDashboard, UserCog, Gift, Users, User, LogOut, LogIn } from "lucide-react";
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
<<<<<<< HEAD
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

=======
} from "@/components/ui/dropdown-menu"
import { useState } from "react";
import { auth } from "@/firebase/config";
import { useAuthState } from "react-firebase-hooks/auth";
import { signOut } from "firebase/auth";
import { FirebaseLogo } from "./logo";


const navLinks = [
  { href: "/ejercicios", label: "Ver ejercicios", icon: <BookOpen className="w-5 h-5"/>, auth: false },
  { href: "/sesiones/crear", label: "Crear Sesión", icon: <PenSquare className="w-5 h-5"/>, auth: true },
  { href: "/favoritos", label: "Favoritos", icon: <Star className="w-5 h-5"/>, auth: true },
  { href: "/panel", label: "Mi Panel", icon: <LayoutDashboard className="w-5 h-5"/>, auth: true },
];

const adminNavLinks = [
    { href: "/admin", label: "Panel Admin", icon: <UserCog className="w-5 h-5"/>, auth: true },
]
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0

export function Header() {
  const [isMounted, setIsMounted] = useState(false);
  const pathname = usePathname();
<<<<<<< HEAD
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
=======
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const isLoggedIn = !!user;
  
  // Asumimos que el usuario es admin si tiene un email específico para desarrollo
  const isAdmin = isLoggedIn && user.email === 'futsaldex@gmail.com'; 
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  
  const pendingInvitations = 2;
  const pendingUsers = 5;
  
  const visibleNavLinks = navLinks; // Todos los enlaces son visibles para todos
  const visibleAdminNavLinks = adminNavLinks.filter(link => !link.auth || isAdmin);

  const handleLinkClick = () => {
    setIsSheetOpen(false);
  };
  
  const handleLogout = async () => {
    await signOut(auth);
    handleLinkClick();
    router.push('/');
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-primary text-primary-foreground">
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
      <div className="container flex h-16 items-center">
        <div className="mr-8 hidden md:flex">
          <Link href="/" className="mr-6 flex items-center space-x-2">
<<<<<<< HEAD
            <span className="font-bold text-lg sm:inline-block font-headline">
              LaPizarra
            </span>
          </Link>
          <nav className="flex items-center space-x-1 text-sm font-light">
            {allNavLinks.map((link) => (
=======
            
            <span className="hidden font-bold sm:inline-block font-headline text-lg">
              LaPizarra
            </span>
          </Link>
          <nav className="flex items-center space-x-6 text-sm font-medium">
            {visibleNavLinks.map((link) => (
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
              <Link
                key={link.href}
                href={link.href}
                className={cn(
<<<<<<< HEAD
                  "flex items-center gap-2 rounded-md px-3 py-2 transition-colors hover:bg-black/10",
                  pathname.startsWith(link.href) && link.href !== "/"
                    ? "bg-black/10 font-semibold"
                    : "text-primary-foreground"
                )}
              >
                {link.icon}
=======
                  "transition-colors hover:text-white flex items-center gap-2",
                  pathname === link.href
                    ? "text-white"
                    : "text-primary-foreground/80"
                )}
              >
                {link.icon}
                {link.label}
              </Link>
            ))}
             {isAdmin && visibleAdminNavLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "transition-colors hover:text-white flex items-center gap-2",
                  pathname.startsWith(link.href)
                    ? "text-white"
                    : "text-primary-foreground/80"
                )}
              >
                {link.icon}
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        
        <div className="flex flex-1 items-center justify-between md:hidden">
           <Link href="/" className="flex items-center space-x-2">
<<<<<<< HEAD
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
=======
            
            <span className="font-bold font-headline">
              LaPizarra
            </span>
          </Link>
          <Sheet open={isSheetOpen} onOpenChange={setIsSheetOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="hover:bg-primary/80">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Abrir menú</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetTitle className="sr-only">Menú</SheetTitle>
              <nav className="grid gap-6 text-lg font-medium mt-8">
                {[...visibleNavLinks, ...(isAdmin ? visibleAdminNavLinks : [])].map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={handleLinkClick}
                    className={cn(
                      "flex items-center gap-2 text-lg font-semibold transition-colors hover:text-foreground/80",
                      pathname === link.href
                        ? "text-foreground"
                        : "text-muted-foreground"
                    )}
                  >
                    {link.icon}
                    {link.label}
                  </Link>
                ))}
              </nav>
                <div className="absolute bottom-4 left-4 right-4 flex flex-col gap-2">
                  {isLoggedIn ? (
                     <Button variant="outline" onClick={handleLogout}>
                        <LogOut className="mr-2 h-4 w-4" />
                        Cerrar Sesión
                    </Button>
                  ) : (
                    <>
                        <Button asChild>
                            <Link href="/login" onClick={handleLinkClick}>
                                <LogIn className="mr-2 h-4 w-4" />
                                Iniciar Sesión
                            </Link>
                        </Button>
                        <Button variant="secondary" asChild>
                            <Link href="/registro" onClick={handleLinkClick}>
                                Registrarse
                            </Link>
                        </Button>
                    </>
                  )}
              </div>
            </SheetContent>
          </Sheet>
>>>>>>> ab01bf1182e15ad6b7471b2d0c44bb16ace71fe0
        </div>
        <div className="hidden md:flex flex-1 items-center justify-end space-x-2">
            {isLoggedIn ? (
              <>
                {isAdmin && (
                    <>
                        <Button variant="ghost" size="icon" className="relative hover:bg-primary/80" asChild>
                            <Link href="https://console.firebase.google.com/project/lapizarra-95eqd" target="_blank">
                                <FirebaseLogo />
                                <span className="sr-only">Proyecto de Firebase</span>
                            </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="relative hover:bg-primary/80" asChild>
                           <Link href="/admin/invitations">
                             <Gift className="h-5 w-5" />
                             {pendingInvitations > 0 && (
                                <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                    {pendingInvitations}
                                </span>
                             )}
                             <span className="sr-only">Invitaciones pendientes</span>
                           </Link>
                        </Button>
                        <Button variant="ghost" size="icon" className="relative hover:bg-primary/80" asChild>
                            <Link href="/admin/users">
                                <Users className="h-5 w-5" />
                                {pendingUsers > 0 && (
                                    <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
                                        {pendingUsers}
                                    </span>
                                )}
                                <span className="sr-only">Usuarios pendientes</span>
                            </Link>
                        </Button>
                    </>
                )}
                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative hover:bg-primary/80">
                            <User className="h-5 w-5" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                        <div className="flex flex-col space-y-1">
                            <p className="text-sm font-medium leading-none text-foreground">{user.displayName || 'Usuario'}</p>
                            <p className="text-xs leading-none text-muted-foreground">
                            {user.email}
                            </p>
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
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={handleLogout}>
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Cerrar Sesión</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="secondary" size="sm" asChild>
                    <Link href="/login">Iniciar Sesión</Link>
                </Button>
                <Button variant="default" size="sm" asChild>
                    <Link href="/registro">Registrarse</Link>
                </Button>
              </div>
            )}
        </div>
      </div>
    </header>
  );
}

    
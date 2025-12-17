'use client';
import { Sheet, SheetClose, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Button } from "../ui/button";
import { Menu, BookOpen, PenSquare, Star, LayoutDashboard, UserCog, Gift, Users, User, LogOut, LogIn } from "lucide-react";
import { useUser } from "@/firebase/use-auth-user";
import { useAuth } from "@/firebase";
import { signOut } from "firebase/auth";

export function Header() {
  const user = useUser();
  const { auth } = useAuth();

  const handleSignOut = () => {
    signOut(auth);
  };

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
            <SheetTitle>La Pizarra de Futsal</SheetTitle>
            {/* Navegación mobile */}
            <div className="my-4 flex flex-col space-y-2">
              <Button variant="ghost" className="w-full justify-start px-2">
                <BookOpen className="mr-2 h-4 w-4" /> Ejercicios
              </Button>
              <Button variant="ghost" className="w-full justify-start px-2">
                <Users className="mr-2 h-4 w-4" /> Equipos
              </Button>
              {user && (
                <>
                  <Button variant="ghost" className="w-full justify-start px-2">
                    <LayoutDashboard className="mr-2 h-4 w-4" /> Dashboard
                  </Button>
                  {user.role === 'admin' && (
                    <Button variant="ghost" className="w-full justify-start px-2">
                      <Users className="mr-2 h-4 w-4" /> Invitaciones
                    </Button>
                  )}
                </>
              )}
            </div>
          </SheetContent>
        </Sheet>
        {/* Logo y nav desktop */}
        <div className="flex flex-1 items-center justify-between space-x-2 md:justify-start">
          <div className="w-full flex-1 md:w-auto md:flex-none">
            <h1 className="text-xl font-bold">La Pizarra</h1>
          </div>
          <nav className="hidden md:flex items-center space-x-6">
            <Button variant="ghost">Ejercicios</Button>
            <Button variant="ghost">Equipos</Button>
            <Button variant="ghost">Partidos</Button>
            {user && user.role === 'admin' && (
              <Button variant="ghost" onClick={() => {/* Lógica invitación */}}>
                Invitar Usuario
              </Button>
            )}
          </nav>
        </div>
        <div className="flex items-center space-x-2">
          {user ? (
            <>
              <Button variant="ghost" onClick={handleSignOut}>
                <LogOut className="h-4 w-4" />
              </Button>
            </>
          ) : (
            <Button variant="ghost">
              <LogIn className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
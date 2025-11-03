'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth, useUser, useFirestore } from '@/firebase';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInAnonymously,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import { AtSign, Lock, User as UserIcon, Eye, EyeOff } from 'lucide-react';

export default function AccesoPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const auth = useAuth();
  const firestore = useFirestore();
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (!isUserLoading && user) {
      router.push('/ejercicios');
    }
  }, [user, isUserLoading, router]);

  const handleAuthAction = async (action: 'login' | 'register') => {
    setLoading(true);
    try {
      if (action === 'login') {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: '¡Bienvenido de vuelta!' });
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const newUser = userCredential.user;
        
        await updateProfile(newUser, { displayName: name });
        
        // Create a user document in Firestore
        const userDocRef = doc(firestore, 'users', newUser.uid);
        await setDoc(userDocRef, {
            uid: newUser.uid,
            displayName: name,
            email: newUser.email,
            createdAt: serverTimestamp(),
            photoURL: newUser.photoURL,
            subscription: 'Invitado', // Initial subscription status
        });
        
        toast({ title: '¡Registro completado!', description: 'Ya puedes iniciar sesión.' });
      }
    } catch (error: any) {
      console.error("Authentication error:", error.code, error.message);
      
      let friendlyMessage = 'Ha ocurrido un error. Por favor, inténtalo de nuevo.';
      switch (error.code) {
          case 'auth/email-already-in-use':
              friendlyMessage = 'Este correo electrónico ya está en uso. Por favor, inicia sesión o usa otro correo.';
              break;
          case 'auth/wrong-password':
              friendlyMessage = 'La contraseña es incorrecta.';
              break;
          case 'auth/user-not-found':
              friendlyMessage = 'No se ha encontrado ningún usuario con este correo.';
              break;
          case 'auth/invalid-email':
              friendlyMessage = 'El formato del correo electrónico no es válido.';
              break;
           case 'auth/weak-password':
              friendlyMessage = 'La contraseña es demasiado débil. Debe tener al menos 6 caracteres.';
              break;
      }
      
      toast({
        variant: 'destructive',
        title: 'Error de autenticación',
        description: friendlyMessage,
      });
    } finally {
      setLoading(false);
    }
  };

   const handleAnonymousSignIn = async () => {
    setLoading(true);
    try {
      await signInAnonymously(auth);
      toast({ title: "Accediendo como invitado..." });
    } catch (error) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo iniciar sesión como invitado.",
      });
    } finally {
      setLoading(false);
    }
  };


  if (isUserLoading || user) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto flex h-[calc(100vh-4rem)] items-center justify-center px-4">
      <Tabs defaultValue="login" className="w-full max-w-md">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">Iniciar Sesión</TabsTrigger>
          <TabsTrigger value="register">Registrarse</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login">
          <Card>
            <CardHeader>
              <CardTitle>Iniciar Sesión</CardTitle>
              <CardDescription>Accede a tu cuenta para continuar.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="login-email" type="email" placeholder="email@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="login-password" type={showPassword ? 'text' : 'password'} placeholder="Contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <Button onClick={() => handleAuthAction('login')} disabled={loading} className="w-full">
                {loading ? 'Accediendo...' : 'Iniciar Sesión'}
              </Button>
               <Button onClick={handleAnonymousSignIn} disabled={loading} className="w-full" variant="outline">
                {loading ? 'Accediendo...' : 'Entrar como Invitado'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="register">
          <Card>
            <CardHeader>
              <CardTitle>Registrarse</CardTitle>
              <CardDescription>Crea una cuenta para disfrutar de 30 días de prueba.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                 <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="name" placeholder="Tu nombre" value={name} onChange={(e) => setName(e.target.value)} className="pl-9" />
              </div>
              <div className="relative">
                 <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="register-email" type="email" placeholder="email@ejemplo.com" value={email} onChange={(e) => setEmail(e.target.value)} className="pl-9" />
              </div>
              <div className="relative">
                 <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="register-password" type={showPassword ? 'text' : 'password'} placeholder="Contraseña (mínimo 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-9 pr-10" />
                 <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 flex items-center pr-3">
                  {showPassword ? <EyeOff className="h-4 w-4 text-muted-foreground" /> : <Eye className="h-4 w-4 text-muted-foreground" />}
                </button>
              </div>
              <Button onClick={() => handleAuthAction('register')} disabled={loading} className="w-full">
                {loading ? 'Creando cuenta...' : 'Registrarse'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

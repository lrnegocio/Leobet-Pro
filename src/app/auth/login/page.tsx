"use client"

import React, { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useAuthStore } from '@/store/use-auth-store';
import { UserProfile } from '@/types/auth';

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get('role') || 'cliente';
  const auth = useAuth();
  const db = useFirestore();
  const setUser = useAuthStore((state) => state.setUser);
  const { toast } = useToast();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const MASTER_USER = "lrnegocio";
    const MASTER_PASS = "135796lR@";

    if (identifier === MASTER_USER && password === MASTER_PASS && roleFromUrl === 'admin') {
      const mockAdmin: UserProfile = {
        id: 'admin-master',
        nome: 'Administrador LEOBET',
        email: 'admin@leobet.pro',
        role: 'admin',
        balance: 1000000,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };
      setUser(mockAdmin);
      toast({ title: "Acesso Master Autorizado" });
      router.push('/admin/dashboard');
      setLoading(false);
      return;
    }

    try {
      if (!auth) throw new Error("Firebase não configurado.");
      
      const email = identifier.includes('@') ? identifier : `${identifier}@leobet.pro`;
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) throw new Error("Perfil não encontrado.");

      const profile = userDoc.data() as UserProfile;
      if (profile.role !== roleFromUrl && roleFromUrl !== 'admin') {
        throw new Error("Acesso negado para este nível.");
      }

      setUser(profile);
      router.push(`/${profile.role}/dashboard`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: "Credenciais inválidas para este acesso.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Link href="/" className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-all">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-primary bg-white">
        <CardHeader className="text-center">
          <div className="mx-auto bg-primary/10 p-4 rounded-full w-fit mb-2">
            <Lock className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-black font-headline uppercase tracking-tight">
            Acesso {roleFromUrl}
          </CardTitle>
          <CardDescription>Insira suas credenciais para continuar.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuário ou E-mail</Label>
              <Input 
                id="identifier" 
                placeholder={roleFromUrl === 'admin' ? "Usuário Admin" : "seu@email.com"}
                value={identifier} 
                onChange={(e) => setIdentifier(e.target.value)} 
                required 
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-primary font-bold h-12 text-lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        {roleFromUrl !== 'admin' && (
          <CardFooter className="justify-center border-t py-4">
            <p className="text-sm text-muted-foreground">
              Ainda não tem conta?{' '}
              <Link href={`/register?role=${roleFromUrl}`} className="text-primary font-bold hover:underline">
                Cadastre-se aqui
              </Link>
            </p>
          </CardFooter>
        )}
      </Card>
      <p className="mt-8 text-xs text-muted-foreground font-bold uppercase tracking-widest opacity-50">
        LEOBET PRO &copy; 2026 - Todos os direitos reservados
      </p>
    </>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center p-4">
      <Suspense fallback={<div className="text-center"><Loader2 className="animate-spin mx-auto" /></div>}>
        <LoginFormContent />
      </Suspense>
    </div>
  );
}

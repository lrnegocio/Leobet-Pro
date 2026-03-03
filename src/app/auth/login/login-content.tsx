"use client"

import React, { useState } from 'react';
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

export default function LoginContent() {
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
      return;
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, identifier, password);
      const uid = userCredential.user.uid;

      const userDoc = await getDoc(doc(db, 'users', uid));
      if (!userDoc.exists()) {
        throw new Error('Usuário não encontrado');
      }

      const userData = userDoc.data() as UserProfile;

      if (userData.role !== roleFromUrl) {
        throw new Error(`Este usuário não é ${roleFromUrl}`);
      }

      if (userData.status === 'pending') {
        toast({
          variant: "destructive",
          title: "Conta Pendente",
          description: "Sua conta está aguardando aprovação.",
        });
        setLoading(false);
        return;
      }

      setUser(userData);
      toast({ title: "Login bem-sucedido!" });

      const dashboardRoutes: Record<string, string> = {
        admin: '/admin/dashboard',
        cambista: '/cambista/dashboard',
        cliente: '/cliente/dashboard',
      };

      router.push(dashboardRoutes[roleFromUrl] || '/');
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Login",
        description: error.message || "Falha ao fazer login.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Login - {roleFromUrl.charAt(0).toUpperCase() + roleFromUrl.slice(1)}</CardTitle>
          <CardDescription>Acesse sua conta para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Email ou Usuário</Label>
              <Input
                id="identifier"
                placeholder="seu@email.com"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                disabled={loading}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
              />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {loading ? 'Entrando...' : 'Entrar'}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground w-full">
            Não tem conta? <Link href={`/auth/register?role=${roleFromUrl}`} className="text-accent hover:underline font-bold">Cadastre-se aqui</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

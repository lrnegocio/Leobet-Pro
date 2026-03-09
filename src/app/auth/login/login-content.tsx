
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
import { useAuthStore } from '@/store/use-auth-store';
import { UserProfile } from '@/types/auth';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get('role') || 'cliente';
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

    if (identifier === MASTER_USER && password === MASTER_PASS) {
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
      localStorage.setItem('is_master_admin', 'true');
      
      toast({ title: "Acesso Master Autorizado" });
      router.push('/admin/dashboard');
      return;
    }

    // Mock para outros usuários de teste
    if (password === '123456') {
      const mockUser: UserProfile = {
        id: 'user-test',
        nome: identifier.split('@')[0],
        email: identifier,
        role: roleFromUrl as any,
        balance: 100,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };
      setUser(mockUser);
      router.push(`/${roleFromUrl}/dashboard`);
      return;
    }

    toast({
      variant: "destructive",
      title: "Erro no Login",
      description: "Credenciais inválidas ou usuário não encontrado.",
    });
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4">
            <Lock className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline uppercase tracking-tight">Login Sistema</CardTitle>
          <CardDescription>Entre com suas credenciais de {roleFromUrl}</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuário ou Email</Label>
              <Input
                id="identifier"
                placeholder="Ex: lrnegocio"
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

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-black uppercase h-12" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Acessar Plataforma"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="flex flex-col gap-4">
          <div className="text-center text-sm text-muted-foreground w-full">
            Não possui cadastro? <Link href={`/auth/register?role=${roleFromUrl}`} className="text-accent hover:underline font-bold">Criar conta grátis</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

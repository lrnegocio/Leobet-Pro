
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

    // Lógica Master Admin
    if (identifier.toLowerCase() === MASTER_USER.toLowerCase() && password === MASTER_PASS) {
      const mockAdmin: UserProfile = {
        id: 'admin-master',
        nome: 'Administrador LEOBET',
        email: 'admin@leobet.pro',
        password: MASTER_PASS,
        role: 'admin',
        balance: 999999999,
        commissionBalance: 0,
        pendingBalance: 0,
        status: 'approved',
        createdAt: new Date().toISOString(),
      };
      
      setUser(mockAdmin);
      localStorage.setItem('is_master_admin', 'true');
      localStorage.setItem('logged_user', JSON.stringify(mockAdmin));
      
      toast({ title: "Acesso Master Autorizado" });
      router.push('/admin/dashboard');
      return;
    }

    // Busca usuário no LocalStorage
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    
    // Encontra por email ou por nome (usuário) ignorando case
    const foundUser = allUsers.find((u: UserProfile) => 
      (u.email && u.email.toLowerCase() === identifier.toLowerCase()) || 
      (u.nome && u.nome.toLowerCase() === identifier.toLowerCase())
    );

    if (!foundUser) {
      toast({
        variant: "destructive",
        title: "Usuário não encontrado",
        description: "Verifique o usuário/email informado.",
      });
      setLoading(false);
      return;
    }

    // Verifica se a senha confere
    if (foundUser.password !== password) {
      toast({
        variant: "destructive",
        title: "Senha Incorreta",
        description: "A senha informada não confere.",
      });
      setLoading(false);
      return;
    }

    // Verifica status
    if (foundUser.status === 'pending') {
      toast({
        variant: "destructive",
        title: "Acesso Pendente",
        description: "Sua conta ainda está em análise ou foi bloqueada.",
      });
      setLoading(false);
      return;
    }

    // Login Sucesso
    setUser(foundUser);
    localStorage.setItem('logged_user', JSON.stringify(foundUser));
    
    toast({ title: `Bem-vindo, ${foundUser.nome}!` });
    router.push(`/${foundUser.role}/dashboard`);
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
          <CardDescription>Acesse seu painel LEOBET</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="identifier">Usuário ou Email</Label>
              <Input
                id="identifier"
                placeholder="Ex: joao.silva"
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
        {roleFromUrl !== 'admin' && (
          <CardFooter className="flex flex-col gap-4">
            <div className="text-center text-sm text-muted-foreground w-full">
              Não possui conta? <Link href={`/auth/register?role=${roleFromUrl}`} className="text-accent hover:underline font-bold">Cadastrar-se</Link>
            </div>
          </CardFooter>
        )}
      </Card>
    </div>
  );
}

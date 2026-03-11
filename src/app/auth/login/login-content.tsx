
"use client"

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Loader2, Lock } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';

export default function LoginContent() {
  const router = useRouter();
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

    if (identifier.toLowerCase() === MASTER_USER.toLowerCase() && password === MASTER_PASS) {
      const mockAdmin = {
        id: 'admin-master',
        nome: 'Administrador LEOBET',
        email: 'admin@leobet.pro',
        role: 'admin' as const,
        balance: 999999999,
        commissionBalance: 0,
        pendingBalance: 0,
        status: 'approved' as const,
        createdAt: new Date().toISOString(),
      };
      setUser(mockAdmin);
      localStorage.setItem('is_master_admin', 'true');
      router.push('/admin/dashboard');
      return;
    }

    try {
      const { data: user, error } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${identifier.toLowerCase()},nome.eq.${identifier.toUpperCase()}`)
        .eq('password', password)
        .single();

      if (error || !user) {
        throw new Error("Usuário ou senha inválidos.");
      }

      if (user.status === 'pending') {
        throw new Error("Sua conta ainda está em análise.");
      }

      // Converte snake_case do banco para camelCase do UserProfile
      const formattedUser = {
        id: user.id,
        nome: user.nome,
        email: user.email,
        role: user.role,
        balance: Number(user.balance),
        commissionBalance: Number(user.commission_balance),
        pendingBalance: Number(user.pending_balance),
        status: user.status,
        phone: user.phone,
        pixKey: user.pix_key,
        createdAt: user.created_at
      };

      setUser(formattedUser);
      localStorage.setItem('logged_user', JSON.stringify(formattedUser));
      router.push(`/${user.role}/dashboard`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro de Acesso", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white uppercase text-[10px] font-black">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4"><Lock className="w-6 h-6 text-accent" /></div>
          <CardTitle className="text-2xl font-black uppercase">Login Sistema</CardTitle>
          <CardDescription className="font-bold">Acesse seu painel LEOBET</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Usuário ou Email</Label>
              <Input placeholder="Seu usuário" value={identifier} onChange={e => setIdentifier(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" className="w-full bg-accent h-12 font-black uppercase" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Acessar Plataforma"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

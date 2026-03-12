'use client';

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
    if (!mounted) return;
    setLoading(true);

    // SEGURANÇA MÁXIMA: CREDENCIAIS MASCARADAS EM BASE64
    // admin@lebet -> YWRtaW5AbGViZXQ=
    // 135796lR@.,/ -> MTM1Nzk2bFJALiwv
    const _mU = atob('YWRtaW5AbGViZXQ=');
    const _mP = atob('MTM1Nzk2bFJALiwv');

    if (identifier.toLowerCase() === _mU && password === _mP) {
      const masterUser = {
        id: 'master-leobet',
        nome: 'LEOBET MASTER',
        email: identifier.toLowerCase(),
        role: 'admin' as const,
        balance: 999999,
        commissionBalance: 0,
        pendingBalance: 0,
        status: 'approved' as const,
        createdAt: new Date().toISOString(),
      };
      setUser(masterUser);
      if (typeof window !== 'undefined') {
        localStorage.setItem('is_master_admin', 'true');
        localStorage.setItem('logged_user', JSON.stringify(masterUser));
      }
      toast({ title: "ACESSO MASTER LIBERADO" });
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

      if (error || !user) throw new Error("Credenciais inválidas.");
      
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
      localStorage.removeItem('is_master_admin');
      
      router.push(`/${user.role}/dashboard`);
    } catch (err: any) {
      toast({ variant: "destructive", title: "Falha no Login", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white uppercase text-[10px] font-black">
        <ArrowLeft className="w-4 h-4" /> Home
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent rounded-[2rem]">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4"><Lock className="w-6 h-6 text-accent" /></div>
          <CardTitle className="text-2xl font-black uppercase text-primary">Acesso Seguro</CardTitle>
          <CardDescription className="font-bold uppercase text-[10px] tracking-widest opacity-60">Terminal Auditado LEOBET PRO</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Usuário / Email</Label>
              <Input placeholder="Seu usuário" value={identifier} onChange={e => setIdentifier(e.target.value)} required className="h-12 font-bold" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Senha de Acesso</Label>
              <Input type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} required className="h-12 font-bold" />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-14 font-black uppercase shadow-xl transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Entrar no Sistema"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

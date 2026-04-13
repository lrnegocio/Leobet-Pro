'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, Lock, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuthStore } from '@/store/use-auth-store';
import { supabase } from '@/supabase/client';

export default function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = searchParams.get('role') || 'cliente';
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

    const cleanId = identifier.trim();
    const cleanPass = password.trim();

    try {
      // 1. ACESSO MESTRE - PRIORIDADE MÁXIMA
      if (cleanId.toLowerCase() === 'lrnegocio0' && cleanPass === '135796lR@.,/') {
        const masterUser = {
          id: 'MASTER-ADMIN',
          nome: 'ADMIN MASTER',
          email: 'lrnegocio0@leobet.pro',
          role: 'admin' as any,
          balance: 999999,
          commissionBalance: 0,
          pendingBalance: 0,
          status: 'approved' as any,
          createdAt: new Date().toISOString()
        };
        setUser(masterUser);
        localStorage.setItem('logged_user', JSON.stringify(masterUser));
        toast({ title: "ACESSO MASTER ATIVADO!" });
        router.push('/admin/dashboard');
        return;
      }

      // 2. TENTATIVA VIA BANCO DE DADOS (TABELA USERS)
      const { data: dbUser, error: dbError } = await supabase
        .from('users')
        .select('*')
        .or(`email.eq.${cleanId.toLowerCase()},nome.eq.${cleanId.toUpperCase()}`)
        .eq('password', cleanPass)
        .maybeSingle();

      if (dbUser) {
        if (dbUser.status === 'blocked') throw new Error("Acesso suspenso.");
        
        const formattedUser = {
          id: dbUser.id,
          nome: dbUser.nome,
          email: dbUser.email,
          role: dbUser.role,
          balance: Number(dbUser.balance || 0),
          commissionBalance: Number(dbUser.commission_balance || 0),
          status: dbUser.status,
          phone: dbUser.phone,
          pixKey: dbUser.pix_key,
          createdAt: dbUser.created_at
        };

        setUser(formattedUser);
        localStorage.setItem('logged_user', JSON.stringify(formattedUser));
        
        // Redirecionamento Estrito por Role
        if (formattedUser.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push(`/${formattedUser.role}/dashboard`);
        }
        return;
      }

      // 3. TENTATIVA VIA SUPABASE AUTH
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: cleanId.includes('@') ? cleanId.toLowerCase() : `${cleanId.toLowerCase()}@leobet.com`,
        password: cleanPass
      });

      if (!authError && authData.user) {
        const { data: profile } = await supabase
          .from('users')
          .select('*')
          .eq('email', authData.user.email)
          .maybeSingle();

        if (profile) {
          const formatted = {
            id: profile.id,
            nome: profile.nome,
            email: profile.email,
            role: profile.role,
            balance: Number(profile.balance || 0),
            commissionBalance: Number(profile.commission_balance || 0),
            status: profile.status,
            phone: profile.phone,
            pixKey: profile.pix_key,
            createdAt: profile.created_at
          };
          setUser(formatted);
          localStorage.setItem('logged_user', JSON.stringify(formatted));
          router.push(profile.role === 'admin' ? '/admin/dashboard' : `/${profile.role}/dashboard`);
          return;
        }
      }

      throw new Error("Credenciais inválidas.");

    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro de Acesso", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  const showRegisterLink = roleFromUrl === 'cliente' || roleFromUrl === 'cambista';

  return (
    <div className="min-h-screen bg-primary flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white uppercase text-[10px] font-black">
        <ArrowLeft className="w-4 h-4" /> Voltar para Home
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-accent rounded-[2.5rem] bg-white">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4 text-accent"><Lock className="w-8 h-8" /></div>
          <CardTitle className="text-2xl font-black uppercase text-primary">Terminal Seguro</CardTitle>
          <CardDescription className="font-bold uppercase text-[10px] tracking-widest opacity-60">Acesso Restrito LEOBET PRO</CardDescription>
        </CardHeader>
        <CardContent className="p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Usuário ou E-mail</Label>
              <Input 
                placeholder="Seu usuário" 
                value={identifier} 
                onChange={e => setIdentifier(e.target.value)} 
                required 
                className="h-14 font-bold border-2 rounded-xl focus:border-primary" 
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-black uppercase opacity-60">Senha Secreta</Label>
              <Input 
                type="password" 
                placeholder="••••••••" 
                value={password} 
                onChange={e => setPassword(e.target.value)} 
                required 
                className="h-14 font-bold border-2 rounded-xl focus:border-primary" 
              />
            </div>
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 h-16 font-black uppercase text-lg shadow-xl transition-all active:scale-95 rounded-2xl" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "ENTRAR NO SISTEMA"}
            </Button>
          </form>
        </CardContent>
        {showRegisterLink && (
          <CardFooter className="flex flex-col gap-4 border-t p-8 bg-muted/30 rounded-b-[2.5rem]">
            <p className="text-[10px] font-black uppercase text-muted-foreground text-center">Não tem conta?</p>
            <Link href={`/auth/register?role=${roleFromUrl}`} className="w-full">
              <Button variant="outline" className="w-full border-2 border-primary/20 hover:bg-primary/5 h-12 font-black uppercase text-[10px] rounded-xl gap-2">
                <UserPlus className="w-4 h-4" /> Criar nova conta
              </Button>
            </Link>
          </CardFooter>
        )}
      </Card>
      <p className="mt-8 text-[8px] font-black uppercase text-white/20 tracking-widest text-center">
        Proteção Anti-Hacker Ativa • Sincronizado com Supabase<br/>
        Acesso Master Ativado para 'lrnegocio0'
      </p>
    </div>
  );
}

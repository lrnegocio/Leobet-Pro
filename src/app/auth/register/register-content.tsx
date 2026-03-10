
"use client"

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Loader2, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { UserRole, UserProfile } from '@/types/auth';

export default function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roleFromUrl = (searchParams.get('role') as UserRole) || 'cliente';
  const { toast } = useToast();

  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [cpf, setCpf] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [phone, setPhone] = useState('');
  const [pixKey, setPixKey] = useState('');
  const [loading, setLoading] = useState(false);

  // TRAVA DE SEGURANÇA: Apenas Clientes e Cambistas podem se cadastrar sozinhos
  const isBlockedRole = roleFromUrl === 'admin' || roleFromUrl === 'gerente';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isBlockedRole) return;
    
    const cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({
        variant: "destructive",
        title: "Telefone Inválido",
        description: "Informe o telefone completo com DDD (ex: 82993343941)",
      });
      return;
    }

    setLoading(true);

    const newUser: UserProfile = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      nome: nome.toUpperCase(),
      email,
      password,
      cpf,
      birthDate,
      phone: cleanPhone,
      pixKey,
      role: roleFromUrl,
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      gerenteId: roleFromUrl === 'cambista' ? 'admin-master' : undefined,
      status: roleFromUrl === 'cliente' ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
    };

    const existingUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...existingUsers, newUser]));

    setTimeout(() => {
      setLoading(false);
      if (newUser.status === 'pending') {
        toast({
          title: "Cadastro Realizado!",
          description: "Sua conta está em análise pelo administrador master.",
        });
        router.push('/');
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Sua conta foi criada com sucesso.",
        });
        router.push('/auth/login?role=cliente');
      }
    }, 1000);
  };

  if (isBlockedRole) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4 font-body">
        <Card className="max-w-md w-full text-center p-12 rounded-[2rem] border-none shadow-2xl">
          <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto mb-6 text-destructive">
             <UserPlus className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black uppercase text-primary tracking-tighter">Acesso Restrito</h2>
          <p className="text-sm font-bold text-muted-foreground mt-4 leading-relaxed">
            Cadastros de <span className="text-destructive">ADMINISTRADORES</span> e <span className="text-destructive">GERENTES</span> são realizados exclusivamente pela diretoria através do painel master.
          </p>
          <Link href="/">
            <Button className="mt-8 w-full h-14 uppercase font-black bg-primary rounded-xl shadow-lg">Voltar ao Início</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4 font-body">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors font-black uppercase text-[10px] tracking-widest">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-accent rounded-[2rem] overflow-hidden">
        <CardHeader className="text-center pt-8">
          <div className="mx-auto bg-accent/20 p-4 rounded-full w-fit mb-4">
            <UserPlus className="w-8 h-8 text-accent" />
          </div>
          <CardTitle className="text-3xl font-black uppercase tracking-tighter text-primary">Criar Conta</CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase tracking-widest opacity-60">
            {roleFromUrl === 'cambista' 
              ? 'Solicite seu acesso como cambista parceiro' 
              : 'Cadastre-se para começar a apostar'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="SEU NOME" required disabled={loading} className="font-bold h-11 rounded-xl" />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase opacity-60">CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" required disabled={loading} className="font-bold h-11 rounded-xl" />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] font-black uppercase opacity-60">Nascimento</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required disabled={loading} className="font-bold h-11 rounded-xl" />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase opacity-60">WhatsApp (Com DDD)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="EX: 82993343941" required disabled={loading} className="font-bold h-11 rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label>
              <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="PIX PARA RECEBIMENTOS" required disabled={loading} className="font-bold h-11 rounded-xl" />
            </div>

            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase opacity-60">Usuário de Acesso</Label>
              <Input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="EX: JOAO.SILVA" required disabled={loading} className="font-bold h-11 rounded-xl" />
            </div>
            
            <div className="space-y-1">
              <Label className="text-[10px] font-black uppercase opacity-60">Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} className="font-bold h-11 rounded-xl" />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-black uppercase h-14 mt-4 rounded-xl shadow-xl transition-all active:scale-95" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Finalizar Cadastro"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="bg-muted/30 p-6">
          <div className="text-center text-[10px] font-black uppercase tracking-widest text-muted-foreground w-full">
            Já possui conta? <Link href={`/auth/login?role=${roleFromUrl}`} className="text-primary hover:underline">Entrar agora</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

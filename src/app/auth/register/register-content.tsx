
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
      id: Math.random().toString(36).substring(7),
      nome: nome.toUpperCase(),
      email,
      password, // Persistindo a senha informada
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
          description: "Sua conta de cambista está em análise pelo administrador master.",
        });
        router.push('/');
      } else {
        toast({
          title: "Bem-vindo!",
          description: "Sua conta de cliente foi criada com sucesso.",
        });
        router.push('/auth/login?role=cliente');
      }
    }, 1000);
  };

  if (isBlockedRole) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-8">
          <h2 className="text-xl font-black uppercase text-destructive">Acesso Restrito</h2>
          <p className="text-sm text-muted-foreground mt-2">Cadastros de administradores e gerentes são realizados exclusivamente pela diretoria.</p>
          <Link href="/">
            <Button className="mt-6 w-full uppercase font-black">Voltar ao Início</Button>
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>

      <Card className="w-full max-w-md shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/20 p-3 rounded-full w-fit mb-4">
            <UserPlus className="w-6 h-6 text-accent" />
          </div>
          <CardTitle className="text-2xl font-bold font-headline uppercase tracking-tight">Criar Conta</CardTitle>
          <CardDescription>
            {roleFromUrl === 'cambista' 
              ? 'Solicite seu acesso como cambista parceiro LEOBET' 
              : 'Cadastre-se para começar a apostar'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <Label>Nome Completo</Label>
              <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome completo" required disabled={loading} />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>CPF</Label>
                <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="000.000.000-00" required disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label>Nascimento</Label>
                <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required disabled={loading} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Telefone (WhatsApp com DDD)</Label>
              <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Ex: 82993343941" required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>Chave PIX para Recebimentos</Label>
              <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="CPF, Email, Telefone ou Chave Aleatória" required disabled={loading} />
            </div>

            <div className="space-y-2">
              <Label>Usuário ou Email</Label>
              <Input type="text" value={email} onChange={e => setEmail(e.target.value)} placeholder="Ex: joao.silva" required disabled={loading} />
            </div>
            
            <div className="space-y-2">
              <Label>Senha</Label>
              <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required disabled={loading} />
            </div>

            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-black uppercase h-12 mt-2" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : "Finalizar Cadastro"}
            </Button>
          </form>
        </CardContent>
        <CardFooter>
          <div className="text-center text-sm text-muted-foreground w-full">
            Já possui conta? <Link href={`/auth/login?role=${roleFromUrl}`} className="text-accent hover:underline font-bold">Entrar agora</Link>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}

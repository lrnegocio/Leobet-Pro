
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
import { UserRole } from '@/types/auth';
import { supabase } from '@/supabase/client';

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
        description: "Informe o telefone completo com DDD",
      });
      return;
    }

    setLoading(true);

    const newUser = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      nome: nome.toUpperCase(),
      email,
      password,
      cpf,
      birth_date: birthDate,
      phone: cleanPhone,
      pix_key: pixKey,
      role: roleFromUrl,
      balance: 0,
      commission_balance: 0,
      pending_balance: 0,
      gerente_id: roleFromUrl === 'cambista' ? 'admin-master' : null,
      status: roleFromUrl === 'cliente' ? 'approved' : 'pending',
    };

    try {
      const { error } = await supabase.from('users').insert([newUser]);
      if (error) throw error;

      toast({
        title: newUser.status === 'pending' ? "Cadastro Realizado!" : "Bem-vindo!",
        description: newUser.status === 'pending' ? "Sua conta está em análise." : "Conta criada com sucesso.",
      });
      router.push('/auth/login');
    } catch (err: any) {
      toast({ variant: "destructive", title: "Erro ao cadastrar", description: err.message });
    } finally {
      setLoading(false);
    }
  };

  if (isBlockedRole) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center p-4">
        <Card className="max-w-md w-full text-center p-12 rounded-[2rem]">
          <div className="bg-destructive/10 p-4 rounded-full w-fit mx-auto mb-6 text-destructive">
             <UserPlus className="w-12 h-12" />
          </div>
          <h2 className="text-2xl font-black uppercase text-primary">Acesso Restrito</h2>
          <p className="text-sm font-bold text-muted-foreground mt-4">
            Cadastros de Admin/Gerente são manuais pela diretoria.
          </p>
          <Link href="/"><Button className="mt-8 w-full h-14 uppercase font-black bg-primary">Início</Button></Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary to-primary/90 flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-white/60 hover:text-white uppercase text-[10px] font-black">
        <ArrowLeft className="w-4 h-4" /> Voltar
      </Link>
      <Card className="w-full max-w-md shadow-2xl border-t-8 border-t-accent rounded-[2rem]">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-black uppercase text-primary">Criar Conta</CardTitle>
          <CardDescription className="font-bold text-[10px] uppercase">
            {roleFromUrl === 'cambista' ? 'Acesso Cambista Parceiro' : 'Comece a Apostar Agora'}
          </CardDescription>
        </CardHeader>
        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-4">
            <Input value={nome} onChange={e => setNome(e.target.value)} placeholder="NOME COMPLETO" required className="font-bold h-11" />
            <div className="grid grid-cols-2 gap-4">
              <Input value={cpf} onChange={e => setCpf(e.target.value)} placeholder="CPF" required className="font-bold h-11" />
              <Input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} required className="font-bold h-11" />
            </div>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="WHATSAPP C/ DDD" required className="font-bold h-11" />
            <Input value={pixKey} onChange={e => setPixKey(e.target.value)} placeholder="CHAVE PIX" required className="font-bold h-11" />
            <Input value={email} onChange={e => setEmail(e.target.value.toLowerCase())} placeholder="USUÁRIO / EMAIL" required className="font-bold h-11" />
            <Input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="SENHA" required className="font-bold h-11" />
            <Button type="submit" className="w-full bg-accent h-14 mt-4 font-black uppercase" disabled={loading}>
              {loading ? <Loader2 className="animate-spin" /> : "Finalizar Cadastro"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

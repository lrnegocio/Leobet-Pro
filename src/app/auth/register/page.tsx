
"use client"

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, User, Store, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useAuth, useFirestore } from '@/firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role') || 'cliente';
  const { toast } = useToast();
  const auth = useAuth();
  const db = useFirestore();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    cpf: '',
    pixKey: '',
    phone: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // 1. Criar usuário no Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // 2. Criar perfil no Firestore
      const userProfile = {
        id: uid,
        nome: formData.nome,
        email: formData.email,
        role: role as any,
        balance: 0,
        status: role === 'admin' ? 'approved' : (role === 'cambista' ? 'pending' : 'approved'),
        cpf: formData.cpf,
        pixKey: formData.pixKey,
        phone: formData.phone,
        createdAt: new Date().toISOString(),
      };

      await setDoc(doc(db, 'users', uid), userProfile);

      toast({
        title: role === 'cambista' ? "Cadastro Solicitado" : "Cadastro Realizado",
        description: role === 'cambista' 
          ? "Aguarde a aprovação do administrador para acessar o painel." 
          : "Sua conta foi criada com sucesso!",
      });

      router.push(`/login?role=${role}`);
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Erro no Cadastro",
        description: error.message || "Não foi possível criar sua conta.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.id]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 py-12">
      <Link href={`/login?role=${role}`} className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors">
        <ArrowLeft className="w-4 h-4" /> Voltar ao login
      </Link>

      <Card className="w-full max-w-2xl shadow-2xl border-t-4 border-t-accent">
        <CardHeader className="text-center">
          <div className="mx-auto bg-accent/10 p-4 rounded-full w-fit mb-4">
            {role === 'cambista' ? <Store className="w-8 h-8 text-accent" /> : <User className="w-8 h-8 text-accent" />}
          </div>
          <CardTitle className="text-2xl font-bold font-headline">Cadastro de {role === 'cambista' ? 'Cambista' : (role === 'admin' ? 'Admin' : 'Cliente')}</CardTitle>
          <CardDescription>Crie sua conta para acessar o sistema.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome Completo</Label>
                <Input id="nome" placeholder="Seu nome completo" required onChange={handleChange} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" placeholder="seu@email.com" required onChange={handleChange} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="cpf">CPF ou CNH</Label>
                <Input id="cpf" placeholder="000.000.000-00" required onChange={handleChange} disabled={loading} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Telefone / WhatsApp</Label>
                <Input id="phone" placeholder="(00) 00000-0000" required onChange={handleChange} disabled={loading} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="pixKey">Chave PIX (Para recebimento)</Label>
                <Input id="pixKey" placeholder="Seu CPF, Email ou Chave Aleatória" required onChange={handleChange} disabled={loading} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="password">Crie uma Senha</Label>
                <Input id="password" type="password" required onChange={handleChange} disabled={loading} />
              </div>
            </div>
            
            <Button type="submit" className="w-full bg-accent hover:bg-accent/90 text-white font-bold h-12 text-lg" disabled={loading}>
              {loading ? <Loader2 className="animate-spin mr-2" /> : null}
              {role === 'cambista' ? 'Solicitar Cadastro' : 'Finalizar Cadastro'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

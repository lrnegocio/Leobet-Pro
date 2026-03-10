
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { UserPlus, Wallet, UserCircle, ShieldCheck } from 'lucide-react';

export default function MeusCambistasPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [cambistas, setCambistas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    password: '',
    cpf: '',
    phone: '',
    birthDate: '',
    pixKey: ''
  });

  const loadData = () => {
    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setCambistas(all.filter((u: any) => u.role === 'cambista' && u.gerenteId === user?.id));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = formData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "DDD OBRIGATÓRIO", description: "Informe o telefone completo com DDD." });
      return;
    }

    const newUser = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      ...formData,
      nome: formData.nome.toUpperCase(),
      phone: cleanPhone,
      role: 'cambista',
      gerenteId: user?.id, // Vincula ao gerente logado
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...all, newUser]));
    toast({ title: "CAMBISTA CADASTRADO!", description: "Seu novo parceiro já pode vender." });
    setFormData({ nome: '', email: '', password: '', cpf: '', phone: '', birthDate: '', pixKey: '' });
    loadData();
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black uppercase text-primary">Gestão de Equipe</h1>
            <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Minha Rede de Cambistas Parceiros</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-t-4 border-t-accent shadow-xl rounded-2xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary"><UserPlus className="w-4 h-4 text-accent" /> Novo Parceiro</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Nome Completo</Label>
                    <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value.toUpperCase()})} required className="font-bold h-10" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">CPF</Label>
                      <Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} required className="font-bold h-10" />
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] font-black uppercase opacity-60">Nascimento</Label>
                      <Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required className="font-bold h-10" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">WhatsApp (DDD)</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required className="font-bold h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Chave PIX</Label>
                    <Input value={formData.pixKey} onChange={e => setFormData({...formData, pixKey: e.target.value})} required className="font-bold h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Usuário/Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required className="font-bold h-10" />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase opacity-60">Senha Inicial</Label>
                    <Input type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} required className="font-bold h-10" />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 font-black uppercase shadow-lg rounded-xl transition-all active:scale-95">Cadastrar Cambista</Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-black uppercase flex items-center gap-2 text-primary">Minha Rede Ativa</h3>
                <Badge variant="outline" className="font-black uppercase text-[10px]">{cambistas.length} Vendedores</Badge>
              </div>
              
              {cambistas.length === 0 ? (
                <Card className="py-20 text-center border-dashed opacity-30 rounded-2xl">
                   <p className="font-black uppercase text-xs">Sua base de cambistas está vazia</p>
                </Card>
              ) : (
                <div className="space-y-2">
                  {cambistas.map((c, i) => (
                    <Card key={i} className="flex justify-between items-center p-6 border-l-8 border-l-primary hover:shadow-md transition-all rounded-2xl">
                      <div className="flex items-center gap-4">
                        <div className="bg-primary/10 p-3 rounded-full"><UserCircle className="w-8 h-8 text-primary" /></div>
                        <div>
                          <p className="font-black uppercase text-sm text-primary">{c.nome}</p>
                          <p className="text-[10px] text-muted-foreground font-bold uppercase">{c.email} • {c.phone}</p>
                          <div className="flex items-center gap-1 mt-1">
                             <ShieldCheck className="w-3 h-3 text-green-600" />
                             <span className="text-[9px] font-black uppercase text-green-600">Status: Ativo</span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black uppercase text-muted-foreground">Saldo do Vendedor</p>
                        <p className="text-lg font-black text-primary">R$ {((c.balance || 0) + (c.commissionBalance || 0)).toFixed(2)}</p>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

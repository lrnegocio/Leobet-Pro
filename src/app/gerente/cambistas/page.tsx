
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
import { UserPlus, Wallet, UserCircle } from 'lucide-react';

export default function MeusCambistasPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  const [cambistas, setCambistas] = useState<any[]>([]);
  const [formData, setFormData] = useState({
    nome: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: ''
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
      id: Math.random().toString(36).substring(7),
      ...formData,
      phone: cleanPhone,
      role: 'cambista',
      gerenteId: user?.id,
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...all, newUser]));
    toast({ title: "CAMBISTA CADASTRADO!" });
    setFormData({ nome: '', email: '', cpf: '', phone: '', birthDate: '' });
    loadData();
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <h1 className="text-3xl font-black uppercase text-primary">Gestão de Cambistas</h1>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 border-t-4 border-t-accent shadow-xl">
              <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><UserPlus className="w-4 h-4 text-accent" /> Novo Cambista</CardTitle></CardHeader>
              <CardContent>
                <form onSubmit={handleCreate} className="space-y-4">
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Nome Completo</Label>
                    <Input value={formData.nome} onChange={e => setFormData({...formData, nome: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">CPF</Label>
                    <Input value={formData.cpf} onChange={e => setFormData({...formData, cpf: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Data de Nascimento</Label>
                    <Input type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">WhatsApp (Com DDD)</Label>
                    <Input value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} required />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-[10px] font-black uppercase">Usuário/Email</Label>
                    <Input value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} required />
                  </div>
                  <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 font-black uppercase shadow-lg">Cadastrar Parceiro</Button>
                </form>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-4">
              <h3 className="text-sm font-black uppercase flex items-center gap-2 text-primary">Minha Rede Ativa</h3>
              {cambistas.length === 0 ? (
                <Card className="py-20 text-center border-dashed opacity-30"><p className="font-black uppercase text-xs">Sua base de cambistas está vazia</p></Card>
              ) : (
                cambistas.map((c, i) => (
                  <Card key={i} className="flex justify-between items-center p-6 border-l-4 border-l-primary hover:shadow-md transition-all">
                    <div className="flex items-center gap-4">
                      <div className="bg-primary/10 p-3 rounded-full"><UserCircle className="w-6 h-6 text-primary" /></div>
                      <div>
                        <p className="font-black uppercase text-sm">{c.nome}</p>
                        <p className="text-[10px] text-muted-foreground font-bold">{c.email} • {c.phone}</p>
                      </div>
                    </div>
                    <div className="text-right flex flex-col items-end gap-1">
                      <div className="flex items-center gap-1 text-primary font-black"><Wallet className="w-3 h-3" /> R$ {c.balance.toFixed(2)}</div>
                      <Badge variant="outline" className="text-[8px] uppercase font-black border-primary/20">Status: Ativo</Badge>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

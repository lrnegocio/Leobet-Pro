
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  Filter, 
  UserCheck, 
  Users, 
  DollarSign, 
  CheckCircle2, 
  XCircle,
  UserPlus,
  ShieldCheck
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [gerentes, setGerentes] = useState<UserProfile[]>([]);
  const [newGerente, setNewGerente] = useState({ nome: '', email: '', password: '' });

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setPendingUsers(allUsers.filter((u: UserProfile) => u.status === 'pending' && u.role === 'cambista'));
    setGerentes(allUsers.filter((u: UserProfile) => u.role === 'gerente'));
  }, []);

  const approveUser = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = allUsers.map((u: UserProfile) => 
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    toast({ title: "Cambista Aprovado!", description: "O acesso agora está liberado." });
  };

  const createGerente = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser: UserProfile = {
      id: 'gerente-' + Math.random().toString(36).substring(7),
      nome: newGerente.nome,
      email: newGerente.email,
      role: 'gerente',
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };
    
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...allUsers, newUser]));
    setGerentes([...gerentes, newUser]);
    setNewGerente({ nome: '', email: '', password: '' });
    toast({ title: "Gerente Criado!", description: "Novo gerente cadastrado com sucesso." });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary">Gestão Financeira Master</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Total: Organizador (20%) | Cambista (10%) | Gerente (5%)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-primary text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Meu Lucro (20%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-accent text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Pagar Comissões (15%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados (65%)</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Total Bruto</p>
                <p className="text-2xl font-black">R$ 0,00</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase">Administração LEOBET</CardTitle>
              <div className="flex items-center gap-2">
                <Input type="date" className="w-40 font-bold" />
                <Button variant="secondary" size="icon"><Filter className="w-4 h-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="cambistas">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="cambistas" className="font-bold">Aprovar Cambistas</TabsTrigger>
                  <TabsTrigger value="gerentes" className="font-bold">Gerentes</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold">Baixar Prêmios</TabsTrigger>
                  <TabsTrigger value="vendas" className="font-bold">Relatório Vendas</TabsTrigger>
                </TabsList>
                
                <TabsContent value="cambistas">
                   {pendingUsers.length === 0 ? (
                      <div className="text-center py-20 border rounded-xl bg-white">
                        <UserPlus className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Sem solicitações de cambistas</p>
                      </div>
                   ) : (
                      <div className="space-y-4">
                        {pendingUsers.map(user => (
                          <div key={user.id} className="flex items-center justify-between p-4 bg-white border rounded-xl">
                            <div>
                              <p className="font-black uppercase">{user.nome}</p>
                              <p className="text-xs text-muted-foreground font-bold">{user.email}</p>
                            </div>
                            <div className="flex gap-2">
                              <Button size="sm" className="bg-green-600 font-black uppercase" onClick={() => approveUser(user.id)}>Aprovar</Button>
                              <Button size="sm" variant="destructive" className="font-black uppercase">Recusar</Button>
                            </div>
                          </div>
                        ))}
                      </div>
                   )}
                </TabsContent>

                <TabsContent value="gerentes">
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <Card className="lg:col-span-1 border-dashed">
                      <CardHeader><CardTitle className="text-xs font-black uppercase">Novo Gerente</CardTitle></CardHeader>
                      <CardContent>
                        <form onSubmit={createGerente} className="space-y-4">
                          <Input placeholder="Nome do Gerente" value={newGerente.nome} onChange={e => setNewGerente({...newGerente, nome: e.target.value})} required />
                          <Input placeholder="Usuário/Email" value={newGerente.email} onChange={e => setNewGerente({...newGerente, email: e.target.value})} required />
                          <Input type="password" placeholder="Senha Temporária" required />
                          <Button className="w-full font-black uppercase">Cadastrar Gerente</Button>
                        </form>
                      </CardContent>
                    </Card>
                    <div className="lg:col-span-2 space-y-4">
                      <h3 className="text-xs font-black uppercase">Gerentes Ativos</h3>
                      {gerentes.map(g => (
                        <div key={g.id} className="p-4 bg-white border rounded-xl flex items-center justify-between">
                           <div className="flex items-center gap-3">
                              <div className="bg-primary/10 p-2 rounded-lg"><ShieldCheck className="w-5 h-5 text-primary" /></div>
                              <div>
                                <p className="font-black uppercase text-sm">{g.nome}</p>
                                <p className="text-[10px] text-muted-foreground font-bold">{g.email}</p>
                              </div>
                           </div>
                           <Button variant="outline" size="sm" className="font-black uppercase">Ver Produção</Button>
                        </div>
                      ))}
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="resgate">
                  <div className="max-w-md mx-auto py-10 space-y-4 text-center">
                    <UserCheck className="w-12 h-12 text-primary mx-auto opacity-20" />
                    <h3 className="font-black uppercase">Resgatar Código Premiado</h3>
                    <div className="flex gap-2">
                      <Input placeholder="Código de 11 dígitos" className="h-12 font-black text-center text-lg" maxLength={11} />
                      <Button className="h-12 font-black uppercase px-8">Validar</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="vendas">
                   <div className="text-center py-20 opacity-20">
                     <Users className="w-16 h-16 mx-auto mb-4" />
                     <p className="font-black uppercase tracking-widest">Relatório consolidado de cambistas e gerentes</p>
                   </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

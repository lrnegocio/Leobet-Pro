
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
  ShieldCheck,
  History,
  TrendingUp,
  ReceiptText
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosFinalizados, setBingosFinalizados] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [gerentes, setGerentes] = useState<UserProfile[]>([]);
  const [newGerente, setNewGerente] = useState({ nome: '', email: '' });

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setPendingUsers(allUsers.filter((u: UserProfile) => u.status === 'pending' && u.role === 'cambista'));
    setGerentes(allUsers.filter((u: UserProfile) => u.role === 'gerente'));

    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allTickets);

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    setBingosFinalizados(allBingos.filter((b: any) => b.status === 'finalizado'));
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

  const calculateCommissions = () => {
    let org = 0;
    let cambista = 0;
    let gerente = 0;
    let bruto = 0;

    tickets.forEach(t => {
      bruto += t.valorTotal;
      org += t.valorTotal * 0.20;
      if (t.vendedorRole === 'cambista') cambista += t.valorTotal * 0.10;
      if (t.vendedorRole === 'gerente') {
        gerente += t.valorTotal * 0.05;
        cambista += t.valorTotal * 0.10; // Gerente ganha comissão de venda também
      }
    });

    return { org, totalComissao: cambista + gerente, bruto, premios: bruto * 0.65 };
  };

  const finance = calculateCommissions();

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary leading-tight">Gestão Financeira Master</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Total: Organizador (20%) | Cambista (10%) | Gerente (5%)</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <Card className="bg-primary text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Meu Lucro (20%)</p>
                <p className="text-2xl font-black">R$ {finance.org.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-accent text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Comissões (15%)</p>
                <p className="text-2xl font-black">R$ {finance.totalComissao.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados (65%)</p>
                <p className="text-2xl font-black">R$ {finance.premios.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white">
              <CardContent className="p-6">
                <p className="text-[10px] font-black uppercase opacity-60">Faturamento Bruto</p>
                <p className="text-2xl font-black">R$ {finance.bruto.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-sm font-black uppercase">Painel Administrativo</CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="vendas">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="vendas" className="font-bold gap-2"><ReceiptText className="w-4 h-4" /> Vendas</TabsTrigger>
                  <TabsTrigger value="sorteios" className="font-bold gap-2"><History className="w-4 h-4" /> Sorteios</TabsTrigger>
                  <TabsTrigger value="cambistas" className="font-bold gap-2"><UserPlus className="w-4 h-4" /> Aprovações</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold gap-2"><CheckCircle2 className="w-4 h-4" /> Baixar Prêmio</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vendas">
                   <div className="space-y-4">
                      {tickets.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30">Sem vendas registradas</div>
                      ) : (
                        tickets.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white border rounded-xl text-xs">
                             <div className="space-y-1">
                                <p className="font-black uppercase">{t.cliente}</p>
                                <p className="text-muted-foreground">{t.eventoNome} • {t.data}</p>
                             </div>
                             <div className="text-right space-y-1">
                                <p className="font-black text-primary">R$ {t.valorTotal.toFixed(2)}</p>
                                <Badge variant="outline" className="text-[8px] font-black uppercase">{t.vendedorRole}</Badge>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="sorteios">
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {bingosFinalizados.map(b => (
                        <Card key={b.id} className="border-l-4 border-l-green-600">
                          <CardContent className="p-4 space-y-3">
                             <div className="flex justify-between items-center">
                               <p className="font-black uppercase text-sm">{b.nome}</p>
                               <Badge className="bg-green-600 font-black text-[9px] uppercase">Finalizado</Badge>
                             </div>
                             <div className="bg-muted p-2 rounded text-[10px] font-mono leading-relaxed">
                                B_O_L_A_S: {b.bolasSorteadas?.join(', ')}
                             </div>
                             <p className="text-[9px] font-bold text-muted-foreground uppercase">Sorteio em: {new Date(b.dataSorteio).toLocaleString('pt-BR')}</p>
                          </CardContent>
                        </Card>
                      ))}
                      {bingosFinalizados.length === 0 && <div className="col-span-2 text-center py-20 opacity-30 italic">Nenhum sorteio finalizado no histórico</div>}
                   </div>
                </TabsContent>

                <TabsContent value="cambistas">
                   {pendingUsers.length === 0 ? (
                      <div className="text-center py-20 border rounded-xl bg-white">
                        <UserPlus className="w-12 h-12 mx-auto text-muted-foreground opacity-20 mb-4" />
                        <p className="font-black uppercase tracking-widest text-xs text-muted-foreground">Sem solicitações pendentes</p>
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

                <TabsContent value="resgate">
                  <div className="max-w-md mx-auto py-10 space-y-6 text-center">
                    <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto">
                      <UserCheck className="w-10 h-10 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase text-lg">Resgate de Código Premiado</h3>
                      <p className="text-xs text-muted-foreground mt-1 font-bold">Solicite o código de 11 dígitos ao cliente para validar o prêmio.</p>
                    </div>
                    <div className="flex gap-2">
                      <Input placeholder="CÓDIGO DE 11 DÍGITOS" className="h-14 font-black text-center text-xl tracking-[0.2em]" maxLength={11} />
                      <Button className="h-14 font-black uppercase px-8 shadow-lg">Validar</Button>
                    </div>
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

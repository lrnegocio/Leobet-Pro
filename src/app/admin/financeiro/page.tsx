'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  RefreshCcw, 
  Database, 
  Phone, 
  Trash2,
  AlertTriangle,
  UserPlus,
  UserCircle,
  XCircle,
  CheckCircle2,
  Calendar,
  Search,
  TrendingUp,
  User
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';

function FinanceiroContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'payouts';

  const [tickets, setTickets] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mounted, setMounted] = useState(false);

  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'cliente',
    cpf: '',
    phone: '',
    pix_key: ''
  });

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!mounted) return;
    setSyncing(true);
    try {
      const { data: tData } = await supabase
        .from('tickets')
        .select('*')
        .order('created_at', { ascending: false });
      if (tData) setTickets(tData);

      const { data: uData } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });
      if (uData) setUsers(uData);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setSyncing(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [mounted]);

  const approveUser = async (userId: string) => {
    const { error } = await supabase.from('users').update({ status: 'approved' }).eq('id', userId);
    if (!error) {
      toast({ title: "USUÁRIO APROVADO!" });
      loadData();
    }
  };

  const deleteUser = async (userId: string) => {
    if (confirm("Deseja remover este usuário?")) {
      const { error } = await supabase.from('users').delete().eq('id', userId);
      if (!error) {
        toast({ title: "USUÁRIO REMOVIDO", variant: "destructive" });
        loadData();
      }
    }
  };

  const clearDatabase = async () => {
    if (confirm("ATENÇÃO: Deseja apagar todos os bilhetes e transações de teste? Esta ação não pode ser desfeita.")) {
      setSyncing(true);
      try {
        await supabase.from('tickets').delete().neq('id', '0');
        await supabase.from('transactions').delete().neq('id', '0');
        toast({ title: "SISTEMA LIMPO!" });
        loadData();
      } catch (e) {
        toast({ variant: "destructive", title: "ERRO AO LIMPAR" });
      } finally {
        setSyncing(false);
      }
    }
  };

  const confirmPayout = async (ticketId: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'premio_pago' })
      .eq('id', ticketId);
    
    if (!error) {
      toast({ title: "PAGAMENTO CONFIRMADO!", description: "O sistema registrou a baixa do prêmio." });
      loadData();
    }
  };

  const handleCreateUser = async () => {
    if (!newUser.nome || !newUser.email || !newUser.password) {
      toast({ variant: "destructive", title: "PREENCHA OS CAMPOS BÁSICOS" });
      return;
    }

    const id = Math.random().toString(36).substring(7).toUpperCase();
    const { error } = await supabase.from('users').insert([{
      ...newUser,
      id,
      status: 'approved',
      balance: 0,
      commission_balance: 0,
      pending_balance: 0,
      created_at: new Date().toISOString()
    }]);

    if (!error) {
      toast({ title: "USUÁRIO CADASTRADO!" });
      setNewUser({ nome: '', email: '', password: '', role: 'cliente', cpf: '', phone: '', pix_key: '' });
      loadData();
    } else {
      toast({ variant: "destructive", title: "ERRO AO CADASTRAR", description: error.message });
    }
  };

  const finance = useMemo(() => {
    let bruto = 0;
    const validTickets = tickets.filter(t => ['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(t.status));
    validTickets.forEach(t => bruto += Number(t.valor_total || 0));
    const pool = Math.floor(bruto * 0.65 * 100) / 100;
    const admin = Math.floor(bruto * 0.35 * 100) / 100;
    return { bruto, pool, admin };
  }, [tickets]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const date = t.created_at ? t.created_at.split('T')[0] : "";
      const matchesDate = date >= startDate && date <= endDate;
      const matchesSearch = (t.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) || 
                           (t.vendedor_nome || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
                           (t.id || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [tickets, searchTerm, startDate, endDate]);

  const performancePorVendedor = useMemo(() => {
    const summary: Record<string, { nome: string, total: number, apostas: number }> = {};
    filteredTickets.forEach(t => {
      if (!['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(t.status)) return;
      const key = t.vendedor_id || 'admin-master';
      const nome = t.vendedor_nome || 'Administrador';
      if (!summary[key]) summary[key] = { nome, total: 0, apostas: 0 };
      summary[key].total += Number(t.valor_total || 0);
      summary[key].apostas += 1;
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => (u.nome || "").toLowerCase().includes(userSearchTerm.toLowerCase()) || (u.email || "").toLowerCase().includes(userSearchTerm.toLowerCase()));
  }, [users, userSearchTerm]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">Auditoria Global</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Sincronização em Tempo Real
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
               <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2">
                 <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-[2.5rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Arrecadação Bruta</p>
              <p className="text-4xl font-black mt-2">R$ {finance.bruto.toFixed(2)}</p>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-[2.5rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Fundo de Prêmios (65%)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.pool.toFixed(2)}</p>
            </Card>
            <Card className="bg-white border-none shadow-xl rounded-[2.5rem] p-8 border-l-8 border-l-accent">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Lucro Admin (35%)</p>
              <p className="text-4xl font-black mt-2 text-primary">R$ {finance.admin.toFixed(2)}</p>
            </Card>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto no-scrollbar">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white shrink-0">Aprovações & Prêmios</TabsTrigger>
              <TabsTrigger value="users" className="font-black uppercase text-[10px] rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white shrink-0">Gestão de Usuários</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12 data-[state=active]:bg-primary data-[state=active]:text-white shrink-0">Histórico Geral</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente' || t.status === 'ganhou' || t.status === 'pendente-resgate').length === 0 ? (
                 <Card className="py-24 text-center border-dashed rounded-[3rem] opacity-30 bg-white font-black uppercase text-xs">Sem pendências ou prêmios no momento</Card>
               ) : (
                 tickets.filter(t => t.status === 'pendente' || t.status === 'ganhou' || t.status === 'pendente-resgate').map((t, i) => (
                   <Card key={i} className={cn(
                     "flex flex-col md:flex-row justify-between items-center p-6 border-l-8 rounded-[2rem] shadow-lg bg-white gap-6",
                     t.status === 'ganhou' || t.status === 'pendente-resgate' ? 'border-l-green-500' : 'border-l-orange-500'
                   )}>
                     <div className="space-y-2 flex-1 w-full">
                       <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.evento_nome} • R$ {Number(t.valor_total || 0).toFixed(2)}</p>
                       <p className="text-[9px] font-black text-muted-foreground uppercase">CÓDIGO: {t.id}</p>
                       
                       {(t.status === 'ganhou' || t.status === 'pendente-resgate') && (
                         <div className="bg-green-50 p-4 rounded-2xl border border-green-100 mt-2">
                            <p className="text-[8px] font-black uppercase text-green-600 opacity-60">Enviar prêmio para:</p>
                            <p className="text-sm font-black text-green-700 truncate">{t.pix_resgate || 'CHAVE NÃO INFORMADA'}</p>
                            <Badge className="bg-green-600 text-white font-black uppercase text-[8px] h-5 mt-2">AGUARDANDO PAGAMENTO</Badge>
                         </div>
                       )}
                     </div>
                     <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto shrink-0">
                        <Button onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${t.whatsapp}`, '_blank')} variant="outline" className="h-14 font-black uppercase text-[9px] rounded-xl border-2"><Phone className="w-4 h-4 mr-2" /> WhatsApp</Button>
                        
                        {t.status === 'pendente' && (
                          <div className="flex gap-2 flex-1">
                            <Button onClick={() => supabase.from('tickets').update({ status: 'pago' }).eq('id', t.id).then(loadData)} className="bg-primary text-white font-black uppercase text-[10px] h-14 px-6 rounded-xl shadow-lg flex-1">Aprovar Venda</Button>
                            <Button onClick={() => supabase.from('tickets').update({ status: 'rejeitado' }).eq('id', t.id).then(loadData)} variant="destructive" className="h-14 px-4 rounded-xl"><XCircle className="w-5 h-5" /></Button>
                          </div>
                        )}

                        {(t.status === 'ganhou' || t.status === 'pendente-resgate') && (
                           <Button 
                             onClick={() => confirmPayout(t.id)} 
                             className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-xs h-14 px-8 rounded-xl shadow-lg flex items-center gap-2"
                           >
                             <CheckCircle2 className="w-5 h-5" /> Confirmar Pagamento
                           </Button>
                        )}
                     </div>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="users" className="mt-6 space-y-4">
              <div className="flex flex-col md:flex-row gap-4">
                <Input 
                  placeholder="Pesquisar usuários..." 
                  value={userSearchTerm} 
                  onChange={e => setUserSearchTerm(e.target.value)}
                  className="h-12 rounded-xl font-bold border-2"
                />
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="h-12 bg-accent font-black uppercase gap-2 rounded-xl shadow-lg shrink-0">
                      <UserPlus className="w-5 h-5" /> Cadastrar Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl rounded-3xl">
                    <DialogHeader><DialogTitle className="font-black uppercase text-primary">Novo Cadastro Manual</DialogTitle></DialogHeader>
                    <div className="grid grid-cols-2 gap-4 py-4">
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Nome</Label><Input value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Usuário/Email</Label><Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value.toLowerCase()})} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Senha</Label><Input value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} /></div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Cargo</Label>
                        <select className="w-full h-10 border rounded-md px-2" value={newUser.role} onChange={e => setNewUser({...newUser, role: e.target.value})}>
                          <option value="cliente">Cliente</option>
                          <option value="cambista">Cambista</option>
                          <option value="gerente">Gerente</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">CPF</Label><Input value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: e.target.value})} /></div>
                      <div className="space-y-1"><Label className="text-[10px] font-black uppercase">WhatsApp</Label><Input value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} /></div>
                    </div>
                    <DialogFooter><Button onClick={handleCreateUser} className="w-full h-14 bg-primary font-black uppercase rounded-2xl">Finalizar Cadastro</Button></DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="grid grid-cols-1 gap-3">
                {filteredUsers.map((user, i) => (
                  <Card key={i} className="flex flex-col md:flex-row justify-between items-center p-6 rounded-[2rem] shadow-sm bg-white gap-6">
                    <div className="flex items-center gap-4 flex-1 w-full">
                      <div className="bg-primary/10 p-4 rounded-2xl"><UserCircle className="w-8 h-8 text-primary" /></div>
                      <div>
                        <p className="font-black uppercase text-lg text-primary leading-tight">{user.nome}</p>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase">{user.email} • {user.role?.toUpperCase()}</p>
                        <Badge variant={user.status === 'approved' ? 'default' : 'destructive'} className="mt-2 font-black text-[8px] uppercase">
                          {user.status === 'approved' ? '✓ Ativo' : '⚠ Pendente'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      {user.status === 'pending' && (
                        <Button onClick={() => approveUser(user.id)} className="bg-green-600 hover:bg-green-700 text-white font-black uppercase text-[10px] h-12 px-6 rounded-xl flex-1">Aprovar Cadastro</Button>
                      )}
                      <Button onClick={() => deleteUser(user.id)} variant="ghost" className="h-12 w-12 text-destructive border border-destructive/10 rounded-xl bg-destructive/5"><Trash2 className="w-5 h-5" /></Button>
                    </div>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
               <div className="flex flex-col gap-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl shadow-sm border">
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Início</Label>
                        <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="font-bold border-2" />
                     </div>
                     <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase opacity-60">Fim</Label>
                        <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="font-bold border-2" />
                     </div>
                     <div className="space-y-1 md:col-span-2">
                        <Label className="text-[10px] font-black uppercase opacity-60">Pesquisar por Nome ou ID</Label>
                        <div className="relative">
                           <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                           <Input placeholder="Cliente ou Vendedor..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-10 font-bold border-2 h-12" />
                        </div>
                     </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                     <Card className="lg:col-span-1 bg-white rounded-3xl shadow-lg border-none overflow-hidden">
                        <div className="bg-primary p-4 text-white flex items-center justify-between">
                           <h3 className="text-xs font-black uppercase flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Performance Equipe</h3>
                           <Badge className="bg-white/20 text-white border-none">{performancePorVendedor.length}</Badge>
                        </div>
                        <div className="p-2 space-y-1 max-h-[400px] overflow-y-auto custom-scrollbar">
                           {performancePorVendedor.map((perf, i) => (
                             <div key={i} className="flex justify-between items-center p-3 hover:bg-muted/50 rounded-xl transition-all border-b last:border-none">
                                <div className="flex items-center gap-2">
                                   <div className="bg-muted p-2 rounded-lg"><User className="w-4 h-4 text-primary" /></div>
                                   <div><p className="text-[10px] font-black uppercase">{perf.nome}</p><p className="text-[8px] font-bold text-muted-foreground uppercase">{perf.apostas} apostas</p></div>
                                </div>
                                <p className="text-xs font-black text-primary">R$ {perf.total.toFixed(2)}</p>
                             </div>
                           ))}
                        </div>
                     </Card>

                     <div className="lg:col-span-2 space-y-4">
                        <div className="flex justify-between items-center px-4">
                           <h3 className="text-xs font-black uppercase text-primary">Extrato Detalhado</h3>
                           <Button onClick={clearDatabase} variant="destructive" size="sm" className="h-8 font-black uppercase text-[8px] rounded-lg gap-1">
                             <Trash2 className="w-3 h-3" /> Limpar Histórico
                           </Button>
                        </div>
                        <Card className="rounded-3xl overflow-hidden bg-white shadow-xl border-none">
                           <div className="overflow-x-auto">
                              <table className="w-full text-left">
                                 <thead className="bg-muted/50 text-[9px] font-black uppercase text-muted-foreground">
                                    <tr><th className="p-4">Data</th><th className="p-4">Vendedor</th><th className="p-4">Cliente</th><th className="p-4">Evento</th><th className="p-4 text-right">Valor</th></tr>
                                 </thead>
                                 <tbody className="divide-y text-[9px] font-bold uppercase">
                                    {filteredTickets.map((t, i) => (
                                      <tr key={i} className="hover:bg-muted/30 transition-colors">
                                         <td className="p-4 whitespace-nowrap">{new Date(t.created_at).toLocaleString('pt-BR')}</td>
                                         <td className="p-4 text-primary font-black">{t.vendedor_nome || '---'}</td>
                                         <td className="p-4">{t.cliente}</td>
                                         <td className="p-4">{t.evento_nome}</td>
                                         <td className="p-4 text-right">R$ {Number(t.valor_total || 0).toFixed(2)}</td>
                                      </tr>
                                    ))}
                                 </tbody>
                              </table>
                           </div>
                        </Card>
                     </div>
                  </div>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary">Carregando Auditoria...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}

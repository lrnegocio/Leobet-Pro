
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Database, Search, TrendingUp, XCircle, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchPending, setSearchPending] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const d = new Date();
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(d.toISOString().split('T')[0]);
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!mounted) return;
    setSyncing(true);
    try {
      const { data: ticketData } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      const { data: transData } = await supabase.from('transactions').select('*').order('created_at', { ascending: false });
      
      if (ticketData) setTickets(ticketData);
      if (transData) setTransactions(transData);
    } catch (err: any) {
      console.error("Erro Financeiro:", err.message);
    } finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { if (mounted) loadData(); }, [mounted]);

  const approvePendingSale = async (receipt: any) => {
    setSyncing(true);
    try {
      // 1. ATUALIZA STATUS DO TICKET PARA PAGO
      const { error: ticketError } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', receipt.id);
      if (ticketError) throw ticketError;

      // 2. COMPUTA COMISSÕES (CAMBISTA E GERENTE)
      const totalVenda = Number(receipt.valor_total);
      const { data: vData } = await supabase.from('users').select('*').eq('id', receipt.vendedor_id).single();
      
      if (vData && vData.role === 'cambista') {
        const comCambista = totalVenda * 0.10;
        await supabase.from('users').update({ commission_balance: Number(vData.commission_balance || 0) + comCambista }).eq('id', vData.id);
        
        if (vData.gerente_id) {
          const comGerente = totalVenda * 0.05;
          const { data: gData } = await supabase.from('users').select('*').eq('id', vData.gerente_id).single();
          if (gData) {
            await supabase.from('users').update({ commission_balance: Number(gData.commission_balance || 0) + comGerente }).eq('id', gData.id);
          }
        }
      }

      toast({ title: "VENDA VALIDADA!", description: "Comissões creditadas e bilhete em jogo." });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO VALIDAR", description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const confirmPayout = async (receiptId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', receiptId);
    if (!error) { 
      toast({ title: "PRÊMIO PAGO COM SUCESSO!" }); 
      loadData(); 
    }
  };

  const handleTransactionAction = async (trans: any, action: 'approve' | 'reject') => {
    setSyncing(true);
    try {
      if (action === 'approve') {
        const { data: userData } = await supabase.from('users').select('*').eq('id', trans.user_id).single();
        if (userData) {
          const currentBalance = Number(userData.balance || 0);
          const currentComm = Number(userData.commission_balance || 0);
          
          if (trans.type === 'deposito') {
            await supabase.from('users').update({ balance: currentBalance + Number(trans.amount) }).eq('id', trans.user_id);
          } else if (trans.type === 'saque') {
            let remaining = Number(trans.amount);
            let newComm = currentComm;
            let newBal = currentBalance;

            if (newComm >= remaining) {
              newComm -= remaining;
            } else {
              remaining -= newComm;
              newComm = 0;
              newBal -= remaining;
            }
            await supabase.from('users').update({ balance: newBal, commission_balance: newComm }).eq('id', trans.user_id);
          }
        }
        await supabase.from('transactions').update({ status: 'aprovado' }).eq('id', trans.id);
        toast({ title: "TRANSAÇÃO APROVADA!" });
      } else {
        await supabase.from('transactions').update({ status: 'rejeitado' }).eq('id', trans.id);
        toast({ variant: "destructive", title: "TRANSAÇÃO REJEITADA!" });
      }
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "FALHA NA OPERAÇÃO" });
    } finally {
      setSyncing(false);
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const date = t.created_at?.split('T')[0] || "";
      return date >= startDate && date <= endDate;
    });
  }, [tickets, startDate, endDate]);

  const filteredPending = useMemo(() => {
    return tickets.filter(t => {
      if (t.status !== 'pendente') return false;
      const term = searchPending.toLowerCase();
      return (
        t.cliente.toLowerCase().includes(term) || 
        t.id.toLowerCase().includes(term)
      );
    });
  }, [tickets, searchPending]);

  const totalPendingPayout = useMemo(() => tickets.filter(t => t.status === 'pendente-resgate').length, [tickets]);
  const totalPendingTrans = useMemo(() => transactions.filter(t => t.status === 'pendente').length, [transactions]);
  const totalPendingSales = useMemo(() => tickets.filter(t => t.status === 'pendente').length, [tickets]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary">Financeiro Master</h1>
              <p className="text-[10px] font-black uppercase tracking-widest flex items-center gap-2 opacity-60">
                <Database className="w-3 h-3 text-green-600" /> Auditoria Live de Vendas e Fluxo de Caixa
              </p>
            </div>
            <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl">
              <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </Button>
          </div>

          <Tabs defaultValue="vendas_pendentes">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="vendas_pendentes" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Vendas Pendentes {totalPendingSales > 0 && <span className="ml-2 bg-orange-600 text-white px-2 py-0.5 rounded-full">{totalPendingSales}</span>}
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Créditos & Saques {totalPendingTrans > 0 && <span className="ml-2 bg-accent text-white px-2 py-0.5 rounded-full">{totalPendingTrans}</span>}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Prêmios {totalPendingPayout > 0 && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full">{totalPendingPayout}</span>}
              </TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">Histórico</TabsTrigger>
            </TabsList>

            <TabsContent value="vendas_pendentes" className="mt-6 space-y-4">
               <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar por NOME do cliente ou CÓDIGO do bilhete..." 
                    value={searchPending}
                    onChange={e => setSearchPending(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 font-bold"
                  />
               </div>

               {filteredPending.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">
                   {searchPending ? "Nenhum resultado para esta busca" : "Sem apostas pendentes de aprovação"}
                 </div>
               ) : filteredPending.map((t, i) => (
                 <Card key={i} className="p-6 border-l-8 border-l-orange-600 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1 w-full">
                     <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                           <ShoppingCart className="text-orange-600" />
                           <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs font-black">#{t.id}</Badge>
                     </div>
                     <p className="text-[10px] font-black opacity-60 bg-muted inline-block px-2 py-1 rounded">
                       JOGO: {t.evento_nome} • VENDEDOR: {t.vendedor_nome}
                     </p>
                     <p className="text-3xl font-black text-orange-600 mt-2">R$ {Number(t.valor_total).toFixed(2)}</p>
                     <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">
                       As comissões e o valor do prêmio só serão computados após sua aprovação manual.
                     </p>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      <Button onClick={() => approvePendingSale(t)} className="bg-primary hover:bg-primary/90 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white">
                        Validar e Gerar Comissões
                      </Button>
                   </div>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="transacoes" className="mt-6 space-y-4">
               {transactions.filter(t => t.status === 'pendente').length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem transações bancárias pendentes</div>
               ) : transactions.filter(t => t.status === 'pendente').map((trans, i) => (
                 <Card key={i} className={cn(
                   "p-6 border-l-8 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6",
                   trans.type === 'deposito' ? 'border-l-blue-500' : 'border-l-orange-500'
                 )}>
                   <div className="flex-1 w-full">
                     <div className="flex items-center gap-2 mb-2">
                        {trans.type === 'deposito' ? <ArrowUpCircle className="text-blue-600" /> : <ArrowDownCircle className="text-orange-600" />}
                        <p className="font-black uppercase text-xl text-primary">{trans.user_name}</p>
                     </div>
                     <p className="text-[10px] font-black opacity-60 bg-muted inline-block px-2 py-1 rounded">TIPO: {trans.type.toUpperCase()} • PIX: {trans.pix_key || 'DEPÓSITO'}</p>
                     <p className="text-3xl font-black text-primary mt-2">R$ {Number(trans.amount).toFixed(2)}</p>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      <Button onClick={() => handleTransactionAction(trans, 'reject')} variant="outline" className="h-16 px-8 font-black uppercase rounded-2xl">Recusar</Button>
                      <Button onClick={() => handleTransactionAction(trans, 'approve')} className="bg-green-600 hover:bg-green-700 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white">Aprovar</Button>
                   </div>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="payouts" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente-resgate').length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem resgates de prêmios pendentes</div>
               ) : tickets.filter(t => t.status === 'pendente-resgate').map((t, i) => {
                 const totalAcumulado = t.tickets_data?.filter((item: any) => (item.s || item.status) === 'ganhou')
                    .reduce((acc: number, item: any) => acc + (Number(item.v || item.valor_premio || item.valorPremio || 0)), 0);
                 
                 return (
                   <Card key={i} className="p-6 border-l-8 border-l-green-500 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex-1 w-full">
                       <p className="font-black uppercase text-2xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-black opacity-60 bg-muted inline-block px-2 py-1 rounded">PIX PARA PAGAMENTO: {t.pix_resgate || "NÃO INFORMADO"}</p>
                       <div className="mt-4"><p className="text-3xl font-black text-green-600">VALOR TOTAL: R$ {totalAcumulado?.toFixed(2)}</p></div>
                       <p className="text-[8px] font-bold text-muted-foreground uppercase mt-1">Este valor é a soma de todas as cartelas premiadas deste bilhete.</p>
                     </div>
                     <Button onClick={() => confirmPayout(t.id)} className="bg-green-600 hover:bg-green-700 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white">Dar Baixa no Pagamento</Button>
                   </Card>
                 );
               })}
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Data Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase">Data Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></div>
               </div>
               <Card className="bg-white rounded-[2rem] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left text-[10px] font-black uppercase">
                        <thead className="bg-muted border-b">
                           <tr><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Vendedor</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr>
                        </thead>
                        <tbody className="divide-y">
                           {filteredTickets.map((t, i) => (
                             <tr key={i} className="hover:bg-muted/20">
                                <td className="p-4 opacity-60">{new Date(t.created_at).toLocaleDateString()}</td>
                                <td className="p-4 text-primary">{t.cliente}</td>
                                <td className="p-4">{t.vendedor_nome || 'Admin'}</td>
                                <td className="p-4">R$ {Number(t.valor_total).toFixed(2)}</td>
                                <td className="p-4"><Badge className={cn("text-[7px]", t.status === 'pago' || t.status === 'premio_pago' ? 'bg-green-600' : 'bg-orange-600')}>{t.status}</Badge></td>
                             </tr>
                           ))}
                        </tbody>
                     </table>
                  </div>
               </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary">Carregando Auditoria...</div>}><FinanceiroContent /></Suspense>;
}

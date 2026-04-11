
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Database, Search, Wallet, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Key, MessageCircle, Trash2, CheckCircle2, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchPending, setSearchPending] = useState('');
  const [searchHistory, setSearchHistory] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
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
      const { error: ticketError } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', receipt.id);
      if (ticketError) throw ticketError;

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

      toast({ title: "VENDA VALIDADA!" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO VALIDAR", description: err.message });
    } finally {
      setSyncing(false);
    }
  };

  const rejectPendingSale = async (id: string) => {
    if (!confirm("Deseja realmente REJEITAR e EXCLUIR esta reserva pendente?")) return;
    setSyncing(true);
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "VENDA REJEITADA E EXCLUÍDA!", variant: "destructive" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO REJEITAR" });
    } finally {
      setSyncing(false);
    }
  };

  const confirmPayout = async (receiptId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', receiptId);
    if (!error) { 
      toast({ title: "PRÊMIO PAGO!" }); 
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
        toast({ title: "APROVADO!" });
      } else {
        await supabase.from('transactions').update({ status: 'rejeitado' }).eq('id', trans.id);
        toast({ variant: "destructive", title: "REJEITADO!" });
      }
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO NA OPERAÇÃO" });
    } finally {
      setSyncing(false);
    }
  };

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

  const filteredHistory = useMemo(() => {
    return tickets.filter(t => {
      if (t.status === 'pendente') return false;
      const term = searchHistory.toLowerCase();
      return (
        t.cliente.toLowerCase().includes(term) || 
        t.id.toLowerCase().includes(term) ||
        t.evento_nome.toLowerCase().includes(term)
      );
    });
  }, [tickets, searchHistory]);

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
                <Database className="w-3 h-3 text-green-600" /> Auditoria Live de Caixa
              </p>
            </div>
            <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl">
              <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </Button>
          </div>

          <Tabs defaultValue="vendas_pendentes">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="vendas_pendentes" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Pendentes {totalPendingSales > 0 && <span className="ml-2 bg-orange-600 text-white px-2 py-0.5 rounded-full">{totalPendingSales}</span>}
              </TabsTrigger>
              <TabsTrigger value="transacoes" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Saldos & Saques {totalPendingTrans > 0 && <span className="ml-2 bg-accent text-white px-2 py-0.5 rounded-full">{totalPendingTrans}</span>}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Prêmios {totalPendingPayout > 0 && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full">{totalPendingPayout}</span>}
              </TabsTrigger>
              <TabsTrigger value="historico" className="font-black uppercase text-[10px] rounded-xl px-8 shrink-0">
                Histórico Total
              </TabsTrigger>
            </TabsList>

            <TabsContent value="vendas_pendentes" className="mt-6 space-y-4">
               <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Pesquisar por NOME ou CÓDIGO do bilhete..." 
                    value={searchPending}
                    onChange={e => setSearchPending(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 font-bold"
                  />
               </div>

               {filteredPending.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem apostas pendentes</div>
               ) : filteredPending.map((t, i) => (
                 <Card key={i} className="p-6 border-l-8 border-l-orange-600 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1 w-full space-y-3">
                     <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                           <ShoppingCart className="text-orange-600" />
                           <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                        </div>
                        <Badge variant="outline" className="font-mono text-xs font-black">#{t.id}</Badge>
                     </div>
                     
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border border-orange-100">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-[8px] font-black uppercase opacity-50">WhatsApp Cliente</p>
                            <span className="text-[11px] font-black uppercase">{t.whatsapp || 'NÃO INFORMADO'}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Key className="w-4 h-4 text-accent" />
                          <div>
                            <p className="text-[8px] font-black uppercase opacity-50">PIX para Pagamento</p>
                            <span className="text-[11px] font-black uppercase truncate">{t.pix_resgate || 'NÃO INFORMADO'}</span>
                          </div>
                        </div>
                     </div>

                     <p className="text-[10px] font-black opacity-60 uppercase">CONCURSO: {t.evento_nome} • VENDEDOR: {t.vendedor_nome || 'ADMIN'}</p>
                     <p className="text-3xl font-black text-orange-600">R$ {Number(t.valor_total).toFixed(2)}</p>
                   </div>
                   <div className="flex gap-2 w-full md:w-auto">
                      <Button onClick={() => rejectPendingSale(t.id)} variant="outline" className="h-16 px-6 font-black uppercase rounded-2xl text-destructive border-destructive hover:bg-destructive/10">
                        <Trash2 className="w-5 h-5 mr-2" /> Rejeitar
                      </Button>
                      <Button onClick={() => approvePendingSale(t)} className="bg-primary hover:bg-primary/90 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white flex-1 md:flex-none">Validar Venda</Button>
                   </div>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="transacoes" className="mt-6 space-y-4">
               {transactions.filter(t => t.status === 'pendente').length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem movimentações</div>
               ) : transactions.filter(t => t.status === 'pendente').map((trans, i) => (
                 <Card key={i} className={cn(
                   "p-6 border-l-8 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6",
                   trans.type === 'deposito' ? 'border-l-blue-500' : 'border-l-orange-500'
                 )}>
                   <div className="flex-1 w-full space-y-2">
                     <div className="flex items-center gap-2">
                        {trans.type === 'deposito' ? <ArrowUpCircle className="text-blue-600" /> : <ArrowDownCircle className="text-orange-600" />}
                        <p className="font-black uppercase text-xl text-primary">{trans.user_name}</p>
                     </div>
                     <p className="text-[10px] font-black opacity-60">PIX: {trans.pix_key || 'DEPÓSITO'}</p>
                     <p className="text-3xl font-black text-primary">R$ {Number(trans.amount).toFixed(2)}</p>
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
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem prêmios pendentes</div>
               ) : tickets.filter(t => t.status === 'pendente-resgate').map((t, i) => {
                 const totalAcumulado = t.tickets_data?.filter((item: any) => (item.s || item.status) === 'ganhou')
                    .reduce((acc: number, item: any) => acc + (Number(item.v || item.valor_premio || item.valorPremio || 0)), 0);
                 
                 return (
                   <Card key={i} className="p-6 border-l-8 border-l-green-500 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex-1 w-full space-y-2">
                       <p className="font-black uppercase text-2xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-black opacity-60 bg-muted px-2 py-1 rounded inline-block">PIX: {t.pix_resgate || "NÃO INFORMADO"}</p>
                       <div className="mt-2"><p className="text-3xl font-black text-green-600">TOTAL SOMADO: R$ {totalAcumulado?.toFixed(2)}</p></div>
                     </div>
                     <Button onClick={() => confirmPayout(t.id)} className="bg-green-600 hover:bg-green-700 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white">Confirmar Pagamento Único</Button>
                   </Card>
                 );
               })}
            </TabsContent>

            <TabsContent value="historico" className="mt-6 space-y-4">
               <div className="bg-white p-4 rounded-2xl border shadow-sm flex items-center gap-3">
                  <Search className="w-5 h-5 text-muted-foreground" />
                  <Input 
                    placeholder="Filtrar histórico por nome ou código..." 
                    value={searchHistory}
                    onChange={e => setSearchHistory(e.target.value)}
                    className="border-none shadow-none focus-visible:ring-0 font-bold"
                  />
               </div>

               {filteredHistory.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Histórico vazio</div>
               ) : filteredHistory.map((t, i) => (
                 <Card key={i} className="p-4 border rounded-2xl bg-white hover:bg-muted/10 transition-all flex justify-between items-center">
                    <div>
                       <div className="flex items-center gap-2">
                          <p className="font-black uppercase text-xs text-primary">{t.cliente}</p>
                          <Badge className={cn("text-[8px] uppercase", 
                            t.status === 'pago' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                          )}>{t.status}</Badge>
                       </div>
                       <p className="text-[9px] font-bold text-muted-foreground uppercase">{t.evento_nome} • COD: {t.id}</p>
                    </div>
                    <div className="text-right">
                       <p className="font-black text-sm text-primary">R$ {Number(t.valor_total).toFixed(2)}</p>
                       <p className="text-[8px] opacity-50 uppercase font-bold">{new Date(t.created_at).toLocaleDateString()}</p>
                    </div>
                 </Card>
               ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary">Carregando...</div>}><FinanceiroContent /></Suspense>;
}

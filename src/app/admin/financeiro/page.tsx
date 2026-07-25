
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Database, Search, Wallet, ShoppingCart, Key, MessageCircle, CheckCircle2, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const loadData = async () => {
    if (!mounted) return;
    setSyncing(true);
    try {
      const { data: ticketData } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (ticketData) setTickets(ticketData);
    } catch (err: any) { console.error(err); } 
    finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { if (mounted) loadData(); }, [mounted]);

  const approvePendingSale = async (receipt: any) => {
    setSyncing(true);
    try {
      // 1. Marcar como pago
      const { error: ticketError } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', receipt.id);
      if (ticketError) throw ticketError;

      // 2. Calcular Comissões Dinâmicas e pagar vendedor
      const { data: vData } = await supabase.from('users').select('*').eq('id', receipt.vendedor_id).single();
      if (vData && vData.role !== 'admin' && vData.role !== 'cliente') {
        const rate = Number(vData.commission_rate || 0) / 100;
        const commission = Number(receipt.valor_total) * rate;
        
        await supabase.from('users').update({ 
          commission_balance: Number(vData.commission_balance || 0) + commission 
        }).eq('id', vData.id);

        // Se houver gerente, pagar 5% fixo do gerente
        if (vData.gerente_id) {
          const { data: gData } = await supabase.from('users').select('*').eq('id', vData.gerente_id).single();
          if (gData) {
            const gRate = 0.05;
            const gComm = Number(receipt.valor_total) * gRate;
            await supabase.from('users').update({ 
              commission_balance: Number(gData.commission_balance || 0) + gComm 
            }).eq('id', gData.id);
          }
        }
      }

      toast({ title: "VENDA VALIDADA!" });
      loadData();
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO AO VALIDAR" }); } 
    finally { setSyncing(false); }
  };

  const totalPendingPayout = useMemo(() => tickets.filter(t => t.status === 'pendente-resgate').length, [tickets]);
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
                <Database className="w-3 h-3 text-green-600" /> Auditoria de Arrecadação
              </p>
            </div>
            <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl">
              <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </Button>
          </div>

          <Tabs defaultValue="vendas_pendentes">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="vendas_pendentes" className="font-black uppercase text-[10px] rounded-xl px-8">
                Pendentes {totalPendingSales > 0 && <span className="ml-2 bg-orange-600 text-white px-2 py-0.5 rounded-full">{totalPendingSales}</span>}
              </TabsTrigger>
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8">
                Prêmios {totalPendingPayout > 0 && <span className="ml-2 bg-red-600 text-white px-2 py-0.5 rounded-full">{totalPendingPayout}</span>}
              </TabsTrigger>
              <TabsTrigger value="historico" className="font-black uppercase text-[10px] rounded-xl px-8">Histórico Total</TabsTrigger>
            </TabsList>

            <TabsContent value="vendas_pendentes" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente').length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Tudo em dia. Nenhuma venda pendente.</div>
               ) : tickets.filter(t => t.status === 'pendente').map((t, i) => (
                 <Card key={i} className="p-6 border-l-8 border-l-orange-600 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1 w-full space-y-3">
                     <div className="flex items-center justify-between">
                        <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                        <Badge variant="outline" className="font-mono text-[9px] font-black">ID: {t.id}</Badge>
                     </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-2xl border">
                        <div className="flex items-center gap-2">
                          <MessageCircle className="w-4 h-4 text-green-600" />
                          <div>
                            <p className="text-[8px] font-black uppercase opacity-50">Vendedor</p>
                            <span className="text-[11px] font-black">{t.vendedor_nome} ({t.whatsapp})</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-4 h-4 text-orange-600" />
                          <div>
                            <p className="text-[8px] font-black uppercase opacity-50">Status do Caixa</p>
                            <span className="text-[11px] font-black text-orange-600">AGUARDANDO DINHEIRO</span>
                          </div>
                        </div>
                     </div>
                     <p className="text-3xl font-black text-orange-600">R$ {Number(t.valor_total).toFixed(2)}</p>
                   </div>
                   <Button onClick={() => approvePendingSale(t)} className="bg-primary hover:bg-primary/90 h-16 px-10 font-black uppercase rounded-2xl shadow-lg text-white">Validar e Pagar Comissão</Button>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="payouts" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente-resgate').map((t, i) => (
                 <Card key={i} className="p-6 border-l-8 border-l-green-500 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex-1 w-full space-y-2">
                     <p className="font-black uppercase text-2xl text-primary">{t.cliente}</p>
                     <p className="text-[10px] font-black opacity-60">PIX DE RESGATE: {t.pix_resgate}</p>
                     <p className="text-3xl font-black text-green-600">VALOR DO PRÊMIO: R$ {Number(t.detalhe_premios?.total || 0).toFixed(2)}</p>
                   </div>
                   <Button onClick={async () => { 
                      await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', t.id); 
                      loadData(); 
                   }} className="bg-green-600 h-16 px-10 font-black uppercase rounded-2xl text-white">Confirmar Pagamento do Prêmio</Button>
                 </Card>
               ))}
            </TabsContent>

            <TabsContent value="historico" className="mt-6 space-y-4">
              {tickets.slice(0, 50).map((t, i) => (
                <div key={i} className="bg-white p-4 rounded-xl border flex justify-between items-center">
                  <div>
                    <p className="text-xs font-black uppercase">{t.cliente} - {t.evento_nome}</p>
                    <p className="text-[9px] font-bold opacity-50">{new Date(t.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-black">R$ {Number(t.valor_total).toFixed(2)}</p>
                    <Badge variant="outline" className="text-[8px] uppercase">{t.status}</Badge>
                  </div>
                </div>
              ))}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary">Carregando Financeiro...</div>}><FinanceiroContent /></Suspense>;
}

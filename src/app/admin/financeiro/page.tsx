
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { RefreshCcw, Database, CheckCircle2, TrendingUp, DollarSign, ArrowUpRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
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
      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      if (data) setTickets(data);
    } catch (err: any) {
      console.error("Erro Financeiro:", err.message);
    } finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { if (mounted) loadData(); }, [mounted]);

  const confirmPayout = async (receiptId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', receiptId);
    if (!error) { 
      toast({ title: "PRÊMIO PAGO COM SUCESSO! ✓", description: "O recibo foi marcado como finalizado." }); 
      loadData(); 
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const date = t.created_at?.split('T')[0] || "";
      const matchesDate = date >= startDate && date <= endDate;
      const matchesSearch = (t.cliente || "").toLowerCase().includes(searchTerm.toLowerCase()) || (t.id || "").toLowerCase().includes(searchTerm.toLowerCase());
      return matchesDate && matchesSearch;
    });
  }, [tickets, startDate, endDate, searchTerm]);

  const performance = useMemo(() => {
    const summary: Record<string, { nome: string, total: number }> = {};
    filteredTickets.forEach(t => {
      if (t.status === 'pago' || t.status === 'premio_pago' || t.status === 'ganhou') {
        const key = t.vendedor_id || 'admin';
        if (!summary[key]) summary[key] = { nome: t.vendedor_nome || 'Admin', total: 0 };
        summary[key].total += Number(t.valor_total || 0);
      }
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  const totalPendingPayout = useMemo(() => {
    return tickets.filter(t => t.status === 'pendente-resgate').length;
  }, [tickets]);

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
                <Database className="w-3 h-3 text-green-600" /> Auditoria e Pagamentos Supabase
              </p>
            </div>
            <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 shadow-sm bg-white hover:bg-muted">
              <RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} />
            </Button>
          </div>

          <Tabs defaultValue="payouts">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12 relative">
                Resgates Unificados
                {totalPendingPayout > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white w-5 h-5 rounded-full flex items-center justify-center text-[8px] animate-bounce">{totalPendingPayout}</span>
                )}
              </TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Histórico & Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="payouts" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente-resgate').length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Aguardando solicitações de resgate...</div>
               ) : tickets.filter(t => t.status === 'pendente-resgate').map((t, i) => {
                 // SOMA TODAS AS CARTELAS GANHADORAS DAQUELE BILHETE
                 const totalAcumulado = t.tickets_data?.filter((item: any) => item.status === 'ganhou' || item.s === 'ganhou')
                    .reduce((acc: number, item: any) => acc + (Number(item.valorPremio || item.vp || 0)), 0);
                 
                 return (
                   <Card key={i} className="p-6 border-l-8 border-l-green-500 rounded-[2rem] shadow-xl bg-white flex flex-col md:flex-row justify-between items-center gap-6 group hover:shadow-2xl transition-all">
                     <div className="flex-1 w-full">
                       <div className="flex items-center gap-2 mb-1">
                          <Badge variant="outline" className="text-[8px] font-black uppercase">{t.tipo}</Badge>
                          <p className="text-[10px] font-black opacity-40">CÓDIGO: {t.id}</p>
                       </div>
                       <p className="font-black uppercase text-2xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-black opacity-60 bg-muted inline-block px-2 py-1 rounded mt-1">
                         PIX: {t.pix_resgate || t.pixKey || "NÃO INFORMADO"}
                       </p>
                       <div className="flex items-end gap-2 mt-4">
                          <p className="text-3xl font-black text-green-600 leading-none">R$ {totalAcumulado?.toFixed(2)}</p>
                          <p className="text-[9px] font-black opacity-40 uppercase mb-1">Total Acumulado Unificado</p>
                       </div>
                     </div>
                     <div className="flex flex-col gap-2 w-full md:w-auto">
                        <Button onClick={() => confirmPayout(t.id)} className="bg-green-600 hover:bg-green-700 h-16 px-10 font-black uppercase rounded-2xl shadow-lg gap-2 text-white">
                           <CheckCircle2 className="w-5 h-5" /> Confirmar Pagamento PIX
                        </Button>
                        <p className="text-[8px] font-black text-center text-muted-foreground uppercase">Verifique o comprovante antes de confirmar</p>
                     </div>
                   </Card>
                 );
               })}
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border shadow-sm">
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Data Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 font-bold" /></div>
                  <div className="space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Data Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 font-bold" /></div>
                  <div className="md:col-span-2 space-y-1"><Label className="text-[10px] font-black uppercase opacity-60">Busca Rápida</Label><Input placeholder="NOME DO CLIENTE OU CÓDIGO" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10 font-bold" /></div>
               </div>

               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1 bg-white rounded-[2rem] p-6 shadow-xl border-none">
                     <h3 className="font-black uppercase text-sm mb-6 flex items-center gap-2 text-primary">
                        <TrendingUp className="w-4 h-4" /> Performance Equipe
                     </h3>
                     <div className="space-y-3">
                        {performance.length === 0 ? (
                           <p className="text-center py-10 opacity-30 font-black uppercase text-[10px]">Sem dados no período</p>
                        ) : performance.map((p, i) => (
                          <div key={i} className="flex justify-between items-center p-3 border-b hover:bg-muted/30 transition-all rounded-lg">
                             <span className="text-[10px] font-black uppercase truncate max-w-[140px]">{p.nome}</span>
                             <span className="text-sm font-black text-primary">R$ {p.total.toFixed(2)}</span>
                          </div>
                        ))}
                     </div>
                  </Card>

                  <Card className="lg:col-span-2 bg-white rounded-[2rem] overflow-hidden shadow-xl border-none">
                     <div className="overflow-x-auto">
                        <table className="w-full text-left text-[10px] font-black uppercase">
                           <thead className="bg-muted border-b">
                              <tr>
                                 <th className="p-4">Data</th>
                                 <th className="p-4">Cliente</th>
                                 <th className="p-4">Valor</th>
                                 <th className="p-4">Status</th>
                                 <th className="p-4">Ação</th>
                              </tr>
                           </thead>
                           <tbody className="divide-y">
                              {filteredTickets.map((t, i) => (
                                <tr key={i} className="hover:bg-muted/20">
                                   <td className="p-4 opacity-60">{new Date(t.created_at).toLocaleDateString()}</td>
                                   <td className="p-4 text-primary">{t.cliente}</td>
                                   <td className="p-4">R$ {Number(t.valor_total).toFixed(2)}</td>
                                   <td className="p-4">
                                      <Badge className={cn(
                                        "text-[7px] font-black uppercase h-5",
                                        t.status === 'pago' ? 'bg-blue-600' : (t.status === 'premio_pago' ? 'bg-green-600' : 'bg-orange-600')
                                      )}>
                                        {t.status}
                                      </Badge>
                                   </td>
                                   <td className="p-4">
                                      <Button variant="ghost" size="icon" className="h-8 w-8 text-primary" onClick={() => router.push(`/resultados?c=${t.id}`)}>
                                         <ArrowUpRight className="w-4 h-4" />
                                      </Button>
                                   </td>
                                </tr>
                              ))}
                           </tbody>
                        </table>
                     </div>
                  </Card>
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black text-xs uppercase">Carregando Financeiro...</div>}><FinanceiroContent /></Suspense>;
}

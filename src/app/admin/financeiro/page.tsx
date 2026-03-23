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
import { RefreshCcw, Database, CheckCircle2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
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
      const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (data) setTickets(data);
    } finally { setLoading(false); setSyncing(false); }
  };

  useEffect(() => { if (mounted) loadData(); }, [mounted]);

  const confirmPayout = async (receiptId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', receiptId);
    if (!error) { toast({ title: "PRÊMIO PAGO ✓" }); loadData(); }
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
      if (t.status === 'pago' || t.status === 'premio_pago') {
        const key = t.vendedor_id || 'admin';
        if (!summary[key]) summary[key] = { nome: t.vendedor_nome || 'Admin', total: 0 };
        summary[key].total += Number(t.valor_total || 0);
      }
    });
    return Object.values(summary).sort((a, b) => b.total - a.total);
  }, [filteredTickets]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div><h1 className="text-4xl font-black uppercase text-primary">Financeiro Master</h1><p className="text-[10px] font-black uppercase tracking-widest"><Database className="inline w-3 h-3" /> Gestão de Prêmios e Performance</p></div>
            <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2"><RefreshCcw className={cn("w-5 h-5", syncing && "animate-spin")} /></Button>
          </div>

          <Tabs defaultValue="payouts">
            <TabsList className="bg-white p-1 rounded-2xl w-full flex justify-start gap-2 shadow-sm border h-14 overflow-x-auto">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Prêmios Unificados</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Histórico & Performance</TabsTrigger>
            </TabsList>

            <TabsContent value="payouts" className="mt-6 space-y-4">
               {tickets.filter(t => t.status === 'pendente-resgate').map((t, i) => {
                 const total = t.tickets_data?.filter((item: any) => item.status === 'ganhou' || item.s === 'ganhou').reduce((acc: number, item: any) => acc + (Number(item.valorPremio || item.vp || 0)), 0);
                 return (
                   <Card key={i} className="p-6 border-l-8 border-l-green-500 rounded-[2rem] shadow-lg bg-white flex flex-col md:flex-row justify-between items-center gap-6">
                     <div className="flex-1 w-full"><p className="font-black uppercase text-xl text-primary">{t.cliente}</p><p className="text-[10px] font-black opacity-60">JOGO: {t.evento_nome} • PIX: {t.pix_resgate}</p><p className="text-2xl font-black text-green-600 mt-2">R$ {total?.toFixed(2)} <span className="text-[10px] opacity-60">(Total Acumulado)</span></p></div>
                     <Button onClick={() => confirmPayout(t.id)} className="bg-green-600 h-14 px-10 font-black uppercase rounded-xl shadow-lg"><CheckCircle2 className="mr-2" /> Confirmar PIX</Button>
                   </Card>
                 );
               })}
            </TabsContent>

            <TabsContent value="history" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 md:grid-cols-4 gap-4 bg-white p-6 rounded-3xl border">
                  <div><Label className="text-[10px] font-black uppercase">Início</Label><Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10" /></div>
                  <div><Label className="text-[10px] font-black uppercase">Fim</Label><Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10" /></div>
                  <div className="md:col-span-2"><Label className="text-[10px] font-black uppercase">Busca</Label><Input placeholder="NOME OU CÓDIGO" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="h-10" /></div>
               </div>
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <Card className="lg:col-span-1 bg-white rounded-3xl p-6 shadow-lg">
                     <h3 className="font-black uppercase text-xs mb-4"><TrendingUp className="inline mr-2" /> Performance Equipe</h3>
                     {performance.map((p, i) => (
                       <div key={i} className="flex justify-between p-3 border-b text-[10px] font-black uppercase"><span>{p.nome}</span><span className="text-primary">R$ {p.total.toFixed(2)}</span></div>
                     ))}
                  </Card>
                  <Card className="lg:col-span-2 bg-white rounded-3xl overflow-hidden shadow-lg">
                     <table className="w-full text-left text-[9px] font-black uppercase">
                        <thead className="bg-muted"><tr><th className="p-4">Data</th><th className="p-4">Cliente</th><th className="p-4">Valor</th><th className="p-4">Status</th></tr></thead>
                        <tbody className="divide-y">{filteredTickets.map((t, i) => (
                          <tr key={i}><td className="p-4">{new Date(t.created_at).toLocaleDateString()}</td><td className="p-4">{t.cliente}</td><td className="p-4">R$ {Number(t.valor_total).toFixed(2)}</td><td className="p-4"><Badge className={cn("text-[7px]", t.status === 'pago' ? 'bg-blue-600' : 'bg-green-600')}>{t.status}</Badge></td></tr>
                        ))}</tbody>
                     </table>
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
  return <Suspense fallback={<div>Carregando...</div>}><FinanceiroContent /></Suspense>;
}
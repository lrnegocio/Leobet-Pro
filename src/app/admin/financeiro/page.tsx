
"use client"

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  RefreshCcw, 
  History, 
  Search, 
  Settings, 
  Store, 
  Globe,
  Database,
  Phone,
  Zap,
  TrendingUp,
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

function FinanceiroContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'payouts';

  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  
  const [startDate, setStartDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('tickets')
      .select('*')
      .order('created_at', { ascending: false });

    if (!error) setTickets(data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, []);

  const finance = useMemo(() => {
    let bruto = 0;
    const filtered = tickets.filter(t => t.status === 'pago');
    filtered.forEach(t => bruto += Number(t.valor_total));
    
    const pool = Math.floor(bruto * 0.65 * 100) / 100;
    const admin = Math.floor(bruto * 0.35 * 100) / 100;

    return { bruto, pool, admin };
  }, [tickets]);

  const approvePayout = async (ticketId: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'premio_pago' })
      .eq('id', ticketId);

    if (!error) {
      toast({ title: "PAGAMENTO CONFIRMADO NO BANCO DE DADOS!" });
      loadData();
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.whatsapp.includes(searchTerm)
  );

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">Financeiro Master</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Auditoria Global via Supabase Cloud
              </p>
            </div>
            <div className="flex gap-3">
               <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border items-center">
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
                 <span className="text-muted-foreground text-[10px] font-black uppercase">até</span>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
               </div>
               <Button onClick={loadData} variant="outline" className="h-12 w-12 rounded-xl border-2"><RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Arrecadação Bruta</p>
              <p className="text-4xl font-black mt-2">R$ {finance.bruto.toFixed(2)}</p>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-2xl rounded-3xl p-6">
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Prêmios Líquidos (65%)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.pool.toFixed(2)}</p>
            </Card>
            <Card className="bg-white border-none shadow-xl rounded-3xl p-6 border-l-8 border-l-accent">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lucro Operacional (35%)</p>
              <p className="text-4xl font-black mt-2 text-primary">R$ {finance.admin.toFixed(2)}</p>
            </Card>
          </div>

          <div className="bg-white p-4 rounded-2xl shadow-sm border flex gap-4 items-center">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar ganhador, WhatsApp ou ID do bilhete..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-xl text-lg border-2 focus:border-primary"
                />
             </div>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto gap-2">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-10">Ganhadores & Prêmios</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-10">Histórico de Vendas</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {filteredTickets.length === 0 ? (
                 <Card className="py-24 text-center border-dashed rounded-[3rem] opacity-30 font-black uppercase text-sm">Nenhum registro localizado</Card>
               ) : (
                 filteredTickets.map((t, i) => (
                   <Card key={i} className={cn(
                     "flex justify-between items-center p-6 border-l-8 rounded-2xl shadow-md transition-all",
                     t.status === 'premio_pago' ? "bg-muted/30 border-l-gray-400 opacity-60" : "bg-white border-l-green-500"
                   )}>
                     <div className="space-y-2">
                       <div className="flex items-center gap-3">
                         <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                         <Badge className={cn(
                           "font-black text-[9px] h-5 uppercase",
                           t.status === 'premio_pago' ? "bg-gray-500" : "bg-green-600 animate-pulse"
                         )}>
                           {t.status === 'premio_pago' ? '✓ PRÊMIO PAGO' : '🔥 GANHADOR DETECTADO'}
                         </Badge>
                       </div>
                       <p className="text-xs font-bold text-muted-foreground uppercase">{t.evento_nome} • ID: {t.id}</p>
                       
                       <div className="flex gap-4 mt-4">
                          <Button 
                            onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${t.whatsapp}`, '_blank')}
                            className="bg-green-50 text-green-700 hover:bg-green-100 font-black uppercase text-[10px] h-9 gap-2 border border-green-200 rounded-lg"
                          >
                            <Phone className="w-3 h-3" /> {t.whatsapp}
                          </Button>
                          <div className="bg-primary/5 px-4 py-1.5 rounded-lg border border-primary/10 flex items-center gap-2">
                             <span className="text-[10px] font-black text-primary uppercase">VALOR:</span>
                             <span className="text-sm font-black text-primary">R$ {Number(t.valor_total).toFixed(2)}</span>
                          </div>
                       </div>
                     </div>
                     {t.status !== 'premio_pago' && (
                       <Button onClick={() => approvePayout(t.id)} className="bg-primary hover:bg-primary/90 font-black uppercase text-xs h-14 px-10 rounded-2xl shadow-xl">Baixar Prêmio</Button>
                     )}
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
               <Card className="rounded-[2.5rem] border-none shadow-xl overflow-hidden">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                           <tr>
                              <th className="p-6">Data</th>
                              <th className="p-6">Cliente</th>
                              <th className="p-6">Evento</th>
                              <th className="p-6">Valor</th>
                              <th className="p-6">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y text-xs font-bold uppercase">
                           {filteredTickets.map((t, i) => (
                             <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="p-6 text-muted-foreground">{new Date(t.created_at).toLocaleString()}</td>
                                <td className="p-6 font-black text-primary">{t.cliente}</td>
                                <td className="p-6">{t.evento_nome}</td>
                                <td className="p-6">R$ {Number(t.valor_total).toFixed(2)}</td>
                                <td className="p-6">
                                   <Badge variant={t.status === 'pago' || t.status === 'premio_pago' ? 'default' : 'destructive'} className="font-black text-[9px]">
                                      {t.status}
                                   </Badge>
                                </td>
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
  return (
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs">Sincronizando Banco de Dados...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}

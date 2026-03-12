
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
  Search, 
  Database, 
  Phone, 
  Trash2,
  AlertTriangle,
  Printer
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
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    setStartDate(d.toISOString().split('T')[0]);
    setEndDate(new Date().toISOString().split('T')[0]);
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!startDate || !endDate) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('tickets')
        .select('*')
        .gte('created_at', `${startDate}T00:00:00`)
        .lte('created_at', `${endDate}T23:59:59`)
        .order('created_at', { ascending: false });

      if (!error) setTickets(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      loadData();
    }
  }, [startDate, endDate, mounted]);

  const finance = useMemo(() => {
    let bruto = 0;
    const validTickets = tickets.filter(t => ['pago', 'ganhou', 'premio_pago'].includes(t.status));
    validTickets.forEach(t => bruto += Number(t.valor_total || 0));
    
    const pool = Math.floor(bruto * 0.65 * 100) / 100;
    const admin = Math.floor(bruto * 0.35 * 100) / 100;

    return { bruto, pool, admin };
  }, [tickets]);

  const approveTicket = async (ticketId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', ticketId);
    if (!error) {
      toast({ title: "APOSTA VALIDADA!" });
      loadData();
    }
  };

  const confirmPrizePayout = async (ticketId: string) => {
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', ticketId);
    if (!error) {
      toast({ title: "PRÊMIO PAGO AO GANHADOR!" });
      loadData();
    }
  };

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const cliente = (t.cliente || "").toLowerCase();
      const id = (t.id || "").toLowerCase();
      const search = searchTerm.toLowerCase();
      return cliente.includes(search) || id.includes(search);
    });
  }, [tickets, searchTerm]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">Auditoria de Caixa</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Banco Supabase Cloud
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
               <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center flex-1 md:flex-none">
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
                 <span className="text-muted-foreground text-[10px] font-black uppercase hidden md:inline">até</span>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
               </div>
               <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 hover:bg-primary transition-all">
                 <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-[2rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Arrecadação Bruta</p>
              <p className="text-4xl font-black mt-2">R$ {finance.bruto.toFixed(2)}</p>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-[2rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Reserva Prêmios (65%)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.pool.toFixed(2)}</p>
            </Card>
            <Card className="bg-white border-none shadow-xl rounded-[2rem] p-8 border-l-8 border-l-accent">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Banca Admin (35%)</p>
              <p className="text-4xl font-black mt-2 text-primary">R$ {finance.admin.toFixed(2)}</p>
            </Card>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start gap-2">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Validar Vendas / Prêmios</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Histórico Geral</TabsTrigger>
            </TabsList>
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {filteredTickets.filter(t => t.status === 'pendente' || t.status === 'ganhou').length === 0 ? (
                 <Card className="py-24 text-center border-dashed rounded-[3rem] opacity-30 bg-white font-black uppercase text-xs">Nada pendente</Card>
               ) : (
                 filteredTickets.filter(t => t.status === 'pendente' || t.status === 'ganhou').map((t, i) => (
                   <Card key={i} className={cn(
                     "flex flex-col md:flex-row justify-between items-center p-6 border-l-8 rounded-3xl shadow-lg bg-white gap-6",
                     t.status === 'ganhou' ? 'border-l-green-500' : 'border-l-orange-500'
                   )}>
                     <div className="space-y-2 flex-1 w-full">
                       <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.evento_nome} • R$ {Number(t.valor_total || 0).toFixed(2)}</p>
                       <div className="bg-muted/50 p-2 rounded-lg inline-block">
                          <p className="text-[8px] font-black uppercase opacity-60">Chave PIX Gravada:</p>
                          <p className="text-[10px] font-black truncate">{t.pix_resgate || 'NÃO INFORMADA'}</p>
                       </div>
                       <Badge variant="outline" className="font-black text-[8px] uppercase block w-fit mt-2">
                          {t.status === 'pendente' ? 'Venda Aguardando Validação' : 'Ganhador - Pagar Prêmio'}
                       </Badge>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <Button onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${t.whatsapp}`, '_blank')} variant="outline" className="flex-1 h-16 font-black uppercase text-[10px] rounded-2xl"><Phone className="w-4 h-4 mr-2" /> WhatsApp</Button>
                        {t.status === 'pendente' ? (
                           <Button onClick={() => approveTicket(t.id)} className="flex-[2] bg-primary font-black uppercase text-xs h-16 rounded-2xl">Validar Pagamento</Button>
                        ) : (
                           <Button onClick={() => confirmPrizePayout(t.id)} className="flex-[2] bg-green-600 hover:bg-green-700 font-black uppercase text-xs h-16 rounded-2xl">Pagar Prêmio</Button>
                        )}
                     </div>
                   </Card>
                 ))
               )}
            </TabsContent>
            <TabsContent value="history" className="mt-6">
               <Card className="rounded-[2.5rem] overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-primary text-white text-[10px] font-black uppercase">
                           <tr><th className="p-8">Data</th><th className="p-8">Cliente</th><th className="p-8">Concurso</th><th className="p-8">Valor</th><th className="p-8 text-right">Status</th></tr>
                        </thead>
                        <tbody className="divide-y text-[10px] font-bold uppercase">
                           {filteredTickets.map((t, i) => (
                             <tr key={i} className="hover:bg-muted/30">
                                <td className="p-8">{new Date(t.created_at).toLocaleDateString()}</td>
                                <td className="p-8 font-black text-primary">{t.cliente}</td>
                                <td className="p-8">{t.evento_nome}</td>
                                <td className="p-8">R$ {Number(t.valor_total || 0).toFixed(2)}</td>
                                <td className="p-8 text-right">
                                   <Badge className={cn(
                                     "font-black text-[8px] uppercase",
                                     t.status === 'pago' ? 'bg-blue-600' : 
                                     t.status === 'premio_pago' ? 'bg-green-600' : 
                                     t.status === 'ganhou' ? 'bg-accent' : 'bg-muted'
                                   )}>
                                     {t.status === 'pago' ? 'Validada' : 
                                      t.status === 'premio_pago' ? 'Prêmio Pago' : 
                                      t.status === 'ganhou' ? 'Ganhador' : 'Pendente'}
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary">Carregando Auditoria...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}

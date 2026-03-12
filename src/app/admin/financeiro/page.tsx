
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';

function FinanceiroContent() {
  const { toast } = useToast();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'payouts';

  const [tickets, setTickets] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [cleaning, setCleaning] = useState(false);
  const [showCleanDialog, setShowCleanDialog] = useState(false);

  const [cleanStart, setCleanStart] = useState('');
  const [cleanEnd, setCleanEnd] = useState('');
  const [cleanTickets, setCleanTickets] = useState(true);
  const [cleanTransactions, setCleanTransactions] = useState(false);
  
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
      const interval = setInterval(loadData, 30000);
      return () => clearInterval(interval);
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

  const handleBulkDelete = async () => {
    if (!cleanStart || !cleanEnd) {
      toast({ variant: "destructive", title: "DATAS OBRIGATÓRIAS" });
      return;
    }

    setCleaning(true);
    try {
      const start = `${cleanStart}T00:00:00`;
      const end = `${cleanEnd}T23:59:59`;

      if (cleanTickets) await supabase.from('tickets').delete().gte('created_at', start).lte('created_at', end);
      if (cleanTransactions) await supabase.from('transactions').delete().gte('created_at', start).lte('created_at', end);

      toast({ title: "LIMPEZA CONCLUÍDA!" });
      setShowCleanDialog(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA LIMPEZA" });
    } finally {
      setCleaning(false);
    }
  };

  const approveTicket = async (ticketId: string) => {
    // Apenas valida o pagamento para entrar no sorteio
    const { error } = await supabase.from('tickets').update({ status: 'pago' }).eq('id', ticketId);
    if (!error) {
      toast({ title: "APOSTA VALIDADA!" });
      loadData();
    }
  };

  const confirmPrizePayout = async (ticketId: string) => {
    // Pagamento real do prêmio após ganhar
    const { error } = await supabase.from('tickets').update({ status: 'premio_pago' }).eq('id', ticketId);
    if (!error) {
      toast({ title: "PRÊMIO PAGO COM SUCESSO!" });
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
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">Financeiro Master</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Auditoria Digital Supabase
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
               <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center flex-1 md:flex-none">
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
                 <span className="text-muted-foreground text-[10px] font-black uppercase hidden md:inline">até</span>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
               </div>

               <Dialog open={showCleanDialog} onOpenChange={setShowCleanDialog}>
                 <DialogTrigger asChild>
                   <Button variant="outline" className="h-14 gap-2 font-black uppercase text-[10px] border-destructive/20 text-destructive hover:bg-destructive/10 rounded-2xl shadow-sm">
                      <Trash2 className="w-4 h-4" /> Limpeza
                   </Button>
                 </DialogTrigger>
                 <DialogContent className="bg-white rounded-[2.5rem] border-none shadow-2xl max-w-md p-8">
                   <DialogHeader>
                     <DialogTitle className="text-center font-black uppercase text-primary text-xl">Gestão de Armazenamento</DialogTitle>
                     <DialogDescription className="text-center text-[10px] font-bold uppercase text-muted-foreground mt-2">
                        Selecione o período para deletar dados antigos do banco.
                     </DialogDescription>
                   </DialogHeader>
                   <div className="space-y-6 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase opacity-60">Data Início</Label>
                          <Input type="date" value={cleanStart} onChange={e => setCleanStart(e.target.value)} className="h-12 font-bold rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                          <Label className="text-[9px] font-black uppercase opacity-60">Data Fim</Label>
                          <Input type="date" value={cleanEnd} onChange={e => setCleanEnd(e.target.value)} className="h-12 font-bold rounded-xl" />
                        </div>
                      </div>
                      <div className="space-y-3 p-5 bg-muted/30 rounded-3xl border-2 border-dashed">
                        <div className="flex items-center space-x-3">
                          <Checkbox id="tickets" checked={cleanTickets} onCheckedChange={(v) => setCleanTickets(!!v)} className="h-5 w-5 rounded-lg" />
                          <label htmlFor="tickets" className="text-xs font-black uppercase cursor-pointer">Bilhetes (Histórico)</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox id="transactions" checked={cleanTransactions} onCheckedChange={(v) => setCleanTransactions(!!v)} className="h-5 w-5 rounded-lg" />
                          <label htmlFor="transactions" className="text-xs font-black uppercase cursor-pointer">Transações</label>
                        </div>
                      </div>
                   </div>
                   <DialogFooter>
                     <Button onClick={handleBulkDelete} disabled={cleaning} className="w-full h-16 bg-destructive hover:bg-destructive/90 font-black uppercase rounded-2xl shadow-xl">
                       {cleaning ? "LIMPANDO..." : "EXECUTAR LIMPEZA"}
                     </Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>

               <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 hover:bg-primary transition-all">
                 <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-[2rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Arrecadação Bruta (Vendas Pagas)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.bruto.toFixed(2)}</p>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-[2rem] p-8">
              <p className="text-[10px] font-black uppercase opacity-60">Reserva Prêmios (65%)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.pool.toFixed(2)}</p>
            </Card>
            <Card className="bg-white border-none shadow-xl rounded-[2rem] p-8 border-l-8 border-l-accent">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Lucro Admin (35%)</p>
              <p className="text-4xl font-black mt-2 text-primary">R$ {finance.admin.toFixed(2)}</p>
            </Card>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-sm border flex gap-4 items-center">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input placeholder="Pesquisar cliente ou código..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-12 h-14 rounded-2xl text-lg border-none focus-visible:ring-0 font-bold" />
             </div>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start gap-2">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Pendentes / Prêmios</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Histórico Geral</TabsTrigger>
            </TabsList>
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {filteredTickets.filter(t => t.status === 'pendente' || t.status === 'ganhou').length === 0 ? (
                 <Card className="py-24 text-center border-dashed rounded-[3rem] opacity-30 bg-white font-black uppercase text-xs">Nada para validar no momento</Card>
               ) : (
                 filteredTickets.filter(t => t.status === 'pendente' || t.status === 'ganhou').map((t, i) => (
                   <Card key={i} className={cn(
                     "flex flex-col md:flex-row justify-between items-center p-6 border-l-8 rounded-3xl shadow-lg bg-white gap-6",
                     t.status === 'ganhou' ? 'border-l-green-500' : 'border-l-orange-500'
                   )}>
                     <div className="space-y-2 flex-1 w-full">
                       <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.evento_nome} • R$ {Number(t.valor_total || 0).toFixed(2)}</p>
                       <Badge variant="outline" className="font-black text-[8px] uppercase">
                          {t.status === 'pendente' ? 'AGUARDANDO PAGAMENTO APOSTA' : 'GANHADOR - PAGAR PRÊMIO'}
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary animate-pulse">Carregando...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}

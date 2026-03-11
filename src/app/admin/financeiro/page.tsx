
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
  Database, 
  Phone, 
  Zap, 
  TrendingUp, 
  Trash2,
  AlertTriangle,
  Calendar as CalendarIcon,
  ShieldAlert
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
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
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
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [startDate, endDate]);

  const finance = useMemo(() => {
    let bruto = 0;
    const filtered = tickets.filter(t => t.status === 'pago' || t.status === 'premio_pago');
    filtered.forEach(t => bruto += Number(t.valor_total));
    
    const pool = Math.floor(bruto * 0.65 * 100) / 100;
    const admin = Math.floor(bruto * 0.35 * 100) / 100;

    return { bruto, pool, admin };
  }, [tickets]);

  const handleBulkDelete = async () => {
    if (!cleanStart || !cleanEnd) {
      toast({ variant: "destructive", title: "DATAS OBRIGATÓRIAS", description: "Selecione o período para limpeza." });
      return;
    }

    if (!cleanTickets && !cleanTransactions) {
      toast({ variant: "destructive", title: "O QUE APAGAR?", description: "Selecione ao menos uma categoria." });
      return;
    }

    setCleaning(true);
    try {
      const start = `${cleanStart}T00:00:00`;
      const end = `${cleanEnd}T23:59:59`;

      if (cleanTickets) {
        const { error: tError } = await supabase
          .from('tickets')
          .delete()
          .gte('created_at', start)
          .lte('created_at', end);
        if (tError) throw tError;
      }

      if (cleanTransactions) {
        const { error: trError } = await supabase
          .from('transactions')
          .delete()
          .gte('created_at', start)
          .lte('created_at', end);
        if (trError) throw trError;
      }

      toast({ title: "LIMPEZA CONCLUÍDA!", description: "Espaço liberado no banco de dados." });
      setShowCleanDialog(false);
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO NA LIMPEZA", description: err.message });
    } finally {
      setCleaning(false);
    }
  };

  const approvePayout = async (ticketId: string) => {
    const { error } = await supabase
      .from('tickets')
      .update({ status: 'premio_pago' })
      .eq('id', ticketId);

    if (!error) {
      toast({ title: "PAGAMENTO CONFIRMADO!" });
      loadData();
    }
  };

  const filteredTickets = tickets.filter(t => 
    t.cliente.toLowerCase().includes(searchTerm.toLowerCase()) || 
    t.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (t.whatsapp && t.whatsapp.includes(searchTerm))
  );

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
                        <p className="text-[9px] font-black uppercase text-primary mb-2">Tabelas para Limpar:</p>
                        <div className="flex items-center space-x-3">
                          <Checkbox id="tickets" checked={cleanTickets} onCheckedChange={(v) => setCleanTickets(!!v)} className="h-5 w-5 rounded-lg" />
                          <label htmlFor="tickets" className="text-xs font-black uppercase leading-none cursor-pointer">Bilhetes (Histórico)</label>
                        </div>
                        <div className="flex items-center space-x-3">
                          <Checkbox id="transactions" checked={cleanTransactions} onCheckedChange={(v) => setCleanTransactions(!!v)} className="h-5 w-5 rounded-lg" />
                          <label htmlFor="transactions" className="text-xs font-black uppercase leading-none cursor-pointer">Transações de Saldo</label>
                        </div>
                      </div>

                      <div className="flex items-start gap-3 text-destructive bg-destructive/5 p-4 rounded-2xl border border-destructive/10">
                         <ShieldAlert className="w-6 h-6 shrink-0" />
                         <p className="text-[9px] font-black uppercase leading-tight">
                           CUIDADO: Esta ação removerá permanentemente os registros do banco de dados no período selecionado.
                         </p>
                      </div>
                   </div>
                   <DialogFooter>
                     <Button onClick={handleBulkDelete} disabled={cleaning} className="w-full h-16 bg-destructive hover:bg-destructive/90 font-black uppercase rounded-2xl shadow-xl transition-all active:scale-95">
                       {cleaning ? "LIMPANDO BANCO..." : "EXECUTAR LIMPEZA AGORA"}
                     </Button>
                   </DialogFooter>
                 </DialogContent>
               </Dialog>

               <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 hover:bg-primary hover:text-white transition-all shadow-sm">
                 <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
               </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-primary text-white border-none shadow-2xl rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-20 h-20" /></div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Arrecadação Bruta</p>
              <p className="text-4xl font-black mt-2">R$ {finance.bruto.toFixed(2)}</p>
              <p className="text-[8px] font-bold mt-4 uppercase opacity-40">Total validado no período</p>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-2xl rounded-[2rem] p-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-20 h-20" /></div>
              <p className="text-[10px] font-black uppercase opacity-60 tracking-widest">Reserva Prêmios (65%)</p>
              <p className="text-4xl font-black mt-2">R$ {finance.pool.toFixed(2)}</p>
            </Card>
            <Card className="bg-white border-none shadow-xl rounded-[2rem] p-8 border-l-8 border-l-accent relative overflow-hidden">
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Lucro Administrativo (35%)</p>
              <p className="text-4xl font-black mt-2 text-primary">R$ {finance.admin.toFixed(2)}</p>
            </Card>
          </div>

          <div className="bg-white p-2 rounded-2xl shadow-sm border flex gap-4 items-center">
             <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input 
                  placeholder="Pesquisar ganhador ou código..." 
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-12 h-14 rounded-2xl text-lg border-none shadow-none focus-visible:ring-0 font-bold"
                />
             </div>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto gap-2">
              <TabsTrigger value="payouts" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Ganhadores Pendentes</TabsTrigger>
              <TabsTrigger value="history" className="font-black uppercase text-[10px] rounded-xl px-8 h-12">Histórico Completo</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts" className="mt-6 space-y-4 pb-20">
               {filteredTickets.filter(t => t.status === 'pago').length === 0 ? (
                 <Card className="py-24 text-center border-dashed rounded-[3rem] opacity-30 bg-white">
                    <History className="w-12 h-12 mx-auto mb-4" />
                    <p className="font-black uppercase text-sm">Sem ganhadores pendentes no período</p>
                 </Card>
               ) : (
                 filteredTickets.filter(t => t.status === 'pago').map((t, i) => (
                   <Card key={i} className="flex flex-col md:flex-row justify-between items-center p-6 border-l-8 border-l-green-500 rounded-3xl shadow-lg bg-white hover:shadow-2xl transition-all gap-6">
                     <div className="space-y-2 flex-1 w-full">
                       <div className="flex items-center gap-3">
                         <p className="font-black uppercase text-xl text-primary">{t.cliente}</p>
                         <Badge className="bg-green-600 animate-pulse font-black text-[9px] h-5 uppercase px-3">🏆 GANHADOR</Badge>
                       </div>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.evento_nome} • Valor: R$ {Number(t.valor_total).toFixed(2)}</p>
                       <p className="text-[9px] font-black text-muted-foreground bg-muted p-1 rounded-lg inline-block">ID: {t.id}</p>
                     </div>
                     <div className="flex gap-2 w-full md:w-auto">
                        <Button 
                          onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${t.whatsapp}`, '_blank')}
                          variant="outline"
                          className="flex-1 h-16 font-black uppercase text-[10px] border-green-200 text-green-700 rounded-2xl bg-green-50/50"
                        >
                          <Phone className="w-4 h-4 mr-2" /> WhatsApp
                        </Button>
                        <Button onClick={() => approvePayout(t.id)} className="flex-[2] bg-primary hover:bg-primary/90 font-black uppercase text-xs h-16 rounded-2xl shadow-xl">Confirmar Pagamento</Button>
                     </div>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="history" className="mt-6">
               <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white">
                  <div className="overflow-x-auto">
                     <table className="w-full text-left">
                        <thead className="bg-primary text-white text-[10px] font-black uppercase tracking-widest">
                           <tr>
                              <th className="p-8">Data</th>
                              <th className="p-8">Cliente</th>
                              <th className="p-8">Concurso</th>
                              <th className="p-8">Valor</th>
                              <th className="p-8 text-right">Status</th>
                           </tr>
                        </thead>
                        <tbody className="divide-y text-[10px] font-bold uppercase">
                           {filteredTickets.map((t, i) => (
                             <tr key={i} className="hover:bg-muted/30 transition-colors">
                                <td className="p-8 text-muted-foreground">{new Date(t.created_at).toLocaleDateString()}</td>
                                <td className="p-8 font-black text-primary">{t.cliente}</td>
                                <td className="p-8">{t.evento_nome}</td>
                                <td className="p-8">R$ {Number(t.valor_total).toFixed(2)}</td>
                                <td className="p-8 text-right">
                                   <Badge variant={t.status === 'pago' || t.status === 'premio_pago' ? 'default' : 'destructive'} className="font-black text-[8px] uppercase px-4 h-6">
                                      {t.status === 'premio_pago' ? 'PAGO' : t.status === 'pago' ? 'VENCIDO' : 'CANCELADO'}
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
    <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs text-primary animate-pulse">Conectando ao Supabase Cloud...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}

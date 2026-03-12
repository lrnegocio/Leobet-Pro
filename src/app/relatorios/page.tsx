
"use client"

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Send, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Zap,
  Trophy,
  Grid3X3,
  Search,
  Printer
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

export default function RelatoriosPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [btCharacteristic, setBtCharacteristic] = useState<any>(null);

  const loadData = async () => {
    const { data } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
    const all = data || [];
    if (user?.role === 'admin') {
      setTickets(all);
    } else if (user?.role === 'gerente') {
      setTickets(all.filter((t: any) => t.gerente_id === user?.id || t.vendedor_id === user?.id));
    } else if (user?.role === 'cambista') {
      setTickets(all.filter((t: any) => t.vendedor_id === user?.id));
    } else {
      setTickets(all.filter((t: any) => t.cliente === user?.nome || t.userId === user?.id));
    }
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setMounted(true);
    loadData();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredTickets = useMemo(() => {
    if (!startDate || !endDate) return [];
    return tickets.filter(t => {
      const date = t.created_at ? t.created_at.split('T')[0] : "";
      return date >= startDate && date <= endDate;
    });
  }, [tickets, startDate, endDate]);

  const totals = useMemo(() => {
    const bruto = filteredTickets.reduce((acc, t) => acc + (t.status === 'pago' ? Number(t.valor_total || 0) : 0), 0);
    const pendente = filteredTickets.reduce((acc, t) => acc + (t.status === 'pendente' ? Number(t.valor_total || 0) : 0), 0);
    return { bruto, pendente };
  }, [filteredTickets]);

  const handleShareValidation = (ticket: any) => {
    const link = `https://leobet-probets.vercel.app/resultados?c=${ticket.id}`;
    let statusText = ticket.status === 'pago' ? '✅ VALIDADA' : '⚠ AGUARDANDO PAGAMENTO';
    const message = `*LEOBET PRO*%0A%0A*STATUS:* ${statusText}%0A👤 *CLIENTE:* ${ticket.cliente}%0A🎟️ *CONCURSO:* ${ticket.evento_nome}%0A💰 *VALOR:* R$ ${Number(ticket.valor_total).toFixed(2)}%0A%0A*Conferir em tempo real:*%0A${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${ticket.whatsapp}&text=${message}`, '_blank');
  };

  const printReceipt = useCallback(async (receipt: any) => {
    if (!btCharacteristic) {
      toast({ variant: "destructive", title: "IMPRESSORA NÃO CONECTADA", description: "Vá ao Terminal de Vendas para parear." });
      return;
    }
    try {
      const encoder = new TextEncoder();
      let text = "\x1B\x40\x1B\x61\x01\x1B\x45\x01LEOBET PRO\x1B\x45\x00\n";
      text += "CUPOM REIMPRESSO (2 VIA)\n";
      text += "--------------------------------\n";
      text += `CLIENTE: ${receipt.cliente}\n`;
      text += `JOGO: ${receipt.evento_nome}\n`;
      text += `DATA: ${new Date(receipt.created_at).toLocaleString()}\n`;
      text += "--------------------------------\n";
      receipt.tickets_data.forEach((t: any, i: number) => {
        text += `BILHETE #${i+1}: ${t.id}\n`;
        if (t.numeros) text += `NUMEROS: ${t.numeros.join(' ')}\n`;
        text += "\n";
      });
      text += "--------------------------------\n";
      text += `VALOR TOTAL: R$ ${Number(receipt.valor_total).toFixed(2)}\n`;
      text += "\x1B\x61\x01www.leobet.pro\n";
      text += "\n\n\n\n";

      const data = encoder.encode(text);
      const chunkSize = 20;
      for (let i = 0; i < data.length; i += chunkSize) {
        await btCharacteristic.writeValue(data.slice(i, i + chunkSize));
      }
      toast({ title: "REIMPRESSO COM SUCESSO!" });
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO NA IMPRESSÃO" });
    }
  }, [btCharacteristic, toast]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Relatórios Financeiros</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mt-1">Auditoria Diária Supabase</p>
            </div>
            
            <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border items-center w-full md:w-auto">
              <Calendar className="w-4 h-4 text-primary ml-2" />
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-full md:w-32 border-none shadow-none font-bold text-xs" />
              <span className="text-muted-foreground text-[10px] font-black uppercase px-2">até</span>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-full md:w-32 border-none shadow-none font-bold text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Aprovado</p>
                 <p className="text-3xl font-black">R$ {totals.bruto.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Pendente</p>
                 <p className="text-3xl font-black">R$ {totals.pendente.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl">
               <CardContent className="p-6 flex justify-between items-center">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Volume</p><p className="text-3xl font-black">{filteredTickets.length}</p></div>
                 <FileText className="w-8 h-8 text-primary/20" />
               </CardContent>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl">
               <CardContent className="p-6 flex justify-between items-center">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Comissão</p><p className="text-3xl font-black text-green-600">R$ {(user?.commissionBalance || 0).toFixed(2)}</p></div>
                 <TrendingUp className="w-8 h-8 text-green-600/20" />
               </CardContent>
             </Card>
          </div>

          <div className="space-y-4 pb-20">
             <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase text-primary">Movimentações</h3>
               <Badge className="bg-primary text-white font-black uppercase text-[10px]">{filteredTickets.length} REGISTROS</Badge>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {filteredTickets.map((t, i) => (
                    <Card key={i} className={`p-4 hover:shadow-md border-l-8 ${t.status === 'pago' ? 'border-l-green-600' : 'border-l-orange-500'} rounded-2xl bg-white`}>
                       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex-1 w-full">
                             <div className="flex items-center gap-2">
                                <p className="font-black uppercase text-sm">{t.cliente}</p>
                                <Badge className="text-[8px] h-4 font-black uppercase">{t.tipo === 'bolao' ? 'BOLÃO' : 'BINGO'}</Badge>
                             </div>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                               {t.evento_nome} • {new Date(t.created_at).toLocaleString()}
                             </p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
                             <p className="text-lg font-black text-primary mr-4">R$ {Number(t.valor_total).toFixed(2)}</p>
                             <div className="flex gap-1">
                               <Button onClick={() => printReceipt(t)} size="icon" variant="outline" className="h-10 w-10 border-primary/20 hover:bg-primary/10 rounded-xl">
                                 <Printer className="w-4 h-4 text-primary" />
                               </Button>
                               <Button onClick={() => handleShareValidation(t)} className="bg-green-600 hover:bg-green-700 h-10 gap-2 font-black uppercase text-[10px] rounded-xl">
                                 <Send className="w-3.5 h-3.5" /> WhatsApp
                               </Button>
                             </div>
                          </div>
                       </div>
                    </Card>
                ))}
                {filteredTickets.length === 0 && (
                  <div className="py-20 text-center opacity-20 font-black uppercase text-xs flex flex-col items-center gap-4">
                    <Search className="w-12 h-12" />
                    Nenhuma venda encontrada para o período.
                  </div>
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

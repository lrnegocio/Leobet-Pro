
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
  TrendingUp, 
  Search, 
  Printer,
  RefreshCcw
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
  const [loading, setLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
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
    setLoading(false);
  };

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
    setMounted(true);
    loadData();
  }, [user]);

  const filteredTickets = useMemo(() => {
    if (!startDate || !endDate) return [];
    return tickets.filter(t => {
      const date = t.created_at ? t.created_at.split('T')[0] : "";
      return date >= startDate && date <= endDate;
    });
  }, [tickets, startDate, endDate]);

  const totals = useMemo(() => {
    const bruto = filteredTickets.reduce((acc, t) => acc + (['pago', 'ganhou', 'premio_pago'].includes(t.status) ? Number(t.valor_total || 0) : 0), 0);
    const pendente = filteredTickets.reduce((acc, t) => acc + (t.status === 'pendente' ? Number(t.valor_total || 0) : 0), 0);
    return { bruto, pendente };
  }, [filteredTickets]);

  const handleShareValidation = (ticket: any) => {
    const savedSettings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    const systemUrl = savedSettings.systemUrl || 'https://leobet-probets.vercel.app/';
    const youtubeUrl = savedSettings.youtubeUrl || '';
    
    const link = `${systemUrl}/resultados?c=${ticket.id}`;
    let statusText = ['pago', 'ganhou', 'premio_pago'].includes(ticket.status) ? '✅ VALIDADA' : '⚠ AGUARDANDO PAGAMENTO';
    
    let prizeMsg = "";
    if (ticket.tipo === 'bingo' && ticket.detalhe_premios) {
      prizeMsg = `🔥 *PRÊMIOS:*%0ABingo: R$ ${ticket.detalhe_premios.bingo.toFixed(2)}%0AQuina: R$ ${ticket.detalhe_premios.quina.toFixed(2)}%0AQuadra: R$ ${ticket.detalhe_premios.quadra.toFixed(2)}`;
    } else if (ticket.detalhe_premios) {
      prizeMsg = `🔥 *ACUMULADO:* R$ ${ticket.detalhe_premios.bolao.toFixed(2)}`;
    }

    const message = `*LEOBET PRO*%0A%0A*STATUS:* ${statusText}%0A👤 *CLIENTE:* ${ticket.cliente}%0A🎟️ *CONCURSO:* ${ticket.evento_nome}%0A💰 *VALOR:* R$ ${Number(ticket.valor_total).toFixed(2)}%0A%0A${prizeMsg}%0A%0A📺 *SORTEIO:* ${youtubeUrl}%0A%0A*Conferir em tempo real:*%0A${link}%0A%0A📊 *CÓDIGO:* ${ticket.barcode}`;
    window.open(`https://api.whatsapp.com/send?phone=55${ticket.whatsapp}&text=${message}`, '_blank');
  };

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
              <Button onClick={loadData} variant="ghost" size="icon" className="h-9 w-9"><RefreshCcw className={cn("w-4 h-4", loading && "animate-spin")} /></Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Vendas Pagas</p>
                 <p className="text-3xl font-black">R$ {totals.bruto.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Aguardando Pagamento</p>
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
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Minha Comissão</p><p className="text-3xl font-black text-green-600">R$ {(user?.commissionBalance || 0).toFixed(2)}</p></div>
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
                    <Card key={i} className={`p-4 hover:shadow-md border-l-8 ${['pago', 'ganhou', 'premio_pago'].includes(t.status) ? 'border-l-green-600' : 'border-l-orange-500'} rounded-2xl bg-white`}>
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
                               <Button variant="outline" size="icon" className="h-10 w-10 border-primary/20 hover:bg-primary/10 rounded-xl" onClick={() => window.print()}>
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
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

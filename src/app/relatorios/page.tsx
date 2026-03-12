
'use client';

import React, { useState, useEffect, useMemo } from 'react';
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
  Printer,
  RefreshCcw,
  Eraser,
  Trophy,
  ArrowRight
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function RelatoriosPage() {
  const { user } = useAuthStore();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [mounted, setMounted] = useState(false);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    const today = new Date().toISOString().split('T')[0];
    setStartDate(today);
    setEndDate(today);
  }, []);

  const loadData = async () => {
    if (!mounted || !user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase.from('tickets').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      
      const all = data || [];
      if (user.role === 'admin') {
        setTickets(all);
      } else if (user.role === 'gerente') {
        setTickets(all.filter((t: any) => t.gerente_id === user.id || t.vendedor_id === user.id));
      } else if (user.role === 'cambista') {
        setTickets(all.filter((t: any) => t.vendedor_id === user.id));
      } else {
        setTickets(all.filter((t: any) => t.cliente === user.nome || t.vendedor_id === user.id));
      }
    } catch (err) {
      console.error("Erro ao carregar relatórios:", err);
      toast({ variant: "destructive", title: "Erro de Sincronização", description: "Verifique sua conexão com o Supabase." });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted && user) {
      loadData();
    }
  }, [mounted, user]);

  const filteredTickets = useMemo(() => {
    if (!startDate || !endDate || !tickets) return [];
    return tickets.filter(t => {
      const date = t.created_at ? t.created_at.split('T')[0] : "";
      return date >= startDate && date <= endDate;
    });
  }, [tickets, startDate, endDate]);

  const totals = useMemo(() => {
    if (!filteredTickets) return { bruto: 0, pendente: 0, ganhos: 0 };
    const bruto = filteredTickets.reduce((acc, t) => acc + (['pago', 'ganhou', 'premio_pago'].includes(t.status) ? Number(t.valor_total || 0) : 0), 0);
    const pendente = filteredTickets.reduce((acc, t) => acc + (t.status === 'pendente' ? Number(t.valor_total || 0) : 0), 0);
    const ganhos = filteredTickets.filter(t => t.status === 'ganhou' || t.status === 'premio_pago').length;
    return { bruto, pendente, ganhos };
  }, [filteredTickets]);

  const handleShareValidation = (ticket: any) => {
    const savedSettings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    const systemUrl = savedSettings.systemUrl || 'https://leobet-probets.vercel.app';
    const youtubeUrl = savedSettings.youtubeUrl || '';
    
    const link = `${systemUrl}/resultados?c=${ticket.id}`;
    let statusText = ['pago', 'ganhou', 'premio_pago'].includes(ticket.status) ? '✅ APOSTA VALIDADA' : '⚠ AGUARDANDO PAGAMENTO';
    
    let prizeMsg = "";
    if (ticket.tipo === 'bingo' && ticket.detalhe_premios) {
      prizeMsg = `🔥 *PRÊMIOS:*%0ABingo: R$ ${ticket.detalhe_premios.bingo?.toFixed(2) || '0.00'}%0AQuina: R$ ${ticket.detalhe_premios.quina?.toFixed(2) || '0.00'}%0AQuadra: R$ ${ticket.detalhe_premios.quadra?.toFixed(2) || '0.00'}`;
    } else if (ticket.detalhe_premios) {
      prizeMsg = `🔥 *ACUMULADO:* R$ ${ticket.detalhe_premios.bolao?.toFixed(2) || '0.00'}`;
    }

    const message = `*LEOBET PRO*%0A%0A*STATUS:* ${statusText}%0A👤 *CLIENTE:* ${ticket.cliente}%0A🎟️ *CONCURSO:* ${ticket.evento_nome}%0A💰 *VALOR:* R$ ${Number(ticket.valor_total).toFixed(2)}%0A%0A${prizeMsg}%0A%0A📺 *SORTEIO:* ${youtubeUrl}%0A%0A*Conferir Auditoria:*%0A${link}%0A%0A📊 *CÓDIGO:* ${ticket.barcode}`;
    window.open(`https://api.whatsapp.com/send?phone=55${ticket.whatsapp}&text=${message}`, '_blank');
  };

  if (!mounted || !user) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Relatórios de Rede</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mt-1">Sincronização Cloud Supabase</p>
            </div>
            
            <div className="flex flex-wrap gap-2 w-full md:w-auto">
              <div className="flex gap-2 bg-white p-2 rounded-2xl shadow-sm border items-center flex-1 md:flex-none">
                <Calendar className="w-4 h-4 text-primary ml-2" />
                <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
                <span className="text-muted-foreground text-[10px] font-black uppercase px-2">até</span>
                <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-10 w-full md:w-32 border-none shadow-none font-bold text-xs" />
              </div>
              <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 hover:bg-primary transition-all group">
                <RefreshCcw className={cn("w-5 h-5 group-hover:text-white", loading && "animate-spin")} />
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Vendas Liquidadas</p>
                 <p className="text-3xl font-black">R$ {totals.bruto.toFixed(2)}</p>
             </Card>
             <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Vendas Pendentes</p>
                 <p className="text-3xl font-black">R$ {totals.pendente.toFixed(2)}</p>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex justify-between items-center">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Volume de Apostas</p><p className="text-3xl font-black">{filteredTickets.length}</p></div>
                 <FileText className="w-8 h-8 text-primary/20" />
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex justify-between items-center">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Minha Comissão</p><p className="text-3xl font-black text-green-600">R$ {(user?.commissionBalance || 0).toFixed(2)}</p></div>
                 <TrendingUp className="w-8 h-8 text-green-600/20" />
             </Card>
          </div>

          <div className="space-y-4 pb-20">
             <div className="flex justify-between items-center px-2">
               <h3 className="text-sm font-black uppercase text-primary">Detalhamento de Movimentações</h3>
               <Badge className="bg-primary text-white font-black uppercase text-[10px] h-7 px-4">{filteredTickets.length} Registros</Badge>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {filteredTickets.length === 0 ? (
                   <Card className="py-20 text-center border-dashed opacity-30 rounded-3xl bg-white">
                      <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="font-black uppercase text-xs">Sem registros para o período selecionado</p>
                   </Card>
                ) : filteredTickets.map((t, i) => (
                    <Card key={i} className={cn(
                        "p-5 hover:shadow-md border-l-8 rounded-2xl bg-white transition-all",
                        ['pago', 'ganhou', 'premio_pago'].includes(t.status) ? 'border-l-green-600' : 'border-l-orange-500'
                    )}>
                       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex-1 w-full text-center md:text-left">
                             <div className="flex items-center gap-2 justify-center md:justify-start">
                                <p className="font-black uppercase text-base text-primary">{t.cliente}</p>
                                <Badge variant="outline" className="text-[8px] h-5 font-black uppercase border-2">{t.tipo === 'bolao' ? 'BOLÃO' : 'BINGO'}</Badge>
                             </div>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                               {t.evento_nome} • {t.created_at ? new Date(t.created_at).toLocaleString('pt-BR') : '---'}
                             </p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 w-full md:w-auto justify-between md:justify-end">
                             <p className="text-xl font-black text-primary mr-4">R$ {Number(t.valor_total).toFixed(2)}</p>
                             <div className="flex gap-2">
                               <Button variant="outline" size="icon" className="h-12 w-12 border-2 rounded-xl" onClick={() => window.print()}>
                                 <Printer className="w-5 h-5 text-primary" />
                               </Button>
                               <Button onClick={() => handleShareValidation(t)} className="bg-green-600 hover:bg-green-700 text-white h-12 gap-2 font-black uppercase text-[10px] px-6 rounded-xl shadow-lg">
                                 <Send className="w-4 h-4" /> WhatsApp
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

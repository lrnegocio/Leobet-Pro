'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card } from '@/components/ui/card';
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
  Trash2,
  Database,
  Download,
  ShieldCheck
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
      } else {
        setTickets(all.filter((t: any) => t.vendedor_id === user.id || t.cliente === user.nome));
      }
    } catch (err: any) {
      console.error("Erro Relatórios:", err.message || err);
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
    const bruto = filteredTickets.reduce((acc, t) => acc + (['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(t.status) ? Number(t.valor_total || 0) : 0), 0);
    const pendente = filteredTickets.reduce((acc, t) => acc + (t.status === 'pendente' ? Number(t.valor_total || 0) : 0), 0);
    const ganhos = filteredTickets.filter(t => t.status === 'ganhou' || t.status === 'premio_pago' || t.status === 'pendente-resgate').length;
    return { bruto, pendente, ganhos };
  }, [filteredTickets]);

  const handleShareValidation = (ticket: any) => {
    const link = `${window.location.origin}/resultados?c=${ticket.id}`;
    let statusText = ['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(ticket.status) ? '✅ VALIDADO' : '⚠ PENDENTE';
    
    const message = `*LEOBET PRO*%0A%0A*STATUS:* ${statusText}%0A👤 *CLIENTE:* ${ticket.cliente}%0A🎟️ *CONCURSO:* ${ticket.evento_nome}%0A💰 *VALOR:* R$ ${Number(ticket.valor_total).toFixed(2)}%0A%0A*Conferir Auditoria:*%0A${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${ticket.whatsapp}&text=${message}`, '_blank');
  };

  const handleDeleteTicket = async (id: string) => {
    if (!confirm("TEM CERTEZA? Esta aposta será excluída permanentemente do Supabase.")) return;
    
    try {
      const { error } = await supabase.from('tickets').delete().eq('id', id);
      if (error) throw error;
      toast({ title: "APOSTA EXCLUÍDA!" });
      loadData();
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO AO EXCLUIR", description: err.message });
    }
  };

  const handleExportPDF = () => {
    window.print();
  };

  if (!mounted || !user) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <div className="print:hidden">
        <SidebarNav />
      </div>
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8 print:p-0 print:pt-0">
        <div className="max-w-7xl mx-auto space-y-8">
          
          {/* CABEÇALHO EXCLUSIVO PARA IMPRESSÃO */}
          <div className="hidden print:block border-b-4 border-primary pb-4 mb-8">
            <div className="flex justify-between items-end">
              <div>
                <h1 className="text-4xl font-black uppercase text-primary">RELATÓRIO DE AUDITORIA</h1>
                <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">LEOBET PRO - Sistema Profissional de Apostas</p>
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase">Data do Relatório</p>
                <p className="text-lg font-black">{new Date().toLocaleDateString('pt-BR')}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-4 text-[10px] font-bold uppercase bg-muted/30 p-2 rounded">
              <p>Período: {new Date(startDate).toLocaleDateString()} até {new Date(endDate).toLocaleDateString()}</p>
              <p className="text-right">Exportado por: {user.nome}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 print:hidden">
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
              
              <div className="flex gap-2">
                <Button onClick={handleExportPDF} variant="outline" className="h-14 gap-2 font-black uppercase text-xs rounded-2xl border-2 hover:bg-primary hover:text-white transition-all">
                  <Download className="w-4 h-4" /> Exportar PDF
                </Button>
                <Button onClick={loadData} variant="outline" className="h-14 w-14 rounded-2xl border-2 transition-all">
                  <RefreshCcw className={cn("w-5 h-5", loading && "animate-spin")} />
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl p-6 print:shadow-none print:border print:text-black print:bg-white">
                 <p className="text-[10px] font-black uppercase opacity-60 print:opacity-100">Vendas Liquidadas</p>
                 <p className="text-3xl font-black">R$ {totals.bruto.toFixed(2)}</p>
             </Card>
             <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl p-6 print:shadow-none print:border print:text-black print:bg-white">
                 <p className="text-[10px] font-black uppercase opacity-60 print:opacity-100">Vendas Pendentes</p>
                 <p className="text-3xl font-black">R$ {totals.pendente.toFixed(2)}</p>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex justify-between items-center print:border print:shadow-none">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Volume de Apostas</p><p className="text-3xl font-black">{filteredTickets.length}</p></div>
                 <FileText className="w-8 h-8 text-primary/20 print:hidden" />
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl p-6 flex justify-between items-center print:border print:shadow-none">
                 <div><p className="text-[10px] font-black uppercase text-muted-foreground">Minha Comissão</p><p className="text-3xl font-black text-green-600">R$ {(user?.commissionBalance || 0).toFixed(2)}</p></div>
                 <TrendingUp className="w-8 h-8 text-green-600/20 print:hidden" />
             </Card>
          </div>

          <div className="space-y-4 pb-20">
             <div className="grid grid-cols-1 gap-3">
                {filteredTickets.length === 0 ? (
                   <Card className="py-20 text-center border-dashed opacity-30 rounded-3xl bg-white print:border-none">
                      <p className="font-black uppercase text-xs">Sem registros para o período</p>
                   </Card>
                ) : filteredTickets.map((t, i) => (
                    <Card key={i} className={cn(
                        "p-5 hover:shadow-md border-l-8 rounded-2xl bg-white transition-all print:shadow-none print:border print:mb-2",
                        ['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(t.status) ? 'border-l-green-600' : 'border-l-orange-500'
                    )}>
                       <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                          <div className="flex-1 w-full text-center md:text-left">
                             <div className="flex items-center gap-2 justify-center md:justify-start">
                                <p className="font-black uppercase text-base text-primary print:text-black">{t.cliente}</p>
                                <Badge variant="outline" className="text-[8px] h-5 font-black uppercase">{t.tipo}</Badge>
                                <span className="hidden print:inline text-[8px] font-black text-muted-foreground ml-2">COD: {t.id}</span>
                             </div>
                             <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">{t.evento_nome} • {new Date(t.created_at).toLocaleString()}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                             <p className="text-xl font-black text-primary mr-4 print:text-black">R$ {Number(t.valor_total).toFixed(2)}</p>
                             <div className="flex gap-2 print:hidden">
                               {user?.role === 'admin' && (
                                 <Button variant="ghost" size="icon" onClick={() => handleDeleteTicket(t.id)} className="h-12 w-12 text-destructive hover:bg-destructive/10 rounded-xl border border-destructive/20">
                                   <Trash2 className="w-5 h-5" />
                                 </Button>
                               )}
                               <Button variant="outline" size="icon" className="h-12 w-12 border-2 rounded-xl" onClick={() => window.print()}>
                                 <Printer className="w-5 h-5 text-primary" />
                               </Button>
                               <Button onClick={() => handleShareValidation(t)} className="bg-green-600 hover:bg-green-700 text-white h-12 gap-2 font-black uppercase text-[10px] px-6 rounded-xl">
                                 <Send className="w-4 h-4" /> WhatsApp
                               </Button>
                             </div>
                             {/* STATUS VISÍVEL NO PDF */}
                             <div className="hidden print:block">
                                <Badge variant="outline" className="font-black uppercase text-[8px]">{t.status}</Badge>
                             </div>
                          </div>
                       </div>
                    </Card>
                ))}
             </div>
          </div>

          {/* RODAPÉ EXCLUSIVO PARA IMPRESSÃO */}
          <div className="hidden print:flex justify-between items-center border-t pt-4 mt-8 opacity-50">
             <p className="text-[8px] font-black uppercase">© LEOBET PRO - Sistema Auditado 365 Dias</p>
             <p className="text-[8px] font-black uppercase">Página 1 de 1</p>
          </div>
        </div>
      </main>
    </div>
  );
}

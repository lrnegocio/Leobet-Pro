'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2, Trophy, Clock, CheckCircle2, Database, XCircle, LayoutGrid, Printer, Info, Wallet } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';

function ResultadosContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuthStore();
  
  const [code, setCode] = useState('');
  const [receipt, setReceipt] = useState<any>(null);
  const [eventData, setEventData] = useState<any>(null);
  const [eventPool, setEventPool] = useState(0);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const handleSearch = async (searchCode?: string) => {
    const codeToSearch = (searchCode || code).trim().toUpperCase();
    if (codeToSearch.length < 3) return;
    setLoading(true);
    try {
      const { data: found } = await supabase.from('tickets').select('*').eq('id', codeToSearch).maybeSingle();
      if (found) {
        setReceipt(found);
        const table = found.tipo === 'bingo' ? 'bingos' : 'boloes';
        const { data: ev } = await supabase.from(table).select('*').eq('id', found.evento_id).single();
        setEventData(ev);

        // Busca todos os tickets para calcular o pool real (Arrecadação - Comissões)
        const { data: allTickets } = await supabase
          .from('tickets')
          .select('valor_total, vendedor_id')
          .eq('evento_id', found.evento_id)
          .in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
        
        // Busca todos os vendedores para saber as taxas de comissão
        const { data: sellers } = await supabase.from('users').select('id, commission_rate, gerente_id');
        
        let totalComissoes = 0;
        let totalArrecadado = 0;

        allTickets?.forEach(t => {
          const valor = Number(t.valor_total) || 0;
          totalArrecadado += valor;
          const seller = sellers?.find(s => s.id === t.vendedor_id);
          const rate = Number(seller?.commission_rate || 0) / 100;
          const gRate = seller?.gerente_id ? 0.05 : 0; // Taxa de gerente fixa em 5%
          totalComissoes += (valor * (rate + gRate));
        });

        // Prêmio final é o que sobra após pagar comissões
        setEventPool(Math.max(0, totalArrecadado - totalComissoes));

      } else {
        setReceipt(null); toast({ variant: "destructive", title: "NÃO ENCONTRADO" });
      }
    } catch (err: any) { toast({ variant: "destructive", title: "ERRO DE CONEXÃO" }); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    if (mounted) {
      const ticketCode = searchParams.get('c');
      if (ticketCode) { setCode(ticketCode); handleSearch(ticketCode); }
    }
  }, [searchParams, mounted]);

  const statsGanhos = useMemo(() => {
    if (!receipt || !receipt.tickets_data) return { total: 0, count: 0 };
    const winners = receipt.tickets_data.filter((t: any) => t.status === 'ganhou');
    const total = winners.reduce((acc: number, t: any) => acc + Number(t.valorPremio || 0), 0);
    return { total, count: winners.length };
  }, [receipt]);

  const getTicketStats = (t: any) => {
    if (!eventData) return null;
    const isLottery = eventData.tipo === 'mega' || eventData.tipo === 'quina';
    const drawn = eventData.tipo === 'bingo' ? eventData.bolas_sorteadas : (isLottery ? eventData.drawn_numbers : null);
    
    if (isLottery) {
      const chosen = t.n || [];
      const hits = chosen.filter((n: number) => drawn?.includes(n)).length;
      return { hits, total: eventData.tipo === 'mega' ? 15 : 20 };
    } else if (eventData.tipo === 'esportivo' || eventData.tipo === 'bolao') {
      const results = eventData.partidas?.map((p: any, i: number) => {
        const s = eventData.scores?.[i];
        if (s && s.p1 !== '' && s.p2 !== '') {
          const p1 = parseInt(s.p1); const p2 = parseInt(s.p2);
          if (p1 > p2) return p.time1; if (p1 < p2) return p.time2; return 'X';
        }
        return null;
      });
      const guesses = t.p?.split('-') || [];
      const hits = guesses.filter((g: string, i: number) => g === results?.[i]).length;
      return { hits, total: eventData.partidas?.length || 10 };
    }
    return null;
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-2 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-6">
        <Button onClick={() => router.push(user ? `/${user.role}/dashboard` : '/')} variant="outline" className="h-11 rounded-xl border-2 font-black uppercase text-[10px] print:hidden">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar
        </Button>
        <h1 className="text-4xl md:text-6xl font-black uppercase text-primary text-center print:hidden">Auditoria Digital</h1>
        
        <Card className="rounded-[2.5rem] shadow-2xl bg-white p-6 md:p-12 print:shadow-none print:border-none print:p-0">
          <div className="flex gap-2 mb-8 print:hidden">
            <input placeholder="CÓDIGO DO BILHETE" className="w-full h-16 font-black text-center text-2xl border-2 rounded-3xl uppercase" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <Button onClick={() => handleSearch()} className="h-16 bg-primary px-8 rounded-3xl shadow-xl">{loading ? <Loader2 className="animate-spin" /> : <Search />}</Button>
          </div>

          {receipt && (
            <div className="space-y-6">
              <div className="bg-primary p-6 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-lg">
                 <div className="flex items-center gap-3">
                    <Wallet className="w-8 h-8 text-accent" />
                    <div>
                       <p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado (Total Líquido)</p>
                       <p className="text-3xl font-black">R$ {eventPool.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                    </div>
                 </div>
                 <Badge className="bg-accent text-white font-black uppercase text-[9px] h-8 px-4">Auditado Live</Badge>
              </div>

              {statsGanhos.total > 0 && (
                <div className="p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl bg-green-600 print:bg-white print:text-black print:border-2 print:border-green-600">
                  <div><p className="text-[10px] font-black uppercase opacity-60 print:opacity-100">Meu Prêmio Total</p><p className="text-4xl font-black">R$ {statsGanhos.total.toFixed(2)}</p></div>
                  <Badge className="bg-white text-green-700 h-10 px-8 font-black uppercase text-[10px] rounded-xl flex items-center justify-center">PREMIADO</Badge>
                </div>
              )}

              <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10">
                <div className="flex justify-between items-start mb-6">
                  <div><p className="text-[10px] font-black uppercase">Apostador: {receipt.cliente}</p><p className="text-xl font-black text-primary uppercase">{receipt.evento_nome}</p></div>
                  <Button onClick={() => window.print()} variant="outline" size="icon" className="h-12 w-12 rounded-xl border-2 print:hidden"><Printer className="w-5 h-5" /></Button>
                </div>

                {eventData && (
                  <div className="mb-6 p-4 bg-white border-2 border-dashed rounded-2xl">
                    <p className="text-[9px] font-black uppercase text-primary flex items-center gap-1 mb-2"><Info className="w-3 h-3" /> Regras do Jogo:</p>
                    <p className="text-[10px] font-bold text-muted-foreground whitespace-pre-line">{eventData.regras || 'Rateio automático auditado via Cloud.'}</p>
                  </div>
                )}
                
                <div className="space-y-4">
                  {receipt.tickets_data?.map((t: any, idx: number) => {
                    const stats = getTicketStats(t);
                    const isWinner = t.status === 'ganhou';
                    return (
                      <div key={idx} className={cn("p-6 rounded-2xl border-2 bg-white", isWinner ? "border-green-400 scale-[1.02] shadow-md" : "border-muted")}>
                        <div className="flex justify-between items-start mb-4">
                          <div><p className="text-[10px] font-black uppercase">Bilhete #{idx+1}</p>
                          {stats && <Badge className="mt-1 font-black bg-primary">{stats.hits} ACERTOS DE {stats.total}</Badge>}</div>
                          {isWinner && <p className="font-black text-xl text-green-600">R$ {Number(t.valorPremio || 0).toFixed(2)}</p>}
                        </div>
                        {t.n && (
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                            {t.n.map((n: number) => {
                              const isDrawn = eventData?.tipo === 'bingo' ? eventData.bolas_sorteadas?.includes(n) : eventData?.drawn_numbers?.includes(n);
                              return (<div key={n} className={cn("h-8 flex items-center justify-center rounded-lg text-xs font-black border", isDrawn ? "bg-green-600 text-white" : "bg-muted/30 text-muted-foreground/40")}>{n < 10 ? `0${n}` : n}</div>);
                            })}
                          </div>
                        )}
                        {(eventData?.tipo === 'esportivo' || eventData?.tipo === 'bolao') && t.p && (
                          <div className="p-3 bg-muted/10 rounded-xl">
                             <p className="text-[9px] font-black uppercase mb-1">Meus Palpites:</p>
                             <p className="text-[10px] font-bold font-mono tracking-tighter">{t.p}</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs">Carregando...</div>}><ResultadosContent /></Suspense>;
}

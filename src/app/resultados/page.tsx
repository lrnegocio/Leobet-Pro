
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2, Trophy, Clock, CheckCircle2, Database, XCircle, LayoutGrid } from 'lucide-react';
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
      } else {
        setReceipt(null); toast({ variant: "destructive", title: "BILHETE NÃO ENCONTRADO" });
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
    const winners = receipt.tickets_data.filter((t: any) => (t.s || t.status) === 'ganhou');
    const total = winners.reduce((acc: number, t: any) => acc + (Number(t.v || t.vp || 0)), 0);
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
    } else if (eventData.tipo === 'esportivo') {
      const results = eventData.partidas?.map((p: any, i: number) => {
        const s = eventData.scores?.[i];
        if (s && s.p1 !== '' && s.p2 !== '') {
          const p1 = parseInt(s.p1); const p2 = parseInt(s.p2);
          if (p1 > p2) return p.time1; if (p1 < p2) return p.time2; return 'X';
        }
        return null;
      });
      const guesses = (t.p || t.palpites)?.split('-') || [];
      const hits = guesses.filter((g: string, i: number) => g === results?.[i]).length;
      return { hits, total: eventData.partidas?.length || 10 };
    }
    return null;
  };

  const handleRequestPayout = async () => {
    if (!receipt) return;
    setLoading(true);
    try {
      const { error } = await supabase.from('tickets').update({ status: 'pendente-resgate' }).eq('id', receipt.id);
      if (error) throw error;
      toast({ title: "RESGATE SOLICITADO!", description: "O Admin validará seu PIX em instantes." });
      handleSearch(receipt.id);
    } catch (e) { toast({ variant: "destructive", title: "ERRO AO SOLICITAR" }); }
    finally { setLoading(false); }
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-2 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-6">
        <Button onClick={() => user ? router.push(`/${user.role}/dashboard`) : router.push('/')} variant="outline" className="h-11 rounded-xl border-2 font-black uppercase text-[10px]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Painel
        </Button>
        <h1 className="text-4xl md:text-6xl font-black uppercase text-primary text-center">Auditoria Digital</h1>
        
        <Card className="rounded-[2.5rem] shadow-2xl bg-white p-6 md:p-12">
          <div className="flex gap-2 mb-8">
            <input placeholder="CÓDIGO DO BILHETE" className="w-full h-16 font-black text-center text-2xl border-2 rounded-3xl uppercase" value={code} onChange={e => setCode(e.target.value.toUpperCase())} />
            <Button onClick={() => handleSearch()} className="h-16 bg-primary px-8 rounded-3xl shadow-xl">{loading ? <Loader2 className="animate-spin" /> : <Search />}</Button>
          </div>

          {receipt && (
            <div className="space-y-6">
              {statsGanhos.total > 0 && (
                <div className="p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl bg-green-600">
                  <div><p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado</p><p className="text-4xl font-black">R$ {statsGanhos.total.toFixed(2)}</p></div>
                  <div className="flex flex-col gap-2 w-full md:w-auto">
                    <Badge className="bg-white text-green-700 h-10 px-8 font-black uppercase text-[10px] rounded-xl flex items-center justify-center">BILHETE PREMIADO</Badge>
                    {receipt.status === 'ganhou' ? (
                      <Button onClick={handleRequestPayout} className="bg-accent text-white h-14 px-8 font-black uppercase text-sm rounded-xl shadow-lg border-2 border-white/20">RESGATAR PRÊMIO VIA PIX</Button>
                    ) : (
                      <Badge className="bg-white/20 text-white h-10 px-8 font-black uppercase text-[10px] rounded-xl flex items-center justify-center">AGUARDANDO PAGAMENTO</Badge>
                    )}
                  </div>
                </div>
              )}

              <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Apostador</p><p className="text-xl font-black text-primary uppercase">{receipt.cliente}</p></div>
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Concurso</p><p className="text-xl font-black text-primary uppercase">{receipt.evento_nome}</p></div>
                </div>
                
                <div className="space-y-4">
                  {receipt.tickets_data?.map((t: any, idx: number) => {
                    const stats = getTicketStats(t);
                    const isWinner = (t.s || t.status) === 'ganhou';
                    return (
                      <div key={idx} className={cn("p-6 rounded-2xl border-2 bg-white", isWinner ? "border-green-400 scale-[1.02] shadow-md" : "border-muted")}>
                        <div className="flex justify-between items-start mb-4">
                          <div><p className="text-[10px] font-black text-muted-foreground uppercase">Bilhete #{idx+1}</p>
                          {stats && <Badge className="mt-1 font-black bg-primary">{stats.hits} ACERTOS DE {stats.total}</Badge>}</div>
                          {isWinner && <p className="font-black text-xl text-green-600">R$ {Number(t.v || 0).toFixed(2)}</p>}
                        </div>

                        {t.n && (
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1">
                            {t.n.map((n: number) => {
                              const isDrawn = eventData?.tipo === 'bingo' 
                                ? eventData.bolas_sorteadas?.includes(n)
                                : eventData?.drawn_numbers?.includes(n);
                              return (
                                <div key={n} className={cn(
                                  "h-8 flex items-center justify-center rounded-lg text-xs font-black border",
                                  isDrawn ? "bg-green-600 text-white shadow-sm" : "bg-muted/30 text-muted-foreground/40"
                                )}>{n < 10 ? `0${n}` : n}</div>
                              );
                            })}
                          </div>
                        )}

                        {t.p && eventData?.tipo === 'esportivo' && (
                          <div className="mt-4 space-y-1">
                             {t.p.split('-').map((palpite: string, pIdx: number) => {
                               const match = eventData.partidas?.[pIdx];
                               const score = eventData.scores?.[pIdx];
                               let result = null;
                               if (score && score.p1 !== '' && score.p2 !== '') {
                                 const p1 = parseInt(score.p1); const p2 = parseInt(score.p2);
                                 if (p1 > p2) result = match.time1; else if (p1 < p2) result = match.time2; else result = 'X';
                               }
                               const isCorrect = palpite === result;
                               return (
                                 <div key={pIdx} className="flex justify-between items-center text-[10px] border-b pb-1">
                                    <span className="font-bold uppercase">{match.time1} x {match.time2}</span>
                                    <Badge variant={isCorrect ? 'default' : 'outline'} className={cn("text-[8px] h-4", isCorrect && "bg-green-600")}>{palpite === 'X' ? 'EMPATE' : palpite}</Badge>
                                 </div>
                               );
                             })}
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

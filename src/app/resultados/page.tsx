
'use client';

import React, { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Search, ArrowLeft, Loader2, Trophy, Clock, CheckCircle2, Database, XCircle, AlertCircle } from 'lucide-react';
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
  const [claiming, setClaiming] = useState(false);
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
        // Busca os dados do evento (bingo ou bolao) para comparar resultados
        const table = found.tipo === 'bingo' ? 'bingos' : 'boloes';
        const { data: ev } = await supabase.from(table).select('*').eq('id', found.evento_id).single();
        setEventData(ev);
      } else {
        setReceipt(null);
        setEventData(null);
        toast({ variant: "destructive", title: "BILHETE NÃO ENCONTRADO" });
      }
    } catch (err: any) {
      toast({ variant: "destructive", title: "ERRO DE CONEXÃO" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (mounted) {
      const ticketCode = searchParams.get('c');
      if (ticketCode) { setCode(ticketCode); handleSearch(ticketCode); }
    }
  }, [searchParams, mounted]);

  const statsGanhos = useMemo(() => {
    if (!receipt || !receipt.tickets_data) return { total: 0, count: 0, hasPending: false, isPaid: false };
    
    const winners = receipt.tickets_data.filter((t: any) => (t.s || t.status) === 'ganhou');
    const total = winners.reduce((acc: number, t: any) => acc + (Number(t.v || t.vp || t.valor_premio || t.valorPremio || 0)), 0);
    
    return { 
      total, 
      count: winners.length, 
      hasPending: total > 0 && receipt.status !== 'pendente-resgate' && receipt.status !== 'premio_pago',
      isPaid: receipt.status === 'premio_pago'
    };
  }, [receipt]);

  const handleClaimAll = async () => {
    if (!receipt || statsGanhos.total <= 0) return;
    setClaiming(true);
    try {
      const { error } = await supabase.from('tickets').update({ status: 'pendente-resgate' }).eq('id', receipt.id);
      if (error) throw error;
      toast({ title: "RESGATE SOLICITADO!", description: `Valor de R$ ${statsGanhos.total.toFixed(2)} enviado para auditoria.` });
      handleSearch(receipt.id);
    } catch (err: any) {
      toast({ variant: "destructive", title: "FALHA NO RESGATE" });
    } finally {
      setClaiming(false);
    }
  };

  const handleGoBack = () => {
    if (user) {
      const path = user.role === 'admin' ? '/admin/dashboard' : `/${user.role}/dashboard`;
      router.push(path);
    } else {
      router.push('/');
    }
  };

  const calculateBolaoHits = (guessesStr: string) => {
    if (!eventData || !eventData.partidas || !eventData.scores) return { hits: 0, total: 0, isFinished: false };
    const guesses = guessesStr.split('-');
    let hits = 0;
    const scores = eventData.scores;
    const isFinished = eventData.status === 'finalizado';

    eventData.partidas.forEach((p: any, i: number) => {
      const s = scores[i];
      if (s && s.p1 !== '' && s.p2 !== '') {
        const p1 = parseInt(s.p1);
        const p2 = parseInt(s.p2);
        let winner = 'X';
        if (p1 > p2) winner = p.time1;
        else if (p1 < p2) winner = p.time2;
        
        if (guesses[i] === winner) hits++;
      }
    });

    return { hits, total: eventData.partidas.length, isFinished };
  };

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-muted/30 p-2 md:p-8 flex flex-col items-center font-body">
      <div className="max-w-4xl w-full space-y-6">
        <Button onClick={handleGoBack} variant="outline" className="h-11 px-5 rounded-xl border-2 font-black uppercase text-[10px]">
          <ArrowLeft className="w-4 h-4 mr-2" /> Voltar ao Painel
        </Button>
        <h1 className="text-4xl md:text-6xl font-black uppercase text-primary text-center">Auditoria Digital</h1>
        
        <Card className="rounded-[2.5rem] shadow-2xl bg-white p-6 md:p-12">
          <div className="flex gap-2 mb-8">
            <input 
              placeholder="CÓDIGO DO BILHETE" 
              className="w-full h-16 font-black text-center text-2xl border-2 rounded-3xl uppercase" 
              value={code} 
              onChange={e => setCode(e.target.value.toUpperCase())} 
            />
            <Button onClick={() => handleSearch()} className="h-16 bg-primary px-8 rounded-3xl shadow-xl">
              {loading ? <Loader2 className="animate-spin" /> : <Search />}
            </Button>
          </div>

          {receipt && (
            <div className="space-y-6">
              {statsGanhos.total > 0 && (
                <div className={cn(
                  "p-8 rounded-[2rem] text-white flex flex-col md:flex-row items-center justify-between gap-4 shadow-xl",
                  statsGanhos.isPaid ? "bg-blue-600" : (receipt.status === 'pendente-resgate' ? "bg-orange-500" : "bg-green-600 animate-pulse")
                )}>
                  <div>
                    <p className="text-[10px] font-black uppercase opacity-60">Prêmios Acumulados ({statsGanhos.count} Cartelas)</p>
                    <p className="text-4xl font-black">R$ {statsGanhos.total.toFixed(2)}</p>
                  </div>
                  
                  {statsGanhos.hasPending ? (
                    <Button onClick={handleClaimAll} disabled={claiming} className="bg-white text-green-700 hover:bg-white/90 h-16 px-10 font-black uppercase rounded-2xl shadow-lg">
                      {claiming ? "..." : <Trophy className="w-5 h-5 mr-2" />}
                      {claiming ? "Enviando" : "RESGATAR TODOS"}
                    </Button>
                  ) : (
                    <div className="bg-white/10 px-6 py-4 rounded-2xl flex items-center gap-2">
                       {statsGanhos.isPaid ? <CheckCircle2 className="w-6 h-6" /> : <Clock className="w-6 h-6" />}
                       <p className="font-black uppercase text-xs">{statsGanhos.isPaid ? "PRÊMIO PAGO" : "EM ANÁLISE"}</p>
                    </div>
                  )}
                </div>
              )}

              <div className="bg-primary/5 p-8 rounded-[2rem] border-2 border-primary/10">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Cliente</p><p className="text-xl font-black text-primary">{receipt.cliente}</p></div>
                   <div><p className="text-[10px] font-black text-muted-foreground uppercase">Concurso</p><p className="text-xl font-black text-primary">{receipt.evento_nome}</p></div>
                </div>
                
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                  {receipt.tickets_data?.map((t: any, idx: number) => {
                    const isWinner = (t.s || t.status) === 'ganhou';
                    const isLoser = (t.s || t.status) === 'perdeu';
                    const nums = t.n || t.numeros;
                    const pals = (t.p || t.palpites) as string;
                    
                    let bolaoStats = null;
                    if (pals && eventData) {
                      bolaoStats = calculateBolaoHits(pals);
                    }

                    return (
                      <div key={idx} className={cn(
                        "p-6 rounded-2xl border-2 transition-all", 
                        isWinner ? "bg-green-50 border-green-400 scale-[1.02] shadow-md" : 
                        isLoser ? "bg-red-50 border-red-200 opacity-80" : "bg-white border-muted"
                      )}>
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <p className="text-[10px] font-black text-muted-foreground uppercase">Cartela #{idx+1}</p>
                            {bolaoStats && (
                              <div className="flex items-center gap-2 mt-1">
                                <Badge className={cn("font-black text-[10px]", bolaoStats.isFinished ? "bg-primary" : "bg-orange-500")}>
                                  {bolaoStats.hits} ACERTOS DE {bolaoStats.total}
                                </Badge>
                                {bolaoStats.isFinished && !isWinner && !isLoser && (
                                  <Badge variant="outline" className="text-red-600 border-red-600 font-black text-[10px]">RODADA FINALIZADA</Badge>
                                )}
                              </div>
                            )}
                          </div>
                          {isWinner ? (
                            <div className="text-right">
                               <Badge className="bg-green-600 text-white font-black text-[10px] uppercase animate-bounce">BILHETE PREMIADO</Badge>
                               <p className="font-black text-xl text-green-600">R$ {(t.v || t.vp || t.valor_premio || t.valorPremio || 0).toFixed(2)}</p>
                            </div>
                          ) : isLoser ? (
                            <Badge variant="outline" className="text-red-600 border-red-600 font-black text-[10px] uppercase">NÃO PREMIADA</Badge>
                          ) : null}
                        </div>

                        {nums && (
                          <div className="grid grid-cols-5 sm:grid-cols-10 gap-1 mt-2">
                            {nums.map((n: number) => (
                              <div key={n} className={cn(
                                "h-8 flex items-center justify-center rounded-lg text-xs font-black border",
                                eventData?.bolas_sorteadas?.includes(n) ? "bg-green-600 text-white border-green-700" : "bg-muted/30"
                              )}>{n}</div>
                            ))}
                          </div>
                        )}

                        {pals && (
                          <div className="space-y-1 mt-2">
                            {pals.split('-').map((guess, gIdx) => {
                              const partida = eventData?.partidas?.[gIdx];
                              const scores = eventData?.scores?.[gIdx];
                              let isHit = false;
                              let isMiss = false;
                              
                              if (scores && scores.p1 !== '' && scores.p2 !== '') {
                                const p1 = parseInt(scores.p1);
                                const p2 = parseInt(scores.p2);
                                let win = 'X';
                                if (p1 > p2) win = partida.time1;
                                else if (p1 < p2) win = partida.time2;
                                if (guess === win) isHit = true; else isMiss = true;
                              }

                              return (
                                <div key={gIdx} className={cn(
                                  "flex justify-between items-center p-2 rounded-xl text-[11px] font-bold border",
                                  isHit ? "bg-green-100 border-green-200 text-green-800" : 
                                  isMiss ? "bg-red-50 border-red-100 text-red-800" : "bg-muted/20"
                                )}>
                                  <span className="uppercase opacity-60 w-1/2 truncate">{partida?.time1} x {partida?.time2}</span>
                                  <span className="font-black uppercase">= {guess}</span>
                                  {isHit && <CheckCircle2 className="w-3 h-3 text-green-600 ml-2" />}
                                  {isMiss && <XCircle className="w-3 h-3 text-red-600 ml-2" />}
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
              <div className="text-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground flex items-center justify-center gap-2">
                  <Database className="w-3 h-3 text-green-600" /> Auditoria Sincronizada com Supabase Cloud
                </p>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

export default function ResultadosPage() {
  return <Suspense fallback={<div className="h-screen flex items-center justify-center font-black uppercase text-xs">Carregando Auditoria...</div>}><ResultadosContent /></Suspense>;
}

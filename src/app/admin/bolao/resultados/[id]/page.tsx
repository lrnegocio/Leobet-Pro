'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Save, Loader2, Database, Calculator, LayoutGrid } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase/client';
import { cn } from '@/lib/utils';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [lotteryResults, setLotteryResults] = useState<number[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const loadData = async () => {
    if (!mounted) return;
    try {
      const resolvedParams = await params;
      const { data: bData } = await supabase.from('boloes').select('*').eq('id', resolvedParams.id).single();
      if (bData) {
        setBolao(bData);
        if (bData.tipo === 'esportivo' || !bData.tipo) {
          if (bData.scores && bData.scores.length > 0) setScores(bData.scores);
          else setScores(Array(bData.partidas?.length || 10).fill({ p1: '', p2: '' }));
        } else {
          setLotteryResults(bData.drawn_numbers || []);
        }
      }
      const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', resolvedParams.id).eq('status', 'pago');
      const { data: uData } = await supabase.from('users').select('*');
      
      if (tData) setTickets(tData);
      if (uData) setAllUsers(uData);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [mounted]);

  const pool = useMemo(() => {
    let totalComissoes = 0;
    let totalArrecadado = 0;

    tickets.forEach(t => {
      const valor = Number(t.valor_total) || 0;
      totalArrecadado += valor;
      
      const seller = allUsers.find(u => u.id === t.vendedor_id);
      const rate = Number(seller?.commission_rate || 0) / 100;
      const gRate = seller?.gerente_id ? 0.05 : 0;
      totalComissoes += (valor * (rate + gRate));
    });

    return Math.max(0, totalArrecadado - totalComissoes);
  }, [tickets, allUsers]);

  const handleUpdateScore = (index: number, field: 'p1' | 'p2', val: string) => {
    const newScores = [...scores];
    newScores[index] = { ...newScores[index], [field]: val };
    setScores(newScores);
  };

  const handleLotteryToggle = (num: number) => {
    if (bolao.status === 'finalizado') return;
    if (lotteryResults.includes(num)) {
      setLotteryResults(lotteryResults.filter(n => n !== num));
    } else {
      if (bolao.tipo === 'quina' && lotteryResults.length >= 5) {
        return toast({ variant: "destructive", title: "LIMITE", description: "Selecione apenas 5." });
      }
      setLotteryResults([...lotteryResults, num].sort((a,b) => a-b));
    }
  };

  const calculateWinners = async () => {
    setSaving(true);
    try {
      let maxHits = 0;
      const participants: any[] = [];
      const isLottery = bolao.tipo === 'mega' || bolao.tipo === 'quina';

      tickets.forEach(receipt => {
        if (!receipt.tickets_data) return;
        receipt.tickets_data.forEach((t: any) => {
          let hits = 0;
          if (isLottery) {
            const chosen = t.n || [];
            hits = chosen.filter((n: number) => lotteryResults.includes(n)).length;
          } else {
            const results = bolao.partidas.map((p: any, i: number) => {
              const s = scores[i];
              const p1 = parseInt(s.p1); const p2 = parseInt(s.p2);
              if (p1 > p2) return p.time1; if (p1 < p2) return p.time2; return 'X';
            });
            const guesses = (t.p || t.palpites)?.split('-') || [];
            guesses.forEach((g: string, i: number) => { if (g === results[i]) hits++; });
          }
          if (hits > maxHits) maxHits = hits;
          participants.push({ ticketId: t.id, hits, receiptId: receipt.id });
        });
      });

      const winnersList = participants.filter(p => p.hits === maxHits && maxHits > 0);
      const individualPrize = winnersList.length > 0 ? (pool / winnersList.length) : 0;

      for (const winner of winnersList) {
        const { data: rec } = await supabase.from('tickets').select('*').eq('id', winner.receiptId).single();
        if (rec) {
          const updatedData = rec.tickets_data.map((t: any) => 
            t.id === winner.ticketId ? { ...t, status: 'ganhou', valorPremio: individualPrize } : t
          );
          await supabase.from('tickets').update({ tickets_data: updatedData, status: 'ganhou', detalhe_premios: { total: individualPrize, data: new Date().toISOString() } }).eq('id', rec.id);
        }
      }

      const resolved = await params;
      await supabase.from('boloes').update({ 
        scores: isLottery ? null : scores, 
        drawn_numbers: isLottery ? lotteryResults : null,
        status: 'finalizado', 
        max_hits: maxHits 
      }).eq('id', resolved.id);

      toast({ title: "RODADA FINALIZADA!" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERRO NA AUDITORIA" });
    } finally { setSaving(false); }
  };

  if (!mounted || !bolao) return <div className="h-screen flex items-center justify-center font-black uppercase text-primary">Carregando...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
             <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-[10px] uppercase">
                <ArrowLeft className="w-4 h-4" /> Voltar
             </Link>
             <div className="text-right">
                <p className="text-[7px] font-black uppercase opacity-60">Prêmio da Rodada (Líquido)</p>
                <p className="text-xl font-black text-green-600">R$ {pool.toFixed(2)}</p>
             </div>
          </div>

          <Card className="rounded-[2.5rem] bg-white overflow-hidden shadow-2xl border-none">
            <CardContent className="p-8 space-y-8">
               <h1 className="text-4xl font-black uppercase text-primary leading-none text-center">{bolao.nome}</h1>
               
               {bolao.tipo === 'esportivo' || !bolao.tipo ? (
                 <div className="grid grid-cols-1 gap-3">
                    {bolao.partidas.map((p: any, i: number) => (
                      <div key={i} className="flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl bg-muted/20 border-2">
                         <div className="flex-1"><Badge className="bg-primary text-white font-black text-[8px] mb-1 uppercase px-3">JOGO #{i+1}</Badge><p className="text-sm font-black uppercase">{p.time1} vs {p.time2}</p></div>
                         <div className="flex items-center gap-3">
                            <input type="number" placeholder="0" className="w-16 h-16 text-center font-black text-3xl rounded-2xl border-2" value={scores[i]?.p1 ?? ''} onChange={e => handleUpdateScore(i, 'p1', e.target.value)} disabled={bolao.status === 'finalizado'} />
                            <span className="font-black text-2xl opacity-20">X</span>
                            <input type="number" placeholder="0" className="w-16 h-16 text-center font-black text-3xl rounded-2xl border-2" value={scores[i]?.p2 ?? ''} onChange={e => handleUpdateScore(i, 'p2', e.target.value)} disabled={bolao.status === 'finalizado'} />
                         </div>
                      </div>
                    ))}
                 </div>
               ) : (
                 <div className="space-y-6">
                    <div className="text-center bg-primary/5 p-6 rounded-3xl border-2 border-primary/10">
                       <div className="flex justify-between items-center mb-4">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Clique nas bolas para marcar o sorteio oficial</p>
                          <Badge className="bg-primary h-6 px-3 font-black text-[10px]">{lotteryResults.length} MARCADAS</Badge>
                       </div>
                       <div className="grid grid-cols-6 sm:grid-cols-10 gap-1.5">
                          {Array.from({ length: bolao.tipo === 'mega' ? 60 : 80 }).map((_, i) => {
                            const n = i + 1;
                            const isDrawn = lotteryResults.includes(n);
                            return (
                              <button key={n} onClick={() => handleLotteryToggle(n)} className={cn(
                                "h-12 w-full rounded-xl flex items-center justify-center font-black text-sm transition-all shadow-sm border-2",
                                isDrawn ? "bg-green-600 text-white border-green-400 scale-105" : "bg-white border-muted text-muted-foreground/40"
                              )}>{n < 10 ? `0${n}` : n}</button>
                            );
                          })}
                       </div>
                    </div>
                 </div>
               )}

               {bolao.status !== 'finalizado' && (
                 <div className="pt-8">
                   <Button onClick={calculateWinners} disabled={saving} className="w-full h-20 bg-accent text-white font-black uppercase rounded-2xl shadow-xl gap-2 text-xl">
                      {saving ? "PROCESSANDO..." : <Calculator className="w-8 h-8" />}
                      FINALIZAR E PAGAR GANHADORES
                   </Button>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

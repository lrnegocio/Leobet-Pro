
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, AlertTriangle, Calendar, Hash } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [scores, setScores] = useState<{p1: string, p2: string}[]>(Array(10).fill({p1: '', p2: ''}));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    const current = all.find((b: any) => String(b.id) === String(params.id));
    setBolao(current);

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allReceipts.filter((r: any) => 
      String(r.eventoId) === String(params.id) && r.status === 'pago'
    ));

    if (current?.scores) {
      setScores(current.scores);
    }
  }, [params.id]);

  const totalArrecadadoPaga = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
  }, [tickets]);

  // LÓGICA DE PRECISÃO: 65% EXATOS PARA PRÊMIOS
  const premioLiquidoTotal = Math.round(totalArrecadadoPaga * 0.65 * 100) / 100;

  const handleUpdateScore = (index: number, field: 'p1' | 'p2', val: string) => {
    const newScores = [...scores];
    newScores[index] = { ...newScores[index], [field]: val };
    setScores(newScores);
  };

  const calculateWinners = () => {
    if (scores.some(s => s.p1 === '' || s.p2 === '')) {
      toast({ variant: "destructive", title: "PLACAR INCOMPLETO", description: "Informe os gols de todos os 10 jogos." });
      return;
    }

    setSaving(true);
    
    // Converte scores em resultados 1-X-2
    const results = scores.map(s => {
      const g1 = parseInt(s.p1);
      const g2 = parseInt(s.p2);
      if (g1 > g2) return '1';
      if (g1 < g2) return '2';
      return 'X';
    });

    setTimeout(() => {
      let maxHitsFound = 0;
      const participantsData: any[] = [];

      tickets.forEach(receipt => {
        receipt.tickets.forEach((t: any) => {
          if (!t.palpite) return;
          const userGuesses = t.palpite.split('-');
          let hits = 0;
          userGuesses.forEach((g: string, i: number) => {
            if (g === results[i]) hits++;
          });
          
          if (hits > maxHitsFound) maxHitsFound = hits;
          participantsData.push({ ticketId: t.id, hits, receiptId: receipt.id });
        });
      });

      // Ganhador é o Top Scorer (Maior número de acertos da rodada)
      const topScorers = participantsData.filter(p => p.hits === maxHitsFound && p.hits > 0);
      const premioIndividual = topScorers.length > 0 ? premioLiquidoTotal / topScorers.length : 0;

      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      const updatedReceipts = allReceipts.map((r: any) => {
        if (String(r.eventoId) !== String(params.id)) return r;
        return {
          ...r,
          tickets: r.tickets.map((t: any) => {
            const winnerData = topScorers.find(w => w.ticketId === t.id);
            if (winnerData) {
              return { ...t, status: 'ganhou', valorPremio: premioIndividual, acertos: maxHitsFound };
            }
            const myHits = participantsData.find(pd => pd.ticketId === t.id)?.hits || 0;
            return { ...t, status: 'perdeu', acertos: myHits };
          })
        };
      });

      localStorage.setItem('leobet_tickets', JSON.stringify(updatedReceipts));

      const allBoloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
      const updatedBoloes = allBoloes.map((b: any) => 
        String(b.id) === String(params.id) ? { ...b, scores, resultados: results, status: 'finalizado', maxHits: maxHitsFound } : b
      );
      localStorage.setItem('leobet_boloes', JSON.stringify(updatedBoloes));

      setBolao({ ...bolao, status: 'finalizado', resultados: results, maxHits: maxHitsFound });
      setSaving(false);
      toast({ title: "AUDITORIA FINALIZADA!", description: `Máximo de acertos: ${maxHitsFound}. Prêmios creditados.` });
    }, 1000);
  };

  const partidasArray = useMemo(() => {
    if (Array.isArray(bolao?.partidas)) return bolao.partidas;
    return Array(10).fill(null).map((_, i) => ({
      time1: `Jogo ${i + 1} - Casa`,
      time2: `Jogo ${i + 1} - Fora`
    }));
  }, [bolao]);

  if (!bolao) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>

          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <div className="bg-primary p-4 rounded-3xl shadow-lg">
                <Trophy className="w-8 h-8 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-black uppercase text-primary leading-none tracking-tighter">{bolao.nome}</h1>
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Lançamento de Placares Digitáveis</p>
              </div>
            </div>
            <div className="text-right bg-white p-4 rounded-2xl shadow-sm border border-primary/10">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Prêmio Top Scorer (65%)</p>
              <p className="text-2xl font-black text-green-600">R$ {premioLiquidoTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-muted/50 border-b p-6">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Grade de Resultados (Gols Reais)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                 {partidasArray.map((p: any, i: number) => {
                   const g1 = parseInt(scores[i].p1);
                   const g2 = parseInt(scores[i].p2);
                   const res = isNaN(g1) || isNaN(g2) ? '?' : (g1 > g2 ? '1' : g1 < g2 ? '2' : 'X');
                   
                   return (
                     <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-muted/30 rounded-2xl border-2 border-transparent hover:border-accent transition-all">
                        <div className="flex-1 space-y-1">
                           <Badge className="font-black text-[9px] h-5 px-3 mb-1">JOGO #{i+1}</Badge>
                           <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase truncate max-w-[120px]">{p.time1 || 'CASA'}</span>
                              <span className="text-[10px] font-black text-accent">VS</span>
                              <span className="text-xs font-black uppercase truncate max-w-[120px]">{p.time2 || 'FORA'}</span>
                           </div>
                        </div>
                        
                        <div className="flex items-center gap-2 shrink-0">
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="w-12 h-12 text-center font-black text-xl rounded-xl border-2"
                            value={scores[i].p1}
                            onChange={(e) => handleUpdateScore(i, 'p1', e.target.value)}
                            disabled={bolao.status === 'finalizado'}
                          />
                          <span className="font-black text-muted-foreground">x</span>
                          <Input 
                            type="number" 
                            placeholder="0" 
                            className="w-12 h-12 text-center font-black text-xl rounded-xl border-2"
                            value={scores[i].p2}
                            onChange={(e) => handleUpdateScore(i, 'p2', e.target.value)}
                            disabled={bolao.status === 'finalizado'}
                          />
                          <Badge className={`ml-4 w-10 h-10 flex items-center justify-center rounded-xl font-black text-lg ${res === '?' ? 'bg-muted text-muted-foreground' : 'bg-primary text-white'}`}>
                            {res}
                          </Badge>
                        </div>
                     </div>
                   );
                 })}
              </CardContent>
              {bolao.status !== 'finalizado' && (
                <div className="p-8 border-t bg-muted/30">
                  <Button onClick={calculateWinners} disabled={saving} className="w-full h-16 bg-accent hover:bg-accent/90 font-black uppercase text-lg shadow-xl rounded-2xl">
                    {saving ? "PROCESSANDO AUDITORIA..." : "FINALIZAR E PAGAR MAIORES ACERTADORES"}
                  </Button>
                </div>
              )}
            </Card>

            <div className="space-y-4">
               <Card className="bg-primary text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xs font-black uppercase text-white/60">Regras do Bolão</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <div className="p-4 bg-white/10 rounded-xl">
                       <p className="text-xs font-bold leading-relaxed whitespace-pre-wrap">{bolao.regras || 'O prêmio de 65% será dividido igualmente entre todos os apostadores que atingirem o maior número de acertos na rodada.'}</p>
                    </div>
                    <div className="mt-6 space-y-2">
                       <p className="text-[10px] font-black uppercase opacity-60">Acúmulo Atual</p>
                       <p className="text-3xl font-black">R$ {premioLiquidoTotal.toFixed(2)}</p>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-md bg-orange-50 border-orange-200 rounded-[2rem]">
                  <CardContent className="p-6 space-y-4">
                     <div className="flex gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                        <p className="text-[10px] font-bold text-orange-800 uppercase leading-relaxed">
                          Apenas bilhetes com status "PAGO" participam desta auditoria. O sistema identifica automaticamente a pontuação máxima e divide o prêmio líquido.
                        </p>
                     </div>
                     <div className="pt-4 border-t border-orange-200 flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-orange-900">Bilhetes Auditados: {tickets.length}</p>
                        {bolao.status === 'finalizado' && (
                          <Badge className="bg-green-600 font-black uppercase text-[9px]">Top Score: {bolao.maxHits} pts</Badge>
                        )}
                     </div>
                  </CardContent>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

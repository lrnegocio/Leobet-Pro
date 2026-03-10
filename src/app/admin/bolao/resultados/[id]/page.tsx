
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, CheckCircle2, History, AlertTriangle, Calendar, FileText } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [results, setResults] = useState<string[]>(Array(10).fill(''));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const all = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    const current = all.find((b: any) => String(b.id) === String(params.id));
    setBolao(current);

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allReceipts.filter((r: any) => 
      String(r.eventoId) === String(params.id) && r.status === 'pago'
    ));

    if (current?.resultados) {
      setResults(current.resultados);
    }
  }, [params.id]);

  const totalArrecadadoPaga = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (t.valorTotal || 0), 0);
  }, [tickets]);

  const premioLiquidoTotal = totalArrecadadoPaga * 0.65;

  const handleUpdateResult = (index: number, val: string) => {
    const newResults = [...results];
    newResults[index] = val.toUpperCase();
    setResults(newResults);
  };

  const calculateWinners = () => {
    if (results.some(r => !r)) {
      toast({ variant: "destructive", title: "PLACAR INCOMPLETO", description: "Informe o resultado para todos os 10 jogos." });
      return;
    }

    setSaving(true);
    
    setTimeout(() => {
      let maxHitsFound = 0;
      const participantsData: any[] = [];

      // Passo 1: Calcular acertos de todos
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

      // Passo 2: Identificar ganhadores (Top Scorers)
      const topScorers = participantsData.filter(p => p.hits === maxHitsFound && p.hits > 0);
      const premioIndividual = topScorers.length > 0 ? premioLiquidoTotal / topScorers.length : 0;

      // Passo 3: Atualizar recibos
      const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      const updatedReceipts = allReceipts.map((r: any) => {
        if (String(r.eventoId) !== String(params.id)) return r;
        if (r.status !== 'pago') return r; 

        return {
          ...r,
          tickets: r.tickets.map((t: any) => {
            const isWinner = topScorers.find(w => w.ticketId === t.id);
            if (isWinner) {
              return { ...t, status: 'ganhou', valorPremio: premioIndividual, acertos: maxHitsFound };
            }
            return { ...t, status: 'perdeu', acertos: participantsData.find(pd => pd.ticketId === t.id)?.hits || 0 };
          })
        };
      });

      localStorage.setItem('leobet_tickets', JSON.stringify(updatedReceipts));

      const allBoloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
      const updatedBoloes = allBoloes.map((b: any) => 
        String(b.id) === String(params.id) ? { ...b, resultados: results, status: 'finalizado', maxHits: maxHitsFound } : b
      );
      localStorage.setItem('leobet_boloes', JSON.stringify(updatedBoloes));

      setBolao({ ...bolao, status: 'finalizado', resultados: results, maxHits: maxHitsFound });
      setSaving(false);
      toast({ title: "AUDITORIA FINALIZADA!", description: `Maior pontuação: ${maxHitsFound}. Prêmios creditados.` });
    }, 1000);
  };

  if (!bolao) return null;

  const partidasArray = Array.isArray(bolao.partidas) ? bolao.partidas : [];

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
                <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Lançamento de Placares Oficiais</p>
              </div>
            </div>
            <div className="text-right bg-white p-4 rounded-2xl shadow-sm border border-primary/10">
              <p className="text-[10px] font-black uppercase text-muted-foreground">Arrecadação Líquida (Paga)</p>
              <p className="text-2xl font-black text-green-600">R$ {premioLiquidoTotal.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-muted/50 border-b p-6">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Grade de Resultados (1-X-2)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                 {partidasArray.map((p: any, i: number) => (
                   <div key={i} className="flex flex-col md:flex-row items-center gap-4 p-4 bg-muted/30 rounded-2xl border-2 border-transparent hover:border-accent transition-all">
                      <div className="flex-1 space-y-1">
                         <Badge className="font-black text-[9px] h-5 px-3 mb-1">JOGO #{i+1}</Badge>
                         <div className="flex items-center gap-2">
                            <span className="text-xs font-black uppercase truncate max-w-[140px]">{p.time1}</span>
                            <span className="text-[10px] font-black text-accent">VS</span>
                            <span className="text-xs font-black uppercase truncate max-w-[120px]">{p.time2}</span>
                         </div>
                      </div>
                      
                      <div className="flex gap-2 shrink-0">
                        {['1', 'X', '2'].map((val) => (
                          <Button
                            key={val}
                            type="button"
                            size="sm"
                            variant={results[i] === val ? 'default' : 'outline'}
                            onClick={() => handleUpdateResult(i, val)}
                            disabled={bolao.status === 'finalizado'}
                            className="w-10 h-10 font-black text-sm"
                          >
                            {val}
                          </Button>
                        ))}
                      </div>
                   </div>
                 ))}
              </CardContent>
              {bolao.status !== 'finalizado' && (
                <div className="p-8 border-t bg-muted/30">
                  <Button onClick={calculateWinners} disabled={saving} className="w-full h-16 bg-accent hover:bg-accent/90 font-black uppercase text-lg shadow-xl rounded-2xl">
                    {saving ? "EXECUTANDO AUDITORIA..." : "FINALIZAR E CREDITAR PRÊMIOS"}
                  </Button>
                </div>
              )}
            </Card>

            <div className="space-y-4">
               <Card className="bg-primary text-white border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
                 <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-xs font-black uppercase text-white/60">Regras da Rodada</CardTitle>
                 </CardHeader>
                 <CardContent className="p-8 pt-0">
                    <div className="p-4 bg-white/10 rounded-xl">
                       <p className="text-xs font-bold leading-relaxed">{bolao.regras || 'O prêmio principal será dividido entre os maiores pontuadores da rodada.'}</p>
                    </div>
                    <div className="mt-6 space-y-2">
                       <p className="text-[10px] font-black uppercase opacity-60">Prêmio Acumulado</p>
                       <p className="text-3xl font-black">R$ {premioLiquidoTotal.toFixed(2)}</p>
                    </div>
                 </CardContent>
               </Card>

               <Card className="border-none shadow-md bg-orange-50 border-orange-200 rounded-[2rem]">
                  <CardContent className="p-6 space-y-4">
                     <div className="flex gap-3">
                        <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                        <p className="text-[10px] font-bold text-orange-800 uppercase leading-relaxed">
                          Apenas bilhetes pagos participam. O ganhador é quem fizer o maior número de acertos. Em caso de empate na pontuação máxima, o prêmio é dividido.
                        </p>
                     </div>
                     <div className="pt-4 border-t border-orange-200 flex justify-between items-center">
                        <p className="text-[10px] font-black uppercase text-orange-900">Bilhetes Auditados: {tickets.length}</p>
                        {bolao.status === 'finalizado' && (
                          <Badge className="bg-green-600 font-black uppercase text-[9px]">Recorde: {bolao.maxHits} pts</Badge>
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

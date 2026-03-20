
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, AlertTriangle, Calendar, Save, Database, Clock, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { supabase } from '@/supabase/client';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!mounted) return;
    try {
      const { data: bData } = await supabase.from('boloes').select('*').eq('id', params.id).single();
      if (bData) {
        setBolao(bData);
        const numPartidas = bData.partidas?.length || 10;
        if (bData.scores && Array.isArray(bData.scores) && bData.scores.length > 0) {
          setScores(bData.scores);
        } else {
          setScores(Array(numPartidas).fill(null).map(() => ({ p1: '', p2: '', excluded: false })));
        }
      }

      const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', params.id).eq('status', 'pago');
      setTickets(tData || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadData();
  }, [params.id, mounted]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (Number(t.valor_total || 0) || 0), 0);
  }, [tickets]);

  const pool = Math.floor(totalArrecadado * 0.65 * 100) / 100;

  const handleUpdateScore = (index: number, field: 'p1' | 'p2', val: string) => {
    const newScores = [...scores];
    if (!newScores[index]) newScores[index] = { p1: '', p2: '', excluded: false };
    newScores[index] = { ...newScores[index], [field]: val, excluded: false };
    setScores(newScores);
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('boloes')
        .update({ scores })
        .eq('id', params.id);
      
      if (!error) {
        toast({ title: "PLACARE SALVOS NO SUPABASE!" });
        loadData();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO AO SALVAR" });
    } finally {
      setSaving(false);
    }
  };

  const resetBolao = async () => {
    if (confirm("ATENÇÃO: Deseja resetar os resultados deste Bolão? Isso permitirá editar os placares novamente.")) {
      setSaving(true);
      const { error } = await supabase
        .from('boloes')
        .update({ 
          status: 'aberto',
          resultados: null,
          max_hits: 0
        })
        .eq('id', params.id);
      
      if (!error) {
        toast({ title: "BOLÃO REABERTO PARA EDIÇÃO" });
        loadData();
      }
      setSaving(false);
    }
  };

  const calculateWinners = async () => {
    // Validação robusta: aceita qualquer valor numérico inclusive zero
    const incomplete = scores.some(s => s.p1 === '' || s.p2 === '' || s.p1 === null || s.p2 === null);

    if (incomplete) {
      toast({ 
        variant: "destructive", 
        title: "PREENCHA TODOS OS PLACARES", 
        description: "Todos os 10 placares devem ser preenchidos antes de finalizar." 
      });
      return;
    }

    setSaving(true);
    
    try {
      const results = (bolao.partidas || []).map((p: any, i: number) => {
        const s = scores[i];
        const g1 = parseInt(s.p1);
        const g2 = parseInt(s.p2);
        if (g1 > g2) return '1';
        if (g1 < g2) return '2';
        return 'X';
      });

      let maxHits = 0;
      const participants: any[] = [];

      tickets.forEach(receipt => {
        if (!receipt.tickets_data) return;
        receipt.tickets_data.forEach((t: any) => {
          const guesses = t.palpite?.split('-') || [];
          let hits = 0;
          guesses.forEach((g: string, i: number) => {
            if (g === results[i]) hits++;
          });
          if (hits > maxHits) maxHits = hits;
          participants.push({ ticketId: t.id, hits, receiptId: receipt.id });
        });
      });

      const winnersList = participants.filter(p => p.hits === maxHits && maxHits > 0);
      const individualPrize = winnersList.length > 0 ? (pool / winnersList.length) : 0;

      for (const winner of winnersList) {
        const { data: receipt } = await supabase.from('tickets').select('*').eq('id', winner.receiptId).single();
        if (receipt && receipt.tickets_data) {
          const updatedData = receipt.tickets_data.map((t: any) => {
            if (t.id === winner.ticketId) {
              return { ...t, status: 'ganhou', valorPremio: individualPrize };
            }
            return t;
          });
          await supabase.from('tickets').update({ tickets_data: updatedData, status: 'ganhou' }).eq('id', receipt.id);
        }
      }

      const { error } = await supabase
        .from('boloes')
        .update({ 
          scores, 
          resultados: results, 
          status: 'finalizado', 
          max_hits: maxHits 
        })
        .eq('id', params.id);

      if (!error) {
        toast({ title: "AUDITORIA FINALIZADA!", description: `Maior pontuação: ${maxHits} acertos. Prêmios distribuídos.` });
        loadData();
      }
    } catch (e) {
      toast({ variant: "destructive", title: "ERRO NA AUDITORIA" });
    } finally {
      setSaving(false);
    }
  };

  if (!mounted || !bolao) return <div className="h-screen flex items-center justify-center font-black text-xs uppercase text-primary">Carregando Banco de Dados...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-[10px] uppercase">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <div className="flex gap-2">
              {bolao.status === 'finalizado' && (
                <Button onClick={resetBolao} variant="outline" className="h-9 text-[9px] font-black uppercase text-destructive border-destructive/20 rounded-xl">
                  <RotateCcw className="w-3 h-3 mr-1" /> Resetar Resultados
                </Button>
              )}
              <Badge className="bg-green-100 text-green-700 font-black uppercase text-[9px] gap-2 h-9 px-4 rounded-xl">
                <Database className="w-3 h-3" /> Supabase Cloud
              </Badge>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">{bolao.nome}</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Lançamento de Placares Oficiais
              </p>
            </div>
            <div className="bg-white p-6 rounded-3xl shadow-xl border-2 border-primary/5 text-right w-full md:w-auto">
               <p className="text-[10px] font-black uppercase text-muted-foreground">Prêmio Estimado (65%)</p>
               <p className="text-3xl font-black text-green-600">R$ {pool.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-32">
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-muted/50 border-b p-6">
                <CardTitle className="text-[10px] font-black uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Grade de Resultados Reais
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 md:p-8 space-y-4">
                 {(bolao.partidas || []).map((p: any, i: number) => (
                   <div key={i} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-accent transition-all">
                      <div className="flex-1 w-full text-center sm:text-left">
                         <Badge className="bg-primary text-white font-black text-[8px] px-2 mb-1">JOGO #{i+1}</Badge>
                         <p className="text-xs font-black uppercase truncate">{p.time1} vs {p.time2}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           placeholder="0" 
                           className="w-14 h-14 text-center font-black text-2xl rounded-2xl border-2 bg-white outline-none focus:border-primary"
                           value={scores[i]?.p1 ?? ''}
                           onChange={(e) => handleUpdateScore(i, 'p1', e.target.value)}
                           disabled={bolao.status === 'finalizado'}
                         />
                         <span className="font-black opacity-30">X</span>
                         <input 
                           type="number" 
                           placeholder="0" 
                           className="w-14 h-14 text-center font-black text-2xl rounded-2xl border-2 bg-white outline-none focus:border-primary"
                           value={scores[i]?.p2 ?? ''}
                           onChange={(e) => handleUpdateScore(i, 'p2', e.target.value)}
                           disabled={bolao.status === 'finalizado'}
                         />
                      </div>
                   </div>
                 ))}
              </CardContent>
              {bolao.status !== 'finalizado' && (
                <div className="p-6 md:p-8 border-t bg-muted/30 flex flex-col sm:flex-row gap-4">
                  <Button onClick={handleSaveProgress} disabled={saving} variant="outline" className="flex-1 h-14 font-black uppercase border-2 rounded-2xl bg-white">Salvar Parcial</Button>
                  <Button onClick={calculateWinners} disabled={saving} className="flex-[2] h-14 bg-accent hover:bg-accent/90 font-black uppercase text-lg shadow-xl rounded-2xl">Finalizar Auditoria</Button>
                </div>
              )}
            </Card>

            <div className="space-y-6">
               <Card className="bg-primary text-white border-none shadow-2xl rounded-[2rem] p-8">
                  <h3 className="text-[10px] font-black uppercase opacity-60 mb-4">Resumo da Rodada</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-[9px] font-black uppercase">Bilhetes Vendidos</span>
                        <span className="text-lg font-black">{tickets.length}</span>
                     </div>
                     <div className="pt-4">
                        <p className="text-[9px] font-black uppercase opacity-60">Status do Sistema</p>
                        <Badge className="mt-2 bg-white text-primary font-black uppercase text-[10px] h-10 w-full justify-center rounded-2xl shadow-lg border-none">
                          {bolao.status === 'finalizado' ? '✓ AUDITADO' : '⌚ AGUARDANDO'}
                        </Badge>
                     </div>
                  </div>
               </Card>

               <Card className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-6">
                  <div className="flex gap-3">
                     <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                     <p className="text-[10px] font-bold text-orange-800 uppercase leading-tight">
                        Ao finalizar, o sistema divide o prêmio acumulado de R$ {pool.toFixed(2)} entre os maiores pontuadores automaticamente.
                     </p>
                  </div>
               </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

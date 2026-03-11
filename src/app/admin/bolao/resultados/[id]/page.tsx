
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, AlertTriangle, Calendar, Save, Database, Clock } from 'lucide-react';
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
  const [scores, setScores] = useState<{p1: string, p2: string, excluded?: boolean}[]>(
    Array(10).fill({p1: '', p2: '', excluded: false})
  );
  const [saving, setSaving] = useState(false);

  const loadData = async () => {
    const { data: bData } = await supabase.from('boloes').select('*').eq('id', params.id).single();
    if (bData) {
      setBolao(bData);
      if (bData.scores && bData.scores.length > 0) setScores(bData.scores);
    }

    const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', params.id).eq('status', 'pago');
    setTickets(tData || []);
  };

  useEffect(() => {
    loadData();
  }, [params.id]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (Number(t.valor_total) || 0), 0);
  }, [tickets]);

  const pool = Math.floor(totalArrecadado * 0.65 * 100) / 100;

  const handleUpdateScore = (index: number, field: 'p1' | 'p2', val: string) => {
    const newScores = [...scores];
    newScores[index] = { ...newScores[index], [field]: val, excluded: false };
    setScores(newScores);
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    const { error } = await supabase
      .from('boloes')
      .update({ scores })
      .eq('id', params.id);
    
    setSaving(false);
    if (!error) toast({ title: "PLACARE SALVOS NO SUPABASE!" });
  };

  const calculateWinners = async () => {
    const incomplete = scores.some(s => !s.excluded && (s.p1 === '' || s.p2 === ''));
    if (incomplete) {
      toast({ variant: "destructive", title: "PREENCHA TODOS OS PLACARES" });
      return;
    }

    setSaving(true);
    
    // Resultados 1-X-2
    const results = scores.map(s => {
      if (s.excluded) return 'CANCELLED';
      const g1 = parseInt(s.p1);
      const g2 = parseInt(s.p2);
      if (g1 > g2) return '1';
      if (g1 < g2) return '2';
      return 'X';
    });

    let maxHits = 0;
    const participants = [];

    tickets.forEach(receipt => {
      receipt.tickets_data.forEach((t: any) => {
        const guesses = t.palpite?.split('-') || [];
        let hits = 0;
        guesses.forEach((g: string, i: number) => {
          if (results[i] !== 'CANCELLED' && g === results[i]) hits++;
        });
        if (hits > maxHits) maxHits = hits;
        participants.push({ id: t.id, hits, receiptId: receipt.id });
      });
    });

    // Finaliza no Supabase
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
      toast({ title: "AUDITORIA FINALIZADA!", description: `Maior pontuação: ${maxHits} acertos.` });
      loadData();
    }
    setSaving(false);
  };

  if (!bolao) return <div className="h-screen flex items-center justify-center font-black text-xs uppercase">Carregando...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <Badge className="bg-green-100 text-green-700 font-black uppercase text-[10px] gap-2">
              <Database className="w-3 h-3" /> Sincronizado Supabase
            </Badge>
          </div>

          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none tracking-tighter">{bolao.nome}</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-2 flex items-center gap-2">
                <Clock className="w-3 h-3" /> Lançamento de Placares Oficiais da Rodada
              </p>
            </div>
            <div className="bg-white p-5 rounded-2xl shadow-xl border-2 border-primary/10 text-right">
               <p className="text-[10px] font-black uppercase text-muted-foreground">Prêmio em Jogo (65%)</p>
               <p className="text-3xl font-black text-green-600">R$ {pool.toFixed(2)}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-20">
            <Card className="lg:col-span-2 border-none shadow-2xl rounded-[2.5rem] overflow-hidden bg-white">
              <CardHeader className="bg-muted/50 border-b p-6">
                <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-primary" /> Grade de Resultados (Gols Reais)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-4">
                 {(bolao.partidas || []).map((p: any, i: number) => (
                   <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-muted/20 border-2 border-transparent hover:border-accent transition-all">
                      <div className="flex-1">
                         <Badge className="bg-primary text-white font-black text-[8px] px-2 mb-1">JOGO #{i+1}</Badge>
                         <p className="text-xs font-black uppercase">{p.time1} vs {p.time2}</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <Input 
                           type="number" 
                           placeholder="0" 
                           className="w-14 h-14 text-center font-black text-2xl rounded-xl border-2"
                           value={scores[i]?.p1 || ''}
                           onChange={(e) => handleUpdateScore(i, 'p1', e.target.value)}
                           disabled={bolao.status === 'finalizado'}
                         />
                         <span className="font-black opacity-30">X</span>
                         <Input 
                           type="number" 
                           placeholder="0" 
                           className="w-14 h-14 text-center font-black text-2xl rounded-xl border-2"
                           value={scores[i]?.p2 || ''}
                           onChange={(e) => handleUpdateScore(i, 'p2', e.target.value)}
                           disabled={bolao.status === 'finalizado'}
                         />
                      </div>
                   </div>
                 ))}
              </CardContent>
              {bolao.status !== 'finalizado' && (
                <div className="p-8 border-t bg-muted/30 flex gap-4">
                  <Button onClick={handleSaveProgress} disabled={saving} variant="outline" className="flex-1 h-16 font-black uppercase border-2 rounded-2xl">Salvar Parcial</Button>
                  <Button onClick={calculateWinners} disabled={saving} className="flex-[2] h-16 bg-accent hover:bg-accent/90 font-black uppercase text-lg shadow-xl rounded-2xl">Finalizar Auditoria</Button>
                </div>
              )}
            </Card>

            <div className="space-y-6">
               <Card className="bg-primary text-white border-none shadow-2xl rounded-[2rem] p-8">
                  <h3 className="text-[10px] font-black uppercase opacity-60 mb-4">Resumo da Rodada</h3>
                  <div className="space-y-4">
                     <div className="flex justify-between items-center border-b border-white/10 pb-4">
                        <span className="text-[9px] font-black uppercase">Bilhetes Pagos</span>
                        <span className="text-lg font-black">{tickets.length}</span>
                     </div>
                     <div className="pt-4">
                        <p className="text-[9px] font-black uppercase opacity-60">Status do Evento</p>
                        <Badge className="mt-2 bg-white text-primary font-black uppercase text-[10px] h-8 w-full justify-center rounded-xl">{bolao.status}</Badge>
                     </div>
                  </div>
               </Card>

               <Card className="bg-orange-50 border-2 border-orange-100 rounded-[2rem] p-6">
                  <div className="flex gap-3">
                     <AlertTriangle className="w-6 h-6 text-orange-600 shrink-0" />
                     <p className="text-[10px] font-bold text-orange-800 uppercase leading-tight">
                        Ao finalizar a auditoria, o sistema calculará automaticamente quem fez o maior número de acertos e dividirá o prêmio de R$ {pool.toFixed(2)} entre eles.
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

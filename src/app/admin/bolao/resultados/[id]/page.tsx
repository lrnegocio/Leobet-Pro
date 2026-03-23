'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Trophy, Save, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/supabase/client';

export default function ResultadosBolaoPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const [bolao, setBolao] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [scores, setScores] = useState<any[]>([]);
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
        if (bData.scores) setScores(bData.scores);
        else setScores(Array(bData.partidas?.length || 10).fill(null).map(() => ({ p1: '', p2: '' })));
      }
      const { data: tData } = await supabase.from('tickets').select('*').eq('evento_id', resolvedParams.id).eq('status', 'pago');
      setTickets(tData || []);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, [mounted]);

  const pool = useMemo(() => {
    const total = tickets.reduce((acc, t) => acc + (Number(t.valor_total || 0)), 0);
    return Math.floor(total * 0.65 * 100) / 100;
  }, [tickets]);

  const handleUpdateScore = (index: number, field: 'p1' | 'p2', val: string) => {
    const newScores = [...scores];
    newScores[index] = { ...newScores[index], [field]: val };
    setScores(newScores);
  };

  const handleSaveProgress = async () => {
    setSaving(true);
    try {
      await supabase.from('boloes').update({ scores }).eq('id', (await params).id);
      toast({ title: "PLACARE SALVOS!" });
    } finally { setSaving(false); }
  };

  const calculateWinners = async () => {
    const incomplete = scores.some(s => s.p1 === '' || s.p2 === '' || s.p1 === null || s.p2 === null);
    if (incomplete) return toast({ variant: "destructive", title: "PREENCHA TODOS OS PLACARES", description: "Use '0' se necessário." });

    setSaving(true);
    try {
      const results = bolao.partidas.map((p: any, i: number) => {
        const s = scores[i];
        if (parseInt(s.p1) > parseInt(s.p2)) return '1';
        if (parseInt(s.p1) < parseInt(s.p2)) return '2';
        return 'X';
      });

      let maxHits = 0;
      const participants: any[] = [];
      tickets.forEach(receipt => {
        receipt.tickets_data.forEach((t: any) => {
          const guesses = t.p?.split('-') || [];
          let hits = 0;
          guesses.forEach((g: string, i: number) => { if (g === results[i]) hits++; });
          if (hits > maxHits) maxHits = hits;
          participants.push({ ticketId: t.id, hits, receiptId: receipt.id });
        });
      });

      const winnersList = participants.filter(p => p.hits === maxHits && maxHits > 0);
      const individualPrize = winnersList.length > 0 ? (pool / winnersList.length) : 0;

      for (const winner of winnersList) {
        const { data: rec } = await supabase.from('tickets').select('*').eq('id', winner.receiptId).single();
        const updatedData = rec.tickets_data.map((t: any) => t.id === winner.ticketId ? { ...t, status: 'ganhou', vp: individualPrize } : t);
        await supabase.from('tickets').update({ tickets_data: updatedData, status: 'ganhou' }).eq('id', rec.id);
      }

      await supabase.from('boloes').update({ scores, status: 'finalizado', max_hits: maxHits }).eq('id', (await params).id);
      toast({ title: "RODADA FINALIZADA!" });
      loadData();
    } catch (e: any) {
      toast({ variant: "destructive", title: "ERRO NA AUDITORIA", description: e.message });
    } finally { setSaving(false); }
  };

  if (!mounted || !bolao) return <div className="h-screen flex items-center justify-center font-black uppercase text-primary"><Loader2 className="animate-spin mr-2" /> Carregando...</div>;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-5xl mx-auto space-y-8">
          <Link href="/admin/bolao" className="flex items-center gap-2 text-primary hover:underline font-black text-[10px] uppercase"><ArrowLeft className="w-4 h-4" /> Gestão</Link>
          <div className="flex justify-between items-end gap-6">
            <div><h1 className="text-4xl font-black uppercase text-primary">{bolao.nome}</h1><p className="text-[10px] font-black text-muted-foreground uppercase mt-2">Prêmio: R$ {pool.toFixed(2)}</p></div>
          </div>

          <Card className="rounded-[2.5rem] bg-white overflow-hidden shadow-2xl">
            <CardContent className="p-8 space-y-4">
               {bolao.partidas.map((p: any, i: number) => (
                 <div key={i} className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-muted/20">
                    <div className="flex-1"><Badge className="bg-primary text-white font-black text-[8px] mb-1">JOGO #{i+1}</Badge><p className="text-xs font-black uppercase">{p.time1} vs {p.time2}</p></div>
                    <div className="flex items-center gap-2">
                       <input type="number" placeholder="0" className="w-14 h-14 text-center font-black text-2xl rounded-2xl border-2" value={scores[i]?.p1 ?? ''} onChange={e => handleUpdateScore(i, 'p1', e.target.value)} disabled={bolao.status === 'finalizado'} />
                       <span className="font-black opacity-30">X</span>
                       <input type="number" placeholder="0" className="w-14 h-14 text-center font-black text-2xl rounded-2xl border-2" value={scores[i]?.p2 ?? ''} onChange={e => handleUpdateScore(i, 'p2', e.target.value)} disabled={bolao.status === 'finalizado'} />
                    </div>
                 </div>
               ))}
               {bolao.status !== 'finalizado' && (
                 <div className="pt-6 flex gap-4">
                   <Button onClick={handleSaveProgress} disabled={saving} variant="outline" className="flex-1 h-14 font-black uppercase rounded-2xl">Salvar Parcial</Button>
                   <Button onClick={calculateWinners} disabled={saving} className="flex-[2] h-14 bg-accent font-black uppercase rounded-2xl shadow-xl">{saving ? <Loader2 className="animate-spin" /> : 'Finalizar e Premiar'}</Button>
                 </div>
               )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
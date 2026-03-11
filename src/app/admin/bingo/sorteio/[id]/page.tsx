
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, RotateCcw, Youtube, AlertTriangle, Database } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/supabase/client';

export default function SorteioPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  
  const [bingo, setBingo] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isAuto, setIsAuto] = useState(false);
  const [finished, setFinished] = useState(false);
  const [currentPrizeLevel, setCurrentPrizeLevel] = useState<'quadra' | 'quina' | 'bingo'>('quadra');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [winners, setWinners] = useState<{
    quadra: any[],
    quina: any[],
    bingo: any[]
  }>({ quadra: [], quina: [], bingo: [] });

  const loadBingoData = async () => {
    // Busca dados do Bingo
    const { data: bingoData } = await supabase
      .from('bingos')
      .select('*')
      .eq('id', params.id)
      .single();
    
    if (bingoData) {
      setBingo(bingoData);
      setDrawnNumbers(bingoData.bolas_sorteadas || []);
      if (bingoData.bolas_sorteadas?.length > 0) {
        setLastNumber(bingoData.bolas_sorteadas[0]);
      }
      if (bingoData.status === 'finalizado') setFinished(true);
    }

    // Busca todos os bilhetes vendidos e pagos para este evento
    const { data: ticketsData } = await supabase
      .from('tickets')
      .select('*')
      .eq('evento_id', params.id)
      .eq('status', 'pago');
    
    setTickets(ticketsData || []);
  };

  useEffect(() => {
    loadBingoData();
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setYoutubeUrl(settings.youtubeUrl || '');
  }, [params.id]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, t) => acc + (Number(t.valor_total) || 0), 0);
  }, [tickets]);

  const pool = Math.floor(totalArrecadado * 0.65 * 100) / 100;
  const premios = {
    bingo: Math.floor(pool * 0.50 * 100) / 100,
    quina: Math.floor(pool * 0.30 * 100) / 100,
    quadra: Number((pool - (Math.floor(pool * 0.50 * 100) / 100) - (Math.floor(pool * 0.30 * 100) / 100)).toFixed(2))
  };

  const updateBingoOnCloud = async (nums: number[], isFinal: boolean) => {
    await supabase
      .from('bingos')
      .update({ 
        bolas_sorteadas: nums, 
        status: isFinal ? 'finalizado' : 'sorteio' 
      })
      .eq('id', params.id);
  };

  const checkWinners = useCallback(async (drawn: number[]) => {
    if (finished) return;

    const level = currentPrizeLevel;
    const currentRoundWinners: any[] = [];
    const targetHits = level === 'bingo' ? 15 : (level === 'quina' ? 5 : 4);

    tickets.forEach(receipt => {
      receipt.tickets_data.forEach((t: any) => {
        if (!t.numeros) return;
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        if (hits >= targetHits) {
          const alreadyInThisLevel = (winners[level] || []).some((w: any) => w.ticketId === t.id);
          if (!alreadyInThisLevel) {
            currentRoundWinners.push({ 
              ticketId: t.id, 
              cliente: receipt.cliente, 
              vendedorId: receipt.vendedor_id 
            });
          }
        }
      });
    });

    if (currentRoundWinners.length > 0) {
      setIsAuto(false);
      const newWinners = { ...winners };
      newWinners[level] = [...(newWinners[level] || []), ...currentRoundWinners];
      setWinners(newWinners);

      const individual = premios[level] / newWinners[level].length;
      
      // Atualiza status dos bilhetes ganhadores no Supabase (Opcional: implementar lógica de atualização de JSONB)
      toast({
        title: `🔥 GANHADORES DA ${level.toUpperCase()}!`,
        description: `${currentRoundWinners.length} novo(s) premiado(s) detectado(s).`,
      });

      if (level === 'bingo') {
        setFinished(true);
        await updateBingoOnCloud(drawn, true);
      } else {
        const next = level === 'quadra' ? 'quina' : 'bingo';
        setCurrentPrizeLevel(next);
      }
    }
  }, [tickets, winners, currentPrizeLevel, premios, finished, params.id]);

  const drawNumber = async () => {
    if (drawnNumbers.length >= 90 || finished) return;
    let num;
    do { 
      num = Math.floor(Math.random() * 90) + 1; 
    } while (drawnNumbers.includes(num));
    
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    await updateBingoOnCloud(newDrawn, false);
    checkWinners(newDrawn);
  };

  const resetSorteio = async () => {
    if (confirm("Deseja resetar o sorteio no banco de dados?")) {
      await supabase.from('bingos').update({ bolas_sorteadas: [], status: 'aberto' }).eq('id', params.id);
      window.location.reload();
    }
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && !finished) interval = setInterval(drawNumber, 3000); 
    return () => clearInterval(interval);
  }, [isAuto, finished, drawnNumbers]);

  if (!bingo) return <div className="h-screen flex items-center justify-center font-black uppercase text-xs">Carregando Auditoria...</div>;

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden font-body">
      <SidebarNav />
      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        <div className="flex items-center justify-between shrink-0 h-6 px-2">
          <Link href="/admin/bingo" className="flex items-center gap-1.5 text-primary hover:underline font-black text-[9px] uppercase">
            <ArrowLeft className="w-3 h-3" /> Gestão
          </Link>
          <div className="flex gap-4 items-center">
            <div className="text-right">
              <p className="text-[7px] font-black uppercase text-muted-foreground leading-none">Prêmio Total (65%)</p>
              <p className="text-[10px] font-black text-green-600 leading-none">R$ {pool.toFixed(2)}</p>
            </div>
            <Button variant="ghost" onClick={resetSorteio} className="text-[7px] font-black uppercase text-destructive h-5 px-1.5">
              <RotateCcw className="w-2 h-2 mr-1" /> Reset
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-black uppercase text-primary">{bingo.nome}</h1>
            <Badge className="bg-green-100 text-green-700 border-none h-5 px-2 font-black text-[8px] uppercase flex gap-1 items-center">
              <Database className="w-2 h-2" /> Supabase Live
            </Badge>
          </div>
          <div className="flex items-center gap-2">
             <Badge className="bg-primary/10 text-primary border-none h-7 px-3 font-black text-[10px]">{drawnNumbers.length} / 90 BOLAS</Badge>
             {!finished ? (
                <div className="flex gap-1">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-7 px-4 font-black uppercase rounded-lg text-[9px]">
                    {isAuto ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-7 px-4 font-black uppercase rounded-lg border text-[9px]">Sortear</Button>
                </div>
              ) : (
                <Badge className="bg-green-600 text-white font-black uppercase px-4 h-7 text-[9px]">SORTEIO FINALIZADO</Badge>
              )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col gap-2 overflow-hidden">
             <Card className="bg-primary text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-4 space-y-2 shrink-0 h-40 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-20 h-20 bg-white/5 rounded-full -mr-10 -mt-10"></div>
                <p className="text-[8px] font-black uppercase tracking-[0.3em] opacity-60">Última Bola</p>
                <div className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-black border-4 border-accent shadow-xl animate-in zoom-in duration-300">
                  {lastNumber || '--'}
                </div>
                <Badge className="bg-accent text-white font-black px-3 py-1 uppercase text-[8px] tracking-widest rounded-lg">
                  FOCO: {currentPrizeLevel.toUpperCase()}
                </Badge>
             </Card>

             <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-xl transition-all border-none shadow-sm shrink-0 ${currentPrizeLevel === lvl ? "ring-2 ring-accent bg-white" : "opacity-40 bg-muted"}`}>
                    <div className="p-2 flex justify-between items-center border-b bg-muted/20">
                       <p className="text-[9px] font-black uppercase text-primary">{lvl}</p>
                       <p className="text-[9px] font-black text-green-600">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </div>
                    <div className="p-2 space-y-1">
                       {winners[lvl as keyof typeof winners]?.length === 0 ? (
                         <p className="text-[8px] text-center text-muted-foreground/50 py-2">Aguardando sorteio...</p>
                       ) : (
                         winners[lvl as keyof typeof winners]?.map((w, i) => (
                           <div key={i} className="text-[8px] font-black uppercase bg-green-50 text-green-700 p-1.5 rounded-lg flex justify-between items-center border border-green-100">
                             <span className="truncate">{w.cliente}</span>
                             <Trophy className="w-3 h-3" />
                           </div>
                         ))
                       )}
                    </div>
                  </Card>
                ))}
             </div>
          </div>

          <Card className="lg:col-span-3 bg-white rounded-2xl shadow-md border-none p-3 flex flex-col overflow-hidden">
             <div className="flex-1 grid grid-cols-10 gap-1 auto-rows-fr">
                {Array.from({ length: 90 }).map((_, i) => {
                  const num = i + 1;
                  const isDrawn = drawnNumbers.includes(num);
                  const isLast = lastNumber === num;
                  return (
                    <div key={num} className={`flex items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300 ${
                      isLast ? "bg-accent text-white scale-110 shadow-xl ring-2 ring-accent/20 z-10" :
                      isDrawn ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground/20 border border-muted/10"
                    }`}>{num}</div>
                  );
                })}
             </div>
             <div className="mt-2 pt-2 border-t flex justify-between items-center shrink-0">
                <p className="text-[8px] font-black uppercase text-muted-foreground">© LEOBET PRO • AUDITORIA EM TEMPO REAL • SUPABASE CLOUD</p>
                <div className="text-right">
                   <p className="text-[8px] font-black text-primary uppercase">{tickets.length} BILHETES EM JOGO</p>
                </div>
             </div>
          </Card>
        </div>
      </main>
    </div>
  );
}

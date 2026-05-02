"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, RotateCcw, Database } from 'lucide-react';
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
  const [allUsers, setAllUsers] = useState<any[]>([]);
  const [winners, setWinners] = useState<{ quadra: any[], quina: any[], bingo: any[] }>({ quadra: [], quina: [], bingo: [] });

  const loadBingoData = async () => {
    const { data: bingoData } = await supabase.from('bingos').select('*').eq('id', params.id).single();
    if (bingoData) {
      setBingo(bingoData);
      setDrawnNumbers(bingoData.bolas_sorteadas || []);
      if (bingoData.bolas_sorteadas?.length > 0) setLastNumber(bingoData.bolas_sorteadas[0]);
      if (bingoData.status === 'finalizado') setFinished(true);
    }

    const { data: ticketsData } = await supabase.from('tickets').select('*').eq('evento_id', params.id).in('status', ['pago', 'ganhou', 'premio_pago', 'pendente-resgate']);
    setTickets(ticketsData || []);

    const { data: userData } = await supabase.from('users').select('*');
    setAllUsers(userData || []);
  };

  useEffect(() => { loadBingoData(); }, [params.id]);

  const poolData = useMemo(() => {
    let totalComissoes = 0;
    let totalArrecadado = 0;

    tickets.forEach(t => {
      const valor = Number(t.valor_total) || 0;
      totalArrecadado += valor;
      
      const seller = allUsers.find(u => u.id === t.vendedor_id);
      const rate = Number(seller?.commission_rate || 0) / 100;
      const gRate = seller?.gerente_id ? 0.05 : 0; // Gerente fixo 5%
      totalComissoes += (valor * (rate + gRate));
    });

    const pool = Math.max(0, totalArrecadado - totalComissoes);
    return {
      pool,
      premios: {
        bingo: Math.floor(pool * 0.50 * 100) / 100,
        quina: Math.floor(pool * 0.30 * 100) / 100,
        quadra: Number((pool - (Math.floor(pool * 0.50 * 100) / 100) - (Math.floor(pool * 0.30 * 100) / 100)).toFixed(2))
      }
    };
  }, [tickets, allUsers]);

  const markTicketAsWinner = async (receiptId: string, ticketId: string, level: string, prize: number) => {
    const receipt = tickets.find(t => t.id === receiptId);
    if (receipt) {
      const updatedData = receipt.tickets_data.map((t: any) => {
        if (t.id === ticketId) return { ...t, status: 'ganhou', premio_tipo: level, valorPremio: prize };
        return t;
      });

      const currentTotal = receipt.detalhe_premios?.total || 0;
      const newTotal = currentTotal + prize;

      await supabase.from('tickets').update({ 
        tickets_data: updatedData,
        status: 'ganhou',
        detalhe_premios: { total: newTotal, data: new Date().toISOString() }
      }).eq('id', receiptId);
    }
  };

  const checkWinners = useCallback(async (drawn: number[]) => {
    if (finished) return;
    const level = currentPrizeLevel;
    const currentRoundWinners: any[] = [];
    const targetHits = level === 'bingo' ? 15 : (level === 'quina' ? 5 : 4);

    tickets.forEach(receipt => {
      receipt.tickets_data?.forEach((t: any) => {
        const hits = t.numeros?.filter((n: number) => drawn.includes(n)).length || 0;
        if (hits >= targetHits && !(winners[level] || []).some((w: any) => w.ticketId === t.id)) {
          currentRoundWinners.push({ receiptId: receipt.id, ticketId: t.id, cliente: receipt.cliente });
        }
      });
    });

    if (currentRoundWinners.length > 0) {
      setIsAuto(false);
      const newWinners = { ...winners };
      newWinners[level] = [...(newWinners[level] || []), ...currentRoundWinners];
      setWinners(newWinners);

      const individualPrize = poolData.premios[level] / newWinners[level].length;
      for (const winner of currentRoundWinners) {
        await markTicketAsWinner(winner.receiptId, winner.ticketId, level, individualPrize);
      }

      toast({ title: `GANHADORES DA ${level.toUpperCase()}!` });
      if (level === 'bingo') {
        setFinished(true);
        await supabase.from('bingos').update({ bolas_sorteadas: drawn, status: 'finalizado' }).eq('id', params.id);
      } else {
        setCurrentPrizeLevel(level === 'quadra' ? 'quina' : 'bingo');
      }
    }
  }, [tickets, winners, currentPrizeLevel, poolData, finished, params.id]);

  const drawNumber = async () => {
    if (drawnNumbers.length >= 90 || finished) return;
    let num; do { num = Math.floor(Math.random() * 90) + 1; } while (drawnNumbers.includes(num));
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    await supabase.from('bingos').update({ bolas_sorteadas: newDrawn, status: 'sorteio' }).eq('id', params.id);
    checkWinners(newDrawn);
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && !finished) interval = setInterval(drawNumber, 3000); 
    return () => clearInterval(interval);
  }, [isAuto, finished, drawnNumbers]);

  if (!bingo) return <div className="h-screen flex items-center justify-center font-black uppercase text-primary">Aguardando Auditoria...</div>;

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden font-body">
      <SidebarNav />
      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        <div className="flex items-center justify-between shrink-0 h-6 px-2">
          <Link href="/admin/bingo" className="text-primary font-black text-[9px] uppercase"><ArrowLeft className="w-3 h-3 inline" /> Voltar</Link>
          <div className="text-right">
             <p className="text-[7px] font-black uppercase opacity-60">Prêmio Dinâmico (Total - Comissões)</p>
             <p className="text-[10px] font-black text-green-600">R$ {poolData.pool.toFixed(2)}</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between">
          <h1 className="text-sm font-black uppercase text-primary">{bingo.nome}</h1>
          <div className="flex gap-2">
             <Badge className="h-7 px-3 font-black text-[10px]">{drawnNumbers.length} BOLAS</Badge>
             {!finished ? (
               <div className="flex gap-1">
                 <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-7 px-4 font-black uppercase text-[9px]">{isAuto ? "Pausar" : "Auto"}</Button>
                 <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-7 px-4 font-black uppercase text-[9px]">Sortear</Button>
               </div>
             ) : <Badge className="bg-green-600 text-white font-black uppercase px-4 h-7 text-[9px]">FINALIZADO</Badge>}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col gap-2">
             <Card className="bg-primary text-white p-4 flex flex-col items-center justify-center shrink-0 h-40 rounded-2xl shadow-lg">
                <p className="text-[8px] font-black uppercase opacity-60 tracking-widest">Última Bola</p>
                <div className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-black border-4 border-accent shadow-xl">{lastNumber || '--'}</div>
                <Badge className="mt-2 bg-accent text-[8px] uppercase">FOCO: {currentPrizeLevel}</Badge>
             </Card>
             <div className="flex-1 space-y-2 overflow-y-auto">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={cn("p-2 transition-all border-none shadow-sm", currentPrizeLevel === lvl ? "ring-2 ring-accent" : "opacity-40")}>
                    <div className="flex justify-between items-center text-[9px] font-black uppercase"><span>{lvl}</span><span className="text-green-600">R$ {poolData.premios[lvl as keyof typeof poolData.premios].toFixed(2)}</span></div>
                    <div className="mt-2 space-y-1">
                       {winners[lvl as keyof typeof winners]?.map((w, i) => (
                         <div key={i} className="text-[8px] font-black uppercase bg-green-50 p-1.5 rounded-lg border flex justify-between"><span>{w.cliente}</span><Trophy className="w-2 h-2" /></div>
                       ))}
                    </div>
                  </Card>
                ))}
             </div>
          </div>
          <Card className="lg:col-span-3 bg-white rounded-2xl p-4 grid grid-cols-10 gap-1 auto-rows-fr">
             {Array.from({ length: 90 }).map((_, i) => {
               const n = i + 1; const isDrawn = drawnNumbers.includes(n); const isLast = lastNumber === n;
               return <div key={n} className={cn("flex items-center justify-center rounded-lg text-[10px] font-black border transition-all", isLast ? "bg-accent text-white scale-110 shadow-lg" : isDrawn ? "bg-primary text-white" : "bg-muted/20 text-muted-foreground/20")}>{n}</div>
             })}
          </Card>
        </div>
      </main>
    </div>
  );
}

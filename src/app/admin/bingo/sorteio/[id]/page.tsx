
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, CheckCircle2, RotateCcw, Volume2, Youtube, MonitorPlay } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

export default function SorteioPage({ params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = React.use(paramsPromise);
  const { toast } = useToast();
  const router = useRouter();
  
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

  const storageKey = useMemo(() => `leobet_progress_${params.id}`, [params.id]);

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setYoutubeUrl(settings.youtubeUrl || '');

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const current = allBingos.find((b: any) => String(b.id) === String(params.id));
    setBingo(current);

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const eventReceipts = allReceipts.filter((r: any) => String(r.eventoId) === String(params.id) && r.status === 'pago');
    setTickets(eventReceipts);

    const savedProgress = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (savedProgress) {
      setDrawnNumbers(savedProgress.drawnNumbers || []);
      setLastNumber(savedProgress.lastNumber || null);
      setWinners(savedProgress.winners || { quadra: [], quina: [], bingo: [] });
      setCurrentPrizeLevel(savedProgress.currentPrizeLevel || 'quadra');
      setFinished(savedProgress.finished || false);
    }
  }, [params.id, storageKey]);

  useEffect(() => {
    if (params.id && drawnNumbers.length > 0) {
      const progress = {
        drawnNumbers,
        lastNumber,
        winners,
        currentPrizeLevel,
        finished
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));

      const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
      const updated = allBingos.map((b: any) => 
        String(b.id) === String(params.id) ? { ...b, status: finished ? 'finalizado' : 'sorteio', bolasSorteadas: drawnNumbers } : b
      );
      localStorage.setItem('leobet_bingos', JSON.stringify(updated));
    }
  }, [drawnNumbers, lastNumber, winners, currentPrizeLevel, finished, params.id, storageKey]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, r) => acc + (Number(r.valorTotal) || 0), 0);
  }, [tickets]);

  const premios = useMemo(() => {
    const pool = totalArrecadado * 0.65;
    return {
      quadra: pool * 0.20,
      quina: pool * 0.30,
      bingo: pool * 0.50
    };
  }, [totalArrecadado]);

  const updateTicketStatus = (ticketId: string, status: string, premioIndividual: number) => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allReceipts.map((receipt: any) => {
      if (String(receipt.eventoId) !== String(params.id)) return receipt;
      return {
        ...receipt,
        tickets: receipt.tickets.map((t: any) => 
          t.id === ticketId ? { ...t, status, valorPremio: premioIndividual } : t
        )
      };
    });
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
  };

  const checkWinners = useCallback((drawn: number[]) => {
    if (finished) return;

    const level = currentPrizeLevel;
    const currentRoundWinners: any[] = [];
    const targetHits = level === 'bingo' ? 15 : (level === 'quina' ? 5 : 4);

    tickets.forEach(receipt => {
      receipt.tickets.forEach((t: any) => {
        if (!t.numeros) return;
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        if (hits === targetHits) {
          const alreadyWinner = winners.quadra.some(w => w.ticketId === t.id) || 
                               winners.quina.some(w => w.ticketId === t.id) || 
                               winners.bingo.some(w => w.ticketId === t.id);
          
          if (!alreadyWinner) {
            currentRoundWinners.push({ 
              ticketId: t.id, 
              cliente: receipt.cliente, 
              userId: receipt.vendedorId || 'vendedor-direto' 
            });
          }
        }
      });
    });

    if (currentRoundWinners.length > 0) {
      setIsAuto(false);
      const newWinners = { ...winners };
      newWinners[level] = [...newWinners[level], ...currentRoundWinners];
      setWinners(newWinners);

      const premioTotalNivel = premios[level];
      const individual = premioTotalNivel / newWinners[level].length;
      
      newWinners[level].forEach(w => {
        updateTicketStatus(w.ticketId, 'ganhou', individual);
      });

      toast({
        title: `🔥 GANHADORES DA ${level.toUpperCase()}!`,
        description: `${currentRoundWinners.length} novo(s) premiado(s) detectado(s).`,
      });

      if (level === 'bingo') {
        setFinished(true);
      } else {
        const next = level === 'quadra' ? 'quina' : 'bingo';
        setCurrentPrizeLevel(next);
      }
    }
  }, [tickets, winners, currentPrizeLevel, toast, premios, finished]);

  const drawNumber = () => {
    if (drawnNumbers.length >= 90 || finished) return;
    let num;
    do { 
      num = Math.floor(Math.random() * 90) + 1; 
    } while (drawnNumbers.includes(num));
    
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    checkWinners(newDrawn);
  };

  const resetSorteio = () => {
    if (confirm("Deseja resetar o sorteio? Todo o progresso salvo será apagado.")) {
      setDrawnNumbers([]);
      setLastNumber(null);
      setWinners({ quadra: [], quina: [], bingo: [] });
      setCurrentPrizeLevel('quadra');
      setFinished(false);
      localStorage.removeItem(storageKey);
    }
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && !finished) interval = setInterval(drawNumber, 3000); 
    return () => clearInterval(interval);
  }, [isAuto, finished, drawNumber]);

  if (!bingo) return null;

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <SidebarNav />
      <main className="flex-1 flex flex-col p-4 gap-4 overflow-hidden">
        <div className="flex items-center justify-between shrink-0">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
            <ArrowLeft className="w-4 h-4" /> Voltar
          </Link>
          <div className="flex gap-4 items-center">
            {youtubeUrl && (
              <Button onClick={() => window.open(youtubeUrl, '_blank')} variant="outline" className="h-9 gap-2 border-red-500 text-red-600 font-black uppercase text-[10px] rounded-xl">
                <Youtube className="w-4 h-4" /> Ver Live no YouTube
              </Button>
            )}
            <div className="text-right">
              <p className="text-[8px] font-black uppercase text-muted-foreground">Arrecadação Bruta</p>
              <p className="text-sm font-black text-primary">R$ {totalArrecadado.toFixed(2)}</p>
            </div>
            <Button variant="ghost" onClick={resetSorteio} className="text-[10px] font-black uppercase text-destructive gap-2 h-8">
              <RotateCcw className="w-3 h-3" /> Reiniciar
            </Button>
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border p-4 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-xl font-black uppercase text-primary leading-none">{bingo.nome}</h1>
            <p className="text-[9px] font-black text-muted-foreground uppercase tracking-widest mt-1">Sorteio Auditado • Multi-Nível</p>
          </div>
          <div className="flex items-center gap-3">
             <Badge className="bg-primary/10 text-primary border-none h-10 px-4 font-black text-xs">{drawnNumbers.length} / 90 BOLAS</Badge>
             {!finished ? (
                <div className="flex gap-2">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-10 px-6 font-black uppercase rounded-xl">
                    {isAuto ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-10 px-6 font-black uppercase rounded-xl border-2">Próxima</Button>
                </div>
              ) : (
                <Badge className="bg-green-600 text-white font-black uppercase py-2 px-6 h-10">FINALIZADO</Badge>
              )}
          </div>
        </div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-4 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col gap-4 overflow-hidden">
             <Card className="bg-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 space-y-4 shrink-0">
                <p className="text-[9px] font-black uppercase tracking-[0.4em] opacity-60">Bola Chamada</p>
                <div className="w-32 h-32 rounded-full bg-white text-primary flex items-center justify-center text-6xl font-black border-8 border-accent shadow-xl">
                  {lastNumber || '--'}
                </div>
                <div className="text-center">
                  <Badge className="bg-accent text-white font-black px-4 py-1.5 uppercase text-[10px] tracking-widest rounded-lg mb-2">
                    FOCO ATUAL: {currentPrizeLevel.toUpperCase()}
                  </Badge>
                  <p className="text-[9px] font-bold opacity-60">PRÊMIO: R$ {premios[currentPrizeLevel].toFixed(2)}</p>
                </div>
             </Card>

             <div className="flex-1 space-y-2 overflow-y-auto pr-2 custom-scrollbar">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-2xl transition-all border-none shadow-sm ${currentPrizeLevel === lvl ? "ring-2 ring-accent bg-white" : "opacity-40 bg-muted"}`}>
                    <div className="p-3 flex justify-between items-center border-b">
                       <p className="text-[10px] font-black uppercase">{lvl}</p>
                       <p className="text-[10px] font-black text-primary">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </div>
                    <div className="p-2 space-y-1">
                       {winners[lvl as keyof typeof winners].length === 0 ? (
                         <p className="text-[8px] text-center text-muted-foreground/50 py-2">Aguardando...</p>
                       ) : (
                         winners[lvl as keyof typeof winners].map((w, i) => (
                           <div key={i} className="text-[9px] font-black uppercase bg-green-50 text-green-700 p-1.5 rounded-lg flex justify-between">
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

          <Card className="lg:col-span-3 bg-white rounded-3xl shadow-md border-none p-4 flex flex-col overflow-hidden">
             <div className="flex-1 grid grid-cols-10 gap-1.5 auto-rows-fr">
                {Array.from({ length: 90 }).map((_, i) => {
                  const num = i + 1;
                  const isDrawn = drawnNumbers.includes(num);
                  const isLast = lastNumber === num;
                  return (
                    <div key={num} className={`flex items-center justify-center rounded-lg text-sm font-black transition-all duration-300 ${
                      isLast ? "bg-accent text-white scale-110 shadow-lg ring-4 ring-accent/20" :
                      isDrawn ? "bg-primary text-white" : "bg-muted/50 text-muted-foreground/30 border border-muted"
                    }`}>{num}</div>
                  );
                })}
             </div>
             <div className="mt-4 pt-4 border-t flex justify-between items-center">
                <p className="text-[10px] font-black uppercase text-muted-foreground">Log Permanente • Auditoria 365 Dias</p>
                <div className="flex items-center gap-2">
                   <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[10px] font-black uppercase text-green-600">Sistema Conectado</p>
                </div>
             </div>
          </Card>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

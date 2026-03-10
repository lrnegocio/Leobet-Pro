
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, RotateCcw, Youtube } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

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

  const storageKey = useMemo(() => `leobet_progress_${params.id}`, [params.id]);

  // Carrega dados iniciais e progresso salvo
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

  // Persistência automática no localStorage
  useEffect(() => {
    if (params.id && (drawnNumbers.length > 0 || winners.quadra.length > 0)) {
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
      <main className="flex-1 flex flex-col p-3 gap-3 overflow-hidden">
        {/* Header Compacto */}
        <div className="flex items-center justify-between shrink-0 h-8">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-black text-[10px] uppercase">
            <ArrowLeft className="w-3 h-3" /> Voltar
          </Link>
          <div className="flex gap-3 items-center">
            {youtubeUrl && (
              <Button onClick={() => window.open(youtubeUrl, '_blank')} variant="outline" className="h-7 gap-1 border-red-500 text-red-600 font-black uppercase text-[8px] rounded-lg">
                <Youtube className="w-3 h-3" /> Live YouTube
              </Button>
            )}
            <div className="text-right">
              <p className="text-[7px] font-black uppercase text-muted-foreground leading-none">Arrecadação</p>
              <p className="text-xs font-black text-primary">R$ {totalArrecadado.toFixed(2)}</p>
            </div>
            <Button variant="ghost" onClick={resetSorteio} className="text-[8px] font-black uppercase text-destructive gap-1 h-6 px-2">
              <RotateCcw className="w-2.5 h-2.5" /> Reiniciar
            </Button>
          </div>
        </div>

        {/* Status Bar Compacta */}
        <div className="bg-white rounded-xl shadow-sm border p-3 flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-lg font-black uppercase text-primary leading-none">{bingo.nome}</h1>
            <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mt-0.5">Sorteio Auditado • Multi-Nível</p>
          </div>
          <div className="flex items-center gap-2">
             <Badge className="bg-primary/10 text-primary border-none h-8 px-3 font-black text-[10px]">{drawnNumbers.length} / 90 BOLAS</Badge>
             {!finished ? (
                <div className="flex gap-2">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-8 px-4 font-black uppercase rounded-lg text-[10px]">
                    {isAuto ? <Pause className="w-3 h-3 mr-1.5" /> : <Play className="w-3 h-3 mr-1.5" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-8 px-4 font-black uppercase rounded-lg border-2 text-[10px]">Próxima</Button>
                </div>
              ) : (
                <Badge className="bg-green-600 text-white font-black uppercase py-1 px-4 h-8 text-[10px]">FINALIZADO</Badge>
              )}
          </div>
        </div>

        {/* Área Principal - Otimizada para altura da tela */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-3 overflow-hidden min-h-0">
          <div className="lg:col-span-1 flex flex-col gap-3 overflow-hidden">
             {/* Bola Chamada - Reduzida */}
             <Card className="bg-primary text-white rounded-2xl shadow-lg flex flex-col items-center justify-center p-4 space-y-2 shrink-0">
                <p className="text-[8px] font-black uppercase tracking-[0.2em] opacity-60">Bola Chamada</p>
                <div className="w-20 h-20 rounded-full bg-white text-primary flex items-center justify-center text-4xl font-black border-4 border-accent shadow-lg">
                  {lastNumber || '--'}
                </div>
                <div className="text-center">
                  <Badge className="bg-accent text-white font-black px-3 py-1 uppercase text-[8px] tracking-widest rounded-md mb-1">
                    FOCO: {currentPrizeLevel.toUpperCase()}
                  </Badge>
                  <p className="text-[8px] font-bold opacity-60">PRÊMIO: R$ {premios[currentPrizeLevel].toFixed(2)}</p>
                </div>
             </Card>

             {/* Vencedores - Scroll Interno */}
             <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar min-h-0">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-xl transition-all border-none shadow-sm shrink-0 ${currentPrizeLevel === lvl ? "ring-2 ring-accent bg-white" : "opacity-40 bg-muted"}`}>
                    <div className="p-2 flex justify-between items-center border-b">
                       <p className="text-[9px] font-black uppercase">{lvl}</p>
                       <p className="text-[9px] font-black text-primary">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </div>
                    <div className="p-1.5 space-y-1">
                       {winners[lvl as keyof typeof winners].length === 0 ? (
                         <p className="text-[8px] text-center text-muted-foreground/50 py-1">Aguardando...</p>
                       ) : (
                         winners[lvl as keyof typeof winners].map((w, i) => (
                           <div key={i} className="text-[8px] font-black uppercase bg-green-50 text-green-700 p-1 rounded-md flex justify-between">
                             <span className="truncate">{w.cliente}</span>
                             <Trophy className="w-2.5 h-2.5" />
                           </div>
                         ))
                       )}
                    </div>
                  </Card>
                ))}
             </div>
          </div>

          {/* Grid de Bolas - Otimizado para 10 colunas e preencher altura */}
          <Card className="lg:col-span-3 bg-white rounded-2xl shadow-md border-none p-3 flex flex-col overflow-hidden">
             <div className="flex-1 grid grid-cols-10 gap-1 auto-rows-fr">
                {Array.from({ length: 90 }).map((_, i) => {
                  const num = i + 1;
                  const isDrawn = drawnNumbers.includes(num);
                  const isLast = lastNumber === num;
                  return (
                    <div key={num} className={`flex items-center justify-center rounded-md text-[10px] font-black transition-all duration-300 ${
                      isLast ? "bg-accent text-white scale-105 shadow-md ring-2 ring-accent/20" :
                      isDrawn ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground/20 border border-muted/50"
                    }`}>{num}</div>
                  );
                })}
             </div>
             <div className="mt-2 pt-2 border-t flex justify-between items-center shrink-0">
                <p className="text-[8px] font-black uppercase text-muted-foreground">Sistema LEOBET • Auditoria 365 Dias</p>
                <div className="flex items-center gap-1.5">
                   <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
                   <p className="text-[8px] font-black uppercase text-green-600">Conectado</p>
                </div>
             </div>
          </Card>
        </div>
      </main>
      
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 3px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #E2E8F0; border-radius: 10px; }
      `}</style>
    </div>
  );
}

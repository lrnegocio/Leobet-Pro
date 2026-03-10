
"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, RotateCcw, Youtube, AlertTriangle } from 'lucide-react';
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

  useEffect(() => {
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setYoutubeUrl(settings.youtubeUrl || '');

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const current = allBingos.find((b: any) => String(b.id) === String(params.id));
    setBingo(current);

    // LOGICA CRITICAL: APENAS TICKETS PAGOS PARTICIPAM
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const eventReceipts = allReceipts.filter((r: any) => 
      String(r.eventoId) === String(params.id) && r.status === 'pago'
    );
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
  }, [tickets, winners, currentPrizeLevel, toast, premios, finished, params.id]);

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
    <div className="flex h-screen bg-muted/30 overflow-hidden font-body">
      <SidebarNav />
      <main className="flex-1 flex flex-col p-2 gap-2 overflow-hidden">
        {/* Header Compacto */}
        <div className="flex items-center justify-between shrink-0 h-6">
          <Link href="/admin/bingo" className="flex items-center gap-1.5 text-primary hover:underline font-black text-[9px] uppercase">
            <ArrowLeft className="w-3 h-3" /> Voltar
          </Link>
          <div className="flex gap-2 items-center">
            {youtubeUrl && (
              <Button onClick={() => window.open(youtubeUrl, '_blank')} variant="outline" className="h-6 gap-1 border-red-500 text-red-600 font-black uppercase text-[7px] rounded-lg">
                <Youtube className="w-3 h-3" /> Live Ao Vivo
              </Button>
            )}
            <div className="text-right">
              <p className="text-[7px] font-black uppercase text-muted-foreground leading-none">Prêmios Acumulados</p>
              <p className="text-[10px] font-black text-primary leading-none">R$ {(totalArrecadado * 0.65).toFixed(2)}</p>
            </div>
            <Button variant="ghost" onClick={resetSorteio} className="text-[7px] font-black uppercase text-destructive gap-1 h-5 px-1.5">
              <RotateCcw className="w-2 h-2" /> Reset
            </Button>
          </div>
        </div>

        {/* Status Bar Ultra Compacta */}
        <div className="bg-white rounded-lg shadow-sm border p-2 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-black uppercase text-primary leading-none">{bingo.nome}</h1>
            <div className="flex items-center gap-1">
               <div className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></div>
               <p className="text-[7px] font-black text-green-600 uppercase">Auditado</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
             <Badge className="bg-primary/10 text-primary border-none h-6 px-2 font-black text-[9px]">{drawnNumbers.length} / 90 BOLAS</Badge>
             {!finished ? (
                <div className="flex gap-1">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-6 px-3 font-black uppercase rounded-lg text-[9px]">
                    {isAuto ? <Pause className="w-3 h-3 mr-1" /> : <Play className="w-3 h-3 mr-1" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-6 px-3 font-black uppercase rounded-lg border text-[9px]">Próxima</Button>
                </div>
              ) : (
                <Badge className="bg-green-600 text-white font-black uppercase px-3 h-6 text-[9px]">FINALIZADO</Badge>
              )}
          </div>
        </div>

        {/* Área Principal - Otimizada para 100% da Altura */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-4 gap-2 overflow-hidden">
          <div className="lg:col-span-1 flex flex-col gap-2 overflow-hidden">
             {/* Bola Chamada - Reduzida para caber tudo */}
             <Card className="bg-primary text-white rounded-xl shadow-lg flex flex-col items-center justify-center p-2 space-y-1 shrink-0 h-32">
                <p className="text-[7px] font-black uppercase tracking-[0.2em] opacity-60">Bola Chamada</p>
                <div className="w-16 h-16 rounded-full bg-white text-primary flex items-center justify-center text-3xl font-black border-4 border-accent shadow-lg animate-in zoom-in duration-300">
                  {lastNumber || '--'}
                </div>
                <div className="text-center">
                  <Badge className="bg-accent text-white font-black px-2 py-0.5 uppercase text-[7px] tracking-widest rounded-md">
                    FOCO: {currentPrizeLevel.toUpperCase()}
                  </Badge>
                </div>
             </Card>

             {/* Ganhadores - Compacto com scroll */}
             <div className="flex-1 space-y-2 overflow-y-auto pr-1 custom-scrollbar">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-xl transition-all border-none shadow-sm shrink-0 ${currentPrizeLevel === lvl ? "ring-1 ring-accent bg-white" : "opacity-40 bg-muted"}`}>
                    <div className="p-1.5 flex justify-between items-center border-b">
                       <p className="text-[8px] font-black uppercase">{lvl}</p>
                       <p className="text-[8px] font-black text-primary">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </div>
                    <div className="p-1 space-y-1">
                       {winners[lvl as keyof typeof winners].length === 0 ? (
                         <p className="text-[7px] text-center text-muted-foreground/50 py-1">Aguardando...</p>
                       ) : (
                         winners[lvl as keyof typeof winners].map((w, i) => (
                           <div key={i} className="text-[7px] font-black uppercase bg-green-50 text-green-700 p-1 rounded-md flex justify-between items-center">
                             <span className="truncate">{w.cliente}</span>
                             <Trophy className="w-2.5 h-2.5" />
                           </div>
                         ))
                       )}
                    </div>
                  </Card>
                ))}
                
                <div className="bg-orange-50 p-2 rounded-lg border border-orange-100 flex items-start gap-1.5">
                   <AlertTriangle className="w-3 h-3 text-orange-600 shrink-0" />
                   <p className="text-[7px] font-bold text-orange-800 uppercase leading-tight">
                     Somente apostas pagas participam. Apostas pendentes foram desconsideradas desta auditoria.
                   </p>
                </div>
             </div>
          </div>

          {/* Grid de Bolas - Otimizado para preencher altura */}
          <Card className="lg:col-span-3 bg-white rounded-xl shadow-md border-none p-2 flex flex-col overflow-hidden">
             <div className="flex-1 grid grid-cols-10 gap-0.5 auto-rows-fr">
                {Array.from({ length: 90 }).map((_, i) => {
                  const num = i + 1;
                  const isDrawn = drawnNumbers.includes(num);
                  const isLast = lastNumber === num;
                  return (
                    <div key={num} className={`flex items-center justify-center rounded-sm text-[9px] font-black transition-all duration-300 ${
                      isLast ? "bg-accent text-white scale-105 shadow-md ring-1 ring-accent/20 z-10" :
                      isDrawn ? "bg-primary text-white" : "bg-muted/30 text-muted-foreground/20 border border-muted/20"
                    }`}>{num}</div>
                  );
                })}
             </div>
             <div className="mt-1.5 pt-1.5 border-t flex justify-between items-center shrink-0">
                <p className="text-[7px] font-black uppercase text-muted-foreground">© LEOBET PRO • Auditoria 365 Dias • Vendas Pendentes Excluídas</p>
                <div className="text-right">
                   <p className="text-[7px] font-black uppercase text-muted-foreground">Tickets Pagos em Jogo</p>
                   <p className="text-[8px] font-black text-primary">{tickets.length} RECIBOS</p>
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


"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, CheckCircle2, RotateCcw } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
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
  
  const [winners, setWinners] = useState<{
    quadra: any[],
    quina: any[],
    bingo: any[]
  }>({ quadra: [], quina: [], bingo: [] });

  const storageKey = useMemo(() => `leobet_progress_${params.id}`, [params.id]);

  // Load Initial Data and Saved Progress
  useEffect(() => {
    // 1. Load Bingo Event Info
    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const current = allBingos.find((b: any) => b.id === params.id);
    setBingo(current);

    // 2. Load Paid Tickets
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    // Normalizing eventId check (some might be string some might be number if ID generation changed)
    const eventReceipts = allReceipts.filter((r: any) => String(r.eventoId) === String(params.id) && r.status === 'pago');
    setTickets(eventReceipts);

    // 3. Restore Progress from LocalStorage
    const savedProgress = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (savedProgress) {
      setDrawnNumbers(savedProgress.drawnNumbers || []);
      setLastNumber(savedProgress.lastNumber || null);
      setWinners(savedProgress.winners || { quadra: [], quina: [], bingo: [] });
      setCurrentPrizeLevel(savedProgress.currentPrizeLevel || 'quadra');
      setFinished(savedProgress.finished || false);
    }
  }, [params.id, storageKey]);

  // Save Progress whenever it changes
  useEffect(() => {
    if (params.id) {
      const progress = {
        drawnNumbers,
        lastNumber,
        winners,
        currentPrizeLevel,
        finished
      };
      localStorage.setItem(storageKey, JSON.stringify(progress));

      // Sync back to bingo object if finished
      if (finished) {
        const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
        const updated = allBingos.map((b: any) => 
          b.id === params.id ? { ...b, status: 'finalizado', bolasSorteadas: drawnNumbers } : b
        );
        localStorage.setItem('leobet_bingos', JSON.stringify(updated));
      }
    }
  }, [drawnNumbers, lastNumber, winners, currentPrizeLevel, finished, params.id, storageKey]);

  const totalArrecadado = useMemo(() => {
    // Somar o valor total de todos os recibos pagos deste evento
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

  const updateTicketStatus = (ticketId: string, status: string, premioIndividual: number, clienteId?: string) => {
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

    // Handle user balance if applicable
    if (clienteId && clienteId !== 'vendedor-direto') {
      const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => {
        if (u.id === clienteId || u.email === clienteId) {
          return { ...u, balance: (u.balance || 0) + premioIndividual };
        }
        return u;
      });
      localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
    }
  };

  const checkWinners = useCallback((drawn: number[]) => {
    if (finished) return;

    const level = currentPrizeLevel;
    const currentRoundWinners: any[] = [];

    // Ensure we are checking for the target level hits
    const targetHits = level === 'bingo' ? 15 : (level === 'quina' ? 5 : 4);

    tickets.forEach(receipt => {
      receipt.tickets.forEach((t: any) => {
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        // Only consider if exactly reaching the hits for the first time
        if (hits === targetHits) {
          const alreadyWinnerAtThisLevel = winners[level].find(w => w.ticketId === t.id);
          if (!alreadyWinnerAtThisLevel) {
            currentRoundWinners.push({ 
              ticketId: t.id, 
              cliente: receipt.cliente, 
              userId: receipt.vendedorRole === 'cliente' ? receipt.vendedorId : 'vendedor-direto' 
            });
          }
        }
      });
    });

    if (currentRoundWinners.length > 0) {
      setIsAuto(false); // Pause for celebration
      const newWinners = { ...winners };
      newWinners[level] = [...newWinners[level], ...currentRoundWinners];
      setWinners(newWinners);

      const premioTotalNivel = premios[level];
      const individual = premioTotalNivel / newWinners[level].length;
      
      // Update all winners of this level with the current split prize
      newWinners[level].forEach(w => {
        updateTicketStatus(w.ticketId, 'ganhou', individual, w.userId);
      });

      toast({
        title: `🔥 GANHADORES DA ${level.toUpperCase()}!`,
        description: `${currentRoundWinners.length} novo(s) premiado(s) detectado(s).`,
      });

      // Advance level logic
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
    if (confirm("Deseja realmente resetar o sorteio atual? Todo o progresso será perdido.")) {
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
    if (isAuto && !finished) interval = setInterval(drawNumber, 2000); // Faster draw
    return () => clearInterval(interval);
  }, [isAuto, finished, drawNumber]);

  if (!bingo) return null;

  return (
    <div className="flex h-screen bg-muted/30 overflow-hidden">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-6">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-black text-xs uppercase">
              <ArrowLeft className="w-4 h-4" /> Voltar
            </Link>
            <Button variant="ghost" onClick={resetSorteio} className="text-[10px] font-black uppercase text-destructive gap-2 h-8">
              <RotateCcw className="w-3 h-3" /> Reiniciar Sorteio
            </Button>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center bg-white rounded-2xl shadow-lg border-t-4 border-t-accent p-4 gap-4">
            <div className="flex-1">
              <h1 className="text-2xl font-black uppercase text-primary leading-none">{bingo.nome}</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mt-1">Arrecadação Bruta: R$ {totalArrecadado.toFixed(2)}</p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <Badge className="text-sm py-1 px-4 bg-primary/10 text-primary font-black border-none h-10 flex items-center">{drawnNumbers.length} / 90 BOLAS</Badge>
              {!finished ? (
                <div className="flex gap-2">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-10 px-6 font-black uppercase rounded-xl transition-all">
                    {isAuto ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-10 px-6 font-black uppercase rounded-xl border-2">Próxima</Button>
                </div>
              ) : (
                <Badge className="bg-green-600 text-white font-black uppercase py-2 px-6 text-xs h-10 flex items-center">BINGO FINALIZADO</Badge>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            {/* Last Number Card */}
            <Card className="lg:col-span-1 bg-primary text-white rounded-3xl shadow-xl flex flex-col items-center justify-center p-6 space-y-4 h-fit">
              <p className="text-[8px] font-black uppercase tracking-[0.5em] opacity-60">Bola Chamada</p>
              <div className="w-32 h-32 rounded-full bg-white text-primary flex items-center justify-center text-6xl font-black border-8 border-accent shadow-xl">
                {lastNumber || '--'}
              </div>
              <Badge className="bg-accent text-white font-black px-4 py-1.5 uppercase text-[9px] tracking-widest rounded-lg">
                 FOCO: {currentPrizeLevel.toUpperCase()}
              </Badge>
            </Card>

            {/* Balls Grid */}
            <div className="lg:col-span-3 space-y-4">
              <Card className="bg-white rounded-3xl shadow-md overflow-hidden border-none p-4">
                <div className="grid grid-cols-10 gap-1.5">
                  {Array.from({ length: 90 }).map((_, i) => {
                    const num = i + 1;
                    const isDrawn = drawnNumbers.includes(num);
                    const isLast = lastNumber === num;
                    return (
                      <div key={num} className={`aspect-square flex items-center justify-center rounded-lg text-[10px] font-black transition-all duration-300 ${
                        isLast ? "bg-accent text-white scale-110 shadow-lg z-10" :
                        isDrawn ? "bg-primary text-white" : "bg-muted text-muted-foreground/30"
                      }`}>{num}</div>
                    );
                  })}
                </div>
              </Card>

              {/* Prizes Grid */}
              <div className="grid grid-cols-3 gap-3">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-2xl transition-all border-none shadow-sm h-fit ${currentPrizeLevel === lvl ? "ring-2 ring-accent scale-100" : "opacity-60"}`}>
                    <CardHeader className="p-3 bg-muted/50 border-b text-center rounded-t-2xl">
                      <p className="text-[8px] font-black uppercase tracking-widest">{lvl}</p>
                      <p className="text-xs font-black text-primary">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </CardHeader>
                    <CardContent className="p-3 min-h-[60px] space-y-1 overflow-y-auto max-h-[120px]">
                      {winners[lvl as keyof typeof winners].length === 0 ? (
                        <p className="text-[8px] text-center text-muted-foreground font-bold uppercase opacity-30 mt-4">Aguardando...</p>
                      ) : (
                        winners[lvl as keyof typeof winners].map((w, i) => (
                          <div key={i} className="text-[9px] font-black uppercase bg-green-50 border border-green-100 p-1.5 rounded-lg flex items-center justify-between text-green-700">
                            <span className="truncate">{w.cliente}</span>
                            <Trophy className="w-2.5 h-2.5 shrink-0" />
                          </div>
                        ))
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


"use client"

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, CheckCircle2 } from 'lucide-react';
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

  useEffect(() => {
    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const current = allBingos.find((b: any) => b.id === params.id);
    setBingo(current);

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const eventReceipts = allReceipts.filter((r: any) => r.eventoId === params.id && r.status === 'pago');
    setTickets(eventReceipts);
  }, [params.id]);

  const totalArrecadado = useMemo(() => {
    return tickets.reduce((acc, r) => acc + r.valorTotal, 0);
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
      if (receipt.eventoId !== params.id) return receipt;
      return {
        ...receipt,
        tickets: receipt.tickets.map((t: any) => 
          t.id === ticketId ? { ...t, status, valorPremio: premioIndividual } : t
        )
      };
    });
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));

    // Se for usuário registrado, credita no saldo agora
    if (clienteId) {
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

    tickets.forEach(receipt => {
      receipt.tickets.forEach((t: any) => {
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        // LÓGICA SEQUENCIAL RESTRITA - Ganhadores de níveis passados não contam novamente no nível atual
        if (level === 'bingo' && hits === 15) {
          if (!winners.bingo.find(w => w.ticketId === t.id)) {
            currentRoundWinners.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId === 'cliente' ? receipt.vendedorId : null });
          }
        } else if (level === 'quina' && hits === 5) {
          if (!winners.quina.find(w => w.ticketId === t.id)) {
            currentRoundWinners.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId === 'cliente' ? receipt.vendedorId : null });
          }
        } else if (level === 'quadra' && hits === 4) {
          if (!winners.quadra.find(w => w.ticketId === t.id)) {
            currentRoundWinners.push({ ticketId: t.id, cliente: receipt.cliente, userId: receipt.vendedorId === 'cliente' ? receipt.vendedorId : null });
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
        updateTicketStatus(w.ticketId, 'ganhou', individual, w.userId);
      });

      toast({
        title: `🔥 GANHADORES DA ${level.toUpperCase()}!`,
        description: `${currentRoundWinners.length} novo(s) premiado(s) detectado(s).`,
      });

      if (level === 'bingo') {
        setFinished(true);
        const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
        const updated = allBingos.map((b: any) => 
          b.id === params.id ? { ...b, status: 'finalizado', bolasSorteadas: drawn } : b
        );
        localStorage.setItem('leobet_bingos', JSON.stringify(updated));
      } else {
        const next = level === 'quadra' ? 'quina' : 'bingo';
        setCurrentPrizeLevel(next);
      }
    }
  }, [tickets, winners, currentPrizeLevel, toast, params.id, finished, premios]);

  const drawNumber = () => {
    if (drawnNumbers.length >= 90 || finished) return;
    let num;
    do { num = Math.floor(Math.random() * 90) + 1; } while (drawnNumbers.includes(num));
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    checkWinners(newDrawn);
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && !finished) interval = setInterval(drawNumber, 3500);
    return () => clearInterval(interval);
  }, [isAuto, finished, drawNumber]);

  if (!bingo) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Painel de Bingos
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-stretch bg-white rounded-3xl shadow-xl border-t-8 border-t-accent overflow-hidden">
            <div className="p-8 flex-1">
              <h1 className="text-4xl font-black uppercase text-primary leading-none">{bingo.nome}</h1>
              <p className="text-sm font-bold text-muted-foreground mt-2">Arrecadação Bruta: R$ {totalArrecadado.toFixed(2)}</p>
            </div>
            <div className="bg-muted/50 p-8 flex items-center gap-4 border-l">
              <Badge className="text-xl py-2 px-6 bg-white font-black">{drawnNumbers.length} / 90 BOLAS</Badge>
              {!finished && (
                <div className="flex gap-2">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-14 px-8 font-black uppercase rounded-2xl shadow-lg transition-all active:scale-95">
                    {isAuto ? <Pause className="mr-2" /> : <Play className="mr-2" />} {isAuto ? "Pausar" : "Auto"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-14 px-8 font-black uppercase rounded-2xl shadow-lg border-2 border-primary/10">Chamar</Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="bg-primary text-white rounded-[3rem] shadow-2xl flex flex-col items-center justify-center p-12 space-y-8">
              <p className="text-[10px] font-black uppercase tracking-[0.5em] opacity-60">Bola Chamada</p>
              <div className="w-56 h-56 rounded-full bg-white text-primary flex items-center justify-center text-9xl font-black border-[12px] border-accent shadow-2xl">
                {lastNumber || '--'}
              </div>
              <Badge className="bg-accent text-white font-black px-6 py-2 uppercase text-xs tracking-widest rounded-xl">
                 FOCO ATUAL: {currentPrizeLevel.toUpperCase()}
              </Badge>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white rounded-[2.5rem] shadow-lg overflow-hidden border-none">
                <CardContent className="p-8">
                  <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: 90 }).map((_, i) => {
                      const num = i + 1;
                      const isDrawn = drawnNumbers.includes(num);
                      const isLast = lastNumber === num;
                      return (
                        <div key={num} className={`aspect-square flex items-center justify-center rounded-2xl text-xs font-black transition-all duration-300 ${
                          isLast ? "bg-accent text-white scale-110 shadow-xl z-10" :
                          isDrawn ? "bg-primary text-white" : "bg-muted text-muted-foreground/20"
                        }`}>{num}</div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-3 gap-4">
                {['quadra', 'quina', 'bingo'].map((lvl: any) => (
                  <Card key={lvl} className={`rounded-[2rem] transition-all border-none shadow-md ${currentPrizeLevel === lvl ? "ring-4 ring-accent scale-105 z-10" : "opacity-60 grayscale-[50%]"}`}>
                    <CardHeader className="p-4 bg-muted/50 border-b text-center rounded-t-[2rem]">
                      <p className="text-[10px] font-black uppercase tracking-widest">{lvl}</p>
                      <p className="text-sm font-black text-primary">R$ {premios[lvl as keyof typeof premios].toFixed(2)}</p>
                    </CardHeader>
                    <CardContent className="p-4 min-h-[120px] space-y-2 overflow-y-auto max-h-[200px]">
                      {winners[lvl as keyof typeof winners].map((w, i) => (
                        <div key={i} className="text-[10px] font-black uppercase bg-green-50 border border-green-200 p-2 rounded-xl flex items-center justify-between text-green-700">
                          <span className="truncate">{w.cliente}</span>
                          <Trophy className="w-3 h-3 shrink-0" />
                        </div>
                      ))}
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

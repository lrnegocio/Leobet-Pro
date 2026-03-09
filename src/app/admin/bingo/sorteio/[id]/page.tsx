
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, Trophy } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export default function SorteioPage({ params }: { params: { id: string } }) {
  const { toast } = useToast();
  const [bingo, setBingo] = useState<any>(null);
  const [tickets, setTickets] = useState<any[]>([]);
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isAuto, setIsAuto] = useState(false);
  
  const [winners, setWinners] = useState<{
    quadra: any[],
    quina: any[],
    bingo: any[]
  }>({ quadra: [], quina: [], bingo: [] });

  const [currentPrizeLevel, setCurrentPrizeLevel] = useState<'quadra' | 'quina' | 'bingo'>('quadra');

  useEffect(() => {
    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    const current = allBingos.find((b: any) => b.id === params.id);
    setBingo(current);

    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const eventTickets = allTickets.filter((t: any) => t.eventoId === params.id);
    setTickets(eventTickets);
  }, [params.id]);

  const checkWinners = useCallback((drawn: number[]) => {
    const newWinners = { ...winners };
    let found = false;

    tickets.forEach(receipt => {
      receipt.tickets.forEach((t: any) => {
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        if (hits >= 4 && !newWinners.quadra.some(w => w.id === t.id)) {
          newWinners.quadra.push({ id: t.id, cliente: receipt.cliente });
          if (currentPrizeLevel === 'quadra') found = true;
        }
        if (hits >= 5 && !newWinners.quina.some(w => w.id === t.id)) {
          newWinners.quina.push({ id: t.id, cliente: receipt.cliente });
          if (currentPrizeLevel === 'quina') found = true;
        }
        if (hits === 15 && !newWinners.bingo.some(w => w.id === t.id)) {
          newWinners.bingo.push({ id: t.id, cliente: receipt.cliente });
          found = true;
        }
      });
    });

    if (found) {
      setIsAuto(false);
      setWinners(newWinners);
      toast({
        title: "🔥 GANHADOR IDENTIFICADO!",
        description: "O sorteio foi pausado para verificação.",
        duration: 10000,
      });
    }
  }, [tickets, winners, currentPrizeLevel, toast]);

  const drawNumber = () => {
    if (drawnNumbers.length >= 90) return;
    
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (drawnNumbers.includes(num));
    
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    
    // Falar o número
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Bola número ${num}`);
      msg.lang = 'pt-BR';
      window.speechSynthesis.speak(msg);
    }

    checkWinners(newDrawn);
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && drawnNumbers.length < 90) {
      interval = setInterval(drawNumber, 3500);
    }
    return () => clearInterval(interval);
  }, [isAuto, drawnNumbers]);

  if (!bingo) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar para Painel
          </Link>

          <div className="flex justify-between items-end bg-white p-6 rounded-2xl shadow-sm border-t-4 border-t-accent">
            <div>
              <p className="text-[10px] font-black uppercase text-accent tracking-widest">Painel de Sorteio Oficial</p>
              <h1 className="text-3xl font-black font-headline uppercase text-primary">{bingo.nome}</h1>
              <p className="text-xs font-bold text-muted-foreground">{new Date(bingo.dataSorteio).toLocaleString('pt-BR')}</p>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="outline" className="text-lg py-1 px-4">{drawnNumbers.length} / 90 Bolas</Badge>
              <div className="flex gap-2">
                <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-12 uppercase font-black">
                  {isAuto ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isAuto ? "Pausar" : "Automático"}
                </Button>
                <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-12 uppercase font-black">
                  Sortear Próxima
                </Button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-1 bg-primary text-white overflow-hidden">
              <CardHeader className="border-b border-white/10">
                <CardTitle className="text-center text-sm font-black uppercase tracking-widest">Última Bola</CardTitle>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center justify-center space-y-6">
                <div className="w-48 h-48 rounded-full bg-white text-primary flex items-center justify-center text-8xl font-black shadow-2xl border-8 border-accent bingo-ball-pulse">
                  {lastNumber || '--'}
                </div>
                <div className="text-center">
                  <p className="text-accent font-black text-xl uppercase tracking-tighter">
                    {lastNumber ? `BOLA NÚMERO ${lastNumber}` : 'AGUARDANDO'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-6">
              <Card className="bg-white">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase">Painel Geral (1-90)</CardTitle>
                  <Button variant="ghost" size="sm" onClick={() => { setDrawnNumbers([]); setLastNumber(null); setWinners({ quadra: [], quina: [], bingo: [] }); }} className="text-muted-foreground">
                    <RotateCcw className="w-3 h-3 mr-1" /> Reiniciar
                  </Button>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-10 gap-1.5">
                    {Array.from({ length: 90 }).map((_, i) => {
                      const num = i + 1;
                      const isDrawn = drawnNumbers.includes(num);
                      return (
                        <div
                          key={num}
                          className={`aspect-square flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${
                            isDrawn 
                              ? "bg-accent text-white scale-110 shadow-md ring-2 ring-accent ring-offset-1" 
                              : "bg-muted text-muted-foreground/30"
                          }`}
                        >
                          {num}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={currentPrizeLevel === 'quadra' ? "border-2 border-accent" : ""}>
                  <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-center">Quadra (20%)</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {winners.quadra.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded text-[10px] font-black uppercase text-green-700 animate-bounce">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.quadra.length === 0 && <p className="text-[10px] text-center text-muted-foreground italic">Nenhum ganhador</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card className={currentPrizeLevel === 'quina' ? "border-2 border-accent" : ""}>
                  <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-center">Quina (30%)</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {winners.quina.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded text-[10px] font-black uppercase text-green-700 animate-bounce">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.quina.length === 0 && <p className="text-[10px] text-center text-muted-foreground italic">Nenhum ganhador</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card className={currentPrizeLevel === 'bingo' ? "border-2 border-accent" : ""}>
                  <CardHeader className="p-4"><CardTitle className="text-xs font-black uppercase text-center">Bingo (50%)</CardTitle></CardHeader>
                  <CardContent className="px-4 pb-4">
                    <div className="space-y-2">
                      {winners.bingo.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded text-[10px] font-black uppercase text-green-700 animate-bounce">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.bingo.length === 0 && <p className="text-[10px] text-center text-muted-foreground italic">Nenhum ganhador</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              <div className="flex justify-center gap-4">
                 <Button variant={currentPrizeLevel === 'quadra' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('quadra')} className="font-black uppercase text-xs">Focar Quadra</Button>
                 <Button variant={currentPrizeLevel === 'quina' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('quina')} className="font-black uppercase text-xs">Focar Quina</Button>
                 <Button variant={currentPrizeLevel === 'bingo' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('bingo')} className="font-black uppercase text-xs">Focar Bingo</Button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

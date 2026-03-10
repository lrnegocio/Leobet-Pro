
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, Trophy, CheckCircle2, Volume2 } from 'lucide-react';
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

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    // Filtra apenas os recibos/tickets deste evento específico que estão PAGOS
    const eventReceipts = allReceipts.filter((r: any) => r.eventoId === params.id && r.status === 'pago');
    setTickets(eventReceipts);
  }, [params.id]);

  const updateTicketStatus = (ticketId: string, status: string) => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allReceipts.map((receipt: any) => ({
      ...receipt,
      tickets: receipt.tickets.map((t: any) => 
        t.id === ticketId ? { ...t, status } : t
      )
    }));
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(text);
      msg.lang = 'pt-BR';
      msg.rate = 0.9;
      window.speechSynthesis.speak(msg);
    }
  };

  const checkWinners = useCallback((drawn: number[]) => {
    if (finished) return;

    const newWinners = { ...winners };
    let foundBingoWinner = false;
    let foundAnyWinner = false;

    tickets.forEach(receipt => {
      receipt.tickets.forEach((t: any) => {
        // Ignora se já ganhou o prêmio máximo (Bingo)
        if (newWinners.bingo.some(w => w.ticketId === t.id)) return;
        
        const hits = t.numeros.filter((n: number) => drawn.includes(n)).length;
        
        // Prioridade 1: Bingo (15 pontos)
        if (hits === 15 && !newWinners.bingo.some(w => w.ticketId === t.id)) {
          newWinners.bingo.push({ ticketId: t.id, cliente: receipt.cliente });
          updateTicketStatus(t.id, 'ganhou');
          foundBingoWinner = true;
          foundAnyWinner = true;
          speak(`BINGO! Temos um ganhador do prêmio máximo: ${receipt.cliente}`);
        }
        
        // Prioridade 2: Quina (5 pontos)
        else if (hits >= 5 && !newWinners.quina.some(w => w.ticketId === t.id)) {
          newWinners.quina.push({ ticketId: t.id, cliente: receipt.cliente });
          updateTicketStatus(t.id, 'ganhou');
          if (currentPrizeLevel === 'quina') {
            foundAnyWinner = true;
            speak(`QUINA! Ganhador: ${receipt.cliente}`);
          }
        }
        
        // Prioridade 3: Quadra (4 pontos)
        else if (hits >= 4 && !newWinners.quadra.some(w => w.ticketId === t.id)) {
          newWinners.quadra.push({ ticketId: t.id, cliente: receipt.cliente });
          updateTicketStatus(t.id, 'ganhou');
          if (currentPrizeLevel === 'quadra') {
            foundAnyWinner = true;
            speak(`QUADRA! Ganhador: ${receipt.cliente}`);
          }
        }
      });
    });

    if (foundAnyWinner || foundBingoWinner) {
      setIsAuto(false); // PAUSA AUTOMÁTICA
      setWinners(newWinners);
      
      const title = foundBingoWinner ? "🏆 BINGO FINALIZADO!" : "🔥 NOVO GANHADOR!";
      const latestWinner = foundBingoWinner 
        ? newWinners.bingo[newWinners.bingo.length - 1]
        : (currentPrizeLevel === 'quina' ? newWinners.quina[newWinners.quina.length - 1] : newWinners.quadra[newWinners.quadra.length - 1]);

      toast({
        title,
        description: `CLIENTE: ${latestWinner?.cliente} ACABA DE GANHAR!`,
        duration: 10000,
      });

      if (foundBingoWinner) {
        setFinished(true);
        const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
        const updated = allBingos.map((b: any) => 
          b.id === params.id ? { ...b, status: 'finalizado', bolasSorteadas: drawn } : b
        );
        localStorage.setItem('leobet_bingos', JSON.stringify(updated));
      }
    }
  }, [tickets, winners, currentPrizeLevel, toast, params.id, finished]);

  const drawNumber = () => {
    if (drawnNumbers.length >= 90 || finished) return;
    
    let num;
    do {
      num = Math.floor(Math.random() * 90) + 1;
    } while (drawnNumbers.includes(num));
    
    const newDrawn = [num, ...drawnNumbers];
    setDrawnNumbers(newDrawn);
    setLastNumber(num);
    
    speak(`Número ${num}`);
    checkWinners(newDrawn);
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && drawnNumbers.length < 90 && !finished) {
      interval = setInterval(drawNumber, 4000);
    }
    return () => clearInterval(interval);
  }, [isAuto, drawnNumbers, finished, drawNumber]);

  if (!bingo) return null;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Link href="/admin/bingo" className="flex items-center gap-2 text-primary hover:underline font-bold">
            <ArrowLeft className="w-4 h-4" /> Voltar ao Painel
          </Link>

          <div className="flex flex-col md:flex-row justify-between items-stretch bg-white rounded-3xl shadow-xl border-t-8 border-t-accent overflow-hidden">
            <div className="p-8 space-y-2 flex-1">
              <p className="text-[10px] font-black uppercase text-accent tracking-[0.3em]">Globo Inteligente LEOBET PRO</p>
              <h1 className="text-4xl font-black font-headline uppercase text-primary leading-none">{bingo.nome}</h1>
              <p className="text-sm font-bold text-muted-foreground">{new Date(bingo.dataSorteio).toLocaleString('pt-BR')}</p>
            </div>
            <div className="bg-muted/50 p-8 flex flex-col justify-center items-center md:items-end gap-4 border-l">
              <Badge variant="outline" className="text-xl py-2 px-6 bg-white shadow-sm font-black border-primary/20">{drawnNumbers.length} / 90 BOLAS</Badge>
              {!finished ? (
                <div className="flex gap-3">
                  <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"} className="h-14 px-8 uppercase font-black rounded-2xl shadow-lg">
                    {isAuto ? <Pause className="w-5 h-5 mr-2" /> : <Play className="w-5 h-5 mr-2" />}
                    {isAuto ? "Pausar" : "Automático"}
                  </Button>
                  <Button onClick={drawNumber} variant="secondary" disabled={isAuto} className="h-14 px-8 uppercase font-black rounded-2xl border-2 border-primary/20">
                    Chamar Bola
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-end gap-2">
                  <Badge className="bg-green-600 text-white py-3 px-6 font-black uppercase text-sm flex gap-3 rounded-2xl shadow-xl">
                    <CheckCircle2 className="w-5 h-5" /> BINGO FINALIZADO
                  </Badge>
                  <p className="text-[10px] font-black uppercase text-muted-foreground">O evento foi encerrado com ganhadores</p>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-1 bg-primary text-white rounded-3xl overflow-hidden shadow-2xl">
              <CardHeader className="border-b border-white/10 text-center py-6">
                <CardTitle className="text-xs font-black uppercase tracking-[0.5em] opacity-60">Bola Atual</CardTitle>
              </CardHeader>
              <CardContent className="p-12 flex flex-col items-center justify-center space-y-8">
                <div className="w-56 h-56 rounded-full bg-white text-primary flex items-center justify-center text-9xl font-black shadow-[0_0_50px_rgba(234,88,12,0.4)] border-[12px] border-accent bingo-ball-pulse">
                  {lastNumber || '--'}
                </div>
                <div className="text-center space-y-2">
                  <p className="text-accent font-black text-2xl uppercase tracking-tighter">
                    {lastNumber ? `BOLA ${lastNumber}` : 'AGUARDANDO...'}
                  </p>
                  <Volume2 className="w-6 h-6 mx-auto opacity-20" />
                </div>
              </CardContent>
            </Card>

            <div className="lg:col-span-2 space-y-8">
              <Card className="bg-white rounded-3xl shadow-lg border-none">
                <CardHeader className="py-6 px-8 border-b">
                  <CardTitle className="text-xs font-black uppercase tracking-widest text-muted-foreground">Mapa de Conferência (1-90)</CardTitle>
                </CardHeader>
                <CardContent className="p-8">
                  <div className="grid grid-cols-10 gap-2">
                    {Array.from({ length: 90 }).map((_, i) => {
                      const num = i + 1;
                      const isDrawn = drawnNumbers.includes(num);
                      const isLast = lastNumber === num;
                      return (
                        <div key={num} className={`aspect-square flex items-center justify-center rounded-full text-xs font-black transition-all duration-300 ${
                          isLast ? "bg-accent text-white scale-125 shadow-2xl ring-4 ring-white" :
                          isDrawn ? "bg-primary text-white shadow-md opacity-100" : 
                          "bg-muted text-muted-foreground/20"
                        }`}>
                          {num}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className={`rounded-2xl transition-all ${currentPrizeLevel === 'quadra' ? "ring-4 ring-accent shadow-xl scale-105 z-10" : "opacity-70"}`}>
                  <CardHeader className="p-4 bg-muted/30 border-b"><CardTitle className="text-[10px] font-black uppercase text-center tracking-widest">Quadra (20%)</CardTitle></CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 min-h-[60px]">
                      {winners.quadra.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-xl text-[10px] font-black uppercase text-green-700 animate-in zoom-in-95">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.quadra.length === 0 && <p className="text-center text-[9px] text-muted-foreground uppercase py-4 font-bold">Sem ganhadores</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card className={`rounded-2xl transition-all ${currentPrizeLevel === 'quina' ? "ring-4 ring-accent shadow-xl scale-105 z-10" : "opacity-70"}`}>
                  <CardHeader className="p-4 bg-muted/30 border-b"><CardTitle className="text-[10px] font-black uppercase text-center tracking-widest">Quina (30%)</CardTitle></CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 min-h-[60px]">
                      {winners.quina.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-green-50 p-2 rounded-xl text-[10px] font-black uppercase text-green-700 animate-in zoom-in-95">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.quina.length === 0 && <p className="text-center text-[9px] text-muted-foreground uppercase py-4 font-bold">Sem ganhadores</p>}
                    </div>
                  </CardContent>
                </Card>
                <Card className={`rounded-2xl transition-all ${currentPrizeLevel === 'bingo' ? "ring-4 ring-accent shadow-xl scale-105 z-10" : "opacity-70"}`}>
                  <CardHeader className="p-4 bg-muted/30 border-b"><CardTitle className="text-[10px] font-black uppercase text-center tracking-widest">Bingo (50%)</CardTitle></CardHeader>
                  <CardContent className="p-4">
                    <div className="space-y-2 min-h-[60px]">
                      {winners.bingo.map((w, i) => (
                        <div key={i} className="flex items-center gap-2 bg-orange-50 p-2 rounded-xl text-[10px] font-black uppercase text-orange-700 ring-2 ring-accent animate-in zoom-in-95">
                          <Trophy className="w-3 h-3" /> {w.cliente}
                        </div>
                      ))}
                      {winners.bingo.length === 0 && <p className="text-center text-[9px] text-muted-foreground uppercase py-4 font-bold">Em disputa</p>}
                    </div>
                  </CardContent>
                </Card>
              </div>
              
              {!finished && (
                <div className="flex justify-center gap-4 bg-white p-4 rounded-2xl shadow-inner border">
                   <Button variant={currentPrizeLevel === 'quadra' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('quadra')} className="font-black uppercase text-[10px] h-10 px-6">Focar Quadra</Button>
                   <Button variant={currentPrizeLevel === 'quina' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('quina')} className="font-black uppercase text-[10px] h-10 px-6">Focar Quina</Button>
                   <Button variant={currentPrizeLevel === 'bingo' ? 'default' : 'outline'} onClick={() => setCurrentPrizeLevel('bingo')} className="font-black uppercase text-[10px] h-10 px-6">Focar Bingo</Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

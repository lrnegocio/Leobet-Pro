
"use client"

import React, { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDoc, useFirestore } from '@/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { Play, Pause, RotateCcw, Volume2, Users, Trophy, Loader2, DollarSign, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

export default function SorteioBingo() {
  const { id } = useParams();
  const db = useFirestore();
  const { toast } = useToast();
  const [autoMode, setAutoMode] = useState(false);
  const [lastBall, setLastBall] = useState<number | null>(null);

  const bingoRef = doc(db, 'bingos', id as string);
  const { data: bingo, loading } = useDoc(bingoRef);

  const speakNumber = (num: number) => {
    if ('speechSynthesis' in window) {
      const msg = new SpeechSynthesisUtterance(`Bola número ${num}`);
      msg.lang = 'pt-BR';
      window.speechSynthesis.speak(msg);
    }
  };

  const drawBall = useCallback(async (manualNum?: number) => {
    if (!bingo) return;
    const drawnBalls = bingo.bolasSorteadas || [];
    if (drawnBalls.length >= 75) {
      setAutoMode(false);
      toast({ title: "Fim do Globo", description: "Todas as bolas já foram sorteadas." });
      return;
    }

    let nextBall: number;
    if (manualNum !== undefined) {
      if (drawnBalls.includes(manualNum)) return;
      nextBall = manualNum;
    } else {
      do {
        nextBall = Math.floor(Math.random() * 75) + 1;
      } while (drawnBalls.includes(nextBall));
    }

    setLastBall(nextBall);
    speakNumber(nextBall);
    
    updateDoc(bingoRef, { 
      bolasSorteadas: arrayUnion(nextBall), 
      status: 'sorteio' 
    });
  }, [bingo, bingoRef, toast]);

  useEffect(() => {
    let interval: any;
    if (autoMode) {
      interval = setInterval(() => drawBall(), 6000);
    }
    return () => clearInterval(interval);
  }, [autoMode, drawBall]);

  if (loading) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin" /></div>;
  if (!bingo) return <div>Bingo não encontrado.</div>;

  const totalBruto = (bingo.vendidas || 0) * (bingo.preco || 0);
  const comissaoCambistas = (bingo.vendidasCambista || 0) * (bingo.preco || 0) * 0.10;
  const taxaOrganizacao = totalBruto * 0.20;
  const apuradoLiquido = totalBruto - taxaOrganizacao - comissaoCambistas;

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex items-center justify-between border-b pb-6">
            <div className="flex items-center gap-4">
              <Link href="/admin/bingo">
                <Button variant="outline" size="icon"><ArrowLeft className="w-4 h-4" /></Button>
              </Link>
              <div>
                <h2 className="text-4xl font-black uppercase text-primary font-headline leading-none">CONCURSO: {bingo.nome}</h2>
                <p className="text-[10px] font-bold text-muted-foreground mt-2 uppercase tracking-widest">Painel de Sorteio Auditado • ID {bingo.id}</p>
              </div>
            </div>
            <div className={`px-6 py-2 rounded-full font-black text-xs uppercase shadow-sm ${bingo.status === 'sorteio' ? 'bg-orange-100 text-orange-600 animate-pulse' : 'bg-muted text-muted-foreground'}`}>
              STATUS: {bingo.status === 'sorteio' ? 'EM ANDAMENTO' : 'AGUARDANDO INÍCIO'}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-primary text-white border-none shadow-lg">
              <CardHeader className="pb-2"><p className="text-[10px] uppercase font-black opacity-70">1º Prêmio: BINGO (50%)</p></CardHeader>
              <CardContent><p className="text-4xl font-black">R$ {(apuradoLiquido * 0.5).toFixed(2)}</p></CardContent>
            </Card>
            <Card className="bg-accent text-white border-none shadow-lg">
              <CardHeader className="pb-2"><p className="text-[10px] uppercase font-black opacity-70">2º Prêmio: QUINA (30%)</p></CardHeader>
              <CardContent><p className="text-4xl font-black">R$ {(apuradoLiquido * 0.3).toFixed(2)}</p></CardContent>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-lg">
              <CardHeader className="pb-2"><p className="text-[10px] uppercase font-black opacity-70">3º Prêmio: QUADRA (20%)</p></CardHeader>
              <CardContent><p className="text-4xl font-black">R$ {(apuradoLiquido * 0.2).toFixed(2)}</p></CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <Card className="lg:col-span-1 bg-white">
              <CardHeader><CardTitle className="text-sm font-black uppercase">CONTROLE DO GLOBO</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="p-12 bg-primary rounded-3xl text-center text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 left-0 w-full h-2 bg-white/20 animate-pulse"></div>
                  <p className="text-9xl font-black leading-none">{lastBall || '--'}</p>
                  <p className="text-[10px] opacity-60 uppercase font-black mt-4 tracking-widest">Última Bola</p>
                </div>
                
                <div className="flex flex-col gap-3">
                  <Button className="w-full h-14 font-black text-lg uppercase tracking-tight shadow-md" onClick={() => setAutoMode(!autoMode)}>
                    {autoMode ? <Pause className="mr-2" /> : <Play className="mr-2" />} {autoMode ? 'PAUSAR AUTOMÁTICO' : 'INICIAR GLOBO'}
                  </Button>
                  <p className="text-[9px] text-center text-muted-foreground uppercase font-bold">Clique em uma bola do painel para sorteio manual.</p>
                </div>

                <div className="text-xs p-5 bg-muted rounded-2xl space-y-3">
                  <div className="flex justify-between"><span>ARRECADAÇÃO:</span> <b className="font-code">R$ {totalBruto.toFixed(2)}</b></div>
                  <div className="flex justify-between text-destructive"><span>COMISSÕES:</span> <b className="font-code">- R$ {comissaoCambistas.toFixed(2)}</b></div>
                  <div className="flex justify-between text-blue-600"><span>ORG (20%):</span> <b className="font-code">- R$ {taxaOrganizacao.toFixed(2)}</b></div>
                  <div className="border-t border-muted-foreground/20 pt-3 flex justify-between font-black text-base uppercase"><span>LÍQUIDO:</span> <span className="font-code text-primary">R$ {apuradoLiquido.toFixed(2)}</span></div>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 bg-white">
              <CardContent className="pt-6">
                <div className="grid grid-cols-5 md:grid-cols-10 gap-3">
                  {Array.from({ length: 75 }, (_, i) => i + 1).map((num) => {
                    const sorteadas = bingo.bolasSorteadas || [];
                    const isSorteada = sorteadas.includes(num);
                    return (
                      <button
                        key={num}
                        onClick={() => drawBall(num)}
                        disabled={isSorteada}
                        className={`h-14 w-14 rounded-full font-black transition-all flex items-center justify-center text-lg border-2 shadow-sm ${
                          isSorteada 
                            ? 'bg-accent text-white border-accent shadow-lg scale-110 z-10' 
                            : 'bg-white border-muted-foreground/10 hover:border-primary hover:text-primary'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-12 pt-8 border-t flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="bg-primary/10 p-2 rounded-lg">
                      <Users className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Auditores On</p>
                      <span className="text-lg font-black text-primary">{bingo.vendidas} CARTELAS VÁLIDAS</span>
                    </div>
                  </div>
                  <Button variant="outline" className="text-destructive font-black h-12 px-8 uppercase tracking-widest border-destructive/20 hover:bg-destructive/10" onClick={() => {
                    updateDoc(bingoRef, { status: 'encerrado' });
                    toast({ title: "Bingo Encerrado" });
                  }}>
                    FINALIZAR SORTEIO
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

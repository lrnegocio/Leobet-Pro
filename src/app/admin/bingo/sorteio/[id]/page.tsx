"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Play, Pause, RotateCcw, Volume2 } from 'lucide-react';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';

export default function SorteioPage({ params }: { params: { id: string } }) {
  const [bingoName, setBingoName] = useState('BINGO ESPECIAL #001');
  const [drawnNumbers, setDrawnNumbers] = useState<number[]>([]);
  const [lastNumber, setLastNumber] = useState<number | null>(null);
  const [isAuto, setIsAuto] = useState(false);

  // Simula busca do nome do bingo
  useEffect(() => {
    // Aqui viria a busca no Firebase
    setBingoName(`CONCURSO: ${params.id === '1' ? 'Bingo de Inauguração' : 'Sorteio de Sábado'}`);
  }, [params.id]);

  const drawNumber = () => {
    if (drawnNumbers.length >= 75) return;
    
    let num;
    do {
      num = Math.floor(Math.random() * 75) + 1;
    } while (drawnNumbers.includes(num));
    
    setDrawnNumbers(prev => [num, ...prev]);
    setLastNumber(num);
  };

  useEffect(() => {
    let interval: any;
    if (isAuto && drawnNumbers.length < 75) {
      interval = setInterval(drawNumber, 3000);
    }
    return () => clearInterval(interval);
  }, [isAuto, drawnNumbers]);

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
              <p className="text-[10px] font-black uppercase text-accent tracking-widest">Painel de Sorteio</p>
              <h1 className="text-3xl font-black font-headline uppercase text-primary">{bingoName}</h1>
            </div>
            <div className="text-right space-y-2">
              <Badge variant="outline" className="text-lg py-1 px-4">{drawnNumbers.length} / 75 Bolas</Badge>
              <div className="flex gap-2">
                <Button onClick={() => setIsAuto(!isAuto)} variant={isAuto ? "destructive" : "default"}>
                  {isAuto ? <Pause className="w-4 h-4 mr-2" /> : <Play className="w-4 h-4 mr-2" />}
                  {isAuto ? "Pausar Automático" : "Sorteio Automático"}
                </Button>
                <Button onClick={drawNumber} variant="secondary" disabled={isAuto}>
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
                    {lastNumber ? `BOLA NÚMERO ${lastNumber}` : 'AGUARDANDO INÍCIO'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 bg-white">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-black uppercase">Painel Geral</CardTitle>
                <Button variant="ghost" size="sm" onClick={() => { setDrawnNumbers([]); setLastNumber(null); }} className="text-muted-foreground">
                  <RotateCcw className="w-3 h-3 mr-1" /> Reiniciar
                </Button>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 gap-2">
                  {Array.from({ length: 75 }).map((_, i) => {
                    const num = i + 1;
                    const isDrawn = drawnNumbers.includes(num);
                    return (
                      <div
                        key={num}
                        className={`aspect-square flex items-center justify-center rounded-full text-xs font-bold transition-all ${
                          isDrawn 
                            ? "bg-accent text-white scale-110 shadow-md ring-2 ring-accent ring-offset-2" 
                            : "bg-muted text-muted-foreground/40"
                        }`}
                      >
                        {num}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

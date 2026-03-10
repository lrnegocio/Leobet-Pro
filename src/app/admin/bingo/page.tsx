
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Lock, PlayCircle, Settings2, Trash2, Clock, CheckCircle2, TrendingUp, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BingoPage() {
  const [bingos, setBingos] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    setBingos(stored);
  }, []);

  const toggleStatus = (id: string) => {
    const updated = bingos.map(b => 
      b.id === id ? { ...b, status: b.status === 'aberto' ? 'encerrado' : 'aberto' } : b
    );
    setBingos(updated);
    localStorage.setItem('leobet_bingos', JSON.stringify(updated));
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Gestão de Bingos</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base Permanente • Sem Exclusão de Histórico</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase h-12 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Criar Concurso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bingos.map((bingo) => {
              const now = new Date();
              const drawDate = new Date(bingo.dataSorteio);
              const closeTime = new Date(drawDate.getTime() - 60000); // 1 min antes
              const isSalesClosed = bingo.status === 'encerrado' || bingo.status === 'finalizado' || now >= closeTime;
              const isFinished = bingo.status === 'finalizado';
              
              return (
                <Card key={bingo.id} className={`hover:shadow-md transition-all border-l-4 overflow-hidden ${isFinished ? 'border-l-green-600 opacity-80' : 'border-l-primary'}`}>
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                       <div className="p-6 flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black uppercase text-primary leading-none">{bingo.nome}</h3>
                            <Badge variant={isFinished ? 'secondary' : (isSalesClosed ? 'destructive' : 'default')} className="font-black text-[9px] uppercase">
                              {isFinished ? 'Finalizado' : (isSalesClosed ? 'Vendas Encerradas' : 'Em Aberto')}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Sorteio</p>
                               <p className="text-xs font-bold flex items-center gap-1">
                                 <Clock className="w-3 h-3 text-accent" /> {drawDate.toLocaleString('pt-BR')}
                               </p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Preço</p>
                               <p className="text-xs font-black text-primary">R$ {(bingo.preco || 0).toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Vendidos</p>
                               <p className="text-xs font-black">{bingo.vendidas || 0}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Status Base</p>
                               <p className="text-[9px] font-black uppercase text-primary/60">{bingo.status}</p>
                            </div>
                          </div>
                       </div>

                       <div className="bg-muted/50 p-6 flex items-center gap-3 border-l shrink-0">
                          <div className="flex flex-col gap-2 min-w-[140px]">
                             {!isFinished && (
                               <Button 
                                  variant="outline" 
                                  size="sm" 
                                  className="font-black text-[10px] uppercase gap-2 h-9 border-primary/20"
                                  onClick={() => toggleStatus(bingo.id)}
                               >
                                  {isSalesClosed ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3 text-orange-600" />}
                                  {isSalesClosed ? "Reabrir" : "Fechar Vendas"}
                               </Button>
                             )}
                             
                             <Link href={isFinished ? `/admin/financeiro` : `/admin/bingo/sorteio/${bingo.id}`}>
                               <Button 
                                 className={`w-full gap-2 font-black uppercase text-xs h-10 shadow-sm ${isFinished ? 'bg-green-600 hover:bg-green-700' : 'bg-primary'}`}
                                 disabled={!isSalesClosed && !isFinished}
                               >
                                 {isFinished ? <History className="w-4 h-4" /> : <PlayCircle className="w-4 h-4" />}
                                 {isFinished ? "Ver Auditoria" : "Abrir Globo"}
                                </Button>
                             </Link>
                          </div>
                          <div className="flex flex-col gap-2">
                             <Button variant="secondary" size="icon" className="h-9 w-9">
                               <Settings2 className="w-4 h-4 text-primary" />
                             </Button>
                             <p className="text-[8px] font-black uppercase text-muted-foreground/40 text-center">ID: {bingo.id.substring(0, 4)}</p>
                          </div>
                       </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {bingos.length === 0 && (
              <Card>
                <CardContent className="py-24 text-center">
                  <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
                    <TrendingUp className="w-8 h-8" />
                  </div>
                  <h3 className="font-black uppercase text-muted-foreground tracking-widest text-xs">Nenhum bingo cadastrado na base</h3>
                  <Link href="/admin/bingo/novo" className="mt-6 block">
                    <Button variant="link" className="text-primary font-black uppercase text-xs">Criar Primeiro Concurso</Button>
                  </Link>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

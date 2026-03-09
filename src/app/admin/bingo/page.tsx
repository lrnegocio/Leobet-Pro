
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Lock, PlayCircle, Settings2, Trash2, Clock, CheckCircle2, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BingoPage() {
  const [bingos, setBingos] = useState<any[]>([]);

  const toggleStatus = (id: string) => {
    setBingos(prev => prev.map(b => 
      b.id === id ? { ...b, status: b.status === 'aberto' ? 'encerrado' : 'aberto' } : b
    ));
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Bingos Cadastrados</h1>
              <p className="text-muted-foreground">Gerenciamento de sorteios e vendas</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase h-12">
                <Plus className="w-4 h-4" /> Novo Concurso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bingos.map((bingo) => {
              const now = new Date();
              const drawDate = new Date(bingo.dataSorteio);
              const closeTime = new Date(drawDate.getTime() - 60000); // 1 min antes
              const isTimeReady = now >= closeTime;
              const isSalesClosed = bingo.status === 'encerrado' || now >= drawDate;
              const canStartDraw = isSalesClosed || isTimeReady;
              
              const totalArrecadado = (bingo.vendidas || 0) * (bingo.preco || 0);
              const premioLiquido = totalArrecadado * 0.65;
              
              return (
                <Card key={bingo.id} className="hover:shadow-md transition-all border-l-4 border-l-primary overflow-hidden">
                  <CardContent className="p-0">
                    <div className="flex flex-col md:flex-row items-stretch">
                       <div className="p-6 flex-1 space-y-4">
                          <div className="flex items-center gap-3">
                            <h3 className="text-2xl font-black uppercase text-primary leading-none">{bingo.nome}</h3>
                            <Badge variant={isSalesClosed ? 'secondary' : 'default'} className="font-black text-[9px] uppercase">
                              {isSalesClosed ? 'Encerrado' : 'Em Aberto'}
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Data/Hora Sorteio</p>
                               <p className="text-xs font-bold flex items-center gap-1">
                                 <Clock className="w-3 h-3 text-accent" /> {drawDate.toLocaleString('pt-BR')}
                               </p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Arrecadado</p>
                               <p className="text-xs font-black text-primary">R$ {totalArrecadado.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Prêmio Atual</p>
                               <p className="text-xs font-black text-green-600">R$ {premioLiquido.toFixed(2)}</p>
                            </div>
                            <div className="space-y-1">
                               <p className="text-[9px] font-black uppercase text-muted-foreground">Bilhetes</p>
                               <p className="text-xs font-black">{bingo.vendidas || 0}</p>
                            </div>
                          </div>
                       </div>

                       <div className="bg-muted/50 p-6 flex items-center gap-3 border-l shrink-0">
                          <div className="flex flex-col gap-2">
                             <Button 
                                variant="outline" 
                                size="sm" 
                                className="font-black text-[10px] uppercase gap-2 h-9 border-primary/20"
                                onClick={() => toggleStatus(bingo.id)}
                             >
                                {isSalesClosed ? <CheckCircle2 className="w-3 h-3" /> : <Lock className="w-3 h-3 text-orange-600" />}
                                {isSalesClosed ? "Reabrir" : "Fechar Vendas"}
                             </Button>
                             
                             <Link href={`/admin/bingo/sorteio/${bingo.id}`}>
                               <Button 
                                 className="w-full gap-2 font-black uppercase text-xs h-10 shadow-sm" 
                                 variant={canStartDraw ? 'default' : 'secondary'}
                                 disabled={!canStartDraw}
                               >
                                 {canStartDraw ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                                 Iniciar Globo
                                </Button>
                             </Link>
                          </div>
                          <div className="flex flex-col gap-2">
                             <Button variant="secondary" size="icon" className="h-9 w-9">
                               <Settings2 className="w-4 h-4 text-primary" />
                             </Button>
                             <Button variant="ghost" size="icon" className="h-9 w-9 text-destructive">
                               <Trash2 className="w-4 h-4" />
                             </Button>
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
                  <h3 className="font-black uppercase text-muted-foreground tracking-widest text-xs">Nenhum bingo ativo</h3>
                  <Link href="/admin/bingo/novo" className="mt-6 block">
                    <Button variant="link" className="text-primary font-black uppercase text-xs">Criar agora</Button>
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

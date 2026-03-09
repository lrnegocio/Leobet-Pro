
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Lock, PlayCircle, Settings2, Trash2, Clock, CheckCircle2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data ampliado para demonstrar status
const INITIAL_BINGOS = [
  { id: '1', nome: 'Bingo Inaugural #01', preco: 10, status: 'aberto', dataSorteio: '2026-03-01T20:00', vendidas: 45 },
  { id: '2', nome: 'Bingo Especial Sábado', preco: 25, status: 'encerrado', dataSorteio: '2026-02-25T19:00', vendidas: 150 },
  { id: '3', nome: 'Sorteio da Madrugada', preco: 5, status: 'aberto', dataSorteio: '2026-02-28T23:30', vendidas: 12 },
];

export default function BingoPage() {
  const [bingos, setBingos] = useState(INITIAL_BINGOS);

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
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight">Gerenciar Bingos</h1>
              <p className="text-muted-foreground">Controle de sorteios, vendas e globos virtuais</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase">
                <Plus className="w-4 h-4" /> Novo Concurso
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bingos.map((bingo) => {
              const now = new Date();
              const drawDate = new Date(bingo.dataSorteio);
              const isTimeReady = drawDate <= now;
              const isSalesClosed = bingo.status === 'encerrado';
              const canStartDraw = isSalesClosed || isTimeReady;
              
              return (
                <Card key={bingo.id} className="hover:shadow-md transition-all border-l-4 border-l-primary">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black uppercase text-primary">{bingo.nome}</h3>
                          <Badge variant={bingo.status === 'aberto' ? 'default' : 'secondary'} className="font-black">
                            {bingo.status === 'aberto' ? 'VENDAS ABERTAS' : 'VENDAS ENCERRADAS'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-4 text-xs font-bold text-muted-foreground uppercase">
                          <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {drawDate.toLocaleString('pt-BR')}</span>
                          <span className="flex items-center gap-1"><Plus className="w-3 h-3" /> {bingo.vendidas} Cartelas</span>
                          <span className="text-accent">R$ {bingo.preco.toFixed(2)} / Cartela</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="font-black text-[10px] uppercase gap-1"
                          onClick={() => toggleStatus(bingo.id)}
                        >
                          {bingo.status === 'aberto' ? <Lock className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
                          {bingo.status === 'aberto' ? "Fechar Vendas" : "Abrir Vendas"}
                        </Button>
                        
                        <Link href={`/admin/bingo/sorteio/${bingo.id}`} className="flex-1 md:flex-none">
                          <Button 
                            className="w-full gap-2 font-black uppercase text-xs h-9" 
                            variant={canStartDraw ? 'default' : 'secondary'}
                            disabled={!canStartDraw}
                          >
                            {canStartDraw ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            Iniciar Sorteio
                          </Button>
                        </Link>
                        
                        <Button variant="ghost" size="icon" title="Editar">
                          <Settings2 className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="icon" title="Excluir" className="text-destructive">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {!canStartDraw && (
                      <p className="text-[9px] text-orange-600 font-black uppercase mt-3 flex items-center gap-1">
                        <Lock className="w-2.5 h-2.5" /> O sorteio está bloqueado até o fechamento das vendas ou horário marcado.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}

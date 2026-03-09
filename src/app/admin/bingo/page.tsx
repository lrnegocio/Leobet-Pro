"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Grid3X3, Lock, PlayCircle, Settings2, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

// Mock data for testing
const INITIAL_BINGOS = [
  { id: '1', nome: 'Bingo de Inauguração', preco: 10, status: 'aberto', dataSorteio: '2026-03-01T20:00', vendidas: 45 },
  { id: '2', nome: 'Sorteio Especial de Sábado', preco: 25, status: 'fechado', dataSorteio: '2026-02-25T19:00', vendidas: 100 },
];

export default function BingoPage() {
  const [bingos, setBingos] = useState(INITIAL_BINGOS);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight">Bingos</h1>
              <p className="text-muted-foreground">Gerencie todos os sorteios e concursos</p>
            </div>
            <Link href="/admin/bingo/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4" /> Novo Bingo
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {bingos.map((bingo) => {
              const canDraw = bingo.status === 'fechado' || new Date(bingo.dataSorteio) <= new Date();
              
              return (
                <Card key={bingo.id} className="hover:shadow-md transition-all">
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <h3 className="text-xl font-black uppercase">{bingo.nome}</h3>
                          <Badge variant={bingo.status === 'aberto' ? 'default' : 'secondary'}>
                            {bingo.status === 'aberto' ? 'VENDAS ABERTAS' : 'AGUARDANDO SORTEIO'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Data: {new Date(bingo.dataSorteio).toLocaleString('pt-BR')} • {bingo.vendidas} cartelas vendidas
                        </p>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        <Link href={`/admin/bingo/sorteio/${bingo.id}`} className="flex-1 md:flex-none">
                          <Button 
                            className="w-full gap-2 font-bold" 
                            variant={canDraw ? 'default' : 'outline'}
                            disabled={!canDraw}
                          >
                            {canDraw ? <PlayCircle className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                            Iniciar Sorteio
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Editar">
                          <Settings2 className="w-4 h-4" />
                        </Button>
                        <Button variant="destructive" size="icon" title="Excluir">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    
                    {!canDraw && (
                      <p className="text-[10px] text-orange-600 font-bold uppercase mt-2">
                        * O sorteio só poderá ser iniciado após o encerramento das vendas ou atingir o horário marcado.
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}

            {bingos.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum bingo criado ainda. Clique em "Novo Bingo" para começar!
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

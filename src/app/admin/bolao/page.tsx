
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy, Settings2, Trash2, Eye, Calendar, Users, XCircle, History, Clock, FileEdit } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BolaoPage() {
  const [boloes, setBoloes] = useState<any[]>([]);

  const loadData = () => {
    const stored = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    setBoloes(stored);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const deleteBolao = (id: string) => {
    if (confirm("Deseja excluir este Bolão?")) {
      const updated = boloes.filter(b => b.id !== id);
      setBoloes(updated);
      localStorage.setItem('leobet_boloes', JSON.stringify(updated));
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Gestão de Bolões</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base Permanente • Trava 1 min antes da 1ª partida</p>
            </div>
            <Link href="/admin/bolao/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase h-12 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Criar Bolão
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {boloes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map((bolao) => {
              const now = new Date();
              const startDate = new Date(bolao.dataFim); 
              const limit = new Date(startDate.getTime() - 60000);
              const isSalesClosed = bolao.status === 'finalizado' || bolao.status === 'encerrado' || now >= limit;
              const isFinished = bolao.status === 'finalizado' || bolao.status === 'encerrado';
              const numPartidas = Array.isArray(bolao.partidas) ? bolao.partidas.length : 0;
              
              return (
                <Card key={bolao.id} className={`hover:shadow-md transition-all border-l-4 overflow-hidden ${isFinished ? 'border-l-green-600' : 'border-l-accent'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black uppercase text-primary leading-none">{bolao.nome}</h3>
                          <Badge variant={isFinished ? 'secondary' : (isSalesClosed ? 'destructive' : 'default')} className="font-black text-[10px] uppercase">
                            {isFinished ? 'Auditado' : (isSalesClosed ? 'Aguardando Resultados' : 'Vendas Abertas')}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Clock className="w-3.5 h-3.5 text-accent" />
                            <span>Início: {startDate.toLocaleString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Trophy className="w-3.5 h-3.5 text-accent" />
                            <span>{numPartidas} Jogos</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Users className="w-3.5 h-3.5 text-accent" />
                            <span>{bolao.vendidas || 0} Apostas</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-black uppercase text-primary">
                            <span className="bg-primary/10 px-2 py-1 rounded">R$ {(bolao.preco || 0).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <Link href={`/admin/bolao/resultados/${bolao.id}`}>
                          <Button className={`gap-2 font-black uppercase text-xs h-10 shadow-sm ${isFinished ? 'bg-green-600 hover:bg-green-700' : 'bg-accent hover:bg-accent/90'}`}>
                            {isFinished ? <History className="w-4 h-4" /> : <FileEdit className="w-4 h-4" />}
                            {isFinished ? "Ver Auditoria" : "Lançar Placares"}
                          </Button>
                        </Link>
                        <Button variant="ghost" size="icon" onClick={() => deleteBolao(bolao.id)} className="h-10 w-10 text-destructive hover:bg-destructive/10">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}

            {boloes.length === 0 && (
              <Card>
                <CardContent className="py-20 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">Nenhum bolão ativo</p>
                  <Link href="/admin/bolao/novo" className="mt-4 block">
                    <Button variant="link" className="text-accent font-black uppercase text-xs">Criar Primeiro Bolão</Button>
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

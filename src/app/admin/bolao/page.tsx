
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy, Settings2, Trash2, Eye, Calendar, Users, XCircle, History } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BolaoPage() {
  const [boloes, setBoloes] = useState<any[]>([]);

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('leobet_boloes') || '[]');
    setBoloes(stored);
  }, []);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Gestão de Bolões</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base Permanente • Resultados Auditados</p>
            </div>
            <Link href="/admin/bolao/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase h-12 rounded-xl shadow-lg">
                <Plus className="w-4 h-4" /> Criar Bolão
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {boloes.map((bolao) => {
              const isFinished = bolao.status === 'finalizado' || bolao.status === 'encerrado';
              return (
                <Card key={bolao.id} className={`hover:shadow-md transition-all border-l-4 overflow-hidden ${isFinished ? 'border-l-green-600 opacity-80' : 'border-l-accent'}`}>
                  <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                      <div className="space-y-3 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-black uppercase text-primary leading-none">{bolao.nome}</h3>
                          <Badge variant={isFinished ? 'secondary' : 'default'} className="font-black text-[10px] uppercase">
                            {isFinished ? 'Encerrado' : 'Em Aberto'}
                          </Badge>
                        </div>
                        
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Calendar className="w-3.5 h-3.5 text-accent" />
                            <span>Início: {new Date(bolao.dataFim).toLocaleDateString('pt-BR')}</span>
                          </div>
                          <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                            <Trophy className="w-3.5 h-3.5 text-accent" />
                            <span>{bolao.partidas || 0} Partidas</span>
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
                        <Link href={isFinished ? "/admin/financeiro" : "#"}>
                          <Button variant="outline" className={`gap-2 font-black uppercase text-xs h-10 ${isFinished ? 'border-green-600 text-green-600' : ''}`}>
                            {isFinished ? <History className="w-4 h-4" /> : <Eye className="w-4 h-4 text-accent" />}
                            {isFinished ? "Ver Resultados" : "Lançar Placar"}
                          </Button>
                        </Link>
                        <Button variant="outline" size="icon" title="Editar" className="hover:border-primary h-10 w-10">
                          <Settings2 className="w-4 h-4 text-primary" />
                        </Button>
                        <p className="text-[8px] font-black uppercase text-muted-foreground/30 ml-2">ID: {bolao.id.substring(0, 4)}</p>
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
                  <p className="font-bold uppercase tracking-widest text-xs">Nenhum bolão ativo no momento</p>
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

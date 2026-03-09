
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy, Settings2, Trash2, Eye, Calendar, Users, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MOCK_BOLOES = [
  { id: '1', nome: 'Rodada Brasileirão #10', valor: 5, status: 'aberto', partidas: 8, vendidas: 120, dataFim: '2026-03-01T15:00' },
  { id: '2', nome: 'Final Champions 2026', valor: 50, status: 'aberto', partidas: 1, vendidas: 500, dataFim: '2026-05-30T16:00' },
  { id: '3', nome: 'Clássicos Estaduais', valor: 10, status: 'encerrado', partidas: 4, vendidas: 240, dataFim: '2026-02-20T18:00' },
];

export default function BolaoPage() {
  const [boloes, setBoloes] = useState(MOCK_BOLOES);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tight text-primary">Bolões Esportivos</h1>
              <p className="text-muted-foreground">Gerencie palpites (1, X, 2) e resultados de partidas</p>
            </div>
            <Link href="/admin/bolao/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90 font-black uppercase">
                <Plus className="w-4 h-4" /> Criar Bolão
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {boloes.map((bolao) => (
              <Card key={bolao.id} className="hover:shadow-md transition-all border-l-4 border-l-accent overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex items-center gap-3">
                        <h3 className="text-xl font-black uppercase text-primary leading-none">{bolao.nome}</h3>
                        <Badge variant={bolao.status === 'aberto' ? 'default' : 'secondary'} className="font-black text-[10px] uppercase">
                          {bolao.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5 text-accent" />
                          <span>Fim: {new Date(bolao.dataFim).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                          <Trophy className="w-3.5 h-3.5 text-accent" />
                          <span>{bolao.partidas} Partidas</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-bold uppercase text-muted-foreground">
                          <Users className="w-3.5 h-3.5 text-accent" />
                          <span>{bolao.vendidas} Vendidos</span>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black uppercase text-primary">
                          <span className="bg-primary/10 px-2 py-1 rounded">R$ {bolao.valor.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button variant="outline" className="gap-2 font-black uppercase text-xs h-9">
                        <Eye className="w-4 h-4 text-accent" /> Resultados
                      </Button>
                      <Button variant="outline" size="icon" title="Editar" className="hover:border-primary">
                        <Settings2 className="w-4 h-4 text-primary" />
                      </Button>
                      <Button variant="ghost" size="icon" title="Excluir" className="text-destructive hover:bg-destructive/10">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex items-center gap-2 text-[10px] font-bold uppercase opacity-60">
                    <span className="flex items-center gap-1"><XCircle className="w-3 h-3" /> Suporte a Empate (X) Habilitado</span>
                  </div>
                </CardContent>
              </Card>
            ))}

            {boloes.length === 0 && (
              <Card>
                <CardContent className="py-20 text-center text-muted-foreground">
                  <Trophy className="w-12 h-12 mx-auto mb-4 opacity-10" />
                  <p className="font-bold uppercase tracking-widest text-xs">Nenhum bolão ativo no momento</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

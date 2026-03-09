"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Plus, Trophy, Settings2, Trash2, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const MOCK_BOLOES = [
  { id: '1', nome: 'Rodada Brasileirão #10', valor: 5, status: 'aberto', partidas: 8, vendidas: 120 },
  { id: '2', nome: 'Champions League Final', valor: 20, status: 'encerrado', partidas: 1, vendidas: 500 },
];

export default function BolaoPage() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase">Bolões</h1>
              <p className="text-muted-foreground">Acompanhe resultados e gerencie palpites</p>
            </div>
            <Link href="/admin/bolao/novo">
              <Button className="gap-2 bg-accent hover:bg-accent/90">
                <Plus className="w-4 h-4" /> Novo Bolão
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {MOCK_BOLOES.map((bolao) => (
              <Card key={bolao.id} className="hover:shadow-md transition-all">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-black uppercase">{bolao.nome}</h3>
                        <Badge variant={bolao.status === 'aberto' ? 'default' : 'secondary'}>
                          {bolao.status.toUpperCase()}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Valor: R$ {bolao.valor.toFixed(2)} • {bolao.partidas} Partidas • {bolao.vendidas} Vendidos
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button variant="outline" className="gap-2 font-bold">
                        <Eye className="w-4 h-4" /> Resultados
                      </Button>
                      <Button variant="outline" size="icon" title="Editar">
                        <Settings2 className="w-4 h-4" />
                      </Button>
                      <Button variant="destructive" size="icon" title="Excluir">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {MOCK_BOLOES.length === 0 && (
              <Card>
                <CardContent className="py-12 text-center text-muted-foreground">
                  Nenhum bolão criado ainda. Comece agora!
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

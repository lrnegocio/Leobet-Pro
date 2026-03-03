"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Grid3X3, Clock } from 'lucide-react';
import Link from 'next/link';

export default function ClienteDashboard() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Painel do Apostador</h1>
            <p className="text-muted-foreground">Gerencie suas apostas e acompanhe resultados em tempo real.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <BalanceCard />
              
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    Informativo
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    Confira os eventos dispon��veis abaixo e boa sorte! Todos os sorteios são auditados em tempo real.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Link href="/cliente/bingo">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-l-4 border-l-primary">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg font-bold">Bingos Disponíveis</CardTitle>
                      <Grid3X3 className="w-5 h-5 text-primary" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">0 Ativos</div>
                      <p className="text-xs text-muted-foreground mt-2">Participe agora e ganhe!</p>
                    </CardContent>
                  </Card>
                </Link>

                <Link href="/cliente/bolao">
                  <Card className="hover:shadow-md transition-shadow cursor-pointer bg-white border-l-4 border-l-accent">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-lg font-bold">Bolões Abertos</CardTitle>
                      <Trophy className="w-5 h-5 text-accent" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold">0 Ativos</div>
                      <p className="text-xs text-muted-foreground mt-2">Aposte no seu time favorito!</p>
                    </CardContent>
                  </Card>
                </Link>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="font-headline flex items-center gap-2">
                    <Clock className="w-5 h-5" /> Minhas Apostas Recentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <p>Você ainda não realizou nenhuma aposta.</p>
                    <p className="text-sm mt-2">Escolha um evento acima para começar!</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

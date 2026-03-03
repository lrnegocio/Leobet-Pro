"use client"

import React from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign } from 'lucide-react';

export default function CambistaDashboard() {
  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-bold font-headline">Painel do Cambista</h1>
            <p className="text-muted-foreground">Gerencie suas vendas e comissões</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vendas do Mês</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">0</span>
                  <div className="bg-green-100 p-3 rounded-2xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Comissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">R$ 0</span>
                  <div className="bg-blue-100 p-3 rounded-2xl"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Últimas Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                Nenhuma transação registrada
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

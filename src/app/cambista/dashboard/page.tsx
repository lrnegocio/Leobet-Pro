
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

export default function CambistaDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    vendasHoje: 0,
    comissaoAcumulada: 0,
    ultimasVendas: [] as any[]
  });

  useEffect(() => {
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const mySales = allTickets.filter((t: any) => t.vendedorId === user?.id);
    
    const today = new Date().toISOString().split('T')[0];
    const todaySales = mySales.filter((s: any) => s.data.startsWith(today) && s.status === 'pago');
    
    setStats({
      vendasHoje: todaySales.length,
      comissaoAcumulada: user?.commissionBalance || 0,
      ultimasVendas: mySales.slice(0, 5)
    });
  }, [user]);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary">Painel LEOBET Cambista</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle de Vendas e Comissões</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vendas Hoje (Aprovadas)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.vendasHoje}</span>
                  <div className="bg-green-100 p-3 rounded-2xl"><ShoppingCart className="w-5 h-5 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Minha Comissão Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-primary">R$ {stats.comissaoAcumulada.toFixed(2)}</span>
                  <div className="bg-blue-100 p-3 rounded-2xl"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="border-none shadow-md">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" /> Últimos Movimentos
                  </CardTitle>
                  <Link href="/admin/venda">
                    <Badge className="bg-accent hover:bg-accent/90 cursor-pointer font-black uppercase text-[9px]">Nova Venda</Badge>
                  </Link>
                </CardHeader>
                <CardContent>
                  {stats.ultimasVendas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground opacity-30 font-black uppercase text-xs">Aguardando primeira venda</div>
                  ) : (
                    <div className="space-y-3">
                       {stats.ultimasVendas.map((s, i) => (
                         <div key={i} className="flex justify-between items-center p-3 border rounded-xl hover:bg-muted/30 transition-all">
                            <div>
                               <p className="font-black uppercase text-xs">{s.cliente}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">{s.eventoNome}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-xs">R$ {s.valorTotal.toFixed(2)}</p>
                               <Badge className={`${s.status === 'pago' ? 'bg-green-600' : 'bg-orange-600'} text-[8px] h-4 font-black uppercase`}>
                                 {s.status === 'pago' ? <CheckCircle2 className="w-2 h-2 mr-1" /> : null}
                                 {s.status === 'pago' ? 'Aprovado' : 'Aguardando'}
                               </Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </CardContent>
             </Card>

             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
                <CardHeader>
                   <CardTitle className="text-xs font-black uppercase text-white/60">Lembrete do Cambista</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                   <p className="text-sm font-bold opacity-80 leading-relaxed">
                     Sua comissão de 10% entra no seu saldo automaticamente assim que a venda é aprovada. 
                     Você pode usar suas comissões para fazer novas vendas para seus clientes e lucrar ainda mais.
                   </p>
                   <div className="pt-4 border-t border-white/10 flex items-center gap-3">
                      <div className="bg-white/10 p-2 rounded-xl"><TrendingUp className="w-5 h-5" /></div>
                      <p className="text-[10px] font-black uppercase">Foco na rede e nas vendas!</p>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

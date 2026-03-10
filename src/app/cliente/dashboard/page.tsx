
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Grid3X3, Clock, Ticket } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { Badge } from '@/components/ui/badge';

export default function ClienteDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ bingos: 0, boloes: 0, minhasApostas: [] as any[] });

  useEffect(() => {
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => b.status === 'aberto');
    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => b.status === 'aberto');
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    
    // Filtra recibos onde o cliente está associado (pelo nome ou id)
    const minhasApostas = allTickets.filter((r: any) => r.cliente === user?.nome || r.userId === user?.id);

    setStats({
      bingos: bingos.length,
      boloes: boloes.length,
      minhasApostas: minhasApostas.slice(0, 5) // Pega as 5 últimas
    });
  }, [user]);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary">Painel do Apostador</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Acompanhe seus prêmios e sorteios ativos</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <BalanceCard />
              
              <Card className="border-l-4 border-l-accent">
                <CardHeader>
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    Informativo Oficial
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                    Todos os nossos sorteios são auditados e as premiações são garantidas pela banca LEOBET PRO. 
                    Confira seu bilhete em tempo real na aba de conferência.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black uppercase text-primary">Bingos Abertos</CardTitle>
                    <Grid3X3 className="w-5 h-5 text-primary opacity-20" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.bingos}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Prêmios acumulados hoje</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm border-l-4 border-l-accent">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black uppercase text-accent">Bolões da Rodada</CardTitle>
                    <Trophy className="w-5 h-5 text-accent opacity-20" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.boloes}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Aposte nos melhores campeonatos</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-md">
                <CardHeader>
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Histórico de Apostas
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {stats.minhasApostas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ticket className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase text-xs tracking-widest">Nenhuma aposta localizada</p>
                      <p className="text-[10px] mt-2">Suas compras aparecerão aqui após validação.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.minhasApostas.map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border">
                          <div>
                            <p className="font-black uppercase text-xs text-primary">{r.eventoNome}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{new Date(r.data).toLocaleDateString()} • {r.tickets.length} Bilhetes</p>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-xs">R$ {r.valorTotal.toFixed(2)}</p>
                             <Badge className={`${r.status === 'pago' ? 'bg-green-600' : 'bg-orange-600'} text-[8px] h-4 font-black uppercase`}>
                               {r.status === 'pago' ? 'Validado' : 'Pendente'}
                             </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

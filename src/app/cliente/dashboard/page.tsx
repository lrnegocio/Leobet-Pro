
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Grid3X3, Clock, Ticket, ShoppingCart, Database } from 'lucide-react';
import Link from 'next/link';
import { useAuthStore } from '@/store/use-auth-store';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase/client';

export default function ClienteDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({ bingos: 0, boloes: 0, minhasApostas: [] as any[] });

  useEffect(() => {
    const loadData = async () => {
      const { data: bingos } = await supabase.from('bingos').select('id').eq('status', 'aberto');
      const { data: boloes } = await supabase.from('boloes').select('id').eq('status', 'aberto');
      const { data: tickets } = await supabase.from('tickets').select('*').eq('cliente', user?.nome).order('created_at', { ascending: false }).limit(5);

      setStats({
        bingos: bingos?.length || 0,
        boloes: boloes?.length || 0,
        minhasApostas: tickets || []
      });
    };
    loadData();
  }, [user]);

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary">Painel do Apostador</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Auditoria Live LEOBET PRO
              </p>
            </div>
            <Link href="/admin/venda">
              <Button className="bg-accent hover:bg-accent/90 h-14 px-8 gap-2 font-black uppercase rounded-2xl shadow-xl text-white">
                <ShoppingCart className="w-5 h-5" /> Comprar Bilhete
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <BalanceCard />
              
              <Card className="border-l-4 border-l-accent shadow-lg rounded-2xl bg-white overflow-hidden">
                <CardHeader className="bg-muted/50">
                  <CardTitle className="text-xs font-black uppercase flex items-center gap-2">
                    Regras e Premiações
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-4">
                  <p className="text-xs font-bold text-muted-foreground leading-relaxed">
                    Nossos sorteios seguem auditoria digital em tempo real. Os prêmios são creditados e ficam disponíveis para resgate via PIX assim que a rodada é finalizada.
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="bg-white border-none shadow-sm border-l-4 border-l-primary rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black uppercase text-primary">Bingos Abertos</CardTitle>
                    <Grid3X3 className="w-5 h-5 text-primary opacity-20" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.bingos}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Escolha suas dezenas e boa sorte</p>
                  </CardContent>
                </Card>

                <Card className="bg-white border-none shadow-sm border-l-4 border-l-accent rounded-2xl">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-black uppercase text-accent">Bolões Ativos</CardTitle>
                    <Trophy className="w-5 h-5 text-accent opacity-20" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-black">{stats.boloes}</div>
                    <p className="text-[10px] font-bold text-muted-foreground uppercase mt-2">Palpite nos melhores jogos da rodada</p>
                  </CardContent>
                </Card>
              </div>

              <Card className="border-none shadow-md rounded-[2rem] bg-white overflow-hidden">
                <CardHeader className="border-b bg-muted/20">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Minhas Últimas Apostas
                  </CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  {stats.minhasApostas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Ticket className="w-12 h-12 mx-auto mb-4 opacity-10" />
                      <p className="font-bold uppercase text-xs tracking-widest">Você ainda não tem apostas</p>
                      <Link href="/admin/venda" className="text-accent underline font-black text-[10px] uppercase mt-2 block">Comece agora</Link>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {stats.minhasApostas.map((r, i) => (
                        <div key={i} className="flex justify-between items-center p-4 bg-muted/30 rounded-2xl border transition-all hover:bg-muted/50">
                          <div>
                            <p className="font-black uppercase text-xs text-primary">{r.evento_nome}</p>
                            <p className="text-[10px] font-bold text-muted-foreground">{new Date(r.created_at).toLocaleDateString()} • {r.tickets_data.length} Bilhetes</p>
                          </div>
                          <div className="text-right">
                             <p className="font-black text-xs text-primary">R$ {Number(r.valor_total).toFixed(2)}</p>
                             <Badge className={cn("text-[8px] h-4 font-black uppercase text-white", r.status === 'pago' || r.status === 'ganhou' ? 'bg-green-600' : 'bg-orange-600')}>
                               {r.status === 'pago' ? 'Auditado' : (r.status === 'ganhou' ? 'Premiado' : 'Pendente')}
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

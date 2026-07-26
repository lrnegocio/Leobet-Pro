"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, ShoppingCart, DollarSign, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function CambistaDashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    vendasHoje: 0,
    comissaoAcumulada: 0,
    ultimasVendas: [] as any[]
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadStats = async () => {
    if (!user?.id || !mounted) return;
    try {
      const { data: mySales } = await supabase
        .from('tickets')
        .select('*')
        .eq('vendedor_id', user.id)
        .order('created_at', { ascending: false });

      const today = new Date().toISOString().split('T')[0];
      const todaySales = (mySales || []).filter((s: any) => s.created_at?.startsWith(today) && s.status === 'pago');
      
      setStats({
        vendasHoje: todaySales.length,
        comissaoAcumulada: Number(user?.commissionBalance || 0),
        ultimasVendas: (mySales || []).slice(0, 5)
      });
    } catch (err) {
      console.warn("Erro dashboard cambista:", err);
    }
  };

  useEffect(() => {
    if (mounted && user?.id) {
      loadStats();
    }
  }, [mounted, user?.id, user?.commissionBalance]);

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-sans">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black uppercase text-primary leading-tight">Painel Cambista Parceiro</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mt-1">Sincronização em Tempo Real</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm rounded-[2rem]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Vendas Hoje</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.vendasHoje}</span>
                  <div className="bg-green-100 p-3 rounded-2xl"><ShoppingCart className="w-5 h-5 text-green-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm rounded-[2rem]">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Minha Comissão</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-primary">R$ {(stats.comissaoAcumulada || 0).toFixed(2)}</span>
                  <div className="bg-blue-100 p-3 rounded-2xl"><DollarSign className="w-5 h-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
             <Card className="border-none shadow-md rounded-[2.5rem] bg-white overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between bg-muted/20 border-b p-6">
                  <CardTitle className="text-sm font-black uppercase flex items-center gap-2 text-primary">
                    <Clock className="w-4 h-4" /> Movimentos Recentes
                  </CardTitle>
                  <Link href="/admin/venda">
                    <Badge className="bg-accent hover:bg-accent/90 cursor-pointer font-black uppercase text-[10px] h-8 px-4 rounded-xl text-white">Nova Venda</Badge>
                  </Link>
                </CardHeader>
                <CardContent className="p-6">
                  {stats.ultimasVendas.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground opacity-30 font-black uppercase text-xs">Aguardando primeira venda...</div>
                  ) : (
                    <div className="space-y-3">
                       {stats.ultimasVendas.map((s, i) => (
                         <div key={i} className="flex justify-between items-center p-4 border rounded-2xl hover:bg-muted/30 transition-all">
                            <div>
                               <p className="font-black uppercase text-xs text-primary">{s?.cliente || 'CLIENTE'}</p>
                               <p className="text-[9px] font-bold text-muted-foreground uppercase">{s?.evento_nome || 'CONCURSO'}</p>
                            </div>
                            <div className="text-right">
                               <p className="font-black text-xs">R$ {Number(s?.valor_total || 0).toFixed(2)}</p>
                               <Badge className={`${s?.status === 'pago' ? 'bg-green-600' : 'bg-orange-600'} text-[8px] h-4 font-black uppercase text-white`}>
                                 {s?.status === 'pago' ? 'Aprovado' : 'Pendente'}
                               </Badge>
                            </div>
                         </div>
                       ))}
                    </div>
                  )}
                </CardContent>
             </Card>

             <Card className="bg-primary text-white border-none shadow-xl rounded-[2.5rem] p-4 flex flex-col justify-center">
                <CardHeader>
                   <CardTitle className="text-xs font-black uppercase text-white/60">Controle Cambista</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                   <p className="text-sm font-bold opacity-80 leading-relaxed">
                     Suas comissões são creditadas automaticamente assim que a venda é validada pelo administrador.
                   </p>
                   <div className="pt-6 border-t border-white/10 flex items-center gap-4">
                      <div className="bg-accent p-3 rounded-2xl shadow-lg"><TrendingUp className="w-6 h-6 text-white" /></div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-widest">Sincronizado</p>
                        <p className="text-[8px] font-bold opacity-50 uppercase">Vendas auditadas digitalmente.</p>
                      </div>
                   </div>
                </CardContent>
             </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

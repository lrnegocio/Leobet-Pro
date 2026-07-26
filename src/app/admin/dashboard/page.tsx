
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, ArrowUpCircle, ShoppingCart, Clock, ShieldAlert, Database, TrendingUp, DollarSign } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { supabase } from '@/supabase/client';

export default function AdminDashboard() {
  const [pendingTickets, setPendingTickets] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalCambistas: 0,
    pendencias: 0,
    totalVendasPagas: 0,
    totalArrecadado: 0
  });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    loadStats();
    const interval = setInterval(loadStats, 15000);
    return () => clearInterval(interval);
  }, []);

  const loadStats = async () => {
    try {
      const { data: users } = await supabase.from('users').select('role, status');
      const { data: tickets } = await supabase.from('tickets').select('*');

      const pendingTicketsList = tickets?.filter(t => t.status === 'pendente') || [];
      setPendingTickets(pendingTicketsList);

      const paidTickets = tickets?.filter(t => ['pago', 'ganhou', 'premio_pago', 'pendente-resgate'].includes(t.status)) || [];
      const totalArrecadado = paidTickets.reduce((acc, t) => acc + (Number(t.valor_total) || 0), 0);

      const pendingUsers = users?.filter(u => u.status === 'pending').length || 0;

      setStats({
        totalClientes: users?.filter(u => u.role === 'cliente').length || 0,
        totalCambistas: users?.filter(u => u.role === 'cambista').length || 0,
        pendencias: (pendingTicketsList.length) + pendingUsers,
        totalVendasPagas: paidTickets.length,
        totalArrecadado: totalArrecadado
      });
    } catch (err) {
      console.warn("Erro ao carregar estatísticas dashboard:", err);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-sans">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase tracking-tighter text-primary">Painel LEOBET PRO</h1>
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Auditoria Digital Master em Tempo Real
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm rounded-3xl overflow-hidden">
              <CardHeader className="pb-2 bg-green-50/50"><CardTitle className="text-[10px] font-black uppercase text-green-700">Arrecadação Total (Rede)</CardTitle></CardHeader>
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-black text-green-600">R$ {stats.totalArrecadado.toFixed(2)}</span>
                  <div className="bg-green-100 p-3 rounded-2xl"><TrendingUp className="w-5 h-5 text-green-600" /></div>
                </div>
                <p className="text-[8px] font-bold uppercase text-muted-foreground mt-2">{stats.totalVendasPagas} Bilhetes Liquidados</p>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm rounded-3xl">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Equipe Cambistas</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.totalCambistas}</span>
                  <div className="bg-purple-100 p-3 rounded-2xl"><Store className="w-5 h-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm rounded-3xl">
              <CardHeader className="pb-2"><CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Pendências Atuais</CardTitle></CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className={`text-3xl font-black ${stats.pendencias > 0 ? 'text-orange-600' : 'text-green-600'}`}>{stats.pendencias}</span>
                  <div className="bg-orange-100 p-3 rounded-2xl"><ShieldAlert className="w-5 h-5 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white rounded-3xl border-none shadow-xl">
              <CardHeader><CardTitle className="font-black uppercase text-sm flex items-center gap-2 text-orange-600"><Clock className="w-4 h-4" /> Aprovações de Vendas</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {pendingTickets.length === 0 ? (
                    <div className="text-center py-10 opacity-30 font-black text-xs uppercase">Sem vendas pendentes</div>
                  ) : pendingTickets.map((sale, i) => (
                    <div key={i} className="flex items-center justify-between p-4 border rounded-2xl bg-orange-50/30">
                      <div><p className="text-xs font-black uppercase">{sale.cliente || 'CLIENTE'}</p><p className="text-[9px] font-bold text-muted-foreground uppercase">{sale.evento_nome || 'EVENTO'} • R$ {Number(sale.valor_total || 0).toFixed(2)}</p></div>
                      <Link href="/admin/financeiro"><Button size="sm" variant="outline" className="h-8 font-black text-[9px] uppercase">Validar</Button></Link>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
            <Card className="bg-white rounded-3xl border-none shadow-xl">
              <CardHeader><CardTitle className="font-black uppercase text-sm flex items-center gap-2 text-primary"><ShoppingCart className="w-4 h-4" /> Atalhos do Administrador</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/admin/venda" className="p-6 border-2 border-dashed rounded-3xl hover:bg-primary hover:text-white transition-all flex flex-col items-center gap-2 group text-center">
                  <ShoppingCart className="w-8 h-8 text-primary group-hover:text-white" /><span className="text-[9px] font-black uppercase">Vender Bilhetes</span>
                </Link>
                <Link href="/admin/financeiro" className="p-6 border-2 border-dashed rounded-3xl hover:bg-destructive hover:text-white transition-all flex flex-col items-center gap-2 group text-center">
                  <DollarSign className="w-8 h-8 text-destructive group-hover:text-white" /><span className="text-[9px] font-black uppercase">Conferir Caixa</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, ArrowUpCircle, ShoppingCart, Grid3X3, Trophy, Clock, UserPlus } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function AdminDashboard() {
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [stats, setStats] = useState({
    totalClientes: 0,
    totalCambistas: 0,
    pendentes: 0,
  });

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    );

    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    
    const pendings = allTickets.filter((t: any) => t.status === 'pendente');
    setPendingSales(pendings);

    setStats({
      totalClientes: allUsers.filter((u: any) => u.role === 'cliente').length,
      totalCambistas: allUsers.filter((u: any) => u.role === 'cambista').length,
      pendentes: pendings.length + allUsers.filter((u: any) => u.status === 'pending').length
    });
  }, []);

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-primary">Painel LEOBET PRO</h1>
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Gestão Master • Auditoria Permanente</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-bold uppercase">{formattedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clientes</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.totalClientes}</span>
                  <div className="bg-blue-100 p-3 rounded-2xl"><Users className="w-5 h-5 text-blue-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cambistas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.totalCambistas}</span>
                  <div className="bg-purple-100 p-3 rounded-2xl"><Store className="w-5 h-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Pendências</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-orange-600">{stats.pendentes}</span>
                  <div className="bg-orange-100 p-3 rounded-2xl"><ArrowUpCircle className="w-5 h-5 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2 text-orange-600">
                  <Clock className="w-4 h-4" /> Aprovações Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {pendingSales.length === 0 ? (
                    <div className="text-center py-10 opacity-30 uppercase text-[10px] font-black tracking-widest">Tudo em dia!</div>
                  ) : (
                    pendingSales.slice(0, 5).map((sale, i) => (
                      <div key={i} className="flex items-center justify-between p-3 border rounded-xl bg-orange-50/30">
                        <div className="space-y-0.5">
                          <p className="text-xs font-black uppercase">{sale.cliente}</p>
                          <p className="text-[9px] font-bold text-muted-foreground">{sale.eventoNome} • R$ {sale.valorTotal.toFixed(2)}</p>
                        </div>
                        <Link href="/admin/financeiro">
                          <Button size="sm" variant="outline" className="h-8 font-black text-[9px] uppercase border-orange-200">Verificar</Button>
                        </Link>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2 text-primary">
                  <ShoppingCart className="w-4 h-4" /> Atalhos Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/admin/venda" className="p-4 border-2 border-dashed rounded-2xl hover:bg-primary hover:text-white transition-all flex flex-col items-center gap-2 group">
                  <ShoppingCart className="w-8 h-8 text-primary group-hover:text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Venda Rápida</span>
                </Link>
                <Link href="/admin/financeiro?tab=novocadastro" className="p-4 border-2 border-dashed rounded-2xl hover:bg-accent hover:text-white transition-all flex flex-col items-center gap-2 group">
                  <UserPlus className="w-8 h-8 text-accent group-hover:text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Cadastrar Parceiro</span>
                </Link>
                <Link href="/admin/bingo/novo" className="p-4 border-2 border-dashed rounded-2xl hover:bg-primary hover:text-white transition-all flex flex-col items-center gap-2 group">
                  <Grid3X3 className="w-8 h-8 text-primary group-hover:text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Novo Bingo</span>
                </Link>
                <Link href="/admin/financeiro" className="p-4 border-2 border-dashed rounded-2xl hover:bg-destructive hover:text-white transition-all flex flex-col items-center gap-2 group">
                  <ArrowUpCircle className="w-8 h-8 text-destructive group-hover:text-white" />
                  <span className="text-[9px] font-black uppercase tracking-widest">Financeiro</span>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

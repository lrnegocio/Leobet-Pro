
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, Store, Loader2, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Grid3X3, Trophy } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit } from 'firebase/firestore';

export default function AdminDashboard() {
  const db = useFirestore();
  const [formattedDate, setFormattedDate] = useState<string>("");

  useEffect(() => {
    setFormattedDate(
      new Date().toLocaleDateString('pt-BR', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    );
  }, []);
  
  const usersRef = useMemoFirebase(() => db ? collection(db, 'users') : null, [db]);
  const { data: users, loading: loadingUsers } = useCollection(usersRef);
  
  const transactionsRef = useMemoFirebase(() => db ? query(collection(db, 'transactions'), where('status', '==', 'pendente'), limit(5)) : null, [db]);
  const { data: pendingTrans, loading: loadingTrans } = useCollection(transactionsRef);

  const stats = {
    totalClientes: users?.filter(u => u.role === 'cliente').length || 0,
    totalCambistas: users?.filter(u => u.role === 'cambista').length || 0,
    pendentes: pendingTrans?.length || 0,
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase tracking-tighter text-primary">Painel de Controle</h1>
              <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">LEOBET PRO • Gestão Master</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground font-bold uppercase">{formattedDate}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BalanceCard />
            
            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Clientes Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{loadingUsers ? <Loader2 className="animate-spin w-4 h-4" /> : stats.totalClientes}</span>
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
                  <span className="text-3xl font-black">{loadingUsers ? <Loader2 className="animate-spin w-4 h-4" /> : stats.totalCambistas}</span>
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
                  <span className="text-3xl font-black text-orange-600">{loadingTrans ? <Loader2 className="animate-spin w-4 h-4" /> : stats.pendentes}</span>
                  <div className="bg-orange-100 p-3 rounded-2xl"><ArrowUpCircle className="w-5 h-5 text-orange-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2">
                  <ArrowUpCircle className="w-4 h-4 text-primary" /> Aprovações Urgentes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingTrans ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : pendingTrans && pendingTrans.length > 0 ? (
                  pendingTrans.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl border border-dashed">
                      <div className="flex items-center gap-4">
                        {t.type === 'deposito' ? <ArrowUpCircle className="text-green-600" /> : <ArrowDownCircle className="text-destructive" />}
                        <div>
                          <p className="font-black text-sm uppercase">{t.userName}</p>
                          <p className="text-[10px] font-bold text-muted-foreground">VALOR: R$ {t.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-1 bg-white border rounded uppercase tracking-widest">{t.type}</span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-40 uppercase text-[10px] font-black tracking-widest">Tudo em dia!</div>
                )}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-primary" /> Atalhos Rápidos
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <button className="p-6 border-2 border-dashed rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all flex flex-col items-center gap-3 group" onClick={() => window.location.href='/admin/venda'}>
                  <ShoppingCart className="w-10 h-10 text-primary group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest">Nova Venda</span>
                </button>
                <button className="p-6 border-2 border-dashed rounded-2xl hover:bg-accent hover:text-white hover:border-accent transition-all flex flex-col items-center gap-3 group" onClick={() => window.location.href='/admin/bingo'}>
                  <Grid3X3 className="w-10 h-10 text-accent group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest">Novo Bingo</span>
                </button>
                <button className="p-6 border-2 border-dashed rounded-2xl hover:bg-primary hover:text-white hover:border-primary transition-all flex flex-col items-center gap-3 group" onClick={() => window.location.href='/admin/bolao'}>
                  <Trophy className="w-10 h-10 text-primary group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest">Novo Bolão</span>
                </button>
                <button className="p-6 border-2 border-dashed rounded-2xl hover:bg-destructive hover:text-white hover:border-destructive transition-all flex flex-col items-center gap-3 group" onClick={() => window.location.href='/admin/financeiro'}>
                  <ArrowUpCircle className="w-10 h-10 text-destructive group-hover:text-white" />
                  <span className="text-xs font-black uppercase tracking-widest">Financeiro</span>
                </button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

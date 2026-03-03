"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, Clock, Loader2, TrendingUp } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useAuthStore } from '@/store/use-auth-store';

export default function CambistaDashboard() {
  const db = useFirestore();
  const user = useAuthStore((state) => state.user);
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!db || !user?.id) return;

    const loadSales = async () => {
      try {
        const q = query(collection(db, 'sales'), where('cambista_id', '==', user.id));
        const snapshot = await getDocs(q);
        setSales(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      } catch (error) {
        console.error('Erro ao carregar vendas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSales();
  }, [db, user?.id]);

  const stats = {
    totalVendas: sales.length,
    vendasPendentes: sales.filter(s => s.status === 'pendente').length,
    vendasAprovadas: sales.filter(s => s.status === 'aprovado').length,
    totalVendido: sales.reduce((acc, s) => acc + (s.amount || 0), 0),
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div>
            <h1 className="text-3xl font-black font-headline uppercase tracking-tighter">Painel do Cambista</h1>
            <p className="text-muted-foreground font-bold uppercase text-[10px] tracking-widest">Gerencie suas vendas</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <BalanceCard />

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Total de Vendas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{stats.totalVendas}</span>
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Pendentes de Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-yellow-600">{stats.vendasPendentes}</span>
                  <Clock className="w-5 h-5 text-yellow-600" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground">Aprovadas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-green-600">{stats.vendasAprovadas}</span>
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          <Card className="bg-white">
            <CardHeader>
              <CardTitle className="font-black uppercase text-sm">Minhas Vendas</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="animate-spin w-6 h-6" />
                </div>
              ) : sales.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <p>Você ainda não tem vendas registradas.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {sales.map((sale) => (
                    <div key={sale.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50">
                      <div className="flex-1">
                        <p className="font-bold">{sale.item_name || 'Venda'}</p>
                        <p className="text-sm text-muted-foreground">R$ {(sale.amount || 0).toFixed(2)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          sale.status === 'pendente' ? 'bg-yellow-100 text-yellow-700' :
                          sale.status === 'aprovado' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {sale.status === 'pendente' ? 'Pendente' : sale.status === 'aprovado' ? 'Aprovado' : 'Rejeitado'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

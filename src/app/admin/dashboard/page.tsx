"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { BalanceCard } from '@/components/dashboard/BalanceCard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, Store, Loader2, ArrowUpCircle, ArrowDownCircle, ShoppingCart, Grid3X3, Trophy, CheckCircle, XCircle } from 'lucide-react';
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, limit, doc, updateDoc, getDocs } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function AdminDashboard() {
  const db = useFirestore();
  const { toast } = useToast();
  const [formattedDate, setFormattedDate] = useState<string>("");
  const [approvingId, setApprovingId] = useState<string | null>(null);

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
  
  // Cambistas pendentes de aprovação
  const cambistasRef = useMemoFirebase(() => db ? query(collection(db, 'users'), where('role', '==', 'cambista'), where('status', '==', 'pending')) : null, [db]);
  const { data: pendingCambistas, loading: loadingCambistas } = useCollection(cambistasRef);

  // Vendas pendentes
  const salesRef = useMemoFirebase(() => db ? query(collection(db, 'sales'), where('status', '==', 'pendente')) : null, [db]);
  const { data: pendingSales, loading: loadingSales } = useCollection(salesRef);

  const stats = {
    totalClientes: users?.filter(u => u.role === 'cliente').length || 0,
    totalCambistas: users?.filter(u => u.role === 'cambista').length || 0,
    cambistasAguardando: pendingCambistas?.length || 0,
    vendasPendentes: pendingSales?.length || 0,
  };

  const approveCambista = async (userId: string, userName: string) => {
    setApprovingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'approved' });
      toast({
        title: "✅ Cambista Aprovado",
        description: `${userName} já pode começar a vender!`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar o cambista.",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const rejectCambista = async (userId: string, userName: string) => {
    setApprovingId(userId);
    try {
      await updateDoc(doc(db, 'users', userId), { status: 'rejected' });
      toast({
        title: "❌ Cambista Rejeitado",
        description: `${userName} foi rejeitado.`,
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar o cambista.",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const approveSale = async (saleId: string) => {
    setApprovingId(saleId);
    try {
      await updateDoc(doc(db, 'sales', saleId), { status: 'aprovado' });
      toast({
        title: "✅ Venda Aprovada",
        description: "A venda foi aprovada com sucesso!",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível aprovar a venda.",
      });
    } finally {
      setApprovingId(null);
    }
  };

  const rejectSale = async (saleId: string) => {
    setApprovingId(saleId);
    try {
      await updateDoc(doc(db, 'sales', saleId), { status: 'rejeitado' });
      toast({
        title: "❌ Venda Rejeitada",
        description: "A venda foi rejeitada.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Não foi possível rejeitar a venda.",
      });
    } finally {
      setApprovingId(null);
    }
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
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Cambistas Ativos</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black">{loadingUsers ? <Loader2 className="animate-spin w-4 h-4" /> : stats.totalCambistas}</span>
                  <div className="bg-purple-100 p-3 rounded-2xl"><Store className="w-5 h-5 text-purple-600" /></div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border-none shadow-sm border-l-4 border-l-yellow-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">⚠️ Aguardando Aprovação</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <span className="text-3xl font-black text-yellow-600">{loadingCambistas ? <Loader2 className="animate-spin w-4 h-4" /> : (stats.cambistasAguardando + stats.vendasPendentes)}</span>
                  <div className="bg-yellow-100 p-3 rounded-2xl"><ArrowUpCircle className="w-5 h-5 text-yellow-600" /></div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* CAMBISTAS PENDENTES */}
            <Card className="bg-white border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2">
                  <Store className="w-4 h-4 text-purple-600" /> Cambistas Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingCambistas ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : pendingCambistas && pendingCambistas.length > 0 ? (
                  pendingCambistas.map(cambista => (
                    <div key={cambista.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200 space-y-3">
                      <div>
                        <p className="font-bold text-sm">{cambista.nome}</p>
                        <p className="text-xs text-muted-foreground">📧 {cambista.email}</p>
                        <p className="text-xs text-muted-foreground">📱 {cambista.phone}</p>
                        <p className="text-xs text-muted-foreground">🔑 {cambista.pixKey}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={approvingId === cambista.id}
                          onClick={() => approveCambista(cambista.id, cambista.nome)}
                        >
                          {approvingId === cambista.id ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          disabled={approvingId === cambista.id}
                          onClick={() => rejectCambista(cambista.id, cambista.nome)}
                        >
                          {approvingId === cambista.id ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-40 uppercase text-[10px] font-black tracking-widest">Nenhum cambista pendente!</div>
                )}
              </CardContent>
            </Card>

            {/* VENDAS PENDENTES */}
            <Card className="bg-white border-l-4 border-l-orange-500">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-orange-600" /> Vendas Aguardando Aprovação
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loadingSales ? (
                  <div className="flex justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : pendingSales && pendingSales.length > 0 ? (
                  pendingSales.map(sale => (
                    <div key={sale.id} className="p-4 bg-orange-50 rounded-lg border border-orange-200 space-y-3">
                      <div>
                        <p className="font-bold text-sm">{sale.item_name || 'Venda'}</p>
                        <p className="text-xs text-muted-foreground">💵 Valor: R$ {(sale.amount || 0).toFixed(2)}</p>
                        <p className="text-xs text-muted-foreground">👤 Cambista: {sale.cambista_name || 'N/A'}</p>
                        <p className="text-xs text-muted-foreground">📅 {sale.createdAt ? new Date(sale.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                          disabled={approvingId === sale.id}
                          onClick={() => approveSale(sale.id)}
                        >
                          {approvingId === sale.id ? <Loader2 className="animate-spin w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="flex-1"
                          disabled={approvingId === sale.id}
                          onClick={() => rejectSale(sale.id)}
                        >
                          {approvingId === sale.id ? <Loader2 className="animate-spin w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 opacity-40 uppercase text-[10px] font-black tracking-widest">Nenhuma venda pendente!</div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
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

            <Card className="bg-white">
              <CardHeader>
                <CardTitle className="font-black uppercase text-sm">Informações Importantes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg text-xs">
                  <p className="font-bold text-blue-900">ℹ️ Cambistas</p>
                  <p className="text-blue-800 mt-1">Cambistas precisam ser aprovados antes de começar a vender. Verifique os dados deles!</p>
                </div>
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg text-xs">
                  <p className="font-bold text-green-900">✅ Vendas</p>
                  <p className="text-green-800 mt-1">Todas as vendas sem saldo precisam de sua aprovação antes de serem processadas.</p>
                </div>
                <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg text-xs">
                  <p className="font-bold text-orange-900">⏰ Apostas</p>
                  <p className="text-orange-800 mt-1">Você pode fechar apostas manualmente 1 minuto antes do horário ou quando a primeira partida começar.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

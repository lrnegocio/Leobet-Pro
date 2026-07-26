
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign, Send, Wallet, ShieldCheck, Database } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/supabase/client';

export default function GerenteDashboard() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState({ cambistas: 0, vendas: 0, comissao: 0 });
  const [transferAmount, setTransferAmount] = useState('');
  const [targetCambista, setTargetCambista] = useState('');
  const [myCambistas, setMyCambistas] = useState<any[]>([]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const loadData = async () => {
    if (!user?.id) return;
    try {
      const { data: allUsers } = await supabase.from('users').select('*');
      const { data: allTickets } = await supabase.from('tickets').select('*');
      
      const mine = allUsers?.filter((u: any) => u.gerente_id === user.id) || [];
      setMyCambistas(mine);
      
      const myNetworkSales = allTickets?.filter((t: any) => 
        (t.vendedor_id === user.id || mine.some(c => c.id === t.vendedor_id)) && 
        t.status === 'pago'
      ) || [];
      
      setStats({
        cambistas: mine.length,
        vendas: myNetworkSales.length,
        comissao: Number(user.commissionBalance || 0)
      });
    } catch (err) {
      console.error("Erro dashboard gerente:", err);
    }
  };

  useEffect(() => {
    if (mounted && user?.id) {
      loadData();
    }
  }, [mounted, user]);

  const handleTransfer = async () => {
    const amount = Number(transferAmount);
    if (amount <= 0 || !targetCambista || !user) return;
    
    const totalBalance = (Number(user.balance) || 0) + (Number(user.commissionBalance) || 0);

    if (totalBalance < amount) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE" });
      return;
    }

    try {
      let rem = amount;
      let newComm = Number(user.commissionBalance || 0);
      let newBal = Number(user.balance || 0);

      if (newComm >= rem) { newComm -= rem; rem = 0; } else { rem -= newComm; newComm = 0; newBal -= rem; }
      
      await supabase.from('users').update({ balance: newBal, commission_balance: newComm }).eq('id', user.id);
      
      const target = myCambistas.find(c => c.id === targetCambista);
      const targetNewBal = (Number(target?.balance) || 0) + amount;
      await supabase.from('users').update({ balance: targetNewBal }).eq('id', targetCambista);

      setUser({ ...user, balance: newBal, commissionBalance: newComm });
      toast({ title: "TRANSFERÊNCIA REALIZADA!" });
      setTransferAmount('');
      loadData();
    } catch (err) {
      toast({ variant: "destructive", title: "ERRO NA TRANSFERÊNCIA" });
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-4 md:p-8 pt-20 lg:pt-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-4xl font-black uppercase text-primary leading-none">Painel Gerência</h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1 flex items-center gap-2">
                <Database className="w-3 h-3 text-green-600" /> Sincronização Cloud Ativa
              </p>
            </div>
            <Card className="bg-primary text-white p-6 rounded-[2rem] shadow-xl border-none w-full md:w-auto">
              <p className="text-[10px] font-black uppercase opacity-60">Meu Saldo Disponível</p>
              <p className="text-3xl font-black">R$ {((Number(user?.balance) || 0) + (Number(user?.commissionBalance) || 0)).toFixed(2)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-none shadow-sm rounded-[2rem] p-6 flex justify-between items-center">
              <div><p className="text-xs font-black uppercase text-muted-foreground">Rede de Cambistas</p><p className="text-3xl font-black">{stats.cambistas}</p></div>
              <div className="bg-blue-100 p-4 rounded-2xl"><Users className="w-8 h-8 text-blue-600" /></div>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-[2rem] p-6 flex justify-between items-center">
              <div><p className="text-xs font-black uppercase text-muted-foreground">Vendas Totais</p><p className="text-3xl font-black">{stats.vendas}</p></div>
              <div className="bg-green-100 p-4 rounded-2xl"><TrendingUp className="w-8 h-8 text-green-600" /></div>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-[2rem] p-6 flex justify-between items-center">
              <div><p className="text-xs font-black uppercase text-muted-foreground">Minha Comissão</p><p className="text-3xl font-black text-accent">R$ {stats.comissao.toFixed(2)}</p></div>
              <div className="bg-orange-100 p-4 rounded-2xl"><DollarSign className="w-8 h-8 text-accent" /></div>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-t-8 border-t-accent shadow-2xl rounded-[3rem] overflow-hidden bg-white">
              <CardHeader className="bg-muted/50 border-b p-8">
                <CardTitle className="text-base font-black uppercase flex items-center gap-2 text-primary">
                  <Wallet className="w-6 h-6 text-accent" /> Recarregar Cambista
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-60">Escolher Vendedor</label>
                  <select 
                    className="w-full h-14 border-2 rounded-2xl px-4 font-bold bg-white focus:border-accent outline-none"
                    value={targetCambista}
                    onChange={e => setTargetCambista(e.target.value)}
                  >
                    <option value="">-- SELECIONE NA LISTA --</option>
                    {myCambistas.map(c => <option key={c.id} value={c.id}>{c.nome || 'SEM NOME'} (Saldo: R$ {((Number(c.balance) || 0) + (Number(c.commission_balance) || 0)).toFixed(2)})</option>)}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase opacity-60">Valor (R$)</label>
                  <Input type="number" placeholder="0,00" value={transferAmount} onChange={e => setTransferAmount(e.target.value)} className="h-16 text-center font-black text-4xl border-2 rounded-2xl" />
                </div>
                <Button onClick={handleTransfer} className="w-full bg-accent hover:bg-accent/90 text-white font-black h-16 uppercase rounded-2xl shadow-xl transition-all active:scale-95 text-lg">
                  <Send className="w-5 h-5 mr-2" /> Transferir Saldo
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[3rem] border-none shadow-sm bg-white overflow-hidden">
              <CardHeader className="p-8 pb-4"><CardTitle className="text-base font-black uppercase text-primary">Atalhos da Gestão</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4 p-8 pt-0">
                <Link href="/gerente/cambistas" className="contents">
                  <Button variant="outline" className="h-32 uppercase font-black flex flex-col gap-3 rounded-3xl border-2 border-primary/10 hover:bg-primary hover:text-white transition-all group">
                    <Users className="w-10 h-10 text-primary group-hover:text-white" /> Meus Cambistas
                  </Button>
                </Link>
                <Link href="/admin/venda" className="contents">
                  <Button variant="outline" className="h-32 uppercase font-black flex flex-col gap-3 rounded-3xl border-2 border-accent/10 hover:bg-accent hover:text-white transition-all group">
                    <Send className="w-10 h-10 text-accent group-hover:text-white" /> Nova Venda
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign, Send, Wallet, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function GerenteDashboard() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [stats, setStats] = useState({ cambistas: 0, vendas: 0, comissao: 0 });
  const [transferAmount, setTransferAmount] = useState(0);
  const [targetCambista, setTargetCambista] = useState('');
  const [myCambistas, setMyCambistas] = useState<any[]>([]);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    
    // Filtra apenas os cambistas vinculados a este gerente
    const mine = allUsers.filter((u: any) => u.gerenteId === user?.id);
    setMyCambistas(mine);
    
    // Soma as vendas próprias + vendas dos cambistas da rede
    const mySales = allTickets.filter((t: any) => (t.gerenteId === user?.id || t.vendedorId === user?.id) && t.status === 'pago');
    
    // Calcula comissão (5% sobre as vendas dos cambistas + 15% sobre vendas próprias se ele vender)
    // Para simplificar, mostramos o saldo de comissão real que ele já tem no objeto user
    const currentComm = user?.commissionBalance || 0;

    setStats({
      cambistas: mine.length,
      vendas: mySales.length,
      comissao: currentComm
    });
  }, [user]);

  const handleTransfer = () => {
    if (transferAmount <= 0 || !targetCambista || !user) return;
    
    const totalBalance = (user.balance || 0) + (user.commissionBalance || 0);

    if (totalBalance < transferAmount) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE" });
      return;
    }

    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = all.map((u: any) => {
      // Deduz do gerente
      if (u.id === user.id) {
        let remaining = transferAmount;
        let newComm = u.commissionBalance || 0;
        let newBal = u.balance || 0;

        if (newComm >= remaining) {
          newComm -= remaining;
          remaining = 0;
        } else {
          remaining -= newComm;
          newComm = 0;
          newBal -= remaining;
        }
        return { ...u, balance: newBal, commissionBalance: newComm };
      }
      // Adiciona ao cambista
      if (u.id === targetCambista) {
        return { ...u, balance: (u.balance || 0) + transferAmount };
      }
      return u;
    });

    localStorage.setItem('leobet_users', JSON.stringify(updated));
    const me = updated.find((u: any) => u.id === user.id);
    setUser(me);
    toast({ title: "TRANSFERÊNCIA REALIZADA!", description: "O saldo já está disponível para o vendedor." });
    setTransferAmount(0);
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Painel do Gerente</h1>
              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest mt-1">Gestão de Rede e Performance</p>
            </div>
            <Card className="bg-primary text-white p-6 rounded-2xl shadow-xl border-none">
              <p className="text-[10px] font-black uppercase opacity-60">Meu Saldo Total</p>
              <p className="text-3xl font-black">R$ {((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white border-none shadow-sm rounded-2xl">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">Cambistas Ativos</p>
                  <p className="text-3xl font-black">{stats.cambistas}</p>
                </div>
                <Users className="w-10 h-10 text-primary/20" />
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-2xl">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">Vendas da Rede</p>
                  <p className="text-3xl font-black">{stats.vendas}</p>
                </div>
                <TrendingUp className="w-10 h-10 text-green-600/20" />
              </CardContent>
            </Card>
            <Card className="bg-white border-none shadow-sm rounded-2xl">
              <CardContent className="p-6 flex justify-between items-center">
                <div>
                  <p className="text-xs font-black uppercase text-muted-foreground">Minha Comissão</p>
                  <p className="text-3xl font-black text-accent">R$ {stats.comissao.toFixed(2)}</p>
                </div>
                <DollarSign className="w-10 h-10 text-accent/20" />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="border-t-4 border-t-accent shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="bg-muted/50 border-b">
                <CardTitle className="text-sm font-black uppercase flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-accent" /> Recarregar Cambista
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60">Vendedor da minha rede</label>
                  <select 
                    className="w-full h-12 border-2 rounded-xl px-3 font-bold bg-white focus:border-accent"
                    value={targetCambista}
                    onChange={e => setTargetCambista(e.target.value)}
                  >
                    <option value="">-- SELECIONE O CAMBISTA --</option>
                    {myCambistas.map(c => <option key={c.id} value={c.id}>{c.nome} (Saldo: R$ {((c.balance || 0) + (c.commissionBalance || 0)).toFixed(2)})</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-black uppercase opacity-60">Valor da Transferência (R$)</label>
                  <Input type="number" placeholder="VALOR R$" value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} className="h-12 font-black text-xl border-2" />
                </div>
                <Button onClick={handleTransfer} className="w-full bg-accent hover:bg-accent/90 font-black h-14 uppercase rounded-xl shadow-lg transition-all active:scale-95">
                  <Send className="w-4 h-4 mr-2" /> Confirmar Transferência
                </Button>
                <p className="text-[9px] font-bold text-center text-muted-foreground uppercase">O valor será deduzido do seu saldo de comissão/depósito.</p>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-none shadow-sm bg-white overflow-hidden">
              <CardHeader><CardTitle className="text-sm font-black uppercase">Atalhos Rápidos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/gerente/cambistas">
                  <Button className="w-full h-24 uppercase font-black flex flex-col gap-2 rounded-2xl shadow-sm border-2 border-primary/10 bg-white text-primary hover:bg-primary hover:text-white transition-all">
                    <Users className="w-6 h-6" /> Meus Cambistas
                  </Button>
                </Link>
                <Link href="/admin/venda">
                  <Button className="w-full h-24 uppercase font-black flex flex-col gap-2 rounded-2xl shadow-sm border-2 border-accent/10 bg-white text-accent hover:bg-accent hover:text-white transition-all">
                    <Send className="w-6 h-6" /> Nova Venda
                  </Button>
                </Link>
                <Link href="/relatorios">
                  <Button className="w-full h-24 uppercase font-black flex flex-col gap-2 rounded-2xl shadow-sm border-2 border-blue-100 bg-white text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                    <TrendingUp className="w-6 h-6" /> Relatórios Rede
                  </Button>
                </Link>
                <Link href="/perfil">
                  <Button className="w-full h-24 uppercase font-black flex flex-col gap-2 rounded-2xl shadow-sm border-2 border-muted bg-white text-muted-foreground hover:bg-muted-foreground hover:text-white transition-all">
                    <ShieldCheck className="w-6 h-6" /> Meu Perfil
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

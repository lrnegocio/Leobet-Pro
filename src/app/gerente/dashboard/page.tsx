
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';
import { TrendingUp, Users, DollarSign, Send } from 'lucide-react';
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
    
    const mine = allUsers.filter((u: any) => u.gerenteId === user?.id);
    setMyCambistas(mine);
    
    const mySales = allTickets.filter((t: any) => t.gerenteId === user?.id && t.status === 'pago');
    const comissao = mySales.reduce((acc: number, t: any) => acc + (t.valorTotal * 0.05), 0);

    setStats({
      cambistas: mine.length,
      vendas: mySales.length,
      comissao: comissao
    });
  }, [user]);

  const handleTransfer = () => {
    if (transferAmount <= 0 || !targetCambista || !user) return;
    if (user.balance < transferAmount) {
      toast({ variant: "destructive", title: "SALDO INSUFICIENTE" });
      return;
    }

    const all = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = all.map((u: any) => {
      if (u.id === user.id) return { ...u, balance: u.balance - transferAmount };
      if (u.id === targetCambista) return { ...u, balance: u.balance + transferAmount };
      return u;
    });

    localStorage.setItem('leobet_users', JSON.stringify(updated));
    const me = updated.find((u: any) => u.id === user.id);
    setUser(me);
    toast({ title: "TRANSFERÊNCIA REALIZADA!" });
    setTransferAmount(0);
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black uppercase text-primary">Painel do Gerente</h1>
            <Card className="bg-primary text-white p-4">
              <p className="text-[10px] font-black uppercase opacity-60">Meu Saldo</p>
              <p className="text-xl font-black">R$ {user?.balance.toFixed(2)}</p>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="bg-white"><CardContent className="p-6 flex justify-between"><div><p className="text-xs font-black uppercase opacity-60">Cambistas</p><p className="text-2xl font-black">{stats.cambistas}</p></div><Users className="text-primary" /></CardContent></Card>
            <Card className="bg-white"><CardContent className="p-6 flex justify-between"><div><p className="text-xs font-black uppercase opacity-60">Vendas Equipe</p><p className="text-2xl font-black">{stats.vendas}</p></div><TrendingUp className="text-green-600" /></CardContent></Card>
            <Card className="bg-white"><CardContent className="p-6 flex justify-between"><div><p className="text-xs font-black uppercase opacity-60">Comissão (5%)</p><p className="text-2xl font-black">R$ {stats.comissao.toFixed(2)}</p></div><DollarSign className="text-accent" /></CardContent></Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase">Recarregar Cambista</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <select 
                  className="w-full h-10 border rounded-md px-3 font-bold"
                  value={targetCambista}
                  onChange={e => setTargetCambista(e.target.value)}
                >
                  <option value="">-- SELECIONE O CAMBISTA --</option>
                  {myCambistas.map(c => <option key={c.id} value={c.id}>{c.nome} (R$ {c.balance.toFixed(2)})</option>)}
                </select>
                <Input type="number" placeholder="VALOR R$" value={transferAmount} onChange={e => setTransferAmount(Number(e.target.value))} />
                <Button onClick={handleTransfer} className="w-full bg-accent hover:bg-accent/90 font-black h-12 uppercase">
                  <Send className="w-4 h-4 mr-2" /> Confirmar Transferência
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader><CardTitle className="text-sm font-black uppercase">Atalhos</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Link href="/gerente/cambistas"><Button className="w-full h-20 uppercase font-black">Meus Cambistas</Button></Link>
                <Link href="/admin/venda"><Button className="w-full h-20 uppercase font-black bg-accent">Nova Venda</Button></Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}


"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Calendar, 
  Send, 
  FileText, 
  CheckCircle2, 
  TrendingUp, 
  Wallet,
  AlertTriangle,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/store/use-auth-store';
import { useToast } from '@/hooks/use-toast';

export default function RelatoriosPage() {
  const { user, setUser } = useAuthStore();
  const { toast } = useToast();
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 7);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const loadData = () => {
    const all = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    if (user?.role === 'admin') {
      setTickets(all);
    } else if (user?.role === 'gerente') {
      setTickets(all.filter((t: any) => t.gerenteId === user?.id || t.vendedorId === user?.id));
    } else if (user?.role === 'cambista') {
      setTickets(all.filter((t: any) => t.vendedorId === user?.id));
    } else {
      setTickets(all.filter((t: any) => t.cliente === user?.nome || t.userId === user?.id));
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const filteredTickets = useMemo(() => {
    return tickets.filter(t => {
      const date = t.data.split('T')[0];
      return date >= startDate && date <= endDate;
    }).sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [tickets, startDate, endDate]);

  const totals = useMemo(() => {
    const bruto = filteredTickets.reduce((acc, t) => acc + (t.status === 'pago' ? t.valorTotal : 0), 0);
    const pendente = filteredTickets.reduce((acc, t) => acc + (t.status === 'pendente' ? t.valorTotal : 0), 0);
    return { bruto, pendente };
  }, [filteredTickets]);

  const handleShareValidation = (ticket: any) => {
    const host = window.location.origin;
    const link = `${host}/resultados?c=${ticket.id}`;
    
    let statusText = ticket.status === 'pago' ? '✅ VALIDADA' : '⚠ AGUARDANDO PAGAMENTO';
    const hasWinner = ticket.tickets.some((t: any) => t.status === 'ganhou' || t.status === 'pago' || t.status === 'pendente-resgate');
    if (hasWinner) statusText = '🔥 BILHETE PREMIADO';

    const message = `*LEOBET PRO - CONSULTA DE BILHETE*%0A%0A*STATUS:* ${statusText}%0A👤 *CLIENTE:* ${ticket.cliente}%0A🎟️ *CONCURSO:* ${ticket.eventoNome}%0A💰 *VALOR:* R$ ${ticket.valorTotal.toFixed(2)}%0A🆔 *RECIBO:* ${ticket.id}%0A%0A*Conferir em tempo real:*%0A${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${ticket.whatsapp}&text=${message}`, '_blank');
  };

  const handleValidatePending = (ticketId: string) => {
    if (!user) return;
    
    const ticket = tickets.find(t => t.id === ticketId);
    if (!ticket) return;

    const totalBalance = (user.balance || 0) + (user.commissionBalance || 0);

    if (totalBalance < ticket.valorTotal) {
      toast({ 
        variant: "destructive", 
        title: "SALDO INSUFICIENTE", 
        description: "Adicione saldo ou aguarde aprovação master." 
      });
      return;
    }

    setLoading(ticketId);
    
    setTimeout(() => {
      const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
      const updatedUsers = allUsers.map((u: any) => {
        if (u.id === user.id) {
          let remaining = ticket.valorTotal;
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

          const myCommRate = user.role === 'cambista' ? 0.10 : user.role === 'gerente' ? 0.15 : 0;
          newComm += (ticket.valorTotal * myCommRate);

          return { ...u, balance: newBal, commissionBalance: newComm };
        }

        if (user.role === 'cambista' && user.gerenteId && u.id === user.gerenteId) {
           return { ...u, commissionBalance: (u.commissionBalance || 0) + (ticket.valorTotal * 0.05) };
        }
        return u;
      });

      const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      const updatedTickets = allTickets.map((t: any) => 
        t.id === ticketId ? { ...t, status: 'pago' } : t
      );

      localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
      localStorage.setItem('leobet_tickets', JSON.stringify(updatedTickets));
      
      const me = updatedUsers.find((u: any) => u.id === user.id);
      if (me) {
        setUser(me);
        localStorage.setItem('logged_user', JSON.stringify(me));
      }

      setLoading(null);
      loadData();
      toast({ title: "VENDA VALIDADA!", description: "O bilhete agora é oficial e as comissões foram pagas." });
    }, 1000);
  };

  const userTotalBalance = (user?.balance || 0) + (user?.commissionBalance || 0);

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Relatórios Financeiros</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-black tracking-widest mt-1">Auditoria de Vendas e Comissões</p>
            </div>
            
            <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border items-center">
              <Calendar className="w-4 h-4 text-primary ml-2" />
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
              <span className="text-muted-foreground text-[10px] font-black uppercase">até</span>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
             <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Total Aprovado (R$)</p>
                 <p className="text-3xl font-black">R$ {totals.bruto.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl">
               <CardContent className="p-6">
                 <p className="text-[10px] font-black uppercase opacity-60">Pendente de Validação (R$)</p>
                 <p className="text-3xl font-black">R$ {totals.pendente.toFixed(2)}</p>
               </CardContent>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl">
               <CardContent className="p-6 flex justify-between items-center">
                 <div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground">Volume de Bilhetes</p>
                   <p className="text-3xl font-black">{filteredTickets.length}</p>
                 </div>
                 <FileText className="w-8 h-8 text-primary/20" />
               </CardContent>
             </Card>
             <Card className="bg-white border-none shadow-sm rounded-2xl">
               <CardContent className="p-6 flex justify-between items-center">
                 <div>
                   <p className="text-[10px] font-black uppercase text-muted-foreground">Minha Comissão</p>
                   <p className="text-3xl font-black text-green-600">R$ {(user?.commissionBalance || 0).toFixed(2)}</p>
                 </div>
                 <TrendingUp className="w-8 h-8 text-green-600/20" />
               </CardContent>
             </Card>
          </div>

          <div className="space-y-4">
             <div className="flex justify-between items-center">
               <h3 className="text-sm font-black uppercase text-primary flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Detalhamento de Movimentações</h3>
               <Badge className="bg-primary/10 text-primary font-black uppercase text-[10px]">{filteredTickets.length} REGISTROS</Badge>
             </div>

             <div className="grid grid-cols-1 gap-3">
                {filteredTickets.length === 0 ? (
                  <Card className="py-20 text-center border-dashed opacity-30 uppercase font-black text-xs">Nenhum registro no período selecionado</Card>
                ) : (
                  filteredTickets.map((t, i) => {
                    const hasWinner = t.tickets.some((ticket: any) => ticket.status === 'ganhou' || ticket.status === 'pendente-resgate');
                    const hasPaid = t.tickets.some((ticket: any) => ticket.status === 'pago' && ticket.valorPremio > 0);
                    const isVendedor = t.vendedorId === user?.id;
                    const canValidate = isVendedor && t.status === 'pendente' && userTotalBalance >= t.valorTotal;

                    return (
                      <Card key={i} className={`p-4 hover:shadow-md transition-all border-l-8 ${t.status === 'pago' ? 'border-l-green-600' : 'border-l-orange-500'}`}>
                         <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                            <div className="flex-1">
                               <div className="flex items-center gap-2">
                                  <p className="font-black uppercase text-sm">{t.cliente}</p>
                                  <Badge variant={t.status === 'pago' ? 'default' : 'destructive'} className="text-[8px] h-4 font-black uppercase">
                                    {t.status === 'pago' ? '✓ Validado' : '⚠ Pendente'}
                                  </Badge>
                                  {hasWinner && <Badge className="bg-accent text-white text-[8px] h-4 font-black uppercase">🔥 Ganhador</Badge>}
                                  {hasPaid && <Badge className="bg-blue-600 text-white text-[8px] h-4 font-black uppercase">✓ Prêmio Pago</Badge>}
                               </div>
                               <p className="text-[10px] font-bold text-muted-foreground uppercase mt-1">
                                 {t.eventoNome} • {new Date(t.data).toLocaleString()} • {t.tickets.length} Bilhetes • ID: {t.id}
                               </p>
                               {user?.role === 'admin' && <p className="text-[9px] font-black uppercase text-primary/60 mt-1">Vendedor: {t.vendedorNome}</p>}
                            </div>
                            
                            <div className="flex items-center gap-6 shrink-0">
                               <div className="text-right">
                                  <p className="text-[9px] font-black uppercase text-muted-foreground">Valor Total</p>
                                  <p className="text-lg font-black text-primary">R$ {t.valorTotal.toFixed(2)}</p>
                                </div>
                               <div className="flex gap-2">
                                  {canValidate ? (
                                    <Button 
                                      onClick={() => handleValidatePending(t.id)}
                                      className="bg-accent hover:bg-accent/90 h-10 gap-2 font-black uppercase text-[10px] rounded-xl shadow-lg animate-pulse"
                                      disabled={loading === t.id}
                                    >
                                      {loading === t.id ? <TrendingUp className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5" />} 
                                      Validar com Saldo
                                    </Button>
                                  ) : t.status === 'pendente' && isVendedor && (
                                    <div className="flex flex-col items-center">
                                       <Badge variant="outline" className="text-[7px] font-black uppercase border-orange-200 text-orange-600">Aguardando Saldo</Badge>
                                       <p className="text-[6px] font-black text-muted-foreground uppercase mt-0.5">Falta R$ {(t.valorTotal - userTotalBalance).toFixed(2)}</p>
                                    </div>
                                  )}
                                  
                                  <Button 
                                    onClick={() => handleShareValidation(t)}
                                    className="bg-green-600 hover:bg-green-700 h-10 gap-2 font-black uppercase text-[10px] rounded-xl"
                                    disabled={t.status === 'pendente'}
                                  >
                                    <Send className="w-3.5 h-3.5" /> Enviar p/ Cliente
                                  </Button>
                               </div>
                            </div>
                         </div>
                      </Card>
                    );
                  })
                )}
             </div>
          </div>
        </div>
      </main>
    </div>
  );
}

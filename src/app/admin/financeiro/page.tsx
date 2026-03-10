
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from '@/components/ui/badge';
import { 
  UserCheck, 
  CheckCircle2, 
  UserPlus,
  History,
  ReceiptText,
  Search,
  Trophy,
  AlertCircle,
  Clock,
  ThumbsUp,
  Calendar,
  Filter,
  Users,
  ArrowRightLeft,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosHistory, setBingosHistory] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [validationCode, setValidationCode] = useState('');
  const [validatedTicket, setValidatedTicket] = useState<any>(null);
  
  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = () => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setAllUsers(users);
    setPendingUsers(users.filter((u: UserProfile) => u.status === 'pending'));

    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allTickets);
    setPendingSales(allTickets.filter((t: any) => t.status === 'pendente'));

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    setBingosHistory(allBingos); 
  };

  useEffect(() => {
    loadData();
  }, []);

  const calculateFinance = () => {
    let org = 0;      // Admin (20%)
    let cambista = 0; // Cambistas (10%)
    let gerente = 0;  // Gerentes (5%)
    let bruto = 0;

    const filteredTickets = tickets.filter(t => {
      const date = new Date(t.data).toISOString().split('T')[0];
      return date >= startDate && date <= endDate && t.status === 'pago';
    });

    filteredTickets.forEach(t => {
      bruto += t.valorTotal;
      org += t.valorTotal * 0.20;

      if (t.vendedorRole === 'admin') {
        // Admin: ganha tudo (10+5 extras)
        org += t.valorTotal * 0.15;
      } else if (t.vendedorRole === 'gerente') {
        // Gerente vendeu: ganha 10 (cambista) + 5 (gerente)
        gerente += t.valorTotal * 0.15;
      } else if (t.vendedorRole === 'cambista') {
        cambista += t.valorTotal * 0.10;
        if (t.gerenteId && t.gerenteId !== 'admin-master') {
          gerente += t.valorTotal * 0.05;
        } else {
          org += t.valorTotal * 0.05;
        }
      } else {
        org += t.valorTotal * 0.15;
      }
    });

    return { org, cambista, gerente, bruto, premios: bruto * 0.65 };
  };

  const finance = calculateFinance();

  const approveUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.map((u: UserProfile) => 
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "Acesso Aprovado!" });
  };

  const approveSale = (saleData: string) => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allReceipts.map((t: any) => {
      if (t.data === saleData) return { ...t, status: 'pago' };
      return t;
    });
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
    loadData();
    toast({ title: "Venda Aprovada!" });
  };

  const handleTransferCambista = (cambistaId: string, newGerenteId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.map((u: UserProfile) => 
      u.id === cambistaId ? { ...u, gerenteId: newGerenteId } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "Cambista Transferido!" });
  };

  const removeGerente = (gerenteId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    // Transfere cambistas para o Admin antes de "remover" (aqui apenas mudamos a role ou desativamos)
    const updated = users.map((u: UserProfile) => {
      if (u.id === gerenteId) return { ...u, role: 'cliente' as any }; // "Rebaixa" para cliente
      if (u.gerenteId === gerenteId) return { ...u, gerenteId: 'admin-master' };
      return u;
    });
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "Gerente Removido!", description: "Cambistas movidos para o Admin." });
  };

  const handleValidatePrize = () => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    let found = null;
    allReceipts.forEach((receipt: any) => {
      const ticket = receipt.tickets.find((t: any) => t.id === validationCode);
      if (ticket) found = { ...ticket, receiptInfo: receipt };
    });

    if (found) {
      setValidatedTicket(found);
    } else {
      toast({ variant: "destructive", title: "CÓDIGO INVÁLIDO" });
      setValidatedTicket(null);
    }
  };

  const handlePayPrize = () => {
    if (!validatedTicket || validatedTicket.status === 'pago') return;
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updatedReceipts = allReceipts.map((receipt: any) => ({
      ...receipt,
      tickets: receipt.tickets.map((t: any) => t.id === validatedTicket.id ? { ...t, status: 'pago' } : t)
    }));
    localStorage.setItem('leobet_tickets', JSON.stringify(updatedReceipts));
    loadData();
    setValidatedTicket({ ...validatedTicket, status: 'pago' });
    toast({ title: "PRÊMIO PAGO!" });
  };

  const gerentes = allUsers.filter(u => u.role === 'gerente');

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase text-primary">Auditoria Master (20/10/5)</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base Permanente • Histórico 365 Dias</p>
            </div>
            <div className="flex gap-2">
               <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32" />
               <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Admin/Org (20% +)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Bruto Período</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="rede">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="rede" className="font-bold">Gestão de Rede</TabsTrigger>
              <TabsTrigger value="pendentes" className="font-bold">Vendas Pendentes ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="aprovacao" className="font-bold">Novos Cambistas ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="sorteios" className="font-bold">Histórico Sorteios</TabsTrigger>
              <TabsTrigger value="resgate" className="font-bold">Validar Bilhete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="rede" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase flex items-center gap-2"><Users className="w-4 h-4" /> Gerentes Ativos</h3>
                     {gerentes.map(g => (
                       <Card key={g.id} className="p-4 flex justify-between items-center border-l-4 border-l-purple-600">
                         <div>
                            <p className="font-black uppercase">{g.nome}</p>
                            <p className="text-[10px] text-muted-foreground">{allUsers.filter(u => u.gerenteId === g.id).length} Cambistas vinculados</p>
                         </div>
                         <Button variant="ghost" size="sm" onClick={() => removeGerente(g.id)} className="text-destructive font-black uppercase text-[10px] gap-2">
                           <Trash2 className="w-3 h-3" /> Remover Gerente
                         </Button>
                       </Card>
                     ))}
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase flex items-center gap-2"><ArrowRightLeft className="w-4 h-4" /> Transferir Cambista</h3>
                     {allUsers.filter(u => u.role === 'cambista' && u.status === 'approved').map(c => (
                       <Card key={c.id} className="p-4 space-y-3">
                         <div className="flex justify-between">
                            <p className="font-bold uppercase text-xs">{c.nome}</p>
                            <p className="text-[9px] font-black uppercase px-2 py-1 bg-muted rounded">Gerente Atual: {allUsers.find(u => u.id === c.gerenteId)?.nome || 'Admin'}</p>
                         </div>
                         <div className="flex gap-2">
                            <select 
                               className="flex-1 h-8 text-[10px] border rounded font-black uppercase px-2"
                               onChange={(e) => handleTransferCambista(c.id, e.target.value)}
                               defaultValue={c.gerenteId}
                            >
                               <option value="admin-master">ADMIN MASTER (EU)</option>
                               {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                         </div>
                       </Card>
                     ))}
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem vendas aguardando aprovação</div>
               ) : (
                 pendingSales.map((t, i) => (
                   <Card key={i} className="flex justify-between items-center p-4 bg-orange-50 border-orange-200">
                     <div className="space-y-1">
                       <p className="font-black uppercase text-sm">{t.cliente}</p>
                       <p className="text-[10px] font-bold text-muted-foreground uppercase">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                       <p className="text-[9px] font-black text-orange-600 uppercase">Vendedor: {t.vendedorNome}</p>
                     </div>
                     <Button onClick={() => approveSale(t.data)} className="bg-green-600 hover:bg-green-700 font-black uppercase text-xs">Aprovar Venda</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="aprovacao" className="mt-6 space-y-4">
               {pendingUsers.length === 0 ? (
                 <div className="py-20 text-center opacity-30 font-black uppercase text-xs">Sem novos cadastros de cambistas</div>
               ) : (
                 pendingUsers.map(u => (
                   <Card key={u.id} className="p-4 flex justify-between items-center">
                     <div>
                        <p className="font-black uppercase">{u.nome}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                        <p className="text-[9px] font-bold uppercase text-primary">Gerente: Admin Master (Padrão)</p>
                     </div>
                     <Button onClick={() => approveUser(u.id)} className="bg-primary font-black uppercase text-xs">Aprovar Cadastro</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="resgate" className="mt-6 space-y-6">
               <div className="flex gap-2 max-w-md">
                 <Input placeholder="CÓDIGO DO BILHETE (11 DÍGITOS)" value={validationCode} onChange={e => setValidationCode(e.target.value)} className="h-12 font-bold uppercase" />
                 <Button onClick={handleValidatePrize} className="h-12 px-8 font-black uppercase">Buscar</Button>
               </div>
               {validatedTicket && (
                 <Card className={`border-l-8 ${validatedTicket.status === 'pago' ? 'border-l-blue-600' : 'border-l-green-600 shadow-xl'}`}>
                   <CardContent className="p-6 flex justify-between items-center">
                     <div>
                       <p className="font-black text-lg">CLIENTE: {validatedTicket.receiptInfo.cliente}</p>
                       <p className="text-xs font-bold uppercase text-muted-foreground">Concurso: {validatedTicket.receiptInfo.eventoNome}</p>
                       <div className="flex gap-2 mt-4">
                          <Badge variant="outline" className="font-black">R$ {validatedTicket.receiptInfo.valorTotal.toFixed(2)}</Badge>
                          <Badge className={validatedTicket.status === 'pago' ? 'bg-blue-600' : 'bg-green-600'}>
                             {validatedTicket.status === 'pago' ? 'JÁ RESGATADO' : 'AGUARDANDO BAIXA'}
                          </Badge>
                       </div>
                     </div>
                     {validatedTicket.status === 'ganhou' ? (
                       <Button onClick={handlePayPrize} className="bg-green-600 hover:bg-green-700 h-14 px-8 font-black uppercase">Efetuar Baixa</Button>
                     ) : validatedTicket.status === 'pago' ? (
                       <div className="text-right">
                          <p className="text-[10px] font-black uppercase text-blue-600">Resgate efetuado</p>
                          <CheckCircle2 className="w-8 h-8 text-blue-600 ml-auto mt-1" />
                       </div>
                     ) : (
                       <Badge variant="destructive" className="font-black">BILHETE NÃO PREMIADO</Badge>
                     )}
                   </CardContent>
                 </Card>
               )}
            </TabsContent>

            <TabsContent value="sorteios" className="mt-6">
               <div className="grid grid-cols-1 gap-4">
                  {bingosHistory.filter(b => b.status === 'finalizado').map(b => (
                    <Card key={b.id} className="p-6">
                       <div className="flex justify-between items-start mb-4">
                          <div>
                             <h3 className="text-xl font-black uppercase text-primary">{b.nome}</h3>
                             <p className="text-xs font-bold text-muted-foreground">{new Date(b.dataSorteio).toLocaleString()}</p>
                          </div>
                          <Badge className="bg-green-600 uppercase font-black">Finalizado</Badge>
                       </div>
                       <div className="space-y-2">
                          <p className="text-[10px] font-black uppercase text-muted-foreground">Bolas Sorteadas:</p>
                          <div className="flex flex-wrap gap-1">
                             {b.bolasSorteadas?.map((n: number) => (
                               <div key={n} className="w-7 h-7 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center">
                                 {n}
                               </div>
                             ))}
                          </div>
                       </div>
                    </Card>
                  ))}
               </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

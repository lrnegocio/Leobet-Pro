
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
  Filter
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosHistory, setBingosHistory] = useState<any[]>([]);
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

  useEffect(() => {
    const loadData = () => {
      const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
      setPendingUsers(allUsers.filter((u: UserProfile) => u.status === 'pending'));

      const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      setTickets(allTickets);
      setPendingSales(allTickets.filter((t: any) => t.status === 'pendente'));

      const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
      setBingosHistory(allBingos); 
    };
    
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
      
      // Regra 20/10/5 Inteligente
      org += t.valorTotal * 0.20; // 20% do Organizador sempre para Admin

      if (t.vendedorRole === 'admin') {
        // Admin vendeu: ganha tudo (20 + 10 + 5)
        cambista += 0; 
        gerente += 0;
        // O valor total de sobra (35%) fica na casa
      } else if (t.vendedorRole === 'gerente') {
        // Gerente vendeu: ganha comissão de cambista (10%) + gerente (5%)
        gerente += t.valorTotal * 0.15;
      } else if (t.vendedorRole === 'cambista') {
        cambista += t.valorTotal * 0.10;
        if (t.gerenteId) {
          // Cambista de um gerente: 5% vai para o gerente dele
          gerente += t.valorTotal * 0.05;
        } else {
          // Cambista direto do Admin: os 5% de gerente voltam para o Org
          org += t.valorTotal * 0.05;
        }
      } else {
        // Cliente direto: os 15% (10+5) ficam para o Admin (Org)
        org += t.valorTotal * 0.15;
      }
    });

    return { org, cambista, gerente, bruto, premios: bruto * 0.65 };
  };

  const finance = calculateFinance();

  const approveUser = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = allUsers.map((u: UserProfile) => 
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    toast({ title: "Acesso Aprovado!" });
  };

  const approveSale = (saleData: string) => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allReceipts.map((t: any) => {
      if (t.data === saleData) return { ...t, status: 'pago' };
      return t;
    });
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
    setTickets(updated);
    setPendingSales(updated.filter((t: any) => t.status === 'pendente'));
    toast({ title: "Venda Aprovada!" });
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
    setTickets(updatedReceipts);
    setValidatedTicket({ ...validatedTicket, status: 'pago' });
    toast({ title: "PRÊMIO PAGO!" });
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase text-primary">Auditoria Master (20/10/5)</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Total de Comissões e Prêmios</p>
            </div>
            <div className="flex gap-2">
               <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32" />
               <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Organizador (20% + sobra)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Bruto Total</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="pendentes">
            <TabsList className="bg-muted p-1">
              <TabsTrigger value="pendentes" className="font-bold">Pendentes ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="vendas" className="font-bold">Relatório Geral</TabsTrigger>
              <TabsTrigger value="sorteios" className="font-bold">Histórico Sorteios</TabsTrigger>
              <TabsTrigger value="resgate" className="font-bold">Validar Bilhete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.map((t, i) => (
                 <div key={i} className="flex justify-between p-4 bg-orange-50 border rounded-xl">
                   <div>
                     <p className="font-black uppercase">{t.cliente}</p>
                     <p className="text-xs">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                   </div>
                   <Button onClick={() => approveSale(t.data)} className="bg-green-600">Aprovar Venda</Button>
                 </div>
               ))}
            </TabsContent>

            <TabsContent value="resgate" className="mt-6 space-y-6">
               <div className="flex gap-2 max-w-md">
                 <Input placeholder="CÓDIGO DO BILHETE" value={validationCode} onChange={e => setValidationCode(e.target.value)} />
                 <Button onClick={handleValidatePrize}>Buscar</Button>
               </div>
               {validatedTicket && (
                 <Card className={`border-l-8 ${validatedTicket.status === 'pago' ? 'border-l-blue-600' : 'border-l-green-600'}`}>
                   <CardContent className="p-6 flex justify-between items-center">
                     <div>
                       <p className="font-black">CLIENTE: {validatedTicket.receiptInfo.cliente}</p>
                       <p className="text-xs uppercase">Concurso: {validatedTicket.receiptInfo.eventoNome}</p>
                       <p className="font-bold text-primary mt-2">VALOR: R$ {validatedTicket.receiptInfo.valorTotal.toFixed(2)}</p>
                     </div>
                     {validatedTicket.status === 'ganhou' ? (
                       <Button onClick={handlePayPrize} className="bg-green-600">Efetuar Baixa</Button>
                     ) : (
                       <Badge variant="outline" className="text-blue-600 border-blue-600 font-black">RESGATADO EM {new Date().toLocaleDateString()}</Badge>
                     )}
                   </CardContent>
                 </Card>
               )}
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

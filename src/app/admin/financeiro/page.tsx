
"use client"

import React, { useState, useEffect } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle2, 
  Users,
  ArrowRightLeft,
  RefreshCcw,
  Trophy,
  History,
  ShieldAlert,
  UserPlus,
  PlusCircle,
  Search,
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/types/auth';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosHistory, setBingosHistory] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [validationCode, setValidationCode] = useState('');
  const [validatedTicket, setValidatedTicket] = useState<any>(null);
  
  const [newUser, setNewUser] = useState({
    nome: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: '',
    role: 'cambista' as UserRole
  });

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

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allReceipts);
    setPendingSales(allReceipts.filter((t: any) => t.status === 'pendente'));

    // Pegar prêmios pendentes de resgate
    const payouts: any[] = [];
    allReceipts.forEach((r: any) => {
      r.tickets.forEach((t: any) => {
        if (t.status === 'pendente-resgate') {
          payouts.push({ ...t, receipt: r });
        }
      });
    });
    setPendingPayouts(payouts);

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    setBingosHistory(allBingos); 
  };

  useEffect(() => {
    loadData();
  }, []);

  const clearAllData = () => {
    localStorage.removeItem('leobet_tickets');
    localStorage.removeItem('leobet_bingos');
    localStorage.removeItem('leobet_boloes');
    const adminMaster = allUsers.find(u => u.id === 'admin-master');
    localStorage.setItem('leobet_users', JSON.stringify(adminMaster ? [adminMaster] : []));
    loadData();
    toast({ title: "SISTEMA RESETADO!" });
  };

  const calculateFinance = () => {
    let org = 0;      
    let cambista = 0; 
    let gerente = 0;  
    let bruto = 0;

    const filteredTickets = tickets.filter(t => {
      const date = new Date(t.data).toISOString().split('T')[0];
      return date >= startDate && date <= endDate && t.status === 'pago';
    });

    filteredTickets.forEach(t => {
      bruto += t.valorTotal;
      // REGRA 20/10/5 RIGOROSA
      if (t.vendedorRole === 'admin') {
        org += t.valorTotal * 0.35; // Admin fica com tudo
      } else if (t.vendedorRole === 'gerente') {
        org += t.valorTotal * 0.20;
        gerente += t.valorTotal * 0.15; // Gerente pega sua parte + cambista dele
      } else if (t.vendedorRole === 'cambista') {
        org += t.valorTotal * 0.20;
        cambista += t.valorTotal * 0.10;
        if (t.gerenteId && t.gerenteId !== 'admin-master') {
          gerente += t.valorTotal * 0.05;
        } else {
          org += t.valorTotal * 0.05; // Margem de gerente vai para o Admin se cambista for direto
        }
      }
    });

    return { org, cambista, gerente, bruto, premios: bruto * 0.65 };
  };

  const finance = calculateFinance();

  const approvePayout = (ticketId: string) => {
    const updated = tickets.map((r: any) => ({
      ...r,
      tickets: r.tickets.map((t: any) => t.id === ticketId ? { ...t, status: 'pago' } : t)
    }));
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
    loadData();
    toast({ title: "PAGAMENTO APROVADO!", description: "Bilhete marcado como pago definitivamente." });
  };

  const approveSale = (saleData: string) => {
    const updated = tickets.map((t: any) => {
      if (t.data === saleData) return { ...t, status: 'pago' };
      return t;
    });
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
    loadData();
    toast({ title: "Venda Aprovada!" });
  };

  const handleValidatePrize = () => {
    let found = null;
    tickets.forEach((receipt: any) => {
      const ticket = receipt.tickets.find((t: any) => t.id === validationCode);
      if (ticket) found = { ...ticket, receiptInfo: receipt };
    });
    if (found) setValidatedTicket(found);
    else {
      toast({ variant: "destructive", title: "CÓDIGO INVÁLIDO" });
      setValidatedTicket(null);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary">Painel Master LEOBET PRO</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Total de Rede e Auditoria 365 Dias</p>
            </div>
            <div className="flex gap-3">
               <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border">
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
                 <span className="flex items-center text-muted-foreground text-xs font-black">ATÉ</span>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
               </div>

               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" className="h-12 gap-2 font-black uppercase text-xs rounded-xl shadow-lg">
                     <RefreshCcw className="w-4 h-4" /> Limpar Testes
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-white border-destructive border-t-8 rounded-[2rem]">
                   <AlertDialogHeader>
                     <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4"><ShieldAlert className="w-8 h-8 text-destructive" /></div>
                     <AlertDialogTitle className="text-2xl font-black uppercase text-center">Resetar Sistema?</AlertDialogTitle>
                     <AlertDialogDescription className="text-center font-bold text-muted-foreground">Isso apagará todos os concursos e bilhetes de teste anteriores.</AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="mt-6 flex gap-3">
                     <AlertDialogCancel className="flex-1 font-black uppercase border-2 h-12 rounded-xl">Cancelar</AlertDialogCancel>
                     <AlertDialogAction onClick={clearAllData} className="flex-1 bg-destructive hover:bg-destructive/90 font-black uppercase h-12 text-white rounded-xl">Limpar Agora</AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Admin (20%+)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Total Bruto</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="payouts">
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto">
              <TabsTrigger value="payouts" className="font-bold rounded-xl whitespace-nowrap">Resgates ({pendingPayouts.length})</TabsTrigger>
              <TabsTrigger value="pendentes" className="font-bold rounded-xl whitespace-nowrap">Vendas ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="resgate" className="font-bold rounded-xl whitespace-nowrap">Validador</TabsTrigger>
              <TabsTrigger value="sorteios" className="font-bold rounded-xl whitespace-nowrap">Histórico Sorteios</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {pendingPayouts.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl"><CardContent className="opacity-30 font-black uppercase text-xs">Sem solicitações de prêmios</CardContent></Card>
               ) : (
                 pendingPayouts.map((p, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-green-50 border-green-200 border-l-8 border-l-green-500 rounded-2xl shadow-md">
                     <div className="space-y-1">
                       <p className="font-black uppercase text-lg text-green-800">{p.receipt.cliente}</p>
                       <p className="text-xs font-bold text-green-700/70 uppercase">Bilhete: {p.id} • {p.receipt.eventoNome}</p>
                       <div className="flex items-center gap-2 mt-2">
                         <Badge className="bg-green-600 font-black text-xs uppercase px-4 py-1">Prêmio: R$ {p.valorPremio.toFixed(2)}</Badge>
                         <span className="text-[9px] font-black uppercase text-muted-foreground">Vendedor: {p.receipt.vendedorNome}</span>
                       </div>
                     </div>
                     <Button onClick={() => approvePayout(p.id)} className="bg-green-600 hover:bg-green-700 font-black uppercase text-xs shadow-lg h-12 px-8 rounded-xl">Aprovar Pagamento</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl"><CardContent className="opacity-30 font-black uppercase text-xs">Sem vendas aguardando liberação</CardContent></Card>
               ) : (
                 pendingSales.map((t, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-orange-50 border-orange-200 border-l-8 border-l-orange-500 rounded-2xl shadow-md">
                     <div>
                       <p className="font-black uppercase text-lg">{t.cliente}</p>
                       <p className="text-xs font-bold text-orange-700/70 uppercase">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                       <Badge className="bg-orange-600 font-black text-[9px] uppercase mt-2">Vendedor: {t.vendedorNome}</Badge>
                     </div>
                     <Button onClick={() => approveSale(t.data)} className="bg-orange-600 font-black uppercase text-xs shadow-lg h-12 px-8 rounded-xl">Liberar Bilhete</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="resgate" className="mt-6">
               <Card className="rounded-[2.5rem] shadow-xl overflow-hidden border-none">
                 <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest text-center">Auditoria de Bilhetes Premiados</CardTitle></CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="flex gap-2 max-w-lg mx-auto">
                      <Input placeholder="CÓDIGO DE 11 DÍGITOS" value={validationCode} onChange={e => setValidationCode(e.target.value.toUpperCase())} className="h-14 font-black text-center text-lg uppercase rounded-2xl border-2" />
                      <Button onClick={handleValidatePrize} className="h-14 px-8 font-black uppercase bg-primary rounded-2xl shadow-lg"><Search className="mr-2 w-4 h-4" /> Buscar</Button>
                    </div>

                    {validatedTicket && (
                      <div className={`p-8 rounded-[2rem] border-4 animate-in zoom-in-95 duration-300 ${validatedTicket.status === 'pago' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="space-y-2 text-center md:text-left">
                            <p className="font-black text-2xl text-primary leading-none uppercase">{validatedTicket.receiptInfo.cliente}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">{validatedTicket.receiptInfo.eventoNome}</p>
                            <div className="flex gap-2 mt-2">
                              <Badge className={`font-black h-7 px-4 ${validatedTicket.status === 'pago' ? 'bg-blue-600' : 'bg-green-600'}`}>
                                {validatedTicket.status === 'pago' ? 'PRÊMIO JÁ PAGO' : '✓ PREMIADO'}
                              </Badge>
                              {validatedTicket.status === 'ganhou' && (
                                <Badge variant="outline" className="border-green-600 text-green-600 font-black">VALOR: R$ {validatedTicket.valorPremio?.toFixed(2)}</Badge>
                              )}
                            </div>
                          </div>
                          {validatedTicket.status === 'ganhou' ? (
                            <Button onClick={() => approvePayout(validatedTicket.id)} className="bg-green-600 hover:bg-green-700 h-16 px-12 font-black uppercase text-lg rounded-2xl shadow-2xl">Pagar Prêmio</Button>
                          ) : (
                            <div className="text-center bg-blue-100 p-4 rounded-2xl border-2 border-blue-200">
                               <CheckCircle2 className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                               <p className="text-[10px] font-black uppercase text-blue-600">Baixa Realizada</p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                 </CardContent>
               </Card>
            </TabsContent>

            <TabsContent value="sorteios" className="mt-6">
               <div className="grid grid-cols-1 gap-4">
                  {bingosHistory.filter(b => b.status === 'finalizado').map(b => (
                    <Card key={b.id} className="p-6 rounded-2xl shadow-sm border-l-8 border-l-green-600">
                       <div className="flex justify-between items-start mb-4">
                          <div><h3 className="text-xl font-black uppercase text-primary leading-none">{b.nome}</h3><p className="text-[10px] font-bold text-muted-foreground mt-1">Realizado em: {new Date(b.dataSorteio).toLocaleString()}</p></div>
                          <Badge className="bg-green-600 uppercase font-black text-[9px] px-3">CONCURSO FINALIZADO</Badge>
                       </div>
                       <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                          <p className="text-[9px] font-black uppercase text-muted-foreground mb-2">Bolas Chamadas no Globo:</p>
                          <div className="flex flex-wrap gap-1.5">{b.bolasSorteadas?.map((n: number) => (<div key={n} className="w-8 h-8 bg-primary text-white text-[10px] font-black rounded-full flex items-center justify-center shadow-sm">{n}</div>))}</div>
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

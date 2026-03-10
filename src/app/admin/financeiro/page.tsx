
"use client"

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
  RefreshCcw,
  Trophy,
  History,
  ShieldAlert,
  Search,
  Settings,
  XCircle,
  TrendingUp,
  Store,
  Wallet,
  Globe,
  UserPlus,
  ArrowRightLeft,
  UserCircle,
  ShieldCheck,
  Youtube,
  UserCheck,
  AlertCircle,
  Key,
  Trash2,
  Lock,
  Unlock,
  Edit2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/types/auth';
import { useAuthStore } from '@/store/use-auth-store';
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

function FinanceiroContent() {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'depositos';

  // Trava de segurança para Financeiro Master
  useEffect(() => {
    if (currentUser && currentUser.role !== 'admin') {
      toast({ variant: "destructive", title: "ACESSO NEGADO", description: "Área exclusiva para Administradores Master." });
      router.push('/' + currentUser.role + '/dashboard');
    }
  }, [currentUser, router]);

  const [tickets, setTickets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [companyPix, setCompanyPix] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  
  const [newPartner, setNewPartner] = useState({
    nome: '',
    email: '',
    password: '',
    role: 'cambista' as UserRole,
    cpf: '',
    birthDate: '',
    phone: '',
    pixKey: '',
    gerenteId: 'admin-master'
  });

  const [startDate, setStartDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = () => {
    const settings = JSON.parse(localStorage.getItem('leobet_settings') || '{}');
    setCompanyPix(settings.companyPix || '');
    setYoutubeUrl(settings.youtubeUrl || '');

    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setAllUsers(users);
    setPendingUsers(users.filter((u: UserProfile) => u.status === 'pending'));

    const withdrawals = JSON.parse(localStorage.getItem('leobet_withdrawals') || '[]');
    setPendingWithdrawals(withdrawals.filter((w: any) => w.status === 'pendente'));

    const deposits = JSON.parse(localStorage.getItem('leobet_deposits') || '[]');
    setPendingDeposits(deposits.filter((d: any) => d.status === 'pendente'));

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allReceipts);
    setPendingSales(allReceipts.filter((t: any) => t.status === 'pendente'));

    const payouts: any[] = [];
    allReceipts.forEach((r: any) => {
      r.tickets.forEach((t: any) => {
        if (t.status === 'pendente-resgate') {
          payouts.push({ ...t, receipt: r });
        }
      });
    });
    setPendingPayouts(payouts);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPartner.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "DDD OBRIGATÓRIO", description: "Informe o telefone completo com DDD." });
      return;
    }

    if (!newPartner.password) {
      toast({ variant: "destructive", title: "SENHA OBRIGATÓRIA", description: "Defina uma senha inicial para o parceiro." });
      return;
    }

    const newUser: UserProfile = {
      id: Math.random().toString(36).substring(7).toUpperCase(),
      ...newPartner,
      nome: newPartner.nome.toUpperCase(),
      phone: cleanPhone,
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      status: 'approved',
      createdAt: new Date().toISOString()
    };

    const existingUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    localStorage.setItem('leobet_users', JSON.stringify([...existingUsers, newUser]));
    
    toast({ title: "PARCEIRO CADASTRADO!", description: `${newUser.nome} (ID: ${newUser.id}) agora faz parte da rede.` });
    setNewPartner({
      nome: '',
      email: '',
      password: '',
      role: 'cambista',
      cpf: '',
      birthDate: '',
      phone: '',
      pixKey: '',
      gerenteId: 'admin-master'
    });
    loadData();
  };

  const deleteUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "USUÁRIO EXCLUÍDO!" });
  };

  const toggleUserStatus = (userId: string, currentStatus: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const newStatus = currentStatus === 'approved' ? 'pending' : 'approved';
    const updated = users.map((u: any) => u.id === userId ? { ...u, status: newStatus } : u);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: `USUÁRIO ${newStatus === 'approved' ? 'ATIVADO' : 'BLOQUEADO'}!` });
  };

  const approveUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.map((u: UserProfile) => u.id === userId ? { ...u, status: 'approved' } : u);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "ACESSO APROVADO!", description: "O parceiro agora pode acessar o sistema." });
  };

  const rejectUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.filter((u: UserProfile) => u.id !== userId);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ variant: "destructive", title: "SOLICITAÇÃO RECUSADA" });
  };

  const transferCambista = (userId: string, newGerenteId: string) => {
    const updated = allUsers.map(u => u.id === userId ? { ...u, gerenteId: newGerenteId } : u);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "CAMBISTA TRANSFERIDO!" });
  };

  const saveSettings = () => {
    const settings = { companyPix, youtubeUrl };
    localStorage.setItem('leobet_settings', JSON.stringify(settings));
    toast({ title: "CONFIGURAÇÕES SALVAS!" });
  };

  const clearAllData = () => {
    localStorage.removeItem('leobet_tickets');
    localStorage.removeItem('leobet_bingos');
    localStorage.removeItem('leobet_boloes');
    localStorage.removeItem('leobet_withdrawals');
    localStorage.removeItem('leobet_deposits');
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
      if (t.vendedorRole === 'admin') {
        org += t.valorTotal * 0.35; 
      } else if (t.vendedorRole === 'gerente') {
        org += t.valorTotal * 0.20;
        gerente += t.valorTotal * 0.15; 
      } else if (t.vendedorRole === 'cambista') {
        org += t.valorTotal * 0.20;
        cambista += t.valorTotal * 0.10;
        if (t.gerenteId && t.gerenteId !== 'admin-master') {
          gerente += t.valorTotal * 0.05;
        } else {
          org += t.valorTotal * 0.05; 
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
    toast({ title: "PAGAMENTO APROVADO!" });
  };

  const approveDeposit = (depositId: string) => {
    const allDeposits = JSON.parse(localStorage.getItem('leobet_deposits') || '[]');
    const deposit = allDeposits.find((d: any) => d.id === depositId);
    if (!deposit) return;

    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updatedUsers = users.map((u: any) => {
      if (u.id === deposit.userId) {
        return { ...u, balance: (u.balance || 0) + deposit.amount };
      }
      return u;
    });

    const updatedDeposits = allDeposits.map((d: any) => 
      d.id === depositId ? { ...d, status: 'aprovado' } : d
    );

    localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
    localStorage.setItem('leobet_deposits', JSON.stringify(updatedDeposits));
    loadData();
    toast({ title: "DEPÓSITO APROVADO!" });
  };

  const rejectDeposit = (depositId: string) => {
    const allDeposits = JSON.parse(localStorage.getItem('leobet_deposits') || '[]');
    const updatedDeposits = allDeposits.map((d: any) => 
      d.id === depositId ? { ...d, status: 'rejeitado' } : d
    );
    localStorage.setItem('leobet_deposits', JSON.stringify(updatedDeposits));
    loadData();
    toast({ variant: "destructive", title: "DEPÓSITO REJEITADO!" });
  };

  const approveWithdrawal = (withdrawId: string) => {
    const allWithdrawals = JSON.parse(localStorage.getItem('leobet_withdrawals') || '[]');
    const updatedWithdrawals = allWithdrawals.map((w: any) => 
      w.id === withdrawId ? { ...w, status: 'pago' } : w
    );
    localStorage.setItem('leobet_withdrawals', JSON.stringify(updatedWithdrawals));
    loadData();
    toast({ title: "SAQUE APROVADO!" });
  };

  const approveSale = (receiptId: string) => {
    const receipt = tickets.find(t => t.id === receiptId);
    if (!receipt) return;

    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updatedUsers = allUsers.map((u: any) => {
      if (u.id === receipt.vendedorId) {
        const commRate = receipt.vendedorRole === 'cambista' ? 0.10 : receipt.vendedorRole === 'gerente' ? 0.05 : 0;
        const newComm = (u.commissionBalance || 0) + (receipt.valorTotal * commRate);
        return { ...u, commissionBalance: newComm };
      }
      if (receipt.gerenteId && u.id === receipt.gerenteId && receipt.vendedorRole === 'cambista') {
         const newComm = (u.commissionBalance || 0) + (receipt.valorTotal * 0.05);
         return { ...u, commissionBalance: newComm };
      }
      return u;
    });

    const updatedTickets = tickets.map((t: any) => {
      if (t.id === receiptId) return { ...t, status: 'pago' };
      return t;
    });

    localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
    localStorage.setItem('leobet_tickets', JSON.stringify(updatedTickets));
    loadData();
    toast({ title: "VENDA APROVADA!" });
  };

  const gerentes = allUsers.filter(u => u.role === 'gerente');

  if (currentUser?.role !== 'admin') return null;

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none">Painel Master LEOBET</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest mt-1">Gestão de Fluxo e Auditoria Permanente</p>
            </div>
            <div className="flex gap-3">
               <div className="flex gap-2 bg-white p-2 rounded-xl shadow-sm border items-center">
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
                 <span className="text-muted-foreground text-[10px] font-black uppercase">até</span>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 w-32 border-none shadow-none font-bold text-xs" />
               </div>

               <AlertDialog>
                 <AlertDialogTrigger asChild>
                   <Button variant="destructive" className="h-12 gap-2 font-black uppercase text-xs rounded-xl">
                     <RefreshCcw className="w-4 h-4" /> Resetar
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-white rounded-3xl border-t-8 border-t-destructive">
                   <AlertDialogHeader>
                     <AlertDialogTitle className="text-2xl font-black uppercase text-center">Reset Total?</AlertDialogTitle>
                     <AlertDialogDescription className="text-center font-bold text-muted-foreground">Isso limpará concursos, bilhetes e depósitos anteriores para novo ciclo.</AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="mt-6 flex gap-3">
                     <AlertDialogCancel className="flex-1 h-12 rounded-xl uppercase font-black">Cancelar</AlertDialogCancel>
                     <AlertDialogAction onClick={clearAllData} className="flex-1 bg-destructive h-12 rounded-xl uppercase font-black">Limpar Tudo</AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Admin (20%)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Total Bruto</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto gap-2">
              <TabsTrigger value="depositos" className="font-bold rounded-xl whitespace-nowrap">Depósitos ({pendingDeposits.length})</TabsTrigger>
              <TabsTrigger value="acessos" className="font-bold rounded-xl whitespace-nowrap">Acessos ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="payouts" className="font-bold rounded-xl whitespace-nowrap">Prêmios ({pendingPayouts.length})</TabsTrigger>
              <TabsTrigger value="withdrawals" className="font-bold rounded-xl whitespace-nowrap">Saques ({pendingWithdrawals.length})</TabsTrigger>
              <TabsTrigger value="pendentes" className="font-bold rounded-xl whitespace-nowrap">Vendas ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="rede" className="font-bold rounded-xl whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> Gestão de Rede</TabsTrigger>
              <TabsTrigger value="settings" className="font-bold rounded-xl whitespace-nowrap"><Settings className="w-4 h-4 mr-2" /> Configs</TabsTrigger>
            </TabsList>
            
            <TabsContent value="acessos" className="mt-6 space-y-4">
               {pendingUsers.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem solicitações de acesso pendentes</Card>
               ) : (
                 pendingUsers.map((u, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-accent/5 border-accent/20 border-l-8 border-l-accent rounded-2xl shadow-sm">
                     <div className="space-y-1">
                        <p className="font-black uppercase text-lg text-primary">{u.nome}</p>
                        <p className="text-[10px] font-black text-primary/60 uppercase">ID: {u.id}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{u.role} • {u.email} • {u.phone}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline" className="text-[9px] font-black uppercase">CPF: {u.cpf}</Badge>
                          <Badge variant="outline" className="text-[9px] font-black uppercase">PIX: {u.pixKey}</Badge>
                        </div>
                     </div>
                     <div className="flex gap-2">
                       <Button onClick={() => rejectUser(u.id)} variant="outline" className="text-destructive font-black uppercase text-xs h-12 rounded-xl">Recusar</Button>
                       <Button onClick={() => approveUser(u.id)} className="bg-accent hover:bg-accent/90 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Aprovar Parceiro</Button>
                     </div>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="depositos" className="mt-6 space-y-4">
               {pendingDeposits.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem recargas pendentes</Card>
               ) : (
                 pendingDeposits.map((d, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-blue-50 border-blue-200 border-l-8 border-l-blue-500 rounded-2xl shadow-sm">
                     <div>
                       <p className="font-black uppercase text-lg text-blue-900">{d.userName}</p>
                       <p className="text-[10px] font-black text-blue-800/50 uppercase">ID USUÁRIO: {d.userId}</p>
                       <p className="text-xs font-bold text-blue-700/70 uppercase">{d.userRole} • {new Date(d.createdAt).toLocaleString()}</p>
                       <Badge className="bg-blue-600 mt-2 h-7 px-4 font-black uppercase text-xs">VALOR: R$ {d.amount.toFixed(2)}</Badge>
                     </div>
                     <div className="flex gap-2">
                       <Button onClick={() => rejectDeposit(d.id)} variant="outline" className="border-red-300 text-red-600 font-black uppercase text-xs h-12 px-6 rounded-xl">Recusar</Button>
                       <Button onClick={() => window.open(`https://api.whatsapp.com/send?phone=55${d.phone}&text=Olá, vi seu pedido de depósito de R$ ${d.amount.toFixed(2)}. Pode me enviar o comprovante?`, '_blank')} variant="outline" className="border-blue-300 text-blue-600 font-black uppercase text-xs h-12 px-6 rounded-xl">WhatsApp</Button>
                       <Button onClick={() => approveDeposit(d.id)} className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Aprovar Saldo</Button>
                     </div>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="payouts" className="mt-6 space-y-4">
               {pendingPayouts.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem solicitações de prêmios</Card>
               ) : (
                 pendingPayouts.map((p, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-green-50 border-green-200 border-l-8 border-l-green-500 rounded-2xl shadow-sm">
                     <div className="space-y-1">
                       <p className="font-black uppercase text-lg text-green-800">{p.receipt.cliente}</p>
                       <p className="text-xs font-bold text-green-700/70 uppercase">Bilhete: {p.id} • R$ {p.valorPremio.toFixed(2)}</p>
                       <div className="bg-white/60 p-2 rounded-lg border mt-2">
                          <p className="text-[9px] font-black uppercase text-muted-foreground">CHAVE PIX DO GANHADOR:</p>
                          <p className="text-sm font-black text-primary">{p.pixResgate || 'Não informado'}</p>
                       </div>
                     </div>
                     <Button onClick={() => approvePayout(p.id)} className="bg-green-600 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Confirmar Pagamento</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="withdrawals" className="mt-6 space-y-4">
               {pendingWithdrawals.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem solicitações de saque da rede</Card>
               ) : (
                 pendingWithdrawals.map((w, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-purple-50 border-purple-200 border-l-8 border-l-purple-500 rounded-2xl shadow-sm">
                     <div>
                       <p className="font-black uppercase text-lg">{w.userName}</p>
                       <p className="text-[10px] font-black text-purple-800/50 uppercase">ID: {w.userId}</p>
                       <p className="text-[10px] font-black uppercase text-muted-foreground">{w.userRole} • R$ {w.amount.toFixed(2)}</p>
                       <div className="bg-white/60 p-2 rounded-lg border mt-2 text-xs font-black">PIX DESTINO: {w.pixKey}</div>
                     </div>
                     <Button onClick={() => approveWithdrawal(w.id)} className="bg-purple-600 font-black uppercase text-xs h-12 px-8 rounded-xl">Confirmar Saque</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem vendas pendentes de aprovação</Card>
               ) : (
                 pendingSales.map((t, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-orange-50 border-orange-200 border-l-8 border-l-orange-500 rounded-2xl shadow-sm">
                     <div>
                       <p className="font-black uppercase text-lg">{t.cliente}</p>
                       <p className="text-xs font-bold text-orange-700/70 uppercase">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                       <Badge className="bg-orange-600 mt-2 font-black uppercase text-[9px]">Vendedor: {t.vendedorNome}</Badge>
                     </div>
                     <Button onClick={() => approveSale(t.id)} className="bg-orange-600 font-black uppercase text-xs h-12 px-8 rounded-xl">Confirmar e Aprovar</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="rede" className="mt-6 space-y-8">
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <Card className="lg:col-span-1 border-t-4 border-t-accent">
                    <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><UserPlus className="w-4 h-4" /> Novo Cadastro</CardTitle></CardHeader>
                    <CardContent>
                      <form onSubmit={handleCreatePartner} className="space-y-4">
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">Role / Cargo</Label>
                          <select 
                            className="w-full h-10 border rounded-md px-3 font-bold text-xs"
                            value={newPartner.role}
                            onChange={e => setNewPartner({...newPartner, role: e.target.value as UserRole})}
                          >
                            <option value="gerente">Gerente</option>
                            <option value="cambista">Cambista</option>
                            <option value="cliente">Cliente</option>
                          </select>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">Nome Completo</Label>
                          <input 
                            value={newPartner.nome} 
                            onChange={e => setNewPartner({...newPartner, nome: e.target.value.toUpperCase()})} 
                            required 
                            className="w-full h-9 border rounded px-3 text-xs font-bold" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                           <div className="space-y-1">
                             <Label className="text-[10px] font-black uppercase">CPF</Label>
                             <input value={newPartner.cpf} onChange={e => setNewPartner({...newPartner, cpf: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                           </div>
                           <div className="space-y-1">
                             <Label className="text-[10px] font-black uppercase">Nascimento</Label>
                             <input type="date" value={newPartner.birthDate} onChange={e => setNewPartner({...newPartner, birthDate: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                           </div>
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">WhatsApp (Com DDD)</Label>
                          <input value={newPartner.phone} onChange={e => setNewPartner({...newPartner, phone: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">Chave PIX</Label>
                          <input value={newPartner.pixKey} onChange={e => setNewPartner({...newPartner, pixKey: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">Usuário/Email</Label>
                          <input value={newPartner.email} onChange={e => setNewPartner({...newPartner, email: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                        </div>
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">Senha Inicial</Label>
                          <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                            <input 
                              type="text" 
                              value={newPartner.password} 
                              onChange={e => setNewPartner({...newPartner, password: e.target.value})} 
                              required 
                              className="w-full h-9 pl-9 border rounded px-3 text-xs font-bold" 
                            />
                          </div>
                        </div>
                        {newPartner.role === 'cambista' && (
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase">Vincular ao Gerente</Label>
                            <select 
                              className="w-full h-10 border rounded-md px-3 font-bold text-xs"
                              value={newPartner.gerenteId}
                              onChange={e => setNewPartner({...newPartner, gerenteId: e.target.value})}
                            >
                              <option value="admin-master">ADMIN MASTER (DIRETO)</option>
                              {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                          </div>
                        )}
                        <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 font-black uppercase text-xs">Finalizar Cadastro</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-4">
                     <div className="flex justify-between items-center">
                        <h3 className="text-sm font-black uppercase flex items-center gap-2 text-primary"><Store className="w-4 h-4" /> Base de Parceiros</h3>
                        <Badge variant="outline" className="font-black uppercase text-[9px]">{allUsers.length} Membros</Badge>
                     </div>
                     <div className="space-y-2">
                        {allUsers.filter(u => u.id !== 'admin-master').map((u, i) => (
                          <Card key={i} className="p-4 flex flex-col md:flex-row justify-between items-center gap-4 hover:shadow-md transition-all">
                             <div className="flex items-center gap-3 flex-1">
                                <div className="bg-primary/5 p-2 rounded-full"><UserCircle className="w-6 h-6 text-primary" /></div>
                                <div>
                                   <div className="flex items-center gap-2">
                                     <p className="font-black uppercase text-xs">{u.nome}</p>
                                     <Badge className={`${u.status === 'approved' ? 'bg-green-600' : 'bg-orange-600'} text-[8px] h-4 font-black`}>
                                       {u.status === 'approved' ? 'ATIVO' : 'BLOQUEADO'}
                                     </Badge>
                                   </div>
                                   <p className="text-[9px] font-bold text-muted-foreground uppercase">ID: {u.id} • {u.role} • {u.phone}</p>
                                </div>
                             </div>
                             <div className="flex items-center gap-3 shrink-0">
                                <div className="text-right mr-4">
                                   <p className="text-[9px] font-black uppercase text-muted-foreground">Saldo</p>
                                   <p className="text-xs font-black text-primary">R$ {((u.balance || 0) + (u.commissionBalance || 0)).toFixed(2)}</p>
                                </div>
                                
                                <div className="flex gap-1">
                                   <Button 
                                     size="icon" 
                                     variant="ghost" 
                                     className="h-8 w-8 text-primary" 
                                     onClick={() => toggleUserStatus(u.id, u.status)}
                                     title={u.status === 'approved' ? 'Bloquear' : 'Desbloquear'}
                                   >
                                     {u.status === 'approved' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                   </Button>
                                   
                                   <AlertDialog>
                                     <AlertDialogTrigger asChild>
                                       <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" title="Excluir">
                                         <Trash2 className="w-4 h-4" />
                                       </Button>
                                     </AlertDialogTrigger>
                                     <AlertDialogContent className="bg-white rounded-2xl">
                                       <AlertDialogHeader>
                                         <AlertDialogTitle className="font-black uppercase text-center">Excluir Parceiro?</AlertDialogTitle>
                                         <AlertDialogDescription className="text-center font-bold">Isso removerá {u.nome} definitivamente da base.</AlertDialogDescription>
                                       </AlertDialogHeader>
                                       <AlertDialogFooter className="flex gap-2">
                                         <AlertDialogCancel className="flex-1 uppercase font-black">Cancelar</AlertDialogCancel>
                                         <AlertDialogAction onClick={() => deleteUser(u.id)} className="flex-1 bg-destructive uppercase font-black">Excluir Agora</AlertDialogAction>
                                       </AlertDialogFooter>
                                     </AlertDialogContent>
                                   </AlertDialog>
                                </div>
                             </div>
                             {u.role === 'cambista' && (
                                <div className="flex items-center gap-2 border-l pl-4 shrink-0">
                                   <select 
                                     className="h-8 border rounded px-2 text-[9px] font-black uppercase"
                                     value={u.gerenteId || 'admin-master'}
                                     onChange={e => transferCambista(u.id, e.target.value)}
                                   >
                                     <option value="admin-master">MIGRAR P/ MASTER</option>
                                     {gerentes.filter(g => g.id !== u.id).map(g => <option key={g.id} value={g.id}>P/ {g.nome}</option>)}
                                   </select>
                                </div>
                             )}
                          </Card>
                        ))}
                     </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <Card className="max-w-2xl border-none shadow-xl rounded-3xl overflow-hidden">
                <CardHeader className="bg-primary text-white p-8">
                  <CardTitle className="text-xl font-black uppercase flex items-center gap-2"><Settings className="w-6 h-6" /> Configurações Master</CardTitle>
                </CardHeader>
                <CardContent className="p-8 space-y-6 bg-white">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">Chave PIX da Banca (Para Receber Depósitos)</Label>
                    <Input 
                      placeholder="CPF, Email, Telefone ou Aleatória" 
                      value={companyPix} 
                      onChange={e => setCompanyPix(e.target.value)} 
                      className="h-14 font-black text-lg border-2 border-primary/20 rounded-2xl focus:border-primary"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">URL do Canal YouTube (Live Sorteios)</Label>
                    <div className="relative">
                      <Youtube className="absolute left-4 top-1/2 -translate-y-1/2 text-red-600 w-5 h-5" />
                      <Input 
                        placeholder="https://youtube.com/live/..." 
                        value={youtubeUrl} 
                        onChange={e => setYoutubeUrl(e.target.value)} 
                        className="h-14 pl-12 font-bold border-2 rounded-2xl"
                      />
                    </div>
                  </div>
                  <Button onClick={saveSettings} className="w-full h-14 bg-primary hover:bg-primary/90 font-black uppercase text-lg rounded-2xl shadow-xl">Salvar Configurações</Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

export default function FinanceiroPage() {
  return (
    <Suspense fallback={<div>Carregando Fluxo Financeiro...</div>}>
      <FinanceiroContent />
    </Suspense>
  );
}


"use client"

import React, { useState, useEffect, Suspense, useMemo } from 'react';
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
  Edit2,
  AlertTriangle,
  Zap,
  PlusCircle,
  MinusCircle,
  Printer
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile, UserRole } from '@/types/auth';
import { useAuthStore } from '@/store/use-auth-store';
import { cn } from '@/lib/utils';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

function FinanceiroContent() {
  const { toast } = useToast();
  const { user: currentUser } = useAuthStore();
  const router = useRouter();
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get('tab') || 'depositos';

  const [tickets, setTickets] = useState<any[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingPayouts, setPendingPayouts] = useState<any[]>([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState<any[]>([]);
  const [pendingDeposits, setPendingDeposits] = useState<any[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [companyPix, setCompanyPix] = useState('');
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [manualAmount, setManualAmount] = useState<number>(0);
  const [selectedUserForBalance, setSelectedUserForBalance] = useState<string | null>(null);
  
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
        // Mostra todos os ganhadores que ainda não foram marcados como pagos
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

  const handleManualBalance = (type: 'add' | 'sub') => {
    if (!selectedUserForBalance || manualAmount <= 0) return;

    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.map((u: any) => {
      if (u.id === selectedUserForBalance) {
        const adjustment = type === 'add' ? manualAmount : -manualAmount;
        return { ...u, balance: (u.balance || 0) + adjustment };
      }
      return u;
    });

    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: `SALDO ${type === 'add' ? 'ADICIONADO' : 'REMOVIDO'}!`, description: `R$ ${manualAmount.toFixed(2)}` });
    setManualAmount(0);
    setSelectedUserForBalance(null);
  };

  const approveSale = (receiptId: string) => {
    const receipt = tickets.find(t => t.id === receiptId);
    if (!receipt) return;

    const allUsersList = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updatedUsers = allUsersList.map((u: any) => {
      if (u.id === receipt.vendedorId) {
        const commRate = receipt.vendedorRole === 'cambista' ? 0.10 : receipt.vendedorRole === 'gerente' ? 0.15 : 0;
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
    toast({ title: "VENDA APROVADA!", description: "Bilhete validado e comissões creditadas." });
  };

  const finance = useMemo(() => {
    let orgRaw = 0;      
    let cambistaRaw = 0; 
    let gerenteRaw = 0;  
    let brutoRaw = 0;

    const filteredTickets = tickets.filter(t => {
      const date = t.data.split('T')[0];
      return date >= startDate && date <= endDate && t.status === 'pago';
    });

    filteredTickets.forEach(t => {
      brutoRaw += t.valorTotal;
      
      // LÓGICA DE MARGEM RESIDUAL: TOTAL DA BANCA É SEMPRE 35%
      if (t.vendedorRole === 'admin') {
        orgRaw += t.valorTotal * 0.35; 
      } else if (t.vendedorRole === 'gerente') {
        orgRaw += t.valorTotal * 0.20; 
        gerenteRaw += t.valorTotal * 0.15; 
      } else if (t.vendedorRole === 'cambista') {
        orgRaw += t.valorTotal * 0.20; 
        cambistaRaw += t.valorTotal * 0.10; 
        if (t.gerenteId && t.gerenteId !== 'admin-master') {
          gerenteRaw += t.valorTotal * 0.05; 
        } else {
          orgRaw += t.valorTotal * 0.05; 
        }
      }
    });

    const dBruto = Number(brutoRaw.toFixed(2));
    const dOrg = Number(orgRaw.toFixed(2));
    const dCambista = Number(cambistaRaw.toFixed(2));
    const dGerente = Number(gerenteRaw.toFixed(2));
    // Prêmios é o resíduo exato de 65%
    const dPremios = Number((dBruto - dOrg - dCambista - dGerente).toFixed(2));

    return { org: dOrg, cambista: dCambista, gerente: dGerente, bruto: dBruto, premios: dPremios };
  }, [tickets, startDate, endDate]);

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
    const withdrawal = allWithdrawals.find((w: any) => w.id === withdrawId);
    if (!withdrawal) return;

    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updatedUsers = users.map((u: any) => {
      if (u.id === withdrawal.userId) {
        return { ...u, balance: Math.max(0, (u.balance || 0) - withdrawal.amount) };
      }
      return u;
    });

    const updatedWithdrawals = allWithdrawals.map((w: any) => 
      w.id === withdrawId ? { ...w, status: 'pago' } : w
    );

    localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
    localStorage.setItem('leobet_withdrawals', JSON.stringify(updatedWithdrawals));
    loadData();
    toast({ title: "SAQUE APROVADO!" });
  };

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newPartner.phone.replace(/\D/g, '');
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
    toast({ title: "PARCEIRO CADASTRADO!" });
    setNewPartner({
      nome: '', email: '', password: '', role: 'cambista', cpf: '', birthDate: '', phone: '', pixKey: '', gerenteId: 'admin-master'
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

  const saveSettings = () => {
    const settings = { companyPix, youtubeUrl };
    localStorage.setItem('leobet_settings', JSON.stringify(settings));
    toast({ title: "CONFIGURAÇÕES SALVAS!" });
  };

  const approveUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.map((u: any) => u.id === userId ? { ...u, status: 'approved' } : u);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "ACESSO APROVADO!" });
  };

  const rejectUser = (userId: string) => {
    const users = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = users.filter((u: any) => u.id !== userId);
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ variant: "destructive", title: "SOLICITAÇÃO RECUSADA!" });
  };

  const gerentes = allUsers.filter(u => u.role === 'gerente');

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
            <Card className="bg-primary text-white border-none shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[9px] font-black uppercase opacity-60">Admin / Banca</p>
                <p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-blue-600 text-white border-none shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p>
                <p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-purple-600 text-white border-none shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p>
                <p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-green-600 text-white border-none shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p>
                <p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p>
              </CardContent>
            </Card>
            <Card className="bg-orange-600 text-white border-none shadow-xl rounded-2xl">
              <CardContent className="p-4">
                <p className="text-[9px] font-black uppercase opacity-60">Total Bruto</p>
                <p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue={defaultTab}>
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto gap-2">
              <TabsTrigger value="depositos" className="font-bold rounded-xl whitespace-nowrap">Depósitos ({pendingDeposits.length})</TabsTrigger>
              <TabsTrigger value="acessos" className="font-bold rounded-xl whitespace-nowrap">Acessos ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="payouts" className="font-bold rounded-xl whitespace-nowrap">Ganhadores ({pendingPayouts.length})</TabsTrigger>
              <TabsTrigger value="withdrawals" className="font-bold rounded-xl whitespace-nowrap">Saques Rede ({pendingWithdrawals.length})</TabsTrigger>
              <TabsTrigger value="pendentes" className="font-bold rounded-xl whitespace-nowrap">Vendas s/ Saldo ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="rede" className="font-bold rounded-xl whitespace-nowrap"><Users className="w-4 h-4 mr-2" /> Gestão de Rede</TabsTrigger>
              <TabsTrigger value="settings" className="font-bold rounded-xl whitespace-nowrap"><Settings className="w-4 h-4 mr-2" /> Configurações</TabsTrigger>
            </TabsList>
            
            <TabsContent value="payouts" className="mt-6 space-y-4">
               {pendingPayouts.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem solicitações de prêmios</Card>
               ) : (
                 pendingPayouts.map((p, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-green-50 border-green-200 border-l-8 border-l-green-500 rounded-2xl shadow-sm">
                     <div className="space-y-1">
                       <p className="font-black uppercase text-lg text-green-800">{p.receipt.cliente}</p>
                       <p className="text-xs font-bold text-green-700/70 uppercase">Evento: {p.receipt.eventoNome} • R$ {p.valorPremio.toFixed(2)}</p>
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

            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Nenhuma venda pendente de aprovação</Card>
               ) : (
                 <div className="space-y-4">
                    <div className="bg-orange-50 p-4 rounded-xl border border-orange-200 flex items-center gap-3">
                       <AlertTriangle className="w-6 h-6 text-orange-600" />
                       <p className="text-[10px] font-black text-orange-800 uppercase leading-relaxed">
                          Vendas sem saldo ficam em quarentena. Elas só geram comissão e prêmio após aprovação.
                       </p>
                    </div>
                    {pendingSales.map((t, i) => (
                      <Card key={i} className="flex justify-between items-center p-6 bg-orange-50 border-orange-200 border-l-8 border-l-orange-500 rounded-2xl shadow-sm">
                        <div>
                          <p className="font-black uppercase text-lg">{t.cliente}</p>
                          <p className="text-xs font-bold text-orange-700/70 uppercase">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                          <Badge className="bg-orange-600 mt-2 font-black uppercase text-[9px]">Vendedor: {t.vendedorNome}</Badge>
                        </div>
                        <Button onClick={() => approveSale(t.id)} className="bg-orange-600 hover:bg-orange-700 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Confirmar e Validar</Button>
                      </Card>
                    ))}
                 </div>
               )}
            </TabsContent>

            <TabsContent value="acessos" className="mt-6 space-y-4">
               {pendingUsers.length === 0 ? (
                 <Card className="py-20 text-center border-dashed rounded-3xl opacity-30 font-black uppercase text-xs">Sem solicitações de acesso pendentes</Card>
               ) : (
                 pendingUsers.map((u, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-accent/5 border-accent/20 border-l-8 border-l-accent rounded-2xl shadow-sm">
                     <div className="space-y-1">
                        <p className="font-black uppercase text-lg text-primary">{u.nome}</p>
                        <p className="text-[10px] font-black text-primary/60 uppercase">ID: {u.id}</p>
                        <p className="text-xs font-bold text-muted-foreground uppercase">{u.role} • {u.email}</p>
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
                       <p className="text-xs font-bold text-blue-700/70 uppercase">{d.userRole} • {new Date(d.createdAt).toLocaleString()}</p>
                       <Badge className="bg-blue-600 mt-2 h-7 px-4 font-black uppercase text-xs">VALOR: R$ {d.amount.toFixed(2)}</Badge>
                     </div>
                     <div className="flex gap-2">
                       <Button onClick={() => rejectDeposit(d.id)} variant="outline" className="border-red-300 text-red-600 font-black uppercase text-xs h-12 px-6 rounded-xl">Recusar</Button>
                       <Button onClick={() => approveDeposit(d.id)} className="bg-blue-600 hover:bg-blue-700 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Aprovar Saldo</Button>
                     </div>
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
                       <p className="text-[10px] font-black uppercase text-muted-foreground">{w.userRole} • R$ {w.amount.toFixed(2)}</p>
                       <div className="bg-white/60 p-2 rounded-lg border mt-2 text-xs font-black">PIX DESTINO: {w.pixKey}</div>
                     </div>
                     <Button onClick={() => approveWithdrawal(w.id)} className="bg-purple-600 font-black uppercase text-xs h-12 px-8 rounded-xl shadow-lg">Confirmar Saque</Button>
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
                          <Label className="text-[10px] font-black uppercase">Cargo</Label>
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
                        <div className="space-y-1">
                          <Label className="text-[10px] font-black uppercase">WhatsApp</Label>
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
                          <input type="text" value={newPartner.password} onChange={e => setNewPartner({...newPartner, password: e.target.value})} required className="w-full h-9 border rounded px-3 text-xs font-bold" />
                        </div>
                        {newPartner.role === 'cambista' && (
                          <div className="space-y-1">
                            <Label className="text-[10px] font-black uppercase">Vincular ao Gerente</Label>
                            <select 
                              className="w-full h-10 border rounded-md px-3 font-bold text-xs"
                              value={newPartner.gerenteId}
                              onChange={e => setNewPartner({...newPartner, gerenteId: e.target.value})}
                            >
                              <option value="admin-master">DIRETO (ADMIN)</option>
                              {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome}</option>)}
                            </select>
                          </div>
                        )}
                        <Button type="submit" className="w-full h-12 bg-accent hover:bg-accent/90 font-black uppercase text-xs">Finalizar Cadastro</Button>
                      </form>
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-4">
                     <h3 className="text-sm font-black uppercase text-primary">Rede de Parceiros</h3>
                     <div className="space-y-2">
                        {allUsers.filter(u => u.id !== 'admin-master').map((u, i) => {
                          const parent = allUsers.find(p => p.id === u.gerenteId);
                          return (
                            <Card key={i} className="p-4 flex justify-between items-center hover:shadow-md transition-all">
                               <div className="flex items-center gap-3">
                                  <div className="bg-primary/5 p-2 rounded-full"><UserCircle className="w-6 h-6 text-primary" /></div>
                                  <div>
                                     <div className="flex items-center gap-2">
                                       <p className="font-black uppercase text-xs">{u.nome}</p>
                                       <Badge className={cn(
                                         "text-[8px] h-4 font-black",
                                         u.role === 'gerente' ? 'bg-purple-600' : 
                                         u.role === 'cambista' ? 'bg-blue-600' : 'bg-green-600'
                                       )}>
                                         {u.role.toUpperCase()}
                                       </Badge>
                                     </div>
                                     <p className="text-[9px] font-bold text-muted-foreground uppercase">{u.phone}</p>
                                     {parent && <p className="text-[8px] font-black text-primary/60 uppercase">Equipe de: {parent.nome}</p>}
                                  </div>
                               </div>
                               <div className="flex items-center gap-3">
                                  <div className="text-right mr-4">
                                     <p className="text-[9px] font-black uppercase text-muted-foreground">Saldo</p>
                                     <p className="text-xs font-black text-primary">R$ {((u.balance || 0) + (u.commissionBalance || 0)).toFixed(2)}</p>
                                  </div>
                                  <div className="flex gap-1">
                                     <Dialog>
                                       <DialogTrigger asChild>
                                         <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => setSelectedUserForBalance(u.id)}>
                                           <ArrowRightLeft className="w-4 h-4" />
                                         </Button>
                                       </DialogTrigger>
                                       <DialogContent className="bg-white rounded-[2rem]">
                                         <DialogHeader>
                                           <DialogTitle className="font-black uppercase text-center">Ajustar Saldo</DialogTitle>
                                         </DialogHeader>
                                         <div className="py-4 space-y-4 text-center">
                                            <Input type="number" placeholder="0.00" value={manualAmount} onChange={e => setManualAmount(Number(e.target.value))} className="h-14 text-center text-2xl font-black rounded-xl" />
                                            <div className="grid grid-cols-2 gap-4">
                                               <Button onClick={() => handleManualBalance('add')} className="bg-green-600 font-black h-12 uppercase rounded-xl">Adicionar</Button>
                                               <Button onClick={() => handleManualBalance('sub')} variant="destructive" className="font-black h-12 uppercase rounded-xl">Remover</Button>
                                            </div>
                                         </div>
                                       </DialogContent>
                                     </Dialog>
                                     <Button size="icon" variant="ghost" className="h-8 w-8 text-primary" onClick={() => toggleUserStatus(u.id, u.status)}>
                                       {u.status === 'approved' ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                                     </Button>
                                     <Button size="icon" variant="ghost" className="h-8 w-8 text-destructive" onClick={() => deleteUser(u.id)}><Trash2 className="w-4 h-4" /></Button>
                                  </div>
                               </div>
                            </Card>
                          );
                        })}
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
                    <Label className="text-xs font-black uppercase text-muted-foreground">Chave PIX da Banca</Label>
                    <Input value={companyPix} onChange={e => setCompanyPix(e.target.value)} className="h-14 font-black text-lg border-2 rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase text-muted-foreground">URL Live YouTube</Label>
                    <Input value={youtubeUrl} onChange={e => setYoutubeUrl(e.target.value)} className="h-14 font-bold border-2 rounded-2xl" />
                  </div>
                  <Button onClick={saveSettings} className="w-full h-14 bg-primary hover:bg-primary/90 font-black uppercase text-lg rounded-2xl shadow-xl">Salvar</Button>
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

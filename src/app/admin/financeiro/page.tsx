
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
  PlusCircle
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
  const [validationCode, setValidationCode] = useState('');
  const [validatedTicket, setValidatedTicket] = useState<any>(null);
  
  // Estados para Novo Cadastro (Admin)
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

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = newUser.phone.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "DDD OBRIGATÓRIO", description: "Informe o telefone completo com DDD." });
      return;
    }

    const createdUser: UserProfile = {
      id: Math.random().toString(36).substring(7),
      ...newUser,
      phone: cleanPhone,
      balance: 0,
      commissionBalance: 0,
      pendingBalance: 0,
      status: 'approved',
      gerenteId: newUser.role === 'cambista' ? 'admin-master' : undefined,
      createdAt: new Date().toISOString()
    };

    const updated = [...allUsers, createdUser];
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    setNewUser({ nome: '', email: '', cpf: '', phone: '', birthDate: '', role: 'cambista' });
    loadData();
    toast({ title: `${newUser.role.toUpperCase()} CADASTRADO!` });
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

  const approveUser = (userId: string) => {
    const updated = allUsers.map((u: UserProfile) => 
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "Cadastro Aprovado!" });
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

  const handleTransferCambista = (cambistaId: string, newGerenteId: string) => {
    const updated = allUsers.map((u: UserProfile) => 
      u.id === cambistaId ? { ...u, gerenteId: newGerenteId } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    loadData();
    toast({ title: "Cambista Transferido!" });
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

  const handlePayPrize = () => {
    if (!validatedTicket || validatedTicket.status === 'pago') return;
    const updatedReceipts = tickets.map((receipt: any) => ({
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
              <h1 className="text-3xl font-black font-headline uppercase text-primary">Painel Master LEOBET PRO</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Total de Rede e Auditoria</p>
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
                     <RefreshCcw className="w-4 h-4" /> Resetar
                   </Button>
                 </AlertDialogTrigger>
                 <AlertDialogContent className="bg-white border-destructive border-t-8 rounded-3xl">
                   <AlertDialogHeader>
                     <div className="mx-auto bg-destructive/10 p-4 rounded-full w-fit mb-4"><ShieldAlert className="w-8 h-8 text-destructive" /></div>
                     <AlertDialogTitle className="text-2xl font-black uppercase text-center">Limpar tudo?</AlertDialogTitle>
                     <AlertDialogDescription className="text-center font-bold text-muted-foreground">Apagará bilhetes, bingos e cadastros de teste.</AlertDialogDescription>
                   </AlertDialogHeader>
                   <AlertDialogFooter className="mt-6 flex gap-3">
                     <AlertDialogCancel className="flex-1 font-black uppercase border-2 h-12">Manter</AlertDialogCancel>
                     <AlertDialogAction onClick={clearAllData} className="flex-1 bg-destructive hover:bg-destructive/90 font-black uppercase h-12 text-white">Limpar Agora</AlertDialogAction>
                   </AlertDialogFooter>
                 </AlertDialogContent>
               </AlertDialog>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white border-none shadow-xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Admin (20%+)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white border-none shadow-xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white border-none shadow-xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white border-none shadow-xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white border-none shadow-xl"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Total Bruto</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Tabs defaultValue="pendentes">
            <TabsList className="bg-muted p-1 rounded-2xl w-full flex justify-start overflow-x-auto">
              <TabsTrigger value="pendentes" className="font-bold rounded-xl whitespace-nowrap">Vendas ({pendingSales.length})</TabsTrigger>
              <TabsTrigger value="aprovacao" className="font-bold rounded-xl whitespace-nowrap">Fila Cadastro ({pendingUsers.length})</TabsTrigger>
              <TabsTrigger value="novocadastro" className="font-bold rounded-xl whitespace-nowrap">Registrar Novo</TabsTrigger>
              <TabsTrigger value="rede" className="font-bold rounded-xl whitespace-nowrap">Gestão de Rede</TabsTrigger>
              <TabsTrigger value="sorteios" className="font-bold rounded-xl whitespace-nowrap">Histórico</TabsTrigger>
              <TabsTrigger value="resgate" className="font-bold rounded-xl whitespace-nowrap">Validar Bilhete</TabsTrigger>
            </TabsList>
            
            <TabsContent value="pendentes" className="mt-6 space-y-4">
               {pendingSales.length === 0 ? (
                 <Card className="py-20 text-center border-dashed"><CardContent className="opacity-30 font-black uppercase text-xs">Sem vendas aguardando</CardContent></Card>
               ) : (
                 pendingSales.map((t, i) => (
                   <Card key={i} className="flex justify-between items-center p-6 bg-orange-50 border-orange-200 border-l-8 border-l-orange-500">
                     <div>
                       <p className="font-black uppercase text-lg">{t.cliente}</p>
                       <p className="text-xs font-bold text-orange-700/70 uppercase">{t.eventoNome} • R$ {t.valorTotal.toFixed(2)}</p>
                       <Badge className="bg-orange-600 font-black text-[9px] uppercase mt-2">Vendedor: {t.vendedorNome}</Badge>
                     </div>
                     <Button onClick={() => approveSale(t.data)} className="bg-orange-600 font-black uppercase text-xs shadow-lg h-12 px-8">Liberar Bilhete</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="novocadastro" className="mt-6">
              <Card className="max-w-2xl mx-auto border-t-4 border-t-primary shadow-xl">
                <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><PlusCircle className="w-4 h-4 text-primary" /> Registrar Gerente ou Cambista</CardTitle></CardHeader>
                <CardContent>
                  <form onSubmit={handleCreateUser} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Cargo</Label>
                        <select 
                          className="w-full h-10 border-2 rounded-xl px-3 font-bold bg-white"
                          value={newUser.role}
                          onChange={e => setNewUser({...newUser, role: e.target.value as UserRole})}
                        >
                          <option value="cambista">CAMBISTA</option>
                          <option value="gerente">GERENTE</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Nome Completo</Label>
                        <Input value={newUser.nome} onChange={e => setNewUser({...newUser, nome: e.target.value})} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">CPF</Label>
                        <Input value={newUser.cpf} onChange={e => setNewUser({...newUser, cpf: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Nascimento</Label>
                        <Input type="date" value={newUser.birthDate} onChange={e => setNewUser({...newUser, birthDate: e.target.value})} required />
                      </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">WhatsApp (Com DDD)</Label>
                        <Input placeholder="Ex: 82993343941" value={newUser.phone} onChange={e => setNewUser({...newUser, phone: e.target.value})} required />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] font-black uppercase">Usuário/Email</Label>
                        <Input value={newUser.email} onChange={e => setNewUser({...newUser, email: e.target.value})} required />
                      </div>
                    </div>
                    <Button type="submit" className="w-full h-12 font-black uppercase mt-4">Criar Acesso Imediato</Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="aprovacao" className="mt-6 space-y-4">
               {pendingUsers.length === 0 ? (
                 <Card className="py-20 text-center border-dashed"><CardContent className="opacity-30 font-black uppercase text-xs">Sem novos cadastros</CardContent></Card>
               ) : (
                 pendingUsers.map(u => (
                   <Card key={u.id} className="p-6 flex justify-between items-center border-l-4 border-l-primary">
                     <div className="space-y-1">
                        <p className="font-black uppercase text-lg">{u.nome}</p>
                        <p className="text-xs text-muted-foreground font-bold">{u.email} • {u.phone}</p>
                        <Badge variant="secondary" className="font-black uppercase text-[9px]">{u.role.toUpperCase()}</Badge>
                     </div>
                     <Button onClick={() => approveUser(u.id)} className="bg-primary font-black uppercase text-xs h-12 px-8">Aprovar Agora</Button>
                   </Card>
                 ))
               )}
            </TabsContent>

            <TabsContent value="rede" className="mt-6 space-y-6">
               <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase flex items-center gap-2"><Users className="w-4 h-4 text-purple-600" /> Gerentes Ativos</h3>
                     {gerentes.map(g => (
                       <Card key={g.id} className="p-4 flex justify-between items-center border-l-4 border-l-purple-600 shadow-sm">
                         <div>
                            <p className="font-black uppercase text-sm">{g.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{allUsers.filter(u => u.gerenteId === g.id).length} Cambistas</p>
                         </div>
                         <Badge className="bg-purple-100 text-purple-700 font-black text-[9px]">Saldo: R$ {g.balance.toFixed(2)}</Badge>
                       </Card>
                     ))}
                  </div>
                  <div className="space-y-4">
                     <h3 className="text-sm font-black uppercase flex items-center gap-2"><ArrowRightLeft className="w-4 h-4 text-primary" /> Transferir Cambistas</h3>
                     {allUsers.filter(u => u.role === 'cambista' && u.status === 'approved').map(c => (
                       <Card key={c.id} className="p-4 space-y-3 rounded-xl border-l-4 border-l-blue-600 shadow-sm">
                         <div className="flex justify-between items-center">
                            <p className="font-black uppercase text-xs">{c.nome}</p>
                            <p className="text-[9px] font-black uppercase px-2 py-1 bg-muted rounded">Dono: {allUsers.find(u => u.id === c.gerenteId)?.nome || 'Admin Master'}</p>
                         </div>
                         <select className="w-full h-9 text-[10px] border-2 rounded-xl font-black uppercase px-2" onChange={(e) => handleTransferCambista(c.id, e.target.value)} defaultValue={c.gerenteId}>
                            <option value="admin-master">ADMIN MASTER</option>
                            {gerentes.map(g => <option key={g.id} value={g.id}>{g.nome.toUpperCase()}</option>)}
                         </select>
                       </Card>
                     ))}
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="resgate" className="mt-6">
               <Card className="rounded-3xl shadow-xl overflow-hidden border-none">
                 <CardHeader className="bg-muted/50 border-b"><CardTitle className="text-xs font-black uppercase tracking-widest text-center">Validador de Bilhetes Premiados</CardTitle></CardHeader>
                 <CardContent className="p-8 space-y-8">
                    <div className="flex gap-2 max-w-lg mx-auto">
                      <Input placeholder="CÓDIGO DO BILHETE" value={validationCode} onChange={e => setValidationCode(e.target.value.toUpperCase())} className="h-14 font-black text-center text-lg uppercase rounded-2xl border-2" />
                      <Button onClick={handleValidatePrize} className="h-14 px-8 font-black uppercase bg-primary rounded-2xl shadow-lg">Buscar</Button>
                    </div>

                    {validatedTicket && (
                      <div className={`p-8 rounded-3xl border-4 animate-in zoom-in-95 duration-300 ${validatedTicket.status === 'pago' ? 'bg-blue-50 border-blue-200' : 'bg-green-50 border-green-200'}`}>
                        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="space-y-2 text-center md:text-left">
                            <p className="font-black text-2xl text-primary leading-none uppercase">{validatedTicket.receiptInfo.cliente}</p>
                            <p className="text-[10px] font-black uppercase text-muted-foreground">{validatedTicket.receiptInfo.eventoNome}</p>
                            <Badge className={`font-black h-7 px-4 mt-2 ${validatedTicket.status === 'pago' ? 'bg-blue-600' : 'bg-green-600'}`}>
                               {validatedTicket.status === 'pago' ? 'JÁ RESGATADO' : 'PRÊMIO DISPONÍVEL'}
                            </Badge>
                          </div>
                          {validatedTicket.status === 'ganhou' ? (
                            <Button onClick={handlePayPrize} className="bg-green-600 hover:bg-green-700 h-16 px-12 font-black uppercase text-lg rounded-2xl shadow-2xl">Pagar Prêmio</Button>
                          ) : validatedTicket.status === 'pago' && (
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
                          <div><h3 className="text-xl font-black uppercase text-primary leading-none">{b.nome}</h3><p className="text-[10px] font-bold text-muted-foreground mt-1">Realizado: {new Date(b.dataSorteio).toLocaleString()}</p></div>
                          <Badge className="bg-green-600 uppercase font-black text-[9px] px-3">CONCURSO FINALIZADO</Badge>
                       </div>
                       <div className="bg-muted/30 p-4 rounded-xl border border-dashed">
                          <p className="text-[9px] font-black uppercase text-muted-foreground mb-2">Bolas Sorteadas:</p>
                          <div className="flex flex-wrap gap-1.5">{b.bolasSorteadas?.map((n: number) => (<div key={n} className="w-8 h-8 bg-primary text-white text-xs font-black rounded-full flex items-center justify-center shadow-sm">{n}</div>))}</div>
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

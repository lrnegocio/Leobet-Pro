
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
  
  // Filtros de Data
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

  const approveUser = (userId: string) => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    const updated = allUsers.map((u: UserProfile) => 
      u.id === userId ? { ...u, status: 'approved' } : u
    );
    localStorage.setItem('leobet_users', JSON.stringify(updated));
    setPendingUsers(pendingUsers.filter(u => u.id !== userId));
    toast({ title: "Acesso Aprovado!", description: "O colaborador foi liberado para operar." });
  };

  const approveSale = (saleData: string) => {
    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allReceipts.map((t: any) => {
      if (t.data === saleData) {
        return { ...t, status: 'pago' };
      }
      return t;
    });
    
    localStorage.setItem('leobet_tickets', JSON.stringify(updated));
    setTickets(updated);
    setPendingSales(updated.filter((t: any) => t.status === 'pendente'));
    toast({ title: "Venda Aprovada!", description: "O bilhete agora é válido para o sorteio." });
  };

  const handleValidatePrize = () => {
    if (validationCode.length < 11) {
      toast({ variant: "destructive", title: "Erro", description: "Código deve ter 11 dígitos." });
      return;
    }

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    let found = null;

    allReceipts.forEach((receipt: any) => {
      const ticket = receipt.tickets.find((t: any) => t.id === validationCode);
      if (ticket) found = { ...ticket, receiptInfo: receipt };
    });

    if (found) {
      setValidatedTicket(found);
      if (found.status === 'pago') {
        toast({ variant: "destructive", title: "PRÊMIO JÁ PAGO", description: "Baixa realizada anteriormente." });
      } else if (found.status === 'ganhou') {
        toast({ title: "BILHETE PREMIADO!", description: "Prêmio liberado para resgate." });
      } else {
        toast({ variant: "destructive", title: "NÃO PREMIADO", description: "Sem prêmios para este código." });
      }
    } else {
      toast({ variant: "destructive", title: "CÓDIGO INVÁLIDO", description: "Bilhete não encontrado." });
      setValidatedTicket(null);
    }
  };

  const handlePayPrize = () => {
    if (!validatedTicket || validatedTicket.status === 'pago') return;

    const allReceipts = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updatedReceipts = allReceipts.map((receipt: any) => {
      return {
        ...receipt,
        tickets: receipt.tickets.map((t: any) => 
          t.id === validatedTicket.id ? { ...t, status: 'pago' } : t
        )
      };
    });

    localStorage.setItem('leobet_tickets', JSON.stringify(updatedReceipts));
    setTickets(updatedReceipts);
    setValidatedTicket({ ...validatedTicket, status: 'pago' });
    toast({ title: "SUCESSO!", description: "Prêmio baixado definitivamente.", className: "bg-green-600 text-white" });
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
      org += t.valorTotal * 0.20;
      if (t.vendedorRole === 'cambista') cambista += t.valorTotal * 0.10;
      if (t.vendedorRole === 'gerente') {
        gerente += t.valorTotal * 0.05;
        cambista += t.valorTotal * 0.10; 
      }
    });

    return { org, cambista, gerente, bruto, premios: bruto * 0.65 };
  };

  const finance = calculateFinance();

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
            <div>
              <h1 className="text-3xl font-black font-headline uppercase text-primary leading-tight">Auditoria Financeira Master</h1>
              <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Base Permanente • Histórico 365 Dias</p>
            </div>
            
            <div className="flex items-center gap-2 bg-white p-3 rounded-2xl shadow-sm border border-primary/10">
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">Início</p>
                 <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 font-bold text-xs" />
               </div>
               <div className="space-y-1">
                 <p className="text-[9px] font-black uppercase text-muted-foreground ml-1">Fim</p>
                 <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 font-bold text-xs" />
               </div>
               <div className="bg-primary/10 p-2 rounded-xl mt-4">
                 <Filter className="w-4 h-4 text-primary" />
               </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Organizador (20%)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Faturamento Bruto</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-black uppercase flex items-center gap-2"><Filter className="w-4 h-4" /> Gestão de Operações</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="pendentes">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="pendentes" className="font-bold gap-2 text-orange-600"><Clock className="w-4 h-4" /> Pendentes ({pendingSales.length})</TabsTrigger>
                  <TabsTrigger value="vendas" className="font-bold gap-2"><ReceiptText className="w-4 h-4" /> Relatório Vendas</TabsTrigger>
                  <TabsTrigger value="sorteios" className="font-bold gap-2"><History className="w-4 h-4" /> Histórico Sorteios</TabsTrigger>
                  <TabsTrigger value="cambistas" className="font-bold gap-2"><UserPlus className="w-4 h-4" /> Novos Colaboradores ({pendingUsers.length})</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold gap-2 text-accent"><Trophy className="w-4 h-4" /> Baixar Prêmio</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pendentes">
                   <div className="space-y-4">
                      {pendingSales.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30 italic">Sem vendas pendentes de aprovação.</div>
                      ) : (
                        pendingSales.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs shadow-sm">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[8px] border-orange-400 text-orange-600 font-black uppercase">Aguardando PIX</Badge>
                                  <p className="font-black uppercase text-sm">{t.cliente}</p>
                                </div>
                                <p className="text-muted-foreground font-bold">{t.eventoNome} • {new Date(t.data).toLocaleString('pt-BR')}</p>
                                <p className="text-[10px] italic">Vendedor: {t.vendedorNome} ({t.vendedorRole})</p>
                             </div>
                             <div className="flex items-center gap-4">
                               <p className="font-black text-orange-600 text-lg mr-4">R$ {t.valorTotal.toFixed(2)}</p>
                               <Button onClick={() => approveSale(t.data)} className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] h-10 px-6 gap-2 shadow-md">
                                 <ThumbsUp className="w-4 h-4" /> Aprovar
                               </Button>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="vendas">
                   <div className="space-y-4">
                      {tickets.filter(t => {
                        const date = new Date(t.data).toISOString().split('T')[0];
                        return date >= startDate && date <= endDate;
                      }).length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30 italic">Nenhuma venda no período selecionado.</div>
                      ) : (
                        tickets.filter(t => {
                          const date = new Date(t.data).toISOString().split('T')[0];
                          return date >= startDate && date <= endDate;
                        }).map((t, i) => (
                          <div key={i} className={`flex items-center justify-between p-4 bg-white border rounded-xl text-xs shadow-sm ${t.status === 'pendente' ? 'opacity-60 grayscale' : ''}`}>
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <p className="font-black uppercase text-primary">{t.cliente}</p>
                                  <Badge variant="outline" className="text-[7px] font-black uppercase">{t.tipo}</Badge>
                                </div>
                                <p className="text-muted-foreground font-bold">{t.eventoNome} • {new Date(t.data).toLocaleString('pt-BR')}</p>
                                <p className="text-[9px] uppercase font-bold text-muted-foreground/60">Vendedor: {t.vendedorNome} • Comissões: R$ {(t.valorTotal * 0.15).toFixed(2)}</p>
                             </div>
                             <div className="text-right space-y-1">
                                <p className="font-black text-primary text-sm">R$ {t.valorTotal.toFixed(2)}</p>
                                <div className="flex gap-1 justify-end">
                                  {t.status === 'pago' ? <Badge className="bg-green-600 text-[7px] font-black uppercase">Validado</Badge> : <Badge className="bg-orange-500 text-[7px] font-black uppercase">Pendente</Badge>}
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="sorteios">
                   <div className="space-y-4">
                      {bingosHistory.filter(b => {
                        const date = new Date(b.dataSorteio).toISOString().split('T')[0];
                        return date >= startDate && date <= endDate;
                      }).length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30 italic">Sem históricos de sorteios para este período.</div>
                      ) : (
                        bingosHistory.filter(b => {
                          const date = new Date(b.dataSorteio).toISOString().split('T')[0];
                          return date >= startDate && date <= endDate;
                        }).map((b, i) => (
                          <div key={i} className="p-6 bg-white border-2 border-primary/5 rounded-2xl shadow-sm hover:border-primary/20 transition-all">
                             <div className="flex justify-between items-center mb-6">
                               <div className="space-y-1">
                                 <h4 className="font-black uppercase text-lg text-primary">{b.nome}</h4>
                                 <p className="text-[10px] font-bold text-muted-foreground uppercase flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(b.dataSorteio).toLocaleString('pt-BR')}</p>
                               </div>
                               <Badge className={b.status === 'finalizado' ? "bg-green-600 h-8 px-4 font-black uppercase" : "bg-primary h-8 px-4 font-black uppercase"}>
                                 {b.status.toUpperCase()}
                               </Badge>
                             </div>
                             {b.bolasSorteadas && (
                               <div className="space-y-3">
                                 <p className="text-[9px] font-black uppercase text-muted-foreground tracking-[0.2em]">Mapa Auditado do Globo</p>
                                 <div className="flex flex-wrap gap-1.5">
                                    {b.bolasSorteadas.map((num: number) => (
                                      <div key={num} className="w-7 h-7 flex items-center justify-center bg-accent text-white rounded-full text-[10px] font-black shadow-sm">
                                        {num.toString().padStart(2, '0')}
                                      </div>
                                    ))}
                                 </div>
                               </div>
                             )}
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="cambistas">
                  <div className="space-y-4">
                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-20 border rounded-xl opacity-30 italic">Nenhum colaborador aguardando aprovação.</div>
                    ) : (
                      pendingUsers.map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-5 bg-white border-2 border-primary/5 rounded-2xl shadow-sm">
                          <div className="space-y-1">
                            <p className="font-black uppercase text-primary text-base">{u.nome}</p>
                            <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">{u.email} • Cargo: {u.role.toUpperCase()}</p>
                          </div>
                          <Button onClick={() => approveUser(u.id)} className="bg-primary hover:bg-primary/90 font-black uppercase text-[10px] h-11 px-8 gap-2 shadow-lg">
                            <UserCheck className="w-4 h-4" /> Aprovar Acesso
                          </Button>
                        </div>
                      ))
                    )}
                  </div>
                </TabsContent>

                <TabsContent value="resgate">
                  <div className="max-w-2xl mx-auto py-10 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="bg-primary/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Search className="w-10 h-10 text-primary" />
                      </div>
                      <h3 className="font-black uppercase text-xl text-primary">Baixa de Bilhete Premiado</h3>
                      <p className="text-[10px] text-muted-foreground font-black uppercase tracking-widest">Auditoria Blindada • Bloqueio de Duplicidade</p>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="DIGITE O CÓDIGO DE 11 DÍGITOS" 
                        className="h-16 font-black text-center text-2xl tracking-[0.3em] border-2 focus:border-accent rounded-2xl" 
                        maxLength={11}
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                      />
                      <Button onClick={handleValidatePrize} className="h-16 font-black uppercase px-10 shadow-xl bg-accent hover:bg-accent/90 rounded-2xl">Validar Bilhete</Button>
                    </div>

                    {validatedTicket && (
                      <Card className={`border-4 animate-in zoom-in-95 rounded-3xl overflow-hidden shadow-2xl ${validatedTicket.status === 'pago' ? 'border-blue-600 bg-blue-50/50' : 'border-green-600 bg-green-50/50'}`}>
                        <CardContent className="p-8 space-y-6">
                          <div className="flex justify-between border-b border-black/10 pb-6">
                            <div className="space-y-2">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Situação do Bilhete</p>
                              <Badge className={
                                validatedTicket.status === 'pago' ? "bg-blue-600 text-sm font-black uppercase py-2 px-6" : 
                                validatedTicket.status === 'ganhou' ? "bg-green-600 text-sm font-black uppercase py-2 px-6" : "bg-muted text-muted-foreground text-sm font-black uppercase py-2 px-6"
                              }>
                                {validatedTicket.status === 'pago' ? 'PRÊMIO JÁ RESGATADO' : 
                                 validatedTicket.status === 'ganhou' ? 'GANHADOR - LIBERADO' : 'SEM PREMIAÇÃO'}
                              </Badge>
                            </div>
                            <div className="text-right space-y-1">
                              <p className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">Valor do Resgate</p>
                              <p className="font-black text-primary text-3xl tracking-tighter">R$ {validatedTicket.receiptInfo?.valorTotal.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs font-black uppercase">
                            <div className="bg-white/50 p-3 rounded-xl border"><span className="text-[9px] text-muted-foreground block mb-1">Cliente Apostador</span> {validatedTicket.receiptInfo?.cliente}</div>
                            <div className="bg-white/50 p-3 rounded-xl border"><span className="text-[9px] text-muted-foreground block mb-1">Ponto de Venda</span> {validatedTicket.receiptInfo?.vendedorNome}</div>
                            <div className="bg-white/50 p-3 rounded-xl border col-span-full"><span className="text-[9px] text-muted-foreground block mb-1">Concurso de Origem</span> {validatedTicket.receiptInfo?.eventoNome}</div>
                          </div>

                          {validatedTicket.status === 'ganhou' ? (
                            <Button onClick={handlePayPrize} className="w-full bg-green-600 hover:bg-green-700 h-16 font-black uppercase text-lg shadow-2xl rounded-2xl group transition-all">
                              <CheckCircle2 className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform" />
                              Efetuar Baixa Definitiva
                            </Button>
                          ) : validatedTicket.status === 'pago' ? (
                            <div className="flex flex-col items-center justify-center gap-3 p-6 bg-blue-100 rounded-2xl text-blue-700 font-black uppercase text-center border-2 border-blue-200">
                               <AlertCircle className="w-8 h-8" />
                               <div className="space-y-1">
                                 <p className="text-sm">BILHETE LIQUIDADO</p>
                                 <p className="text-[9px] opacity-60 uppercase">Este prêmio já foi baixado no sistema</p>
                               </div>
                            </div>
                          ) : (
                            <div className="p-6 bg-muted rounded-2xl text-center text-muted-foreground font-black uppercase text-sm border-2">
                               Bilhete Sem Premiação Auditada
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    )}
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

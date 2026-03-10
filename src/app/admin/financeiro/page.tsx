
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
  DollarSign,
  AlertCircle,
  Clock,
  ThumbsUp
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosFinalizados, setBingosFinalizados] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [pendingSales, setPendingSales] = useState<any[]>([]);
  const [validationCode, setValidationCode] = useState('');
  const [validatedTicket, setValidatedTicket] = useState<any>(null);

  useEffect(() => {
    const loadData = () => {
      const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
      setPendingUsers(allUsers.filter((u: UserProfile) => u.status === 'pending'));

      const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      setTickets(allTickets);
      setPendingSales(allTickets.filter((t: any) => t.status === 'pendente'));

      const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
      setBingosFinalizados(allBingos.filter((b: any) => b.status === 'finalizado'));
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
    toast({ title: "Acesso Aprovado!", description: "O usuário agora está liberado." });
  };

  const approveSale = (saleId: string) => {
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const updated = allTickets.map((t: any) => {
      // Usamos uma lógica simples para encontrar a venda, já que o ID pode ser do bilhete ou do recibo
      // Aqui estamos tratando 't' como o objeto do recibo que contém a lista de tickets
      if (t.tickets.some((tk: any) => tk.id === saleId) || t.data === saleId) {
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
      toast({ variant: "destructive", title: "Erro", description: "Insira o código completo de 11 dígitos." });
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
        toast({ 
          variant: "destructive", 
          title: "PRÊMIO JÁ PAGO", 
          description: "Este bilhete já foi baixado no sistema anteriormente.",
          duration: 5000 
        });
      } else if (found.status === 'ganhou') {
        toast({ title: "BILHETE PREMIADO!", description: "O prêmio está disponível para baixa." });
      } else {
        toast({ variant: "destructive", title: "NÃO PREMIADO", description: "Este código não possui prêmios pendentes." });
      }
    } else {
      toast({ variant: "destructive", title: "CÓDIGO INVÁLIDO", description: "Nenhum bilhete encontrado com este código." });
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
    toast({ 
      title: "SUCESSO!", 
      description: "O prêmio foi BAIXADO e marcado como PAGO no sistema.",
      className: "bg-green-600 text-white"
    });
  };

  const calculateFinance = () => {
    let org = 0;
    let cambista = 0;
    let gerente = 0;
    let bruto = 0;

    // Apenas vendas pagas entram no cálculo financeiro real
    tickets.filter(t => t.status === 'pago').forEach(t => {
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
          <div>
            <h1 className="text-3xl font-black font-headline uppercase text-primary leading-tight">Gestão Financeira Master</h1>
            <p className="text-muted-foreground uppercase text-[10px] font-bold tracking-widest">Controle Master • LEOBET PRO</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Card className="bg-primary text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Organizador (20%)</p><p className="text-xl font-black">R$ {finance.org.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-blue-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Cambistas (10%)</p><p className="text-xl font-black">R$ {finance.cambista.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-purple-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Gerentes (5%)</p><p className="text-xl font-black">R$ {finance.gerente.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-green-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Prêmios (65%)</p><p className="text-xl font-black">R$ {finance.premios.toFixed(2)}</p></CardContent></Card>
            <Card className="bg-orange-600 text-white"><CardContent className="p-4"><p className="text-[9px] font-black uppercase opacity-60">Bruto Total</p><p className="text-xl font-black">R$ {finance.bruto.toFixed(2)}</p></CardContent></Card>
          </div>

          <Card>
            <CardHeader><CardTitle className="text-sm font-black uppercase">Painel de Operações</CardTitle></CardHeader>
            <CardContent>
              <Tabs defaultValue="pendentes">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="pendentes" className="font-bold gap-2 text-orange-600"><Clock className="w-4 h-4" /> Vendas Pendentes ({pendingSales.length})</TabsTrigger>
                  <TabsTrigger value="vendas" className="font-bold gap-2"><ReceiptText className="w-4 h-4" /> Todas as Vendas</TabsTrigger>
                  <TabsTrigger value="sorteios" className="font-bold gap-2"><History className="w-4 h-4" /> Histórico Sorteios</TabsTrigger>
                  <TabsTrigger value="cambistas" className="font-bold gap-2"><UserPlus className="w-4 h-4" /> Aprovar Cambistas ({pendingUsers.length})</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold gap-2 text-accent"><Trophy className="w-4 h-4" /> Validar & Pagar</TabsTrigger>
                </TabsList>
                
                <TabsContent value="pendentes">
                   <div className="space-y-4">
                      {pendingSales.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30">Nenhuma venda aguardando aprovação</div>
                      ) : (
                        pendingSales.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-orange-50 border border-orange-200 rounded-xl text-xs shadow-sm">
                             <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="text-[8px] border-orange-400 text-orange-600 font-black">AGUARDANDO PIX/DEPÓSITO</Badge>
                                  <p className="font-black uppercase text-sm">{t.cliente}</p>
                                </div>
                                <p className="text-muted-foreground font-bold">{t.eventoNome} • {t.data}</p>
                                <p className="text-[10px] italic">Vendido por: {t.vendedorRole || 'Admin'}</p>
                             </div>
                             <div className="flex items-center gap-4">
                               <div className="text-right space-y-1 mr-4">
                                  <p className="font-black text-orange-600 text-lg">R$ {t.valorTotal.toFixed(2)}</p>
                               </div>
                               <Button onClick={() => approveSale(t.data)} className="bg-green-600 hover:bg-green-700 font-black uppercase text-[10px] h-10 px-6 gap-2">
                                 <ThumbsUp className="w-4 h-4" /> Aprovar Venda
                               </Button>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="vendas">
                   <div className="space-y-4">
                      {tickets.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30">Sem vendas registradas</div>
                      ) : (
                        tickets.map((t, i) => (
                          <div key={i} className={`flex items-center justify-between p-4 bg-white border rounded-xl text-xs ${t.status === 'pendente' ? 'opacity-60 grayscale' : ''}`}>
                             <div className="space-y-1">
                                <p className="font-black uppercase">{t.cliente}</p>
                                <p className="text-muted-foreground">{t.eventoNome} • {t.data}</p>
                                {t.status === 'pendente' && <Badge className="bg-orange-500 text-[8px]">PENDENTE</Badge>}
                             </div>
                             <div className="text-right space-y-1">
                                <p className="font-black text-primary">R$ {t.valorTotal.toFixed(2)}</p>
                                <div className="flex gap-1 justify-end">
                                  <Badge variant="outline" className="text-[7px] font-black">ORG: R$ {(t.valorTotal * 0.2).toFixed(2)}</Badge>
                                  <Badge variant="secondary" className="text-[7px] font-black">CAMB: R$ {(t.valorTotal * 0.1).toFixed(2)}</Badge>
                                </div>
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="sorteios">
                   <div className="space-y-4">
                      {bingosFinalizados.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30">Nenhum sorteio finalizado</div>
                      ) : (
                        bingosFinalizados.map((b, i) => (
                          <div key={i} className="p-4 bg-white border rounded-xl">
                             <div className="flex justify-between items-center mb-4">
                               <h4 className="font-black uppercase text-primary">{b.nome}</h4>
                               <Badge className="bg-green-600">FINALIZADO</Badge>
                             </div>
                             <div className="grid grid-cols-10 gap-1">
                                {b.bolasSorteadas?.map((num: number) => (
                                  <div key={num} className="aspect-square flex items-center justify-center bg-accent text-white rounded-full text-[9px] font-bold">
                                    {num}
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))
                      )}
                   </div>
                </TabsContent>

                <TabsContent value="cambistas">
                  <div className="space-y-4">
                    {pendingUsers.length === 0 ? (
                      <div className="text-center py-20 border rounded-xl opacity-30">Nenhum cambista aguardando aprovação</div>
                    ) : (
                      pendingUsers.map((u, i) => (
                        <div key={i} className="flex items-center justify-between p-4 bg-white border rounded-xl shadow-sm">
                          <div className="space-y-1">
                            <p className="font-black uppercase text-primary">{u.nome}</p>
                            <p className="text-xs text-muted-foreground">{u.email} • {u.role.toUpperCase()}</p>
                          </div>
                          <Button onClick={() => approveUser(u.id)} className="bg-primary font-black uppercase text-[10px] h-9 gap-2">
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
                      <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-black uppercase text-lg">Validação de Bilhetes Premiados</h3>
                      <p className="text-xs text-muted-foreground font-bold italic">A baixa do prêmio é definitiva e impede duplicidade de pagamento.</p>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="CÓDIGO DE 11 DÍGITOS" 
                        className="h-14 font-black text-center text-xl tracking-[0.2em] border-2 focus:border-accent" 
                        maxLength={11}
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                      />
                      <Button onClick={handleValidatePrize} className="h-14 font-black uppercase px-8 shadow-lg bg-accent hover:bg-accent/90">Validar</Button>
                    </div>

                    {validatedTicket && (
                      <Card className={`border-2 animate-in zoom-in-95 ${validatedTicket.status === 'pago' ? 'border-blue-600 bg-blue-50/30' : 'border-green-600'}`}>
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between border-b pb-4">
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Status Atual</p>
                              <Badge className={
                                validatedTicket.status === 'pago' ? "bg-blue-600" : 
                                validatedTicket.status === 'ganhou' ? "bg-green-600" : "bg-muted text-muted-foreground"
                              }>
                                {validatedTicket.status === 'pago' ? 'PRÊMIO JÁ BAIXADO (PAGO)' : 
                                 validatedTicket.status === 'ganhou' ? 'AGUARDANDO BAIXA (GANHOU)' : 'NÃO PREMIADO'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Valor Estimado</p>
                              <p className="font-black text-primary text-xl">R$ {validatedTicket.receiptInfo?.valorTotal.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs font-bold">
                            <p className="flex flex-col"><span className="text-[9px] uppercase text-muted-foreground">Cliente:</span> {validatedTicket.receiptInfo?.cliente}</p>
                            <p className="flex flex-col"><span className="text-[9px] uppercase text-muted-foreground">Vendedor:</span> {validatedTicket.receiptInfo?.vendedorRole}</p>
                            <p className="col-span-2 flex flex-col"><span className="text-[9px] uppercase text-muted-foreground">Concurso:</span> {validatedTicket.receiptInfo?.eventoNome}</p>
                          </div>

                          {validatedTicket.status === 'ganhou' ? (
                            <Button onClick={handlePayPrize} className="w-full bg-green-600 hover:bg-green-700 h-14 font-black uppercase shadow-xl group">
                              <CheckCircle2 className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                              Efetuar Baixa e Liberar Saldo
                            </Button>
                          ) : validatedTicket.status === 'pago' ? (
                            <div className="flex items-center justify-center gap-2 p-4 bg-blue-100 rounded-xl text-blue-700 font-black uppercase text-sm border-2 border-blue-200">
                               <AlertCircle className="w-5 h-5" /> OPERAÇÃO JÁ REALIZADA
                            </div>
                          ) : null}
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

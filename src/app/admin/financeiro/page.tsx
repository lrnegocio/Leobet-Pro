
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
  DollarSign
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserProfile } from '@/types/auth';

export default function FinanceiroPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [bingosFinalizados, setBingosFinalizados] = useState<any[]>([]);
  const [pendingUsers, setPendingUsers] = useState<UserProfile[]>([]);
  const [validationCode, setValidationCode] = useState('');
  const [validatedTicket, setValidatedTicket] = useState<any>(null);

  useEffect(() => {
    const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
    setPendingUsers(allUsers.filter((u: UserProfile) => u.status === 'pending' && (u.role === 'cambista' || u.role === 'gerente')));

    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    setTickets(allTickets);

    const allBingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]');
    setBingosFinalizados(allBingos.filter((b: any) => b.status === 'finalizado'));
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

  const handleValidatePrize = () => {
    if (validationCode.length < 11) {
      toast({ variant: "destructive", title: "Erro", description: "Código inválido." });
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
      if (found.status === 'ganhou') {
        toast({ title: "Bilhete Premiado!", description: "Este bilhete é um vencedor." });
      } else if (found.status === 'pago') {
        toast({ variant: "destructive", title: "Já Pago", description: "Este prêmio já foi resgatado." });
      } else {
        toast({ variant: "destructive", title: "Não Premiado", description: "Este bilhete não possui prêmios." });
      }
    } else {
      toast({ variant: "destructive", title: "Não Encontrado", description: "Código não localizado no sistema." });
    }
  };

  const handlePayPrize = () => {
    if (!validatedTicket) return;

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
    toast({ title: "Sucesso!", description: "Prêmio baixado e marcado como PAGO." });
  };

  const calculateFinance = () => {
    let org = 0;
    let cambista = 0;
    let gerente = 0;
    let bruto = 0;

    tickets.forEach(t => {
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
              <Tabs defaultValue="vendas">
                <TabsList className="mb-6 bg-muted p-1">
                  <TabsTrigger value="vendas" className="font-bold gap-2"><ReceiptText className="w-4 h-4" /> Vendas</TabsTrigger>
                  <TabsTrigger value="sorteios" className="font-bold gap-2"><History className="w-4 h-4" /> Sorteios</TabsTrigger>
                  <TabsTrigger value="cambistas" className="font-bold gap-2"><UserPlus className="w-4 h-4" /> Aprovações</TabsTrigger>
                  <TabsTrigger value="resgate" className="font-bold gap-2"><Trophy className="w-4 h-4" /> Validar Prêmio</TabsTrigger>
                </TabsList>
                
                <TabsContent value="vendas">
                   <div className="space-y-4">
                      {tickets.length === 0 ? (
                        <div className="text-center py-20 border rounded-xl opacity-30">Sem vendas registradas</div>
                      ) : (
                        tickets.map((t, i) => (
                          <div key={i} className="flex items-center justify-between p-4 bg-white border rounded-xl text-xs">
                             <div className="space-y-1">
                                <p className="font-black uppercase">{t.cliente}</p>
                                <p className="text-muted-foreground">{t.eventoNome} • {t.data}</p>
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

                <TabsContent value="resgate">
                  <div className="max-w-2xl mx-auto py-10 space-y-6">
                    <div className="text-center space-y-2">
                      <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto">
                        <Search className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="font-black uppercase text-lg">Validação de Bilhetes</h3>
                      <p className="text-xs text-muted-foreground font-bold">Insira o código de 11 dígitos para conferir e baixar prêmios.</p>
                    </div>

                    <div className="flex gap-2">
                      <Input 
                        placeholder="CÓDIGO DE 11 DÍGITOS" 
                        className="h-14 font-black text-center text-xl tracking-[0.2em]" 
                        maxLength={11}
                        value={validationCode}
                        onChange={(e) => setValidationCode(e.target.value.toUpperCase())}
                      />
                      <Button onClick={handleValidatePrize} className="h-14 font-black uppercase px-8 shadow-lg">Validar</Button>
                    </div>

                    {validatedTicket && (
                      <Card className="border-2 border-primary animate-in zoom-in-95">
                        <CardContent className="p-6 space-y-4">
                          <div className="flex justify-between border-b pb-4">
                            <div>
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Status do Bilhete</p>
                              <Badge className={validatedTicket.status === 'ganhou' ? "bg-green-600" : "bg-muted text-muted-foreground"}>
                                {validatedTicket.status?.toUpperCase() || 'EM ABERTO'}
                              </Badge>
                            </div>
                            <div className="text-right">
                              <p className="text-[10px] font-black uppercase text-muted-foreground">Valor Estimado</p>
                              <p className="font-black text-primary">R$ {validatedTicket.receiptInfo?.valorTotal.toFixed(2)}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <p><strong>Cliente:</strong> {validatedTicket.receiptInfo?.cliente}</p>
                            <p><strong>Vendedor:</strong> {validatedTicket.receiptInfo?.vendedorRole}</p>
                            <p className="col-span-2"><strong>Evento:</strong> {validatedTicket.receiptInfo?.eventoNome}</p>
                          </div>

                          {validatedTicket.status === 'ganhou' && (
                            <Button onClick={handlePayPrize} className="w-full bg-green-600 hover:bg-green-700 h-12 font-black uppercase">
                              Baixar Prêmio e Confirmar Pagamento
                            </Button>
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

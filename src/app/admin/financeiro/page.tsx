
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useCollection, useFirestore, useMemoFirebase } from '@/firebase';
import { collection, query, where, doc, updateDoc, increment, orderBy, Timestamp } from 'firebase/firestore';
import { CheckCircle2, XCircle, Wallet, ArrowUpCircle, ArrowDownCircle, Loader2, Search, Filter, Calendar, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function FinanceiroAdmin() {
  const db = useFirestore();
  const { toast } = useToast();
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [searchCode, setSearchCode] = useState('');

  // Transações Pendentes
  const pendingTransRef = useMemoFirebase(() => db ? query(collection(db, 'transactions'), where('status', '==', 'pendente')) : null, [db]);
  const { data: pendingTrans, loading: loadingPending } = useCollection(pendingTransRef);

  // Histórico Geral
  const historyRef = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, 'transactions'), orderBy('createdAt', 'desc'));
  }, [db]);
  const { data: history, loading: loadingHistory } = useCollection(historyRef);

  // Tickets
  const ticketsRef = useMemoFirebase(() => db ? query(collection(db, 'tickets'), orderBy('createdAt', 'desc')) : null, [db]);
  const { data: tickets, loading: loadingTickets } = useCollection(ticketsRef);

  const handleAction = async (transaction: any, action: 'aprovado' | 'rejeitado') => {
    if (!db) return;
    try {
      const transRef = doc(db, 'transactions', transaction.id);
      const userRef = doc(db, 'users', transaction.userId);
      if (action === 'aprovado') {
        const balanceChange = transaction.type === 'deposito' ? transaction.amount : -transaction.amount;
        await updateDoc(userRef, { balance: increment(balanceChange) });
      }
      await updateDoc(transRef, { status: action });
      toast({ title: action === 'aprovado' ? "Transação Aprovada!" : "Transação Rejeitada" });
    } catch (e) {
      toast({ title: "Erro no processamento", variant: "destructive" });
    }
  };

  const filterByDate = (date: any) => {
    if (!startDate || !endDate || !date) return true;
    const itemDate = (date as Timestamp).toDate();
    const start = new Date(startDate);
    const end = new Date(endDate);
    end.setHours(23, 59, 59);
    return itemDate >= start && itemDate <= end;
  };

  const filteredHistory = history?.filter(t => filterByDate(t.createdAt));
  const filteredTickets = tickets?.filter(t => {
    const matchesDate = filterByDate(t.createdAt);
    const matchesCode = searchCode ? t.codigoIdentificacao?.toLowerCase().includes(searchCode.toLowerCase()) : true;
    return matchesDate && matchesCode;
  });

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex justify-between items-end border-b pb-8">
            <div>
              <h1 className="text-4xl font-black font-headline uppercase tracking-tighter text-primary">Gestão Financeira</h1>
              <p className="text-muted-foreground text-sm font-bold uppercase tracking-widest mt-2">Relatórios auditados em tempo real</p>
            </div>
            <div className="flex items-center gap-4 bg-white p-4 rounded-2xl border shadow-sm">
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black opacity-60 flex items-center gap-1"><Calendar className="w-3 h-3" /> Data Inicial</Label>
                <Input type="date" className="h-10 font-bold border-none bg-muted/30" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </div>
              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-black opacity-60 flex items-center gap-1"><Calendar className="w-3 h-3" /> Data Final</Label>
                <Input type="date" className="h-10 font-bold border-none bg-muted/30" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </div>
              <Button size="icon" variant="ghost" className="mt-5 hover:bg-muted" onClick={() => { setStartDate(''); setEndDate(''); }}>
                <Filter className="w-4 h-4" />
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="pendentes" className="w-full">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-white border p-1 rounded-2xl">
              <TabsTrigger value="pendentes" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl font-black uppercase text-xs tracking-widest">
                APROVAÇÕES ({pendingTrans?.length || 0})
              </TabsTrigger>
              <TabsTrigger value="historico" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl font-black uppercase text-xs tracking-widest">
                EXTRATO GERAL
              </TabsTrigger>
              <TabsTrigger value="apostas" className="data-[state=active]:bg-primary data-[state=active]:text-white rounded-xl font-black uppercase text-xs tracking-widest">
                RELATÓRIO DE APOSTAS
              </TabsTrigger>
            </TabsList>

            <TabsContent value="pendentes" className="mt-6">
              <Card className="bg-white">
                <CardHeader><CardTitle className="text-xl font-black uppercase tracking-widest">DEPÓSITOS E SAQUES AGUARDANDO</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  {loadingPending ? <Loader2 className="animate-spin mx-auto py-12" /> : pendingTrans?.length ? pendingTrans.map(t => (
                    <div key={t.id} className="flex items-center justify-between p-5 border rounded-2xl bg-muted/5 hover:bg-muted/10 transition-all">
                      <div className="flex items-center gap-5">
                        <div className={`p-3 rounded-2xl ${t.type === 'deposito' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {t.type === 'deposito' ? <ArrowUpCircle className="w-8 h-8" /> : <ArrowDownCircle className="w-8 h-8" />}
                        </div>
                        <div>
                          <p className="font-black text-lg uppercase tracking-tight">{t.userName}</p>
                          <p className="text-xs font-bold text-muted-foreground uppercase">{t.type} • PIX: {t.pixKey || 'Não informada'}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-6">
                        <span className="text-2xl font-black font-code">R$ {t.amount.toFixed(2)}</span>
                        <div className="flex gap-2">
                          <Button className="bg-green-600 hover:bg-green-700 rounded-xl font-black" size="sm" onClick={() => handleAction(t, 'aprovado')}>APROVAR</Button>
                          <Button variant="destructive" className="rounded-xl font-black" size="sm" onClick={() => handleAction(t, 'rejeitado')}>REJEITAR</Button>
                        </div>
                      </div>
                    </div>
                  )) : <div className="text-center py-20 text-muted-foreground uppercase font-black tracking-widest opacity-40">Nenhuma solicitação pendente no momento.</div>}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="historico" className="mt-6">
              <Card className="bg-white">
                <CardHeader><CardTitle className="text-xl font-black uppercase tracking-widest">HISTÓRICO DE TRANSAÇÕES</CardTitle></CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loadingHistory ? <Loader2 className="animate-spin mx-auto py-12" /> : filteredHistory?.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 border-b hover:bg-muted/5 transition-colors text-sm">
                        <div className="flex gap-6 items-center">
                          <span className="text-muted-foreground font-bold w-28">{(t.createdAt as Timestamp).toDate().toLocaleDateString()}</span>
                          <span className="font-black w-48 truncate uppercase">{t.userName}</span>
                          <span className={`uppercase font-black text-[10px] px-3 py-1 rounded-full ${t.type === 'deposito' || t.type === 'premio' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{t.type}</span>
                        </div>
                        <div className="flex gap-6 items-center">
                          <span className="font-code font-black text-base">R$ {t.amount.toFixed(2)}</span>
                          <span className={`text-[9px] px-3 py-1 rounded uppercase font-black ${t.status === 'aprovado' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground'}`}>
                            {t.status}
                          </span>
                        </div>
                      </div>
                    ))}
                    {!loadingHistory && filteredHistory?.length === 0 && <p className="text-center py-20 text-muted-foreground font-bold uppercase">Nenhum registro encontrado no período.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="apostas" className="mt-6">
              <Card className="bg-white">
                <CardHeader className="flex flex-row justify-between items-center">
                  <CardTitle className="text-xl font-black uppercase tracking-widest">RELATÓRIO GERAL DE BILHETES</CardTitle>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder="BUSCAR CÓDIGO..." className="pl-10 font-bold uppercase text-xs rounded-xl" value={searchCode} onChange={e => setSearchCode(e.target.value)} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {loadingTickets ? <Loader2 className="animate-spin mx-auto py-12" /> : filteredTickets?.map(t => (
                      <div key={t.id} className="flex items-center justify-between p-4 border-b hover:bg-muted/5 transition-colors text-sm">
                        <div className="flex gap-6 items-center">
                          <span className="text-muted-foreground font-bold w-28">{(t.createdAt as Timestamp).toDate().toLocaleDateString()}</span>
                          <div className="w-48">
                            <p className="font-black uppercase truncate">{t.userName}</p>
                            <p className="text-[10px] text-muted-foreground font-bold">{t.tipo.toUpperCase()} • ID {t.eventId?.substring(0,6)}</p>
                          </div>
                          <span className="font-code text-primary font-black bg-primary/5 px-3 py-1 rounded uppercase tracking-widest text-base">
                            {t.codigoIdentificacao}
                          </span>
                        </div>
                        <div className="flex gap-6 items-center">
                          <span className={`text-[10px] px-4 py-1 rounded-full uppercase font-black ${
                            t.status === 'ganhou' ? 'bg-green-600 text-white animate-pulse' : 
                            t.status === 'pago' ? 'bg-blue-600 text-white' : 
                            t.status === 'perdeu' ? 'bg-red-100 text-red-700' : 'bg-muted text-muted-foreground'
                          }`}>
                            {t.status}
                          </span>
                          {t.valorPremio > 0 && <span className="text-green-600 font-black text-lg font-code">R$ {t.valorPremio.toFixed(2)}</span>}
                        </div>
                      </div>
                    ))}
                    {!loadingTickets && filteredTickets?.length === 0 && <p className="text-center py-20 text-muted-foreground font-bold uppercase">Nenhuma aposta encontrada.</p>}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}

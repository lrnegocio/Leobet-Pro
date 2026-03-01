
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { useFirestore } from '@/firebase';
import { collection, query, where, getDocs, updateDoc, doc, increment, addDoc, serverTimestamp } from 'firebase/firestore';
import { Ticket, Search, CheckCircle2, Loader2, QrCode } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function BaixaPremio() {
  const [codigo, setCodigo] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const { toast } = useToast();
  const db = useFirestore();

  const handleSearch = async () => {
    if (codigo.length !== 10) {
      toast({ title: "Código Inválido", description: "O código deve ter 10 dígitos.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const q = query(collection(db, 'tickets'), where('codigoIdentificacao', '==', codigo));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        toast({ title: "Não encontrado", description: "Nenhum bilhete encontrado com este código.", variant: "destructive" });
        setTicket(null);
      } else {
        const data = snapshot.docs[0].data();
        setTicket({ ...data, id: snapshot.docs[0].id });
      }
    } catch (error) {
      toast({ title: "Erro", description: "Erro ao buscar bilhete.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async () => {
    if (!ticket || ticket.status === 'pago') return;

    if (ticket.status !== 'ganhou') {
      toast({ title: "Não Premiado", description: "Este bilhete não possui prêmios.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // 1. Marcar ticket como pago
      await updateDoc(doc(db, 'tickets', ticket.id), { status: 'pago' });

      // 2. Adicionar saldo ao usuário dono do ticket
      await updateDoc(doc(db, 'users', ticket.userId), {
        balance: increment(ticket.valorPremio)
      });

      // 3. Registrar transação de prêmio
      await addDoc(collection(db, 'transactions'), {
        userId: ticket.userId,
        userName: ticket.userName,
        type: 'premio',
        amount: ticket.valorPremio,
        status: 'aprovado',
        ticketCode: ticket.codigoIdentificacao,
        createdAt: serverTimestamp()
      });

      toast({ title: "Premiação Paga!", description: `R$ ${ticket.valorPremio.toFixed(2)} creditados ao cliente.` });
      setTicket({ ...ticket, status: 'pago' });
    } catch (error) {
      toast({ title: "Erro no Resgate", description: "Não foi possível processar o pagamento.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-2xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold font-headline flex items-center gap-2">
            <QrCode className="w-8 h-8 text-primary" /> Baixa de Prêmios
          </h1>

          <Card>
            <CardHeader>
              <CardTitle>Validar Bilhete</CardTitle>
              <CardDescription>Insira o código de 10 dígitos para validar e pagar prêmios.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="codigo">Código do Bilhete</Label>
                  <Input 
                    id="codigo" 
                    placeholder="Ex: AB12345678" 
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    maxLength={10}
                  />
                </div>
                <Button className="mt-8" onClick={handleSearch} disabled={loading}>
                  {loading ? <Loader2 className="animate-spin" /> : <Search className="w-4 h-4" />}
                </Button>
              </div>

              {ticket && (
                <div className="mt-8 p-6 border rounded-xl bg-muted/20 space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-lg">{ticket.userName}</h3>
                      <p className="text-sm text-muted-foreground">Tipo: {ticket.tipo === 'bingo' ? 'BINGO' : 'BOLÃO'}</p>
                      <p className="text-sm text-muted-foreground">Código: <span className="font-mono font-bold text-primary">{ticket.codigoIdentificacao}</span></p>
                    </div>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${
                      ticket.status === 'ganhou' ? 'bg-green-100 text-green-700' : 
                      ticket.status === 'pago' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                    }`}>
                      {ticket.status}
                    </div>
                  </div>

                  {ticket.status === 'ganhou' && (
                    <div className="bg-green-600 p-4 rounded-lg text-white">
                      <p className="text-xs opacity-80 uppercase">Valor a Receber</p>
                      <p className="text-2xl font-black">R$ {ticket.valorPremio?.toFixed(2)}</p>
                      <Button 
                        className="w-full mt-4 bg-white text-green-700 hover:bg-white/90 font-bold"
                        onClick={handleRedeem}
                        disabled={loading}
                      >
                        Confirmar Pagamento
                      </Button>
                    </div>
                  )}

                  {ticket.status === 'pago' && (
                    <div className="flex items-center gap-2 text-blue-600 bg-blue-50 p-4 rounded-lg">
                      <CheckCircle2 className="w-5 h-5" />
                      <span className="font-bold">Prêmio já foi creditado no saldo do cliente.</span>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

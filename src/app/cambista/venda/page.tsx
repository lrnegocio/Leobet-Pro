
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Grid3X3, Trophy, Printer, Share2, Search, Loader2 } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function VendaCambista() {
  const db = useFirestore();
  const { toast } = useToast();
  const [cpf, setCpf] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);

  const bingosRef = useMemoFirebase(() => db ? query(collection(db, 'bingos'), where('status', '==', 'aberto')) : null, [db]);
  const { data: bingos } = useCollection(bingosRef);

  const handleVenda = async (event: any, tipo: 'bingo' | 'bolao') => {
    setLoading(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      // Buscar se cliente existe pelo CPF
      let userId = 'anonimo';
      let userName = 'Cliente Externo';
      if (cpf) {
        const userQ = query(collection(db, 'users'), where('cpf', '==', cpf));
        const userSnap = await getDocs(userQ);
        if (!userSnap.empty) {
          userId = userSnap.docs[0].id;
          userName = userSnap.docs[0].data().nome;
        }
      }

      const ticketData = {
        eventId: event.id,
        userId,
        userName,
        userCpf: cpf,
        codigoIdentificacao: codigo,
        tipo,
        status: 'pendente',
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      
      // Incrementar contadores de venda no evento
      await updateDoc(doc(db, tipo === 'bingo' ? 'bingos' : 'boloes', event.id), {
        vendidas: increment(1),
        vendidasCambista: increment(1)
      });

      setTicket({ ...ticketData, eventName: event.nome });
      toast({ title: "Venda Realizada!", description: `Bilhete ${codigo} gerado.` });
    } catch (e) {
      toast({ title: "Erro", description: "Falha ao processar venda.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shareTicket = () => {
    if (!ticket) return;
    const text = `*LEOBET PRO - COMPROVANTE*\nEvento: ${ticket.eventName}\nCódigo: ${ticket.codigoIdentificacao}\nCliente: ${ticket.userName}\nBoa sorte!`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <h1 className="text-3xl font-bold font-headline">Nova Venda de Bilhete</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card>
              <CardHeader><CardTitle>Dados do Cliente</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>CPF do Cliente (Opcional)</Label>
                  <Input placeholder="000.000.000-00" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </div>
                <p className="text-xs text-muted-foreground">Se o CPF for de um cliente cadastrado, o bilhete aparecerá no painel dele.</p>
              </CardContent>
            </Card>

            {ticket && (
              <Card className="bg-primary text-white">
                <CardHeader className="flex flex-row justify-between">
                  <CardTitle>Bilhete Gerado</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => window.print()}><Printer size={16} /></Button>
                    <Button variant="outline" size="icon" onClick={shareTicket}><Share2 size={16} /></Button>
                  </div>
                </CardHeader>
                <CardContent className="text-center py-6">
                  <p className="text-xs opacity-70">CÓDIGO DE IDENTIFICAÇÃO</p>
                  <p className="text-4xl font-black tracking-widest">{ticket.codigoIdentificacao}</p>
                </CardContent>
              </Card>
            )}
          </div>

          <Card>
            <CardHeader><CardTitle>Escolha o Evento</CardTitle></CardHeader>
            <CardContent>
              <div className="space-y-4">
                {bingos?.map(bingo => (
                  <div key={bingo.id} className="flex items-center justify-between p-4 border rounded-xl hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-4">
                      <Grid3X3 className="text-primary" />
                      <div>
                        <p className="font-bold">{bingo.nome}</p>
                        <p className="text-sm text-muted-foreground">R$ {bingo.preco?.toFixed(2)}</p>
                      </div>
                    </div>
                    <Button onClick={() => handleVenda(bingo, 'bingo')} disabled={loading}>Vender Agora</Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

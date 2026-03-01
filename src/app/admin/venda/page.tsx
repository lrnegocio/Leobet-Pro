
"use client"

import React, { useState } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Grid3X3, Printer, Share2, Loader2, ShoppingCart, Trophy, Search } from 'lucide-react';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, updateDoc, doc, increment } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function VendaAdmin() {
  const db = useFirestore();
  const { toast } = useToast();
  const [cpf, setCpf] = useState('');
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<any>(null);
  const [palpites, setPalpites] = useState<Record<number, string>>({});

  const bingosRef = useMemoFirebase(() => db ? query(collection(db, 'bingos'), where('status', '==', 'aberto')) : null, [db]);
  const { data: bingos } = useCollection(bingosRef);

  const boloesRef = useMemoFirebase(() => db ? query(collection(db, 'boloes'), where('status', '==', 'aberto')) : null, [db]);
  const { data: boloes } = useCollection(boloesRef);

  const handleVenda = async (event: any, tipo: 'bingo' | 'bolao') => {
    if (tipo === 'bolao' && Object.keys(palpites).length < 10) {
      toast({ title: "Palpites Incompletos", description: "Marque os 10 jogos (1, X ou 2) antes de finalizar.", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      const codigo = Math.random().toString(36).substring(2, 12).toUpperCase();
      
      let userId = 'anonimo';
      let userName = 'Cliente Externo (Admin)';
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
        cambistaId: 'admin',
        codigoIdentificacao: codigo,
        tipo,
        status: 'pendente',
        palpites: tipo === 'bolao' ? palpites : null,
        valorPremio: 0,
        createdAt: serverTimestamp()
      };

      await addDoc(collection(db, 'tickets'), ticketData);
      
      await updateDoc(doc(db, tipo === 'bingo' ? 'bingos' : 'boloes', event.id), {
        vendidas: increment(1)
      });

      setTicket({ ...ticketData, eventName: event.nome });
      toast({ title: "Venda Concluída!", description: `Bilhete ${codigo} gerado com sucesso.` });
      setPalpites({});
    } catch (e) {
      toast({ title: "Erro na Venda", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const shareTicket = () => {
    if (!ticket) return;
    const text = `*LEOBET PRO - COMPROVANTE*\n\nEvento: ${ticket.eventName}\nCódigo: *${ticket.codigoIdentificacao}*\nCliente: ${ticket.userName}\nData: ${new Date().toLocaleDateString()}\n\nBoa sorte! Valide seu código no resgate.`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-black font-headline flex items-center gap-3 uppercase tracking-tighter">
              <ShoppingCart className="text-primary w-8 h-8" /> Balcão Administrativo
            </h1>
            <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Venda Rápida de Bilhetes</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardHeader><CardTitle className="text-sm font-black uppercase">1. IDENTIFICAÇÃO DO CLIENTE</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-black uppercase opacity-60">CPF do Apostador (Opcional)</Label>
                  <Input placeholder="000.000.000-00" className="h-12 font-bold" value={cpf} onChange={(e) => setCpf(e.target.value)} />
                </div>
                <div className="p-4 bg-muted/20 rounded-xl border border-dashed text-xs text-muted-foreground">
                  <p>O Admin retém a margem de organização definida. Vendas por este painel não geram comissão de cambista.</p>
                </div>
              </CardContent>
            </Card>

            {ticket && (
              <Card className="bg-primary text-white border-none shadow-2xl relative overflow-hidden">
                <div className="absolute -right-4 -top-4 opacity-10">
                  <Printer className="w-24 h-24" />
                </div>
                <CardHeader className="flex flex-row justify-between items-center border-b border-white/10">
                  <CardTitle className="text-xs font-black uppercase tracking-widest">BILHETE GERADO</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" className="h-10 w-10 text-white border-white/20 hover:bg-white/10" onClick={() => window.print()} title="Imprimir Recibo">
                      <Printer size={18} />
                    </Button>
                    <Button variant="outline" size="icon" className="h-10 w-10 text-white border-white/20 hover:bg-white/10" onClick={shareTicket} title="Enviar WhatsApp">
                      <Share2 size={18} />
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="text-center py-8">
                  <p className="text-[10px] opacity-70 uppercase font-black mb-2">CÓDIGO DE IDENTIFICAÇÃO</p>
                  <p className="text-5xl font-black tracking-[0.2em] font-code drop-shadow-md">{ticket.codigoIdentificacao}</p>
                  <p className="text-[9px] mt-6 opacity-60 font-bold uppercase tracking-widest">Valide este comprovante no momento do resgate</p>
                </CardContent>
              </Card>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="bg-white">
              <CardHeader className="border-b"><CardTitle className="text-lg font-black flex items-center gap-3 uppercase"><Grid3X3 className="w-5 h-5 text-primary" /> BINGOS ABERTOS</CardTitle></CardHeader>
              <CardContent className="space-y-4 pt-6">
                {bingos?.length ? bingos.map(bingo => (
                  <div key={bingo.id} className="flex items-center justify-between p-4 border rounded-2xl bg-muted/5 hover:bg-muted/10 transition-all group">
                    <div>
                      <p className="font-black text-primary uppercase">{bingo.nome}</p>
                      <p className="text-xs font-bold text-muted-foreground uppercase mt-1">VALOR: R$ {bingo.preco?.toFixed(2)}</p>
                    </div>
                    <Button className="bg-primary hover:bg-primary/90 font-black uppercase text-xs h-10 px-6 rounded-xl" onClick={() => handleVenda(bingo, 'bingo')} disabled={loading}>VENDER</Button>
                  </div>
                )) : <div className="text-center py-12 text-muted-foreground uppercase text-xs font-bold">Nenhum concurso de bingo aberto no momento.</div>}
              </CardContent>
            </Card>

            <Card className="bg-white">
              <CardHeader className="border-b"><CardTitle className="text-lg font-black flex items-center gap-3 uppercase"><Trophy className="w-5 h-5 text-accent" /> BOLÕES (MARCAR PALPITES)</CardTitle></CardHeader>
              <CardContent className="space-y-6 pt-6">
                {boloes?.length ? boloes.map(bolao => (
                  <div key={bolao.id} className="p-5 border rounded-2xl bg-muted/5 space-y-5">
                    <div className="flex justify-between items-center pb-4 border-b">
                      <div>
                        <p className="font-black text-accent uppercase">{bolao.nome}</p>
                        <p className="text-xs font-bold text-muted-foreground mt-1 uppercase">VALOR: R$ {bolao.valor?.toFixed(2)}</p>
                      </div>
                      <Button className="bg-accent hover:bg-accent/90 font-black uppercase text-xs h-10 px-6 rounded-xl" onClick={() => handleVenda(bolao, 'bolao')} disabled={loading}>FINALIZAR</Button>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-3 max-h-[350px] overflow-y-auto pr-3 scrollbar-hide">
                      {bolao.partidas?.map((p: any, i: number) => (
                        <div key={i} className="p-3 border rounded-xl bg-white space-y-3 shadow-sm">
                          <p className="font-black text-[11px] uppercase tracking-tighter flex justify-between">
                            <span>{p.time1} <span className="text-muted-foreground mx-1">VS</span> {p.time2}</span>
                            <span className="text-accent text-[9px]">JOGO {i + 1}</span>
                          </p>
                          <RadioGroup className="flex justify-between gap-2" onValueChange={(v) => setPalpites({...palpites, [i]: v})}>
                            <div className="flex-1">
                              <RadioGroupItem value="1" id={`m${i}-1`} className="peer sr-only" />
                              <Label htmlFor={`m${i}-1`} className="flex flex-col items-center justify-center h-10 border-2 rounded-lg peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 cursor-pointer font-black text-xs">CASA (1)</Label>
                            </div>
                            <div className="flex-1">
                              <RadioGroupItem value="X" id={`m${i}-X`} className="peer sr-only" />
                              <Label htmlFor={`m${i}-X`} className="flex flex-col items-center justify-center h-10 border-2 rounded-lg peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 cursor-pointer font-black text-xs">EMPATE (X)</Label>
                            </div>
                            <div className="flex-1">
                              <RadioGroupItem value="2" id={`m${i}-2`} className="peer sr-only" />
                              <Label htmlFor={`m${i}-2`} className="flex flex-col items-center justify-center h-10 border-2 rounded-lg peer-data-[state=checked]:border-accent peer-data-[state=checked]:bg-accent/10 cursor-pointer font-black text-xs">FORA (2)</Label>
                            </div>
                          </RadioGroup>
                        </div>
                      ))}
                    </div>
                  </div>
                )) : <div className="text-center py-12 text-muted-foreground uppercase text-xs font-bold">Nenhum bolão ativo no momento.</div>}
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}

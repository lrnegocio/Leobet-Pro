
"use client"

import React, { useState, useEffect, useMemo } from 'react';
import { SidebarNav } from '@/components/dashboard/SidebarNav';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ShoppingCart, Printer, Send, Ticket as TicketIcon, Trophy, Smartphone, FileText, Grid3X3, Zap, CheckCircle2, AlertCircle, Plus, Minus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { useAuthStore } from '@/store/use-auth-store';

export default function VendaPage() {
  const { toast } = useToast();
  const { user, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [eventosAtivos, setEventosAtivos] = useState<any[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [quantity, setQuantity] = useState(1);
  
  const [prizes, setPrizes] = useState({
    totalNet: 0,
    quadra: 0,
    quina: 0,
    bingo: 0,
    bolao: 0
  });
  
  const [formData, setFormData] = useState({
    cliente: '',
    whatsapp: '',
    eventoId: '',
    eventoNome: '',
    tipo: 'bingo' as 'bingo' | 'bolao',
    valorTotal: 0,
    unitario: 0,
  });

  const [bolaoPalpites, setBolaoPalpites] = useState<string[]>(Array(10).fill(''));
  const [vendaRealizada, setVendaRealizada] = useState<any>(null);

  const updatePrizes = (eventId: string, type: 'bingo' | 'bolao') => {
    const allTickets = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
    const eventSales = allTickets.filter((t: any) => String(t.eventoId) === String(eventId) && t.status === 'pago');
    const totalPaid = eventSales.reduce((acc: number, t: any) => acc + (t.valorTotal || 0), 0);
    
    // MATEMÁTICA DE PRECISÃO: Arredondar sempre para baixo para evitar furos de centavos
    const totalNet = Math.floor(totalPaid * 0.65 * 100) / 100;

    if (type === 'bingo') {
      const bingoVal = Math.floor(totalNet * 0.50 * 100) / 100;
      const quinaVal = Math.floor(totalNet * 0.30 * 100) / 100;
      const quadraVal = Number((totalNet - bingoVal - quinaVal).toFixed(2)); // Residuo exato

      setPrizes({
        totalNet: totalNet,
        bingo: bingoVal,
        quina: quinaVal,
        quadra: quadraVal,
        bolao: 0
      });
    } else {
      setPrizes({
        totalNet: totalNet,
        quadra: 0,
        quina: 0,
        bingo: 0,
        bolao: totalNet
      });
    }
  };

  const loadEventos = () => {
    const now = new Date();
    const bingos = JSON.parse(localStorage.getItem('leobet_bingos') || '[]').filter((b: any) => {
      const drawDate = new Date(b.dataSorteio);
      return b.status === 'aberto' && now < new Date(drawDate.getTime() - 60000);
    }).map((b: any) => ({ ...b, tipo: 'bingo' }));

    const boloes = JSON.parse(localStorage.getItem('leobet_boloes') || '[]').filter((b: any) => {
      const startDate = new Date(b.dataFim); 
      return b.status === 'aberto' && now < new Date(startDate.getTime() - 60000);
    }).map((b: any) => ({ ...b, tipo: 'bolao' }));

    setEventosAtivos([...bingos, ...boloes]);
  };

  useEffect(() => {
    loadEventos();
    const interval = setInterval(() => {
      loadEventos();
      if (formData.eventoId && selectedEvent) {
        updatePrizes(formData.eventoId, selectedEvent.tipo);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [formData.eventoId, selectedEvent]);

  const handleSelectEvent = (eventId: string) => {
    const ev = eventosAtivos.find(e => String(e.id) === String(eventId));
    setSelectedEvent(ev);
    setQuantity(1);
    
    if (ev) {
      setFormData({
        ...formData,
        eventoId: eventId,
        eventoNome: ev.nome,
        unitario: ev.preco,
        valorTotal: ev.preco,
        tipo: ev.tipo
      });
      setBolaoPalpites(Array(10).fill(''));
      updatePrizes(eventId, ev.tipo);
    } else {
      setSelectedEvent(null);
      setFormData(prev => ({ ...prev, eventoId: '', eventoNome: '', valorTotal: 0 }));
      setPrizes({ totalNet: 0, quadra: 0, quina: 0, bingo: 0, bolao: 0 });
    }
  };

  useEffect(() => {
    if (selectedEvent) {
      setFormData(prev => ({
        ...prev,
        valorTotal: quantity * prev.unitario
      }));
    }
  }, [quantity, selectedEvent]);

  const handleSetPalpite = (matchIndex: number, value: string) => {
    const newPalpites = [...bolaoPalpites];
    newPalpites[matchIndex] = value;
    setBolaoPalpites(newPalpites);
  };

  const generateUniqueNumbers = (count: number, max: number) => {
    const nums: Set<number> = new Set();
    while (nums.size < count) {
      const n = Math.floor(Math.random() * max) + 1;
      nums.add(n);
    }
    return Array.from(nums).sort((a, b) => a - b);
  };

  const handleVenda = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.cliente.trim()) {
      toast({ variant: "destructive", title: "NOME OBRIGATÓRIO" });
      return;
    }

    const cleanPhone = formData.whatsapp.replace(/\D/g, '');
    if (cleanPhone.length < 10) {
      toast({ variant: "destructive", title: "WHATSAPP OBRIGATÓRIO" });
      return;
    }

    if (formData.tipo === 'bolao' && bolaoPalpites.some(p => !p)) {
      toast({ variant: "destructive", title: "ESCOLHA OS 10 PALPITES" });
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const ticketsGenerated: any[] = [];
      
      for (let i = 0; i < quantity; i++) {
        ticketsGenerated.push({
          id: Math.random().toString().substring(2, 13),
          numeros: formData.tipo === 'bingo' ? generateUniqueNumbers(15, 90) : null,
          palpite: formData.tipo === 'bolao' ? bolaoPalpites.join('-') : null,
          status: 'aberto'
        });
      }

      const userTotalBalance = (user?.balance || 0) + (user?.commissionBalance || 0);
      const statusVenda = (user?.role === 'admin' || userTotalBalance >= formData.valorTotal) ? 'pago' : 'pendente';

      const receipt = {
        id: Math.random().toString(36).substring(7).toUpperCase(),
        data: new Date().toISOString(),
        status: statusVenda,
        vendedorId: user?.id,
        vendedorNome: user?.nome,
        vendedorRole: user?.role,
        gerenteId: user?.gerenteId || (user?.role === 'cambista' ? 'admin-master' : undefined),
        ...formData,
        whatsapp: cleanPhone,
        tickets: ticketsGenerated,
        qtd: quantity,
        detalhePremios: { ...prizes }
      };

      const all = JSON.parse(localStorage.getItem('leobet_tickets') || '[]');
      localStorage.setItem('leobet_tickets', JSON.stringify([...all, receipt]));

      if (statusVenda === 'pago' && user?.role !== 'admin') {
        const allUsers = JSON.parse(localStorage.getItem('leobet_users') || '[]');
        const updatedUsers = allUsers.map((u: any) => {
          if (u.id === user?.id) {
            let remaining = formData.valorTotal;
            let newComm = u.commissionBalance || 0;
            let newBal = u.balance || 0;
            if (newComm >= remaining) { newComm -= remaining; remaining = 0; }
            else { remaining -= newComm; newComm = 0; newBal -= remaining; }
            const myCommRate = user?.role === 'cambista' ? 0.10 : user?.role === 'gerente' ? 0.15 : 0;
            newComm += (formData.valorTotal * myCommRate);
            return { ...u, balance: newBal, commissionBalance: newComm };
          }
          if (user?.role === 'cambista' && user?.gerenteId && u.id === user.gerenteId) {
             return { ...u, commissionBalance: (u.commissionBalance || 0) + (formData.valorTotal * 0.05) };
          }
          return u;
        });
        localStorage.setItem('leobet_users', JSON.stringify(updatedUsers));
        setUser(updatedUsers.find((u: any) => u.id === user?.id));
      }

      setVendaRealizada(receipt);
      setLoading(false);
      updatePrizes(formData.eventoId, selectedEvent.tipo);
      toast({ title: statusVenda === 'pago' ? "BILHETE EMITIDO!" : "AGUARDANDO SALDO MASTER" });
    }, 800);
  };

  const handleWhatsApp = () => {
    if (!vendaRealizada) return;
    const host = window.location.origin;
    const link = `${host}/resultados?c=${vendaRealizada.id}`;
    
    let prizesText = '';
    if (vendaRealizada.tipo === 'bingo') {
      prizesText = `%0A%0A*PRÊMIOS LÍQUIDOS AGORA:*%0A🎯 BINGO: R$ ${prizes.bingo.toFixed(2)}%0A✋ QUINA: R$ ${prizes.quina.toFixed(2)}%0A🍀 QUADRA: R$ ${prizes.quadra.toFixed(2)}`;
    } else {
      prizesText = `%0A%0A*PRÊMIO ACUMULADO:* R$ ${prizes.bolao.toFixed(2)}`;
    }

    let message = `*LEOBET PRO - RECIBO OFICIAL*%0A%0A👤 *CLIENTE:* ${vendaRealizada.cliente}%0A🎟️ *CONCURSO:* ${vendaRealizada.eventoNome}%0A📦 *QTD:* ${vendaRealizada.qtd} bilhete(s)%0A💰 *VALOR:* R$ ${vendaRealizada.valorTotal.toFixed(2)}%0A✅ *STATUS:* ${vendaRealizada.status === 'pago' ? 'VALIDADA' : 'PENDENTE'}${prizesText}%0A%0A*CONFERIR ONLINE:* ${link}`;
    window.open(`https://api.whatsapp.com/send?phone=55${vendaRealizada.whatsapp}&text=${message}`, '_blank');
  };

  return (
    <div className="flex h-screen bg-muted/30 font-body">
      <SidebarNav />
      <main className="flex-1 overflow-auto p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex justify-between items-end print:hidden">
            <div>
              <h1 className="text-3xl font-black uppercase text-primary leading-none tracking-tighter">Terminal de Vendas</h1>
              <p className="text-[10px] font-black text-muted-foreground uppercase mt-1">Sorteios e Bolões Auditados</p>
            </div>
            <Badge className="bg-primary text-white font-black px-4 py-2 text-sm rounded-xl">
              SALDO: R$ {user?.role === 'admin' ? 'ILIMITADO' : ((user?.balance || 0) + (user?.commissionBalance || 0)).toFixed(2)}
            </Badge>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="rounded-[2.5rem] border-none shadow-2xl overflow-hidden bg-white print:hidden">
              <CardContent className="p-8">
                <form onSubmit={handleVenda} className="space-y-6">
                  <div className="bg-orange-50 p-4 rounded-xl border border-orange-100 flex items-center gap-3">
                    <AlertCircle className="w-5 h-5 text-orange-600 shrink-0" />
                    <p className="text-[9px] font-black text-orange-800 uppercase leading-tight">DADOS OBRIGATÓRIOS PARA LOCALIZAÇÃO EM CASO DE PRÊMIO.</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <Label className="uppercase text-[9px] font-black opacity-60">Nome Apostador *</Label>
                      <Input value={formData.cliente} onChange={e => setFormData({...formData, cliente: e.target.value.toUpperCase()})} required className="font-bold h-11 border-2" />
                    </div>
                    <div className="space-y-1">
                      <Label className="uppercase text-[9px] font-black opacity-60">WhatsApp (DDD) *</Label>
                      <Input value={formData.whatsapp} onChange={e => setFormData({...formData, whatsapp: e.target.value})} required className="font-bold h-11 border-2" />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label className="uppercase text-[9px] font-black opacity-60">Selecione o Concurso</Label>
                    <select 
                      className="w-full h-12 border-2 rounded-xl px-3 font-bold bg-white"
                      value={formData.eventoId}
                      onChange={e => handleSelectEvent(e.target.value)}
                      required
                    >
                      <option value="">-- ESCOLHA O EVENTO --</option>
                      {eventosAtivos.map(e => <option key={e.id} value={e.id}>{e.tipo === 'bolao' ? '🏆 BOLÃO' : '🎯 BINGO'}: {e.nome} (R$ {e.preco.toFixed(2)})</option>)}
                    </select>
                  </div>

                  {selectedEvent?.tipo === 'bingo' && (
                    <div className="space-y-2 p-4 bg-primary/5 rounded-2xl border-2 border-dashed border-primary/20">
                       <Label className="uppercase text-[10px] font-black text-primary">Quantidade de Cartelas</Label>
                       <div className="flex items-center gap-4">
                          <Button type="button" onClick={() => setQuantity(Math.max(1, quantity - 1))} variant="outline" className="h-12 w-12 rounded-xl border-2"><Minus /></Button>
                          <Input 
                            type="number" 
                            value={quantity} 
                            onChange={e => setQuantity(Math.max(1, Number(e.target.value)))} 
                            className="h-12 text-center text-xl font-black border-2 rounded-xl"
                          />
                          <Button type="button" onClick={() => setQuantity(quantity + 1)} variant="outline" className="h-12 w-12 rounded-xl border-2"><Plus /></Button>
                       </div>
                    </div>
                  )}

                  {selectedEvent && (
                    <div className="bg-primary/5 p-6 rounded-2xl border-2 border-primary/10 space-y-4">
                       <h3 className="font-black uppercase text-xs flex items-center gap-2 text-primary"><Zap className="w-4 h-4 text-accent fill-accent" /> Prêmios Líquidos Atuais (65%)</h3>
                       {selectedEvent.tipo === 'bingo' ? (
                         <div className="grid grid-cols-3 gap-2">
                            <div className="bg-white p-2 rounded-xl border text-center">
                               <p className="text-[7px] font-black uppercase opacity-60">BINGO</p>
                               <p className="text-xs font-black text-primary">R$ {prizes.bingo.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border text-center">
                               <p className="text-[7px] font-black uppercase opacity-60">QUINA</p>
                               <p className="text-xs font-black text-primary">R$ {prizes.quina.toFixed(2)}</p>
                            </div>
                            <div className="bg-white p-2 rounded-xl border text-center">
                               <p className="text-[7px] font-black uppercase opacity-60">QUADRA</p>
                               <p className="text-xs font-black text-primary">R$ {prizes.quadra.toFixed(2)}</p>
                            </div>
                         </div>
                       ) : (
                         <div className="bg-white p-4 rounded-xl border flex justify-between items-center">
                            <p className="text-xs font-black uppercase text-primary">PRÊMIO ACUMULADO</p>
                            <p className="text-xl font-black text-green-600">R$ {prizes.bolao.toFixed(2)}</p>
                         </div>
                       )}
                    </div>
                  )}

                  {selectedEvent?.tipo === 'bolao' && (
                    <div className="space-y-4 bg-muted/30 p-6 rounded-2xl border-2 max-h-[300px] overflow-y-auto">
                      {(selectedEvent.partidas || []).map((p: any, i: number) => (
                        <div key={i} className="bg-white p-3 rounded-xl border">
                           <p className="text-[8px] font-black uppercase opacity-60 mb-2">{p.time1} vs {p.time2}</p>
                           <div className="grid grid-cols-3 gap-2">
                              {['1', 'X', '2'].map(v => (
                                <Button key={v} type="button" onClick={() => handleSetPalpite(i, v)} variant={bolaoPalpites[i] === v ? 'default' : 'outline'} className="h-9 text-xs font-black">{v}</Button>
                              ))}
                           </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="relative">
                     <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-2xl text-primary/30">VALOR JOGO: R$</span>
                     <Input type="number" value={formData.valorTotal.toFixed(2)} readOnly className="h-20 text-4xl font-black text-center border-primary/20 bg-primary/5 rounded-2xl pl-32" />
                  </div>

                  <Button type="submit" className="w-full h-16 font-black uppercase text-lg shadow-xl rounded-2xl bg-primary hover:bg-primary/90 text-white" disabled={loading}>
                    {loading ? "GERANDO..." : "FINALIZAR BILHETE"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            <div className="space-y-6">
              {vendaRealizada ? (
                <div className="bg-[#FFFFF0] p-8 shadow-2xl border border-black/10 font-mono text-[10px] rounded-[2.5rem]">
                   <div className="text-center border-b-2 border-dashed border-black/20 pb-4 mb-4">
                      <p className="text-2xl font-black text-primary tracking-tighter">LEOBET PRO</p>
                      <p className="font-bold uppercase tracking-[0.3em] text-[7px] mt-1">Comprovante Oficial de Aposta</p>
                   </div>
                   
                   <div className="space-y-1.5 mb-4 text-[9px] uppercase font-bold">
                      <p className="flex justify-between"><span>CLIENTE:</span> <span>{vendaRealizada.cliente}</span></p>
                      <p className="flex justify-between"><span>WHATSAPP:</span> <span>{vendaRealizada.whatsapp}</span></p>
                      <p className="flex justify-between"><span>CONCURSO:</span> <span>{vendaRealizada.eventoNome}</span></p>
                      <p className="flex justify-between"><span>EMISSÃO:</span> <span>{new Date(vendaRealizada.data).toLocaleString()}</span></p>
                   </div>

                   <div className="my-4 border-y-2 border-dashed border-black/20 py-4 space-y-3">
                      {vendaRealizada.tickets.map((t: any, i: number) => (
                        <div key={i} className="bg-black/5 p-3 rounded-xl">
                          <p className="font-black flex justify-between text-[8px] mb-1"><span>BILHETE #{i+1}</span> <span>{t.id}</span></p>
                          <p className="text-[9px] break-all">{t.numeros ? `NÚMEROS: ${t.numeros.join(' - ')}` : `PALPITES: ${t.palpite}`}</p>
                        </div>
                      ))}
                   </div>

                   <div className="text-center space-y-3">
                      <p className="text-[9px] font-black uppercase text-muted-foreground">Prêmio Atual Estimado (65%)</p>
                      {vendaRealizada.tipo === 'bingo' ? (
                        <div className="grid grid-cols-3 gap-1">
                           <div className="p-1 bg-black/5 rounded"><p className="text-[6px]">BINGO</p><p className="font-black">R$ {vendaRealizada.detalhePremios.bingo.toFixed(2)}</p></div>
                           <div className="p-1 bg-black/5 rounded"><p className="text-[6px]">QUINA</p><p className="font-black">R$ {vendaRealizada.detalhePremios.quina.toFixed(2)}</p></div>
                           <div className="p-1 bg-black/5 rounded"><p className="text-[6px]">QUADRA</p><p className="font-black">R$ {vendaRealizada.detalhePremios.quadra.toFixed(2)}</p></div>
                        </div>
                      ) : (
                        <p className="text-2xl font-black">R$ {vendaRealizada.detalhePremios.bolao.toFixed(2)}</p>
                      )}
                      <Badge variant={vendaRealizada.status === 'pago' ? 'default' : 'destructive'} className="uppercase font-black px-8 py-1 rounded-full">
                         {vendaRealizada.status === 'pago' ? '✓ VALIDADA' : '⚠ PENDENTE'}
                      </Badge>
                   </div>

                   <div className="mt-8 flex flex-col gap-2 print:hidden">
                      <Button onClick={handleWhatsApp} className="w-full h-12 bg-green-600 hover:bg-green-700 font-black uppercase text-xs text-white rounded-xl shadow-lg"><Send className="w-4 h-4 mr-2" /> WhatsApp</Button>
                      <Button onClick={() => window.print()} variant="outline" className="w-full h-12 font-black uppercase text-xs rounded-xl border-2"><Smartphone className="w-4 h-4 mr-2" /> Impressão</Button>
                   </div>
                </div>
              ) : (
                <div className="h-full min-h-[500px] flex flex-col items-center justify-center border-4 border-dashed rounded-[3.5rem] opacity-20 bg-white">
                   <TicketIcon className="w-24 h-24 text-primary mb-6" />
                   <h3 className="text-xl font-black uppercase text-primary text-center px-12">Aguardando Seleção</h3>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
